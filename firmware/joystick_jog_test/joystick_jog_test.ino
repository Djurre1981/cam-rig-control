/*
 * Joystick jog test — CNC Shield V3 + Arduino Uno
 *
 * Hold stick off-center -> motor keeps running until truly centered.
 * Serial status is suppressed while any axis is active to keep stepping smooth.
 */

#include <AccelStepper.h>
#include "config.h"

AccelStepper steppers[NUM_AXES] = {
  AccelStepper(AccelStepper::DRIVER, STEP_PINS[AXIS_BOOM],  DIR_PINS[AXIS_BOOM]),
  AccelStepper(AccelStepper::DRIVER, STEP_PINS[AXIS_SWING], DIR_PINS[AXIS_SWING]),
  AccelStepper(AccelStepper::DRIVER, STEP_PINS[AXIS_YAW],   DIR_PINS[AXIS_YAW]),
  AccelStepper(AccelStepper::DRIVER, STEP_PINS[AXIS_PITCH], DIR_PINS[AXIS_PITCH]),
};

const uint8_t JOY_PINS[NUM_AXES] = {
  JOY_BOOM_PIN, JOY_SWING_PIN, JOY_YAW_PIN, JOY_PITCH_PIN
};

float targetVel[NUM_AXES] = {0, 0, 0, 0};
float joyFiltered[NUM_AXES] = {JOY_CENTER, JOY_CENTER, JOY_CENTER, JOY_CENTER};
bool axisActive[NUM_AXES] = {false, false, false, false};
uint8_t releaseCount[NUM_AXES] = {0, 0, 0, 0};
unsigned long lastJoyMs = 0;
unsigned long lastStatusMs = 0;
bool lastBoomMin = false;
bool lastBoomMax = false;
uint8_t lastActMask = 0;

int readJoystickRaw(uint8_t axis) {
  long sum = 0;
  for (uint8_t i = 0; i < 4; i++) {
    sum += analogRead(JOY_PINS[axis]);
  }
  return (int)(sum / 4);
}

void setupEnable() {
  pinMode(ENABLE_PIN, OUTPUT);
  digitalWrite(ENABLE_PIN, LOW);
}

void setupLimits() {
  pinMode(LIMIT_BOOM_MIN_PIN, INPUT_PULLUP);
  pinMode(LIMIT_BOOM_MAX_PIN, INPUT_PULLUP);
}

void setupSteppers() {
  for (int i = 0; i < NUM_AXES; i++) {
    steppers[i].setMaxSpeed(MAX_VEL[i] * JOG_SPEED_SCALE);
    if (INVERT_DIR[i]) {
      steppers[i].setPinsInverted(true);
    }
  }
}

bool boomAtMin() { return digitalRead(LIMIT_BOOM_MIN_PIN) == LOW; }
bool boomAtMax() { return digitalRead(LIMIT_BOOM_MAX_PIN) == LOW; }

bool anyAxisActive() {
  for (int i = 0; i < NUM_AXES; i++) {
    if (axisActive[i]) return true;
  }
  return false;
}

uint8_t activeMask() {
  uint8_t mask = 0;
  for (int i = 0; i < NUM_AXES; i++) {
    if (axisActive[i]) mask |= (1 << i);
  }
  return mask;
}

float velocityFromDelta(int delta, float maxVel) {
  float sign = (delta > 0) ? 1.0f : -1.0f;
  float mag = (abs(delta) - JOY_DEADZONE_ENTER) / (float)(512 - JOY_DEADZONE_ENTER);
  mag = constrain(mag, 0.0f, 1.0f);
  return sign * mag * maxVel;
}

void updateAxis(uint8_t axis) {
  int raw = readJoystickRaw(axis);
  joyFiltered[axis] = joyFiltered[axis] * 0.85f + raw * 0.15f;
  int delta = (int)joyFiltered[axis] - JOY_CENTER;
  int absDelta = abs(delta);

  if (absDelta >= JOY_DEADZONE_ENTER) {
    axisActive[axis] = true;
    releaseCount[axis] = 0;
  } else if (absDelta <= JOY_DEADZONE_EXIT) {
    if (axisActive[axis]) {
      if (releaseCount[axis] < 255) {
        releaseCount[axis]++;
      }
      if (releaseCount[axis] >= JOY_RELEASE_FRAMES) {
        axisActive[axis] = false;
      }
    }
  } else {
    releaseCount[axis] = 0;
  }

  if (!axisActive[axis]) {
    targetVel[axis] = 0.0f;
    return;
  }

  int effectiveDelta = absDelta;
  if (effectiveDelta < JOY_DEADZONE_ENTER) {
    effectiveDelta = JOY_DEADZONE_ENTER;
  }
  targetVel[axis] = velocityFromDelta((delta < 0) ? -effectiveDelta : effectiveDelta,
                                      MAX_VEL[axis] * JOG_SPEED_SCALE);
}

void clampBoomVelocity() {
  if ((boomAtMin() && targetVel[AXIS_BOOM] < 0) ||
      (boomAtMax() && targetVel[AXIS_BOOM] > 0)) {
    targetVel[AXIS_BOOM] = 0;
  }
}

void applyVelocities() {
  clampBoomVelocity();
  for (int i = 0; i < NUM_AXES; i++) {
    steppers[i].setSpeed(targetVel[i]);
  }
}

void readJoysticks() {
  for (int i = 0; i < NUM_AXES; i++) {
    updateAxis(i);
  }
  applyVelocities();
}

void printStatus() {
  if (Serial.availableForWrite() < 64) {
    return;
  }

  Serial.print(F("VEL "));
  for (int i = 0; i < NUM_AXES; i++) {
    Serial.print((int)targetVel[i]);
    if (i < NUM_AXES - 1) Serial.print(',');
  }

  Serial.print(F(" | ACT "));
  for (int i = 0; i < NUM_AXES; i++) {
    Serial.print(axisActive[i] ? '1' : '0');
  }

  Serial.print(F(" | REL "));
  for (int i = 0; i < NUM_AXES; i++) {
    Serial.print(releaseCount[i]);
    if (i < NUM_AXES - 1) Serial.print(',');
  }

  Serial.print(F(" | LIM MIN="));
  Serial.print(boomAtMin() ? '1' : '0');
  Serial.print(F(" MAX="));
  Serial.print(boomAtMax() ? '1' : '0');

  Serial.print(F(" | JOY "));
  for (int i = 0; i < NUM_AXES; i++) {
    Serial.print((int)joyFiltered[i]);
    if (i < NUM_AXES - 1) Serial.print(',');
  }
  Serial.println();
}

void setup() {
  Serial.begin(SERIAL_BAUD);
  setupEnable();
  setupLimits();
  setupSteppers();
  lastBoomMin = boomAtMin();
  lastBoomMax = boomAtMax();
  Serial.println(F("READY joystick_jog_test 0.1.2"));
  Serial.println(F("Hold stick off-center to jog; center to stop"));
}

void loop() {
  digitalWrite(ENABLE_PIN, LOW);

  unsigned long now = millis();
  if (now - lastJoyMs >= JOY_READ_MS) {
    readJoysticks();
    lastJoyMs = now;
  }

  for (int i = 0; i < NUM_AXES; i++) {
    if (axisActive[i]) {
      steppers[i].runSpeed();
    }
  }

  bool minHit = boomAtMin();
  bool maxHit = boomAtMax();
  uint8_t actMask = activeMask();
  bool actChanged = actMask != lastActMask;
  lastActMask = actMask;

  if (actChanged) {
    printStatus();
    lastStatusMs = now;
  } else if (!anyAxisActive() && (now - lastStatusMs >= STATUS_MS)) {
    printStatus();
    lastStatusMs = now;
  }

  if (minHit != lastBoomMin || maxHit != lastBoomMax) {
    printStatus();
    lastBoomMin = minHit;
    lastBoomMax = maxHit;
    lastStatusMs = now;
  }
}
