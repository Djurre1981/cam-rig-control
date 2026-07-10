import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_CALIBRATION,
  type FocusCalibration,
  loadFocusCalibration,
  loadFocusFollowDemo,
  saveFocusCalibration,
  saveFocusFollowDemo,
} from "../lib/focusCalibration";

export function useFocusCalibration() {
  const [calibration, setCalibration] = useState<FocusCalibration>(() => loadFocusCalibration());
  const [focusFollow, setFocusFollowState] = useState(() => loadFocusFollowDemo());

  useEffect(() => {
    saveFocusCalibration(calibration);
  }, [calibration]);

  const setMeasuredHomeM = useCallback((metres: number | null) => {
    setCalibration({ measuredHomeM: metres != null && metres > 0 ? metres : null });
  }, []);

  const setFocusFollow = useCallback((on: boolean) => {
    setFocusFollowState(on);
    saveFocusFollowDemo(on);
  }, []);

  const clearCalibration = useCallback(() => {
    setCalibration({ ...DEFAULT_CALIBRATION });
  }, []);

  return {
    calibration,
    setMeasuredHomeM,
    clearCalibration,
    focusFollow,
    setFocusFollow,
  };
}
