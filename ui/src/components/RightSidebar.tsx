import { LivePanel } from "./LivePanel";
import { Inspector } from "./Inspector";
import type { RigPose } from "../lib/rigKinematics";
import type { TargetLockMode } from "../lib/liveMotion";
import type { ClipSelection, TimelineProject } from "../types";

type Props = {
  project: TimelineProject;
  selection: ClipSelection;
  speedPercent: number;
  livePose: RigPose;
  velocities: number[];
  zoomVelocity: number;
  demoMode: boolean;
  targetLock: TargetLockMode;
  onTargetLockChange: (mode: TargetLockMode) => void;
  onUpdateProject: (p: TimelineProject) => void;
  onDeleteSelection: () => void;
  onSpeedPercentChange: (pct: number) => void;
  onVelocityChange: (axis: number, value: number) => void;
  onZoomVelocityChange: (value: number) => void;
  onAxisStop: (axis: number) => void;
  onZoomStop: () => void;
  onAxisHome: (axis: number) => void;
  onZoomHome: () => void;
  onHomeAll: () => void;
};

export function RightSidebar({
  project,
  selection,
  speedPercent,
  livePose,
  velocities,
  zoomVelocity,
  demoMode,
  targetLock,
  onTargetLockChange,
  onUpdateProject,
  onDeleteSelection,
  onSpeedPercentChange,
  onVelocityChange,
  onZoomVelocityChange,
  onAxisStop,
  onZoomStop,
  onAxisHome,
  onZoomHome,
  onHomeAll,
}: Props) {
  return (
    <aside className="right-sidebar">
      <LivePanel
        embedded
        pose={livePose}
        velocities={velocities}
        zoomVelocity={zoomVelocity}
        speedPercent={speedPercent}
        targetLock={targetLock}
        onTargetLockChange={onTargetLockChange}
        onSpeedPercentChange={onSpeedPercentChange}
        onVelocityChange={onVelocityChange}
        onZoomVelocityChange={onZoomVelocityChange}
        onAxisStop={onAxisStop}
        onZoomStop={onZoomStop}
        onAxisHome={onAxisHome}
        onZoomHome={onZoomHome}
        onHomeAll={onHomeAll}
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
