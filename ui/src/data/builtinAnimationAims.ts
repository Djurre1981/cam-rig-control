import type { BuiltinAnimationId } from "../lib/animationLibrary";
import { poseFromTimeline } from "../lib/rigKinematics";
import { DEFAULT_SUBJECT_AIM, subjectAimForPose, type SubjectAimPoint } from "../lib/subjectTarget";
import type { TimelineProject } from "../types";

const orbitCentre = { fixed: DEFAULT_SUBJECT_AIM };

/** Default subject aim for each built-in animation (applied when the project is loaded). */
export function builtinAnimationAim(
  id: BuiltinAnimationId,
  project: TimelineProject
): SubjectAimPoint | undefined {
  const t0 = poseFromTimeline(project, 0);

  switch (id) {
    case "demo":
    case "slow_swing":
    case "blank":
    case "reveal_rise":
    case "orbit_slow":
    case "crane_down":
    case "whip_pan":
    case "timelapse_sweep":
      return subjectAimForPose(t0, orbitCentre);

    case "push_in":
      return subjectAimForPose(t0, { distanceM: 0.88 });

    case "interview_two":
      return subjectAimForPose(t0, { distanceM: 1.2, lateralM: -0.38 });

    default:
      return undefined;
  }
}
