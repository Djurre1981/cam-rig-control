import { useCallback, useEffect, useRef, useState } from "react";
import {
  addMotionSample,
  applyRecordedClipsToProject,
  buildRecordedClips,
  createMotionRecorder,
  type MotionRecorder,
} from "../lib/motionRecording";
import type { RigPose } from "../lib/rigKinematics";
import type { TimelineProject } from "../types";

export function useMotionRecording(
  getPose: () => RigPose,
  getPlayhead: () => number,
  onProjectChange: (p: TimelineProject) => void
) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MotionRecorder | null>(null);
  const recordingRef = useRef(false);
  const getPoseRef = useRef(getPose);
  const getPlayheadRef = useRef(getPlayhead);
  const onProjectChangeRef = useRef(onProjectChange);

  getPoseRef.current = getPose;
  getPlayheadRef.current = getPlayhead;
  onProjectChangeRef.current = onProjectChange;
  recordingRef.current = recording;

  const toggleRecording = useCallback((project: TimelineProject) => {
    if (!recordingRef.current) {
      const start = getPlayheadRef.current();
      recorderRef.current = createMotionRecorder(start);
      addMotionSample(recorderRef.current, start, getPoseRef.current());
      setRecording(true);
      return;
    }

    const recorder = recorderRef.current;
    recorderRef.current = null;
    setRecording(false);
    if (!recorder || recorder.samples.length < 2) return;

    const clipStart = recorder.startTime;
    const clips = buildRecordedClips(recorder, clipStart);
    if (clips.length === 0) return;
    onProjectChangeRef.current(applyRecordedClipsToProject(project, clipStart, clips));
  }, []);

  useEffect(() => {
    if (!recording) return;
    const wallStart = performance.now();
    let raf = 0;
    const tick = () => {
      const rec = recorderRef.current;
      if (rec && recordingRef.current) {
        const elapsed = (performance.now() - wallStart) / 1000;
        addMotionSample(rec, rec.startTime + elapsed, getPoseRef.current());
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [recording]);

  return { recording, toggleRecording };
}
