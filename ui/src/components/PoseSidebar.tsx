import { useMemo, useState } from "react";
import { listPoses, loadPose, saveUserPose, deleteUserPose, type PoseMeta } from "../lib/poseLibrary";
import type { RigPose } from "../lib/rigKinematics";
import type { SubjectAimPoint } from "../lib/subjectTarget";

type Props = {
  compact?: boolean;
  livePose: RigPose;
  subjectAimPoint: SubjectAimPoint;
  onRecallPose: (pose: RigPose, subjectAim?: SubjectAimPoint) => void;
};

export function PoseSidebar({ compact, livePose, subjectAimPoint, onRecallPose }: Props) {
  const [poses, setPoses] = useState<PoseMeta[]>(() => listPoses());
  const [storeName, setStoreName] = useState("");

  const refresh = () => setPoses(listPoses());

  const handleStore = () => {
    const name = storeName.trim() || `Pose ${new Date().toLocaleTimeString()}`;
    saveUserPose(name, livePose, subjectAimPoint);
    setStoreName("");
    refresh();
  };

  return (
    <div className={["pose-sidebar", compact ? "compact" : ""].filter(Boolean).join(" ")}>
      <div className="pose-store-row">
        <input
          type="text"
          className="pose-store-input"
          placeholder="Name new pose…"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleStore()}
        />
        <button type="button" className="btn-compact" onClick={handleStore} title="Store current live pose">
          Store
        </button>
      </div>
      <ul className="pose-list">
        {poses.map((meta) => (
          <li key={meta.id} className="pose-list-item">
            <button
              type="button"
              className="pose-recall-btn"
              onClick={() => {
                const p = loadPose(meta.id);
                if (p) onRecallPose(p.pose, p.subjectAim);
              }}
              title="Recall pose to live rig"
            >
              <span className="pose-name">{meta.name}</span>
              {meta.builtin && <span className="pose-badge">built-in</span>}
            </button>
            {meta.userCreated && (
              <button
                type="button"
                className="pose-delete-btn"
                title="Delete stored pose"
                onClick={() => {
                  deleteUserPose(meta.id);
                  refresh();
                }}
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
