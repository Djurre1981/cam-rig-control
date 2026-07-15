/*
 * CNC Shield V3 — all axes spin test (Arduino Uno)
 * Spins X/Y/Z/A clockwise for 2 s, pauses 2 s, repeats.
 * Z = yaw slot. Flip CLOCKWISE_DIR if your motor runs the wrong way.
 */

#define ENABLE_PIN 8
#define NUM_AXES 4

const uint8_t STEP_PINS[NUM_AXES] = {2, 3, 4, 12};   // X, Y, Z, A
const uint8_t DIR_PINS[NUM_AXES]  = {5, 6, 7, 13};

#define CLOCKWISE_DIR HIGH
#define STEP_DELAY_US 800   // ~1250 steps/s per axis

void pulseAll() {
  for (int i = 0; i < NUM_AXES; i++) {
    digitalWrite(STEP_PINS[i], HIGH);
  }
  delayMicroseconds(2);
  for (int i = 0; i < NUM_AXES; i++) {
    digitalWrite(STEP_PINS[i], LOW);
  }
}

void spin(unsigned long durationMs) {
  unsigned long start = millis();
  while (millis() - start < durationMs) {
    pulseAll();
    delayMicroseconds(STEP_DELAY_US);
  }
}

void setup() {
  pinMode(ENABLE_PIN, OUTPUT);
  digitalWrite(ENABLE_PIN, LOW);

  for (int i = 0; i < NUM_AXES; i++) {
    pinMode(STEP_PINS[i], OUTPUT);
    pinMode(DIR_PINS[i], OUTPUT);
    digitalWrite(STEP_PINS[i], LOW);
    digitalWrite(DIR_PINS[i], CLOCKWISE_DIR);
  }
}

void loop() {
  spin(2000);
  delay(2000);
}
