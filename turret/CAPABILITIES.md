# Turret onboard chips & what you can add

What the board already has, and what you can add with extra parts.

---

## Onboard (no extra parts)

### 1. **ATmega328P internal temperature sensor**

The chip has a **built-in temperature sensor** that measures the **microcontroller’s own temperature** (not room temperature). It goes up when the CPU is busy and when the board is in a warm place.

- **Use:** Chip/board “how hot am I?” – fun for Serial, or to trigger a cooldown.
- **Accuracy:** Rough (±several °C); not for precise room temp.
- **In this project:** Press **#** on the remote to print chip temp (in °C) over Serial. Open the serial monitor to see it.

### 2. **IR receiver (pin 9) – “where’s the remote?”**

A **single** IR receiver can’t tell direction by itself. But you can do a **software trick** with the turret:

- **Scan mode:** Rotate the turret (yaw) slowly while listening for IR. When you press a button, you see which way the turret was pointing when it got the signal → rough direction of the remote. No extra hardware.

### 3. **Free pins for future add-ons**

Currently used: **9** (IR), **10** (yaw), **11** (pitch), **12** (roll).

Still free (among others):

- **Digital:** 2, 3, 4, 5, 6, 7, 8, 13  
- **Analog (ADC):** A0–A7 (also usable as digital)  
- **I2C:** A4 (SDA), A5 (SCL) – for I2C sensors/displays  
- **SPI:** 11–13 are used by servos here; SPI would need different pins or another board

So you have plenty of room for extra sensors or LEDs.

---

## Add-on hardware (you’d need to buy / wire)

| Idea | What to add | Notes |
|------|-------------|--------|
| **Room temperature** | TMP36, LM35, or DHT11/DHT22 (analog or digital) | TMP36/LM35 → one analog pin (e.g. A0). DHT → one digital pin. |
| **Direction of remote** | 2–4 IR receivers on different sides | Compare which receiver gets the signal (or signal strength) to guess direction. |
| **Distance / “see” something** | Ultrasonic (e.g. HC-SR04) or IR distance sensor | Good for “aim at thing in front” or simple avoidance. |
| **Tilt / orientation** | I2C IMU (e.g. MPU6050) | Accelerometer + gyro; level the turret or react to being tilted. |
| **Ambient light** | LDR (photoresistor) on an analog pin | Simple “lights on/off” or “aim toward light.” |
| **Small display** | I2C OLED (e.g. SSD1306) on A4/A5 | Show temp, mode, or status. |
| **Sound** | Piezo buzzer on a digital pin | Beeps, alerts, or simple tunes. |
| **LED** | LED + resistor (e.g. 220Ω) on digital pin | Flash when firing – great for contest demos! |

### Quick wiring for contest demos

**Piezo buzzer** (pin 7, GND): `pinMode(7, OUTPUT); digitalWrite(7, HIGH); delay(50); digitalWrite(7, LOW);` in `fire()` for a satisfying *pew*.

**LED** (pin 6, 220Ω resistor, GND): Flash in `fire()` and `burstFire()` for visible "laser" effect.

---

## Summary

- **Onboard, no extra parts:** Internal chip temperature (press **#** to read over Serial), and a possible “find remote” scan using the existing IR receiver and yaw.
- **With cheap add-ons:** Room temp (TMP36/DHT), distance (ultrasonic), direction (multiple IR receivers), display (I2C OLED), sound (buzzer).

If you want, we can add a “scan for remote” mode (e.g. a button that slowly rotates and reports when it sees IR) or wire another button to the internal temp read.
