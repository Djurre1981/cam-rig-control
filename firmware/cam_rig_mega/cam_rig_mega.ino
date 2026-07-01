/*
 * Cam Rig Mega — 4-axis velocity jog firmware
 * Protocol: see docs/BUILD_PLAN.md Phase 3
 *
 * Libraries: install "AccelStepper" via Arduino Library Manager
 * Board: Arduino Mega 2560
 */

#include <AccelStepper.h>
#include "config.h"

AccelStepper steppers[NUM_AXES] = {
  AccelStepper(AccelStepper::DRIVER, STEP_PINS[AXIS_BOOM],  DIR_PINS[AXIS_BOOM]),
  AccelStepper(AccelStepper::DRIVER, STEP_PINS[AXIS_SWING], DIR_PINS[AXIS_SWING]),
  AccelStepper(AccelStepper::DRIVER, STEP_PINS[AXIS_YAW],   DIR_PINS[AXIS_YAW]),
  AccelStepper(AccelStepper::DRIVER, STEP_PINS[AXIS_PITCH], DIR_PINS[AXIS_PITCH]),
};

float targetVel[NUM_AXES] = {0, 0, 0, 0};
long boomSoftMin = BOOM_SOFT_MIN_DEFAULT;
long boomSoftMax = BOOM_SOFT_MAX_DEFAULT;
unsigned long lastCommandMs = 0;
bool homing = false;

void setupEnable() {
  for (int i = 0; i < NUM_AXES; i++) {
    pinMode(ENABLE_PINS[i], OUTPUT);
    digitalWrite(ENABLE_PINS[i], LOW);  // active LOW = drivers enabled
  }
}

void setupLimits() {
  pinMode(LIMIT_BOOM_MIN_PIN, INPUT_PULLUP);
  pinMode(LIMIT_BOOM_MAX_PIN, INPUT_PULLUP);
}

void setupSteppers() {
  for (int i = 0; i < NUM_AXES; i++) {
    steppers[i].setMaxSpeed(MAX_VEL[i]);
    steppers[i].setAcceleration(MAX_ACCEL[i]);
    if (INVERT_DIR[i]) {
      steppers[i].setPinsInverted(true);
    }
  }
}

void stopAll() {
  for (int i = 0; i < NUM_AXES; i++) {
    targetVel[i] = 0;
    steppers[i].stop();
    steppers[i].setSpeed(0);
  }
}

bool boomAtMin() { return digitalRead(LIMIT_BOOM_MIN_PIN) == LOW; }
bool boomAtMax() { return digitalRead(LIMIT_BOOM_MAX_PIN) == LOW; }

void clampBoomVelocity() {
  long pos = steppers[AXIS_BOOM].currentPosition();
  if ((pos <= boomSoftMin && targetVel[AXIS_BOOM] < 0) || boomAtMin()) {
    targetVel[AXIS_BOOM] = max(targetVel[AXIS_BOOM], 0.0f);
  }
  if ((pos >= boomSoftMax && targetVel[AXIS_BOOM] > 0) || boomAtMax()) {
    targetVel[AXIS_BOOM] = min(targetVel[AXIS_BOOM], 0.0f);
  }
}

void applyVelocities() {
  clampBoomVelocity();
  for (int i = 0; i < NUM_AXES; i++) {
    steppers[i].setSpeed(targetVel[i]);
  }
}

void homeBoom() {
  homing = true;
  stopAll();
  targetVel[AXIS_BOOM] = -200;
  while (!boomAtMin()) {
    steppers[AXIS_BOOM].runSpeed();
    if (millis() - lastCommandMs > 10000) break;
  }
  stopAll();
  steppers[AXIS_BOOM].setCurrentPosition(0);
  homing = false;
  Serial.println(F("OK HOME"));
}

String serialBuffer;

void handleLine(String line) {
  line.trim();
  if (line.length() == 0) return;
  lastCommandMs = millis();

  if (line == "STOP") {
    stopAll();
    Serial.println(F("OK"));
    return;
  }

  if (line == "P" || line == "STATUS") {
    if (line == "P") {
      Serial.print(F("P "));
      for (int i = 0; i < NUM_AXES; i++) {
        Serial.print(steppers[i].currentPosition());
        if (i < NUM_AXES - 1) Serial.print(',');
      }
      Serial.println();
    } else {
      Serial.println(F("STATUS cam_rig_mega 0.1.0"));
    }
    return;
  }

  if (line.startsWith("HOME")) {
    homeBoom();
    return;
  }

  if (line.startsWith("LIMITS")) {
    // LIMITS 0,min,max
    int c1 = line.indexOf(',');
    int c2 = line.indexOf(',', c1 + 1);
    if (c1 > 0 && c2 > 0) {
      boomSoftMin = line.substring(c1 + 1, c2).toInt();
      boomSoftMax = line.substring(c2 + 1).toInt();
      Serial.println(F("OK"));
    } else {
      Serial.println(F("ERR LIMITS"));
    }
    return;
  }

  if (line.startsWith("J")) {
    // J v0,v1,v2,v3
    int start = line.indexOf(' ');
    if (start < 0) {
      Serial.println(F("ERR J"));
      return;
    }
    String vals = line.substring(start + 1);
    for (int i = 0; i < NUM_AXES; i++) {
      int comma = vals.indexOf(',');
      String part = (comma >= 0) ? vals.substring(0, comma) : vals;
      targetVel[i] = part.toFloat();
      if (comma >= 0) vals = vals.substring(comma + 1);
    }
    applyVelocities();
    Serial.println(F("OK"));
    return;
  }

  Serial.println(F("ERR UNKNOWN"));
}

void setup() {
  Serial.begin(SERIAL_BAUD);
  setupEnable();
  setupLimits();
  setupSteppers();
  lastCommandMs = millis();
  Serial.println(F("READY cam_rig_mega 0.1.0"));
}

void loop() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      handleLine(serialBuffer);
      serialBuffer = "";
    } else {
      serialBuffer += c;
    }
  }

  if (!homing && (millis() - lastCommandMs > WATCHDOG_MS)) {
    for (int i = 0; i < NUM_AXES; i++) {
      if (targetVel[i] != 0) {
        stopAll();
        break;
      }
    }
  }

  for (int i = 0; i < NUM_AXES; i++) {
    steppers[i].runSpeed();
  }
}
