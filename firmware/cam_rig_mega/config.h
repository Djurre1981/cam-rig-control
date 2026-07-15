#pragma once

// Axis indices
#define AXIS_BOOM   0
#define AXIS_SWING  1
#define AXIS_YAW    2
#define AXIS_PITCH  3
#define NUM_AXES    4

// RAMPS 1.6 on Arduino Mega 2560 (same pin map as RAMPS 1.4)
// X=boom  Y=swing  Z=yaw  E0=pitch — see docs/pin_map.md
static const uint8_t STEP_PINS[NUM_AXES]  = {54, 60, 46, 26};
static const uint8_t DIR_PINS[NUM_AXES]   = {55, 61, 48, 28};
static const uint8_t ENABLE_PINS[NUM_AXES] = {38, 56, 62, 24};  // active LOW

// Boom limits on RAMPS X endstop header (NC to GND, INPUT_PULLUP)
#define LIMIT_BOOM_MIN_PIN 3   // X_MIN
#define LIMIT_BOOM_MAX_PIN 2   // X_MAX

// Steps per motor output revolution @ 1/16 microstepping (DRV8825 MS pins)
#define STEPS_PER_REV_GEARED  16576.0f  // planetary output: 200 * 16 * 5.18
#define STEPS_PER_REV_DIRECT   3200.0f  // plain NEMA 17 @ 1/16 μstep (yaw, pitch)

// Boom gear train (CAD): 20T pinion on motor, 60T sector on boom arm → 3:1
#define BOOM_PINION_TEETH  20
#define BOOM_SECTOR_TEETH  60
#define BOOM_GEAR_RATIO    ((float)BOOM_SECTOR_TEETH / (float)BOOM_PINION_TEETH)  // 3.0
#define STEPS_PER_REV_BOOM (STEPS_PER_REV_GEARED * BOOM_GEAR_RATIO)               // 49728
#define STEPS_PER_DEG_BOOM (STEPS_PER_REV_BOOM / 360.0f)                          // ~138.13

// Swing gear train (CAD): 18T pinion on motor, 180T ring on slew bearing → 10:1
#define SWING_PINION_TEETH  18
#define SWING_RING_TEETH   180
#define SWING_GEAR_RATIO   ((float)SWING_RING_TEETH / (float)SWING_PINION_TEETH)  // 10.0
#define STEPS_PER_REV_SWING (STEPS_PER_REV_GEARED * SWING_GEAR_RATIO)              // 165760
#define STEPS_PER_DEG_SWING (STEPS_PER_REV_SWING / 360.0f)                         // ~460.44

// Yaw gear train (CAD): 20T pinion on motor, 80T gear on yaw axis → 4:1
#define YAW_PINION_TEETH  20
#define YAW_OUTPUT_TEETH  80
#define YAW_GEAR_RATIO    ((float)YAW_OUTPUT_TEETH / (float)YAW_PINION_TEETH)    // 4.0
#define STEPS_PER_REV_YAW (STEPS_PER_REV_DIRECT * YAW_GEAR_RATIO)                  // 12800
#define STEPS_PER_DEG_YAW (STEPS_PER_REV_YAW / 360.0f)                           // ~35.56

// Pitch compound gear train (CAD): 20T pinion → 40T/20T compound → 80T cradle → 8:1
#define PITCH_PINION_TEETH         20
#define PITCH_COMPOUND_LARGE_TEETH 40
#define PITCH_COMPOUND_SMALL_TEETH 20
#define PITCH_OUTPUT_TEETH         80
#define PITCH_STAGE1_RATIO ((float)PITCH_COMPOUND_LARGE_TEETH / (float)PITCH_PINION_TEETH)         // 2.0
#define PITCH_STAGE2_RATIO ((float)PITCH_OUTPUT_TEETH / (float)PITCH_COMPOUND_SMALL_TEETH)         // 4.0
#define PITCH_GEAR_RATIO   (PITCH_STAGE1_RATIO * PITCH_STAGE2_RATIO)                               // 8.0
#define STEPS_PER_REV_PITCH (STEPS_PER_REV_DIRECT * PITCH_GEAR_RATIO)                              // 25600
#define STEPS_PER_DEG_PITCH (STEPS_PER_REV_PITCH / 360.0f)                                         // ~71.11

// Boom travel: +40° to −27° = 67° (see ui/src/lib/rigConstants.ts)
#define BOOM_RANGE_DEG 67.0f
#define BOOM_TRAVEL_STEPS ((long)(BOOM_RANGE_DEG * STEPS_PER_DEG_BOOM + 0.5f))    // 9255

// Motion limits (steps/s) — from min traverse times (see ui/src/lib/motionLimits.ts)
// Boom 67°/2s, Swing 360°/4s, Yaw/Pitch 360°/2s @ 1/16 μstep
static const float MAX_VEL[NUM_AXES]  = {4628, 41440, 6400, 12800};
static const float MAX_ACCEL[NUM_AXES] = {900, 4000, 2400, 4800};

static const bool INVERT_DIR[NUM_AXES] = {false, false, false, false};

#define SERIAL_BAUD 115200
#define WATCHDOG_MS 200

#define BOOM_SOFT_MIN_DEFAULT 0
#define BOOM_SOFT_MAX_DEFAULT BOOM_TRAVEL_STEPS
