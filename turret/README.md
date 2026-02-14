# CrunchLabs IR Turret – reprogram with PlatformIO

This project lets you build and upload code to the **CrunchLabs IR Turret** (Arduino Nano–compatible board) from the command line or Cursor, so we can change behavior and add features together.

## Hardware

- **Board:** Arduino Nano clone (ATmega328). Often uses a **CH340** USB chip.
- **Pins:** YAW servo = 10, PITCH servo = 11, ROLL servo = 12, IR receiver = 9.

## 1. Install tooling (run these in your own terminal)

Pick one option.

### Option A: PlatformIO via Homebrew (recommended)

If Homebrew permissions are fixed:

```bash
brew install platformio
```

If you see permission errors, fix Homebrew ownership first:

```bash
sudo chown -R $(whoami) /opt/homebrew /Users/$(whoami)/Library/Logs/Homebrew
```

Then run `brew install platformio` again.

### Option B: PlatformIO via pip

```bash
python3 -m pip install --user platformio
```

Ensure `~/.local/bin` is in your `PATH` (e.g. in `~/.zshrc`):

```bash
export PATH="$HOME/.local/bin:$PATH"
```

### Check installation

```bash
pio --version
```

## 2. USB driver (macOS)

Many Arduino Nano clones use a **CH340** USB chip. On macOS they often work without a driver; if the board doesn’t show up as a serial port, install the CH340 driver:

- [CH340 driver for macOS](https://www.wch.cn/downloads/CH341SER_MAC_ZIP.html) (download and install the package).

After installing, unplug and replug the turret’s USB cable.

## 3. Build and upload

From the **turret** folder (this project):

```bash
cd /Users/hayley/Cursor/hqkiddo.github.io/turret
pio run
pio run -t upload
```

- **First run:** PlatformIO will download the AVR platform and libraries (Servo, IRremote); that can take a minute.
- **Upload:** Plug in the turret via USB, then run `pio run -t upload`. If you have multiple serial devices, specify the port:

  ```bash
  pio run -t upload --upload-port /dev/cu.usbserial-XXXX
  ```

  List ports: `pio device list` (or on macOS: `ls /dev/cu.*`).

## 4. Serial monitor (optional)

To see debug messages and which IR codes are received:

```bash
pio device monitor
```

Baud rate is 9600. Press the remote buttons and watch the hex codes; you can add new buttons in `src/main.cpp` using those codes.

## Project layout

- **`platformio.ini`** – board (Nano ATmega328), libraries (Servo, IRremote).
- **`src/main.cpp`** – turret logic: IR handling, servos (yaw/pitch/roll), fire, home, etc.

Remote mapping (NEC codes in code):

| Button | Action |
|--------|--------|
| Arrows | Aim (up/down/left/right) |
| OK | Fire one |
| * | Fire all |
| 0 | Shake head no |
| 1 | **Find Remote** – slowly scans; fires when IR detected |
| 2 | **Guard mode** – patrols; alerts (fire + dance) on IR |
| 3 | **Speed toggle** – faster/slower movement |
| 4 | **Burst fire** – 3 rapid shots |
| 5 | Turret dance |
| 6 | **Disco dance** – strobe-style routine |
| 7 | Shoot around randomly |
| 9 | Shake head yes |
| # | Chip temp (Serial); if hot or **double-press** → overheat drama |

If buttons 1–6 don't work, press them and check Serial for hex codes, then update `CMD_1`–`CMD_6` in `src/main.cpp`. See **`CAPABILITIES.md`** for add-on sensor ideas.

## Reference

- [CrunchLabs IR Turret](https://www.crunchlabs.com/products/ir-turret)
- [Community project (PlatformIO + Nano/ESP32)](https://github.com/billism1/hackpack-irturret-customization)
