#!/usr/bin/env python3
"""Desk test for Waveshare Stepper Motor HAT (B) — 2 motors max.

Requires Waveshare BCM2835 library or RPi.GPIO.
See: https://www.waveshare.com/wiki/Stepper_Motor_HAT_(B)

Usage (on Pi):
  python3 jog_test.py --motor 1 --steps 200
"""

import argparse
import time

try:
    import RPi.GPIO as GPIO
except ImportError:
    GPIO = None

# BCM pins per Waveshare wiki
MOTORS = {
    1: {"step": 19, "dir": 13, "enable": 12},
    2: {"step": 18, "dir": 24, "enable": 4},
}


def pulse(motor: int, count: int, delay: float, direction: bool) -> None:
    GPIO.output(MOTORS[motor]["dir"], GPIO.HIGH if direction else GPIO.LOW)
    pin = MOTORS[motor]["step"]
    for _ in range(count):
        GPIO.output(pin, GPIO.HIGH)
        time.sleep(delay)
        GPIO.output(pin, GPIO.LOW)
        time.sleep(delay)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--motor", type=int, choices=[1, 2], default=1)
    parser.add_argument("--steps", type=int, default=200)
    parser.add_argument("--forward", action="store_true")
    args = parser.parse_args()
    motor = args.motor

    if GPIO is None:
        print("Run on Raspberry Pi with RPi.GPIO installed")
        raise SystemExit(1)

    GPIO.setmode(GPIO.BCM)
    pins = MOTORS[motor]
    for p in pins.values():
        GPIO.setup(p, GPIO.OUT)
    GPIO.output(pins["enable"], GPIO.LOW)

    pulse(motor, args.steps, 0.001, args.forward)
    GPIO.cleanup()
    print("Done")
