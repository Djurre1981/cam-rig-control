/*
 * Enable DRV8825 drivers on CNC Shield V3 (Arduino Uno).
 * Holds D8 (shared enable) LOW so drivers stay enabled for Vref adjustment.
 * Upload, then measure Vref on each driver pot vs GND.
 */

void setup() {
  pinMode(8, OUTPUT);
  digitalWrite(8, LOW);  // active LOW = drivers enabled
}

void loop() {
}
