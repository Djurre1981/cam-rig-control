import { LivePanel } from "./LivePanel";
import { Inspector } from "./Inspector";
import type { RigPose } from "../lib/rigKinematics";
import type { ClipSelection, TimelineProject } from "../types";

type Props = {
  project: TimelineProject;
  selection: ClipSelection;
  speedPercent: number;
  livePose: RigPose;
  velocities: number[];
  liveRecording: boolean;
  demoMode: boolean;
  onUpdateProject: (p: TimelineProject) => void;
  onDeleteSelection: () => void;
  onSpeedPercentChange: (pct: number) => void;
  onVelocityChange: (axis: number, value: number) => void;
  onAxisStop: (axis: number) => void;
  onAxisHome: (axis: number) => void;
  onStopAll: () => void;
  onToggleRecord: () => void;
};

export function RightSidebar({
  project,
  selection,
  speedPercent,
  livePose,
  velocities,
  liveRecording,
  demoMode,
  onUpdateProject,
  onDeleteSelection,
  onSpeedPercentChange,
  onVelocityChange,
  onAxisStop,
  onAxisHome,
  onStopAll,
  onToggleRecord,
}: Props) {
  return (
    <aside className="right-sidebar">
      <LivePanel
        embedded
        pose={livePose}
        velocities={velocities}
        speedPercent={speedPercent}
        onSpeedPercentChange={onSpeedPercentChange}
        onVelocityChange={onVelocityChange}
        onAxisStop={onAxisStop}
        onAxisHome={onAxisHome}
        onStopAll={onStopAll}
        recording={liveRecording}
        onToggleRecord={onToggleRecord}
        demoMode={demoMode}
      />
      <div className="right-sidebar-divider" role="separator" />
      <Inspector
        embedded
        project={project}
        selection={selection}
        speedPercent={speedPercent}
        onUpdateProject={onUpdateProject}
        onDeleteSelection={onDeleteSelection}
      />
    </aside>
  );
}
