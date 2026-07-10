import { useEffect, useState } from "react";
import { LivePanel } from "./LivePanel";
import { Inspector } from "./Inspector";
import { PanelTabs } from "./PanelTabs";
import type { RigPose } from "../lib/rigKinematics";
import type { TargetLockMode } from "../lib/liveMotion";
import type { FocusCalibration } from "../lib/focusCalibration";
import type { SubjectAimPoint } from "../lib/subjectTarget";
import type { ClipSelection, TimelineProject } from "../types";

type RightTab = "live" | "inspector";

const TAB_STORAGE_KEY = "camrig-right-tab";

function loadTab(): RightTab {
  try {
    const raw = sessionStorage.getItem(TAB_STORAGE_KEY);
    if (raw === "live" || raw === "inspector") return raw;
  } catch {
    /* ignore */
  }
  return "live";
}

type Props = {
  project: TimelineProject;
  selection: ClipSelection;
  speedPercent: number;
  livePose: RigPose;
  velocities: number[];
  zoomVelocity: number;
  demoMode: boolean;
  targetLock: TargetLockMode;
  calibration: FocusCalibration;
  focusFollow: boolean;
  onMeasuredHomeChange: (metres: number | null) => void;
  onClearCalibration: () => void;
  onFocusFollowChange: (on: boolean) => void;
  onTargetLockChange: (mode: TargetLockMode) => void;
  subjectAimPoint: SubjectAimPoint;
  moveTargetEnabled: boolean;
  onMoveTargetEnabledChange: (on: boolean) => void;
  onResetSubjectAim: () => void;
  gamepadEnabled: boolean;
  onGamepadEnabledChange: (on: boolean) => void;
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
  calibration,
  focusFollow,
  onMeasuredHomeChange,
  onClearCalibration,
  onFocusFollowChange,
  onTargetLockChange,
  subjectAimPoint,
  moveTargetEnabled,
  onMoveTargetEnabledChange,
  onResetSubjectAim,
  gamepadEnabled,
  onGamepadEnabledChange,
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
  const [tab, setTab] = useState<RightTab>(loadTab);
  const lockOn = targetLock !== "off";

  useEffect(() => {
    try {
      sessionStorage.setItem(TAB_STORAGE_KEY, tab);
    } catch {
      /* ignore */
    }
  }, [tab]);

  useEffect(() => {
    if (selection) setTab("inspector");
  }, [selection]);

  const inspectorBadge = selection ? "●" : undefined;

  return (
    <aside className="right-sidebar">
      <PanelTabs
        className="right-sidebar-tabs"
        tabs={[
          {
            id: "live",
            label: "Live",
            badge: lockOn ? "◎" : undefined,
            title: lockOn ? "Target lock active" : "Jog axes in real time",
          },
          {
            id: "inspector",
            label: "Inspector",
            badge: inspectorBadge,
            title: selection ? "Clip properties" : "Project & clip properties",
          },
        ]}
        active={tab}
        onChange={setTab}
      >
        {tab === "live" ? (
          <LivePanel
            embedded
            tabbed
            pose={livePose}
            velocities={velocities}
            zoomVelocity={zoomVelocity}
            speedPercent={speedPercent}
            targetLock={targetLock}
            calibration={calibration}
            focusFollow={focusFollow}
            onMeasuredHomeChange={onMeasuredHomeChange}
            onClearCalibration={onClearCalibration}
            onFocusFollowChange={onFocusFollowChange}
            onTargetLockChange={onTargetLockChange}
            subjectAimPoint={subjectAimPoint}
            moveTargetEnabled={moveTargetEnabled}
            onMoveTargetEnabledChange={onMoveTargetEnabledChange}
            onResetSubjectAim={onResetSubjectAim}
            gamepadEnabled={gamepadEnabled}
            onGamepadEnabledChange={onGamepadEnabledChange}
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
        ) : (
          <Inspector
            embedded
            tabbed
            project={project}
            selection={selection}
            speedPercent={speedPercent}
            onUpdateProject={onUpdateProject}
            onDeleteSelection={onDeleteSelection}
          />
        )}
      </PanelTabs>
    </aside>
  );
}
