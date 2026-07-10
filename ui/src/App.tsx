import { useCallback, useEffect, useMemo, useState } from "react";

import { AnimationNameDialog, ConfirmDialog, UnsavedChangesDialog } from "./components/AnimationDialog";

import { ClipPalette } from "./components/ClipPalette";

import { EffectorBar } from "./components/EffectorBar";

import { RightSidebar } from "./components/RightSidebar";

import { PresetSidebar } from "./components/PresetSidebar";

import { CameraViewPreview } from "./components/CameraViewPreview";

import { RigPreview } from "./components/RigPreview";

import { ViewMenu } from "./components/ViewMenu";
import { CollapsibleSidebar } from "./components/CollapsibleSidebar";
import { CollapsibleSection } from "./components/CollapsibleSection";
import { AppFooter } from "./components/AppFooter";

import { TimelineEditor } from "./components/TimelineEditor";

import { TransportBar } from "./components/TransportBar";

import { WorkspaceResizer } from "./components/WorkspaceResizer";

import { CLIP_PALETTE } from "./data/palette";

import { usePlayback } from "./hooks/usePlayback";

import { useLivePose } from "./hooks/useLivePose";
import { useFocusCalibration } from "./hooks/useFocusCalibration";
import { useSubjectTarget } from "./hooks/useSubjectTarget";
import { useMotionRecording } from "./hooks/useMotionRecording";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useGamepad } from "./hooks/useGamepad";

import type { TargetLockMode } from "./lib/liveMotion";
import type { RigPose } from "./lib/rigKinematics";

import { PoseSidebar } from "./components/PoseSidebar";
import { DocsPage } from "./pages/DocsPage";

import {

  createBlankAnimation,

  deleteAnimation,

  duplicateAnimation,

  listAnimations,

  loadAnimationProject,

  renameAnimation,

  saveAnimation,

  saveAnimationAs,

  type AnimationMeta,

} from "./lib/animationLibrary";

import { normalizeProject, projectsEqual } from "./lib/normalizeProject";
import { ensureTimelineDuration, extendTimelineDuration } from "./lib/timelineDuration";

import {
  isTrackVisible,
  loadViewLayout,
  mergeTrackVisibility,
  saveViewLayout,
  type ViewLayout,
} from "./lib/viewLayout";

import type { ClipSelection, TimelineProject } from "./types";



const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== "false";

type DialogState =
  | { kind: "none" }

  | { kind: "unsaved-switch"; targetId: string }

  | { kind: "save-as"; afterSave?: "switch"; targetId?: string }

  | { kind: "rename"; targetId: string }

  | { kind: "delete"; targetId: string }

  | { kind: "new" };



export default function App() {

  const [animationList, setAnimationList] = useState<AnimationMeta[]>(() => listAnimations());

  const [activeId, setActiveId] = useState("demo");

  const [project, setProject] = useState<TimelineProject>(() => {
    const loaded = normalizeProject(loadAnimationProject("demo")!);
    return structuredClone(loaded);
  });

  const updateProject = useCallback((p: TimelineProject) => {
    setProject(ensureTimelineDuration(p));
  }, []);

  const ensureDuration = useCallback((minDuration: number) => {
    setProject((p) => extendTimelineDuration(p, minDuration));
  }, []);

  const [savedProject, setSavedProject] = useState<TimelineProject>(() => {
    const loaded = normalizeProject(loadAnimationProject("demo")!);
    return structuredClone(loaded);
  });

  const [selection, setSelection] = useState<ClipSelection>(null);

  const [snapEnabled, setSnapEnabled] = useState(true);

  const [velocities, setVelocities] = useState([0, 0, 0, 0]);

  const [zoomVelocity, setZoomVelocity] = useState(0);

  const [speedPercent, setSpeedPercent] = useState(100);

  const [targetLock, setTargetLock] = useState<TargetLockMode>("off");

  const {
    aimPoint: subjectAimPoint,
    setAimPoint: setSubjectAimPoint,
    moveEnabled: moveTargetEnabled,
    setMoveEnabled: setMoveTargetEnabled,
    resetAimToHome: resetSubjectAim,
  } = useSubjectTarget();

  const [gamepadEnabled, setGamepadEnabled] = useState(false);

  const [appView, setAppView] = useState<"editor" | "docs">("editor");

  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });

  const [activePaletteItem, setActivePaletteItem] = useState(

    () => CLIP_PALETTE.find((p) => p.id === "movement") ?? CLIP_PALETTE[0]

  );

  const [viewLayout, setViewLayout] = useState<ViewLayout>(() => loadViewLayout(loadAnimationProject("demo")));



  const dirty = useMemo(() => !projectsEqual(project, savedProject), [project, savedProject]);

  const hiddenTrackIds = useMemo(() => {
    const hidden = new Set<string>();
    for (const t of project.tracks) {
      if (!isTrackVisible(viewLayout, t.id)) hidden.add(t.id);
    }
    for (const t of project.camera_tracks) {
      if (!isTrackVisible(viewLayout, t.id)) hidden.add(t.id);
    }
    return hidden;
  }, [project, viewLayout]);

  const showPreviewRow = viewLayout.rigPreview || viewLayout.cameraView;
  const showTimelineBottom =
    viewLayout.transport ||
    viewLayout.scrubSection ||
    project.tracks.some((t) => isTrackVisible(viewLayout, t.id)) ||
    project.camera_tracks.some((t) => isTrackVisible(viewLayout, t.id));



  const refreshList = useCallback(() => {

    setAnimationList(listAnimations());

  }, []);



  const { playing, playhead, play, pause, stop, scrub } = usePlayback(project.duration);

  const { pose: livePose, recallPose, startHoming, startZoomHoming, homeAll, cancelHoming, cancelZoomHoming } =
    useLivePose(
    true,
    project,
    playhead,
    speedPercent,
    velocities,
    targetLock,
    zoomVelocity,
    (axis) => {
      setVelocities((v) => {
        if (Math.abs(v[axis]) < 1e-6) return v;
        const next = [...v];
        next[axis] = 0;
        return next;
      });
    },
    () => {
      setZoomVelocity(0);
    },
    subjectAimPoint
  );

  const {
    calibration,
    setMeasuredHomeM,
    clearCalibration,
    focusFollow,
    setFocusFollow,
  } = useFocusCalibration();



  const loadAnimation = useCallback(

    (id: string) => {

      const loaded = loadAnimationProject(id);

      if (!loaded) return;

      const normalized = normalizeProject(loaded);

      setActiveId(id);

      setProject(normalized);

      setSavedProject(structuredClone(normalized));

      setSelection(null);

      stop();

      if (normalized.subjectAim) {
        setSubjectAimPoint(normalized.subjectAim);
      }

      refreshList();

    },

    [refreshList, stop, setSubjectAimPoint]

  );



  const commitSave = useCallback(

    (id: string, nextProject: TimelineProject) => {

      const savedId = saveAnimation(id, nextProject);

      const loaded = loadAnimationProject(savedId)!;

      const normalized = normalizeProject(loaded);

      setActiveId(savedId);

      setProject(normalized);

      setSavedProject(structuredClone(normalized));

      refreshList();

      return savedId;

    },

    [refreshList]

  );



  const requestSelectAnimation = useCallback(

    (targetId: string) => {

      if (targetId === activeId) return;

      if (dirty) {

        setDialog({ kind: "unsaved-switch", targetId });

        return;

      }

      loadAnimation(targetId);

    },

    [activeId, dirty, loadAnimation]

  );



  const handleSave = useCallback(() => {

    commitSave(activeId, project);

  }, [activeId, commitSave, project]);



  const handleSaveAs = useCallback(() => {

    setDialog({ kind: "save-as" });

  }, []);



  const handleNew = useCallback(() => {

    if (dirty) {

      setDialog({ kind: "unsaved-switch", targetId: "__new__" });

      return;

    }

    setDialog({ kind: "new" });

  }, [dirty]);



  const deleteSelection = useCallback(() => {

    if (!selection) return;

    const next = structuredClone(project);

    if (selection.kind === "motor") {

      const track = next.tracks.find((t) => t.id === selection.trackId);

      if (track) track.clips = track.clips.filter((c) => c.id !== selection.clipId);

    } else {

      const track = next.camera_tracks.find((t) => t.id === selection.trackId);

      if (track) track.clips = track.clips.filter((c) => c.id !== selection.clipId);

    }

    updateProject(next);

    setSelection(null);

  }, [selection, project, updateProject]);

  const { recording: motionRecording, toggleRecording } = useMotionRecording(
    () => livePose,
    () => playhead,
    updateProject
  );

  useGamepad(gamepadEnabled, speedPercent, (v) => setVelocities(v), setZoomVelocity);

  const shortcutHandlers = useMemo(
    () => ({
      playPause: () => (playing ? pause() : play()),
      stop: () => stop(),
      stepBack: () => scrub(Math.max(0, playhead - 0.25)),
      stepForward: () => scrub(Math.min(project.duration, playhead + 0.25)),
      deleteSelection: () => deleteSelection(),
      save: () => {
        if (dirty) handleSave();
      },
      toggleRecord: () => toggleRecording(project),
      homeAll: () => {
        setVelocities([0, 0, 0, 0]);
        setZoomVelocity(0);
        homeAll();
      },
    }),
    [
      playing,
      pause,
      play,
      stop,
      scrub,
      playhead,
      project,
      deleteSelection,
      dirty,
      handleSave,
      toggleRecording,
      homeAll,
    ]
  );

  useKeyboardShortcuts(shortcutHandlers, appView === "editor");

  const handleRecallPose = useCallback(
    (pose: RigPose, aim?: { x: number; y: number; z: number }) => {
      recallPose(pose);
      if (aim) setSubjectAimPoint(aim);
    },
    [recallPose, setSubjectAimPoint]
  );

  useEffect(() => {
    setViewLayout((prev) => mergeTrackVisibility(prev, project));
  }, [project]);

  useEffect(() => {
    saveViewLayout(viewLayout);
  }, [viewLayout]);

  if (appView === "docs") {
    return <DocsPage onBack={() => setAppView("editor")} />;
  }

  return (

    <div className="app-shell">

      <header className="app-header">

        <div className="header-telemetry" aria-hidden="true">
          <span className="telemetry-unit">UNIT / DIW-01</span>
          <span className="telemetry-rev">REV 2.6</span>
        </div>

        <div className="brand">
          <h1>
            <span className="brand-glyph" aria-hidden="true">CRC</span>
            <span className="brand-title">Cam Rig Control</span>
          </h1>
          <span className="project-name">
            {project.name}
            {dirty && <span className="project-modified"> · unsaved</span>}
          </span>
        </div>

        {DEMO_MODE && (

          <span className="demo-banner" title="No connection to Pi or Mega">

            Demo mode — UI preview

          </span>

        )}

        <div className="header-actions">
        <button type="button" className="view-menu-trigger" onClick={() => setAppView("docs")} title="Documentation">
          Docs
        </button>
        <ViewMenu layout={viewLayout} project={project} onChange={setViewLayout} />
        </div>

      </header>



      <div className="workspace timeline-workspace">

          <CollapsibleSidebar
            side="left"
            collapsed={!viewLayout.leftSidebar}
            label="left sidebar"
            onToggle={() =>
              setViewLayout((layout) => ({ ...layout, leftSidebar: !layout.leftSidebar }))
            }
          >
          <div className="workspace-left">
            <CollapsibleSection
              title="Animations"
              storageKey="left-animations"
              defaultOpen
              badge={`${animationList.length}`}
            >
              <PresetSidebar
                compact
                animations={animationList}
                activeId={activeId}
                dirty={dirty}
                onSelect={requestSelectAnimation}
                onSave={handleSave}
                onSaveAs={handleSaveAs}
                onNew={handleNew}
                onRename={(id) => setDialog({ kind: "rename", targetId: id })}
                onDuplicate={(id) => {
                  const copyId = duplicateAnimation(id);
                  if (copyId) loadAnimation(copyId);
                }}
                onDelete={(id) => setDialog({ kind: "delete", targetId: id })}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Poses" storageKey="left-poses" defaultOpen badge="10">
              <PoseSidebar
                compact
                livePose={livePose}
                subjectAimPoint={subjectAimPoint}
                onRecallPose={handleRecallPose}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Motions" storageKey="left-motions" defaultOpen badge="5">
              <ClipPalette
                compact
                items={CLIP_PALETTE}
                selectedId={activePaletteItem?.id ?? null}
                onSelect={setActivePaletteItem}
              />
            </CollapsibleSection>
          </div>
          </CollapsibleSidebar>



          <main className="workspace-center">

            <WorkspaceResizer
              top={
                showPreviewRow ? (
                <div className="center-preview-row">
                  {viewLayout.rigPreview && (
                    <div className="preview-pane">
                      <RigPreview
                        project={project}
                        playhead={playhead}
                        speedPercent={speedPercent}
                        livePose={livePose}
                        calibration={calibration}
                        focusFollow={focusFollow}
                        subjectAimPoint={subjectAimPoint}
                        moveTargetEnabled={moveTargetEnabled}
                        onSubjectAimChange={setSubjectAimPoint}
                        docked
                      />
                    </div>
                  )}
                  {viewLayout.cameraView && (
                    <div className="preview-pane">
                      <CameraViewPreview
                        project={project}
                        playhead={playhead}
                        speedPercent={speedPercent}
                        livePose={livePose}
                        calibration={calibration}
                        focusFollow={focusFollow}
                        subjectAimPoint={subjectAimPoint}
                        moveTargetEnabled={moveTargetEnabled}
                        onSubjectAimChange={setSubjectAimPoint}
                        showHorizon={viewLayout.cameraHorizon}
                        onionSkinEnabled={viewLayout.cameraOnionSkin}
                        onionSkinOffset={viewLayout.onionSkinOffset}
                        docked
                      />
                    </div>
                  )}
                </div>
                ) : undefined
              }
              bottom={
                showTimelineBottom ? (
                <div className="timeline-stack">
                  {viewLayout.transport && (
                  <TransportBar

                    playhead={playhead}

                    duration={project.duration}

                    playing={playing}

                    speedPercent={speedPercent}

                    onPlay={play}

                    onPause={pause}

                    onStop={stop}

                    onSpeedPercentChange={setSpeedPercent}

                    onRecord={() => toggleRecording(project)}

                    recording={motionRecording}

                  />

                  )}

                  {viewLayout.scrubSection && (
                  <EffectorBar

                    project={project}

                    playhead={playhead}

                    playing={playing}

                    speedPercent={speedPercent}

                  />
                  )}

                  <TimelineEditor

                    project={project}

                    playhead={playhead}

                    selection={selection}

                    snapEnabled={snapEnabled}

                    activePaletteItem={activePaletteItem}

                    onSnapToggle={setSnapEnabled}

                    onProjectChange={updateProject}

                    onEnsureDuration={ensureDuration}

                    onSelect={setSelection}

                    onSeek={scrub}

                    hiddenTrackIds={hiddenTrackIds}

                  />

                </div>
                ) : (
                  <div className="timeline-stack timeline-stack-empty" />
                )
              }
            />

          </main>



          <CollapsibleSidebar
            side="right"
            collapsed={!viewLayout.inspector}
            label="right sidebar"
            onToggle={() =>
              setViewLayout((layout) => ({ ...layout, inspector: !layout.inspector }))
            }
          >
          <RightSidebar
            project={project}
            selection={selection}
            speedPercent={speedPercent}
            livePose={livePose}
            velocities={velocities}
            zoomVelocity={zoomVelocity}
            demoMode={DEMO_MODE}
            targetLock={targetLock}
            calibration={calibration}
            focusFollow={focusFollow}
            onMeasuredHomeChange={setMeasuredHomeM}
            onClearCalibration={clearCalibration}
            onFocusFollowChange={setFocusFollow}
            onTargetLockChange={setTargetLock}
            subjectAimPoint={subjectAimPoint}
            moveTargetEnabled={moveTargetEnabled}
            onMoveTargetEnabledChange={setMoveTargetEnabled}
            onResetSubjectAim={resetSubjectAim}
            gamepadEnabled={gamepadEnabled}
            onGamepadEnabledChange={setGamepadEnabled}
            onUpdateProject={updateProject}
            onDeleteSelection={deleteSelection}
            onSpeedPercentChange={setSpeedPercent}
            onVelocityChange={(axis, v) => {
              const next = [...velocities];
              next[axis] = v;
              setVelocities(next);
            }}
            onZoomVelocityChange={setZoomVelocity}
            onAxisStop={(axis) => {
              cancelHoming(axis);
              setVelocities((v) => {
                const next = [...v];
                next[axis] = 0;
                return next;
              });
            }}
            onZoomStop={() => {
              cancelZoomHoming();
              setZoomVelocity(0);
            }}
            onAxisHome={(axis) => {
              setVelocities((v) => {
                const next = [...v];
                next[axis] = 0;
                return next;
              });
              startHoming(axis);
            }}
            onZoomHome={() => {
              setZoomVelocity(0);
              startZoomHoming();
            }}
            onHomeAll={() => {
              setVelocities([0, 0, 0, 0]);
              setZoomVelocity(0);
              homeAll();
            }}
          />
          </CollapsibleSidebar>

        </div>



      <AppFooter duration={project.duration} />



      {dialog.kind === "unsaved-switch" && (

        <UnsavedChangesDialog

          animationName={project.name}

          onCancel={() => setDialog({ kind: "none" })}

          onSave={() => {

            const targetId = dialog.targetId;

            commitSave(activeId, project);

            setDialog({ kind: "none" });

            if (targetId === "__new__") {

              setDialog({ kind: "new" });

            } else {

              loadAnimation(targetId);

            }

          }}

          onSaveAs={() => {

            setDialog({

              kind: "save-as",

              afterSave: "switch",

              targetId: dialog.targetId,

            });

          }}

          onDiscard={() => {

            const targetId = dialog.targetId;

            setDialog({ kind: "none" });

            if (targetId === "__new__") {

              setDialog({ kind: "new" });

            } else {

              loadAnimation(targetId);

            }

          }}

        />

      )}



      {dialog.kind === "save-as" && (

        <AnimationNameDialog

          title="Save animation as"

          label="Name"

          initialName={`${project.name} copy`}

          confirmLabel="Save"

          onCancel={() => setDialog({ kind: "none" })}

          onConfirm={(name) => {

            const newId = saveAnimationAs(project, name);

            const loaded = loadAnimationProject(newId)!;

            const normalized = normalizeProject(loaded);

            setActiveId(newId);

            setProject(normalized);

            setSavedProject(structuredClone(normalized));

            refreshList();

            const targetId = dialog.targetId;

            const afterSave = dialog.afterSave;

            setDialog({ kind: "none" });

            if (afterSave === "switch" && targetId && targetId !== "__new__") {

              loadAnimation(targetId);

            } else if (afterSave === "switch" && targetId === "__new__") {

              setDialog({ kind: "new" });

            }

          }}

        />

      )}



      {dialog.kind === "rename" && (

        <AnimationNameDialog

          title="Rename animation"

          label="Name"

          initialName={animationList.find((a) => a.id === dialog.targetId)?.name ?? project.name}

          confirmLabel="Rename"

          onCancel={() => setDialog({ kind: "none" })}

          onConfirm={(name) => {

            renameAnimation(dialog.targetId, name);

            refreshList();

            if (dialog.targetId === activeId) {

              setProject((p) => ({ ...p, name: name.trim() }));

              setSavedProject((p) => ({ ...p, name: name.trim() }));

            }

            setDialog({ kind: "none" });

          }}

        />

      )}



      {dialog.kind === "delete" && (() => {

        const meta = animationList.find((a) => a.id === dialog.targetId);

        if (!meta) return null;

        const isRevert = meta.builtin && meta.overridden;

        return (

          <ConfirmDialog

            title={isRevert ? "Revert animation?" : "Delete animation?"}

            message={

              isRevert

                ? `Restore "${meta.name}" to the original built-in version? Your edits will be lost.`

                : `Delete "${meta.name}"? This cannot be undone.`

            }

            confirmLabel={isRevert ? "Revert" : "Delete"}

            danger

            onCancel={() => setDialog({ kind: "none" })}

            onConfirm={() => {

              const id = dialog.targetId;

              deleteAnimation(id);

              refreshList();

              setDialog({ kind: "none" });

              if (id === activeId) {

                loadAnimation("blank");

              }

            }}

          />

        );

      })()}



      {dialog.kind === "new" && (

        <AnimationNameDialog

          title="New animation"

          label="Name"

          initialName="Untitled animation"

          confirmLabel="Create"

          onCancel={() => setDialog({ kind: "none" })}

          onConfirm={(name) => {

            const { id, project: blank } = createBlankAnimation(name);

            setActiveId(id);

            setProject(blank);

            setSavedProject(structuredClone(blank));

            setSelection(null);

            stop();

            refreshList();

            setDialog({ kind: "none" });

          }}

        />

      )}

    </div>

  );

}

