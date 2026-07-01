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

// Steps per output revolution @ 1/16 microstepping (DRV8825 MS pins)
#define STEPS_PER_REV_GEARED  16576.0f  // boom, swing: 200 * 16 * 5.18
#define STEPS_PER_REV_DIRECT   3200.0f  // yaw, pitch: plain NEMA 17

// Motion limits (steps/s) — tune on hardware
static const float MAX_VEL[NUM_AXES]  = {600, 800, 1200, 1200};
static const float MAX_ACCEL[NUM_AXES] = {300, 400, 600, 600};

static const bool INVERT_DIR[NUM_AXES] = {false, false, false, false};

#define SERIAL_BAUD 115200
#define WATCHDOG_MS 200

#define BOOM_SOFT_MIN_DEFAULT 0
#define BOOM_SOFT_MAX_DEFAULT 100000
