/**
 * DIW 4-axis camera rig — geometry and travel limits from CAD renders.
 * Source: cursor/renders/ (side + isometric annotations, Jul 2026).
 *
 * Side elevation: +X = camera, −X = counterweight, +Y = up.
 * Boom angle: 0° = horizontal; +40° max height, −27° min height.
 */

/** Home/rest boom angle — horizontal reference in CAD side view. */
export const BOOM_REST_ANGLE = 0;

/** Boom travel limits (degrees from horizontal). */
export const BOOM_MIN_DEG = -27;
export const BOOM_MAX_DEG = 40;
export const BOOM_RANGE_DEG = BOOM_MAX_DEG - BOOM_MIN_DEG;

export const BOOM_MIN_RAD = (BOOM_MIN_DEG * Math.PI) / 180;
export const BOOM_MAX_RAD = (BOOM_MAX_DEG * Math.PI) / 180;

// —— Pole & central pivot (metres) ——
/** Floor to boom tilt pivot centre (1319.260 mm). */
export const POLE_HEIGHT_M = 1.31926;
/** Vertical spacing between parallelogram pivots at central block (139.567 mm). */
export const PARALLELOGRAM_SPACING_M = 0.139567;
/** Vertical spacing between parallelogram pivots at head end (140.000 mm). */
export const PARALLELOGRAM_END_SPACING_M = 0.14;

// —— Boom reach (metres) ——
/** Horizontal reach from swing/boom pivot to yaw rotation axis (909.159 mm). */
export const REACH_YAW_AXIS_M = 0.909159;

/** Front parallelogram pivots — same X as yaw axis in side elevation. */
export const REACH_YAW_M = REACH_YAW_AXIS_M;

/** Horizontal reach from swing/boom pivot to rear parallelogram pivot (505.579 mm). */
export const REACH_REAR_M = 0.505579;
/** Total rear-to-front pivot span (1415.044 mm). */
export const BOOM_SPAN_M = 1.415044;

/** Upper-tube segment from rear pivot to front pivot (741.944 mm). */
export const BOOM_LINK_LENGTH_M = 0.741944;

// —— Camera head — front elevation CAD (Jul 2026) ——
/** Head top (yaw pivot) to outer-frame top crossbar (195.339 mm). */
export const HEAD_TOP_TO_FRAME_TOP_M = 0.195339;
/** Cradle bottom to head top (389.399 mm). */
export const HEAD_TOTAL_HEIGHT_M = 0.389399;
/** Cradle bottom to lens centre (91.398 mm). */
export const LENS_CENTER_ABOVE_CRADLE_BOTTOM_M = 0.091398;
/** Outer frame width — outer faces of side posts (298.000 mm). */
export const HEAD_OUTER_WIDTH_M = 0.298;
/** Inner U-cradle width — inner faces of side posts (219.127 mm). */
export const HEAD_INNER_WIDTH_M = 0.219127;

export const HEAD_FRAME_DROP_M = HEAD_TOTAL_HEIGHT_M - HEAD_TOP_TO_FRAME_TOP_M;
export const HEAD_OUTER_HALF_M = HEAD_OUTER_WIDTH_M / 2;
export const HEAD_INNER_HALF_M = HEAD_INNER_WIDTH_M / 2;
export const HEAD_Y_BOTTOM_M = -HEAD_TOTAL_HEIGHT_M;
export const HEAD_Y_FRAME_TOP_M = -HEAD_TOP_TO_FRAME_TOP_M;
export const HEAD_Y_LENS_M = HEAD_Y_BOTTOM_M + LENS_CENTER_ABOVE_CRADLE_BOTTOM_M;

/** Pitch gear cluster height above cradle bottom (CAD side view). */
export const HEAD_PITCH_Y_M = HEAD_Y_BOTTOM_M + 0.045;

/** Yaw axis to lens centre vertical drop (298.001 mm). */
export const YAW_TO_LENS_DROP_M = HEAD_TOTAL_HEIGHT_M - LENS_CENTER_ABOVE_CRADLE_BOTTOM_M;

/** Side view: yaw axis forward offset to head depth (90.000 mm). */
export const YAW_TO_CRADLE_FORWARD_M = 0.09;

/** Side elevation: yaw axis to pitch gear centre (230.482 mm) — retained for docs. */
export const YAW_TO_PITCH_DROP_M = 0.230482;

/** Square tube / rail profile for head frame (~22 mm). */
export const HEAD_RAIL_M = 0.022;

/** Bracket truss depth aft of yaw axis toward boom tubes (255.000 mm). */
export const FRONT_BRACKET_DEPTH_M = 0.255;

/** Camera body proxy (lens axis +X). Lens centre placed at HEAD_Y_LENS_M. */
export const CAMERA_BODY_X_M = 0.065;
export const CAMERA_BODY_Y_M = 0.085;
export const CAMERA_BODY_Z_M = 0.105;
export const CAMERA_LENS_RADIUS_M = 0.03;
export const CAMERA_LENS_LENGTH_M = 0.045;

/** Camera mount pad on lower cradle bar. */
export const CAMERA_MOUNT_RISE_M = HEAD_RAIL_M / 2 + 0.002;

/**
 * Pitch-axis → lens geometric centre (procedural proxy).
 * Pitch pivot is on the inner cradle +Z post at the lower gear.
 */
export const MOUNT_TO_LENS_FORWARD_M =
  YAW_TO_CRADLE_FORWARD_M + CAMERA_BODY_X_M / 2 + CAMERA_LENS_LENGTH_M / 2;
export const MOUNT_TO_LENS_DROP_M = HEAD_Y_LENS_M - HEAD_PITCH_Y_M;

// —— Tubing ——
/** Measured boom tube OD at front head (25.945 mm). Lower link stays 3⁄4" OD. */
export const TUBE_UPPER_OD_M = 0.025945;
export const TUBE_UPPER_RADIUS_M = TUBE_UPPER_OD_M / 2;
export const TUBE_LOWER_RADIUS_M = 0.009525;
