#pragma once

// Axis indices — matches cam_rig_uno
#define AXIS_BOOM   0
#define AXIS_SWING  1
#define AXIS_YAW    2
#define AXIS_PITCH  3
#define NUM_AXES    4

// CNC Shield V3 on Arduino Uno R3
static const uint8_t STEP_PINS[NUM_AXES] = {2, 3, 4, 12};
static const uint8_t DIR_PINS[NUM_AXES]  = {5, 6, 7, 13};
#define ENABLE_PIN 8

#define LIMIT_BOOM_MIN_PIN 9
#define LIMIT_BOOM_MAX_PIN 10

// Safe jog cap as fraction of cam_rig_uno MAX_VEL (0.25 = 25%)
#define JOG_SPEED_SCALE 0.25f
static const float MAX_VEL[NUM_AXES] = {4628, 41440, 6400, 12800};

// Flip per axis if joystick direction is opposite to desired CW/CCW
static const bool INVERT_DIR[NUM_AXES] = {false, false, true, false};

// Dual-axis joystick analog inputs (VRx/VRy only — SW not used)
// Module 1: boom + swing | Module 2: yaw + pitch
#define JOY_BOOM_PIN   A0
#define JOY_SWING_PIN  A1
#define JOY_YAW_PIN    A2
#define JOY_PITCH_PIN  A3

#define JOY_CENTER         512
#define JOY_DEADZONE_ENTER 100   // stick must pass this to start motion
#define JOY_DEADZONE_EXIT   60   // stick must return inside this to stop
#define JOY_RELEASE_FRAMES  15   // consecutive centered reads before stop (~300 ms)
#define JOY_READ_MS         20   // refresh analog at 50 Hz; velocity latched between reads

#define SERIAL_BAUD 115200
#define STATUS_MS  2000          // status only while idle (see sketch)
