import { useCallback, useState } from "react";
import {
  DEFAULT_SUBJECT_AIM,
  loadSubjectAim,
  saveSubjectAim,
  type SubjectAimPoint,
} from "../lib/subjectTarget";

export function useSubjectTarget() {
  const [aimPoint, setAimInternal] = useState<SubjectAimPoint>(() => loadSubjectAim());
  const [moveEnabled, setMoveEnabled] = useState(false);

  const setAimPoint = useCallback((aim: SubjectAimPoint) => {
    setAimInternal(aim);
    saveSubjectAim(aim);
  }, []);

  const resetAimToHome = useCallback(() => {
    setAimPoint({ ...DEFAULT_SUBJECT_AIM });
  }, [setAimPoint]);

  return {
    aimPoint,
    setAimPoint,
    moveEnabled,
    setMoveEnabled,
    resetAimToHome,
  };
}
