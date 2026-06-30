#pragma once

// Axis indices
#define AXIS_BOOM   0
#define AXIS_SWING  1
#define AXIS_YAW    2
#define AXIS_PITCH  3
#define NUM_AXES    4

// CNC Shield V3 (Uno pin names) jumpered to Arduino Mega 2560
// X=boom Y=swing Z=yaw A=pitch — see docs/pin_map.md
static const uint8_t STEP_PINS[NUM_AXES] = {2, 3, 4, 12};
static const uint8_t DIR_PINS[NUM_AXES]  = {5, 6, 7, 13};
static const uint8_t ENABLE_PIN = 8;  // active LOW on CNC shield

// Limit switches (boom only) — NC to GND, INPUT_PULLUP
#define LIMIT_BOOM_MIN_PIN 9
#define LIMIT_BOOM_MAX_PIN 10

// Steps per output revolution @ 1/16 microstepping (DRV8825 DIP)
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
