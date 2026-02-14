/*
 * CrunchLabs IR Turret – control with IR remote
 * Board: Arduino Nano (ATmega328). Pins: YAW=10, PITCH=11, ROLL=12, IR=9.
 *
 * ADD-ONS (optional – wire to use):
 *   LED: pin 6 → 220Ω resistor → LED → GND (flashes when firing)
 *   Buzzer: pin 7 → buzzer → GND (pew sound when firing)
 *
 * CONTEST UPGRADES:
 * - Find Remote mode (1): slowly scans, fires when it detects IR
 * - Guard mode (2): patrols and alerts when IR detected
 * - Burst fire (4): 3 rapid shots
 * - Disco dance (6): strobe-style dance
 * - Overheat drama (#): if chip hot, turret "overheats" dramatically
 * - Speed toggle (3): faster/slower movement
 *
 * If buttons 1–6 don't work, press them and check Serial for hex codes, then update below.
 */

#include <Arduino.h>
#include <Servo.h>
#include <IRremote.hpp>
#include <avr/io.h>

#define DECODE_NEC

#define PIN_LED    6
#define PIN_BUZZER 7

// Remote button codes (NEC). Add more from Serial output if you use another remote.
#define CMD_LEFT   0x8
#define CMD_RIGHT  0x5A
#define CMD_UP     0x52
#define CMD_DOWN   0x18
#define CMD_OK     0x1C
#define CMD_STAR   0x16
#define CMD_HASH   0xD
#define CMD_0      0x19
#define CMD_1      0x45   // Find Remote mode – update if your remote uses different code
#define CMD_2      0x46   // Guard mode
#define CMD_3      0x47   // Speed toggle
#define CMD_4      0x44   // Burst fire
#define CMD_5      0x40
#define CMD_6      0x43   // Disco dance
#define CMD_7      0x7
#define CMD_9      0x9

// Servos
Servo yawServo;    // base rotation
Servo pitchServo;  // up/down tilt
Servo rollServo;   // barrel fire

int pitchServoVal = 100;
int pitchMoveSpeed = 8;
int yawMoveSpeed = 90;
int yawStopSpeed = 90;
int rollMoveSpeed = 90;
int rollStopSpeed = 90;
int yawPrecision = 150;
int rollPrecision = 158;
int pitchMax = 175;
int pitchMin = 10;

// Contest upgrade modes
enum Mode { MODE_NORMAL, MODE_FIND_REMOTE, MODE_GUARD };
Mode currentMode = MODE_NORMAL;
bool fastMode = false;
unsigned long lastModeStep = 0;
unsigned long lastHashPress = 0;
int findRemoteAngle = 90;
int guardAngle = 90;
int guardDirection = 1;

void homeServos();
void fire();
void fireAll();
void leftMove(int moves);
void rightMove(int moves);
void upMove(int moves);
void downMove(int moves);
void shakeHeadYes(int moves);
void shakeHeadNo(int moves);
void shootAroundRandomly();
void turretDance();
void discoDance();
void burstFire();
void overheatDrama();
int readChipTempC();  // ATmega328P internal temp (chip, not room)
void reportChipTemp();
void findRemoteStep();
void guardStep();
void fireFX();  // LED flash + pew sound (when wired)

void setup() {
  Serial.begin(9600);

  yawServo.attach(10);
  pitchServo.attach(11);
  rollServo.attach(12);

  IrReceiver.begin(9, ENABLE_LED_FEEDBACK);

  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_LED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  Serial.println(F("CrunchLabs Turret ready. IR at pin 9. LED=6, Buzzer=7."));
  homeServos();
}

void loop() {
  // Run mode-specific logic (non-blocking)
  if (currentMode == MODE_FIND_REMOTE) {
    findRemoteStep();
    return;
  }
  if (currentMode == MODE_GUARD) {
    guardStep();
    return;
  }

  if (!IrReceiver.decode()) {
    delay(2);
    return;
  }

  IrReceiver.printIRResultShort(&Serial);
  if (IrReceiver.decodedIRData.protocol == UNKNOWN) {
    Serial.println(F("Unknown protocol – use the hex code above to add a new button."));
    IrReceiver.printIRResultRawFormatted(&Serial, true);
  }
  Serial.println();

  uint8_t cmd = IrReceiver.decodedIRData.command;
  IrReceiver.resume();

  switch (cmd) {
    case CMD_UP:    upMove(1); break;
    case CMD_DOWN:  downMove(1); break;
    case CMD_LEFT:  leftMove(1); break;
    case CMD_RIGHT: rightMove(1); break;
    case CMD_OK:    fire(); break;
    case CMD_STAR:  fireAll(); delay(50); break;
    case CMD_0:     shakeHeadNo(3); delay(50); break;
    case CMD_1:     currentMode = MODE_FIND_REMOTE; findRemoteAngle = 90; Serial.println(F("FIND REMOTE – scanning...")); break;
    case CMD_2:     currentMode = MODE_GUARD; guardAngle = 90; guardDirection = 1; Serial.println(F("GUARD – patrolling...")); break;
    case CMD_3:     fastMode = !fastMode; Serial.print(F("Speed: ")); Serial.println(fastMode ? F("FAST") : F("normal")); break;
    case CMD_4:     burstFire(); delay(50); break;
    case CMD_5:     turretDance(); delay(50); break;
    case CMD_6:     discoDance(); delay(50); break;
    case CMD_7:     shootAroundRandomly(); break;
    case CMD_9:     shakeHeadYes(3); delay(50); break;
    case CMD_HASH:  {
      unsigned long now = millis();
      bool doublePress = (now - lastHashPress < 1500);
      lastHashPress = now;
      int t = readChipTempC();
      if (t >= 45 || doublePress) overheatDrama();  // Real overheat or double-press to demo
      else reportChipTemp();
      delay(50);
      break;
    }
  }
  delay(5);
}

int getYawDelay() { return fastMode ? yawPrecision / 2 : yawPrecision; }
int getPitchDelay() { return fastMode ? 25 : 50; }

void leftMove(int moves) {
  int d = getYawDelay();
  for (int i = 0; i < moves; i++) {
    yawServo.write(yawStopSpeed + yawMoveSpeed);
    delay(d);
    yawServo.write(yawStopSpeed);
    delay(5);
    Serial.println("LEFT");
  }
}

void rightMove(int moves) {
  int d = getYawDelay();
  for (int i = 0; i < moves; i++) {
    yawServo.write(yawStopSpeed - yawMoveSpeed);
    delay(d);
    yawServo.write(yawStopSpeed);
    delay(5);
    Serial.println("RIGHT");
  }
}

void upMove(int moves) {
  int d = getPitchDelay();
  for (int i = 0; i < moves; i++) {
    if (pitchServoVal > pitchMin) {
      pitchServoVal -= pitchMoveSpeed;
      pitchServo.write(pitchServoVal);
      delay(d);
      Serial.println("UP");
    }
  }
}

void downMove(int moves) {
  int d = getPitchDelay();
  for (int i = 0; i < moves; i++) {
    if (pitchServoVal < pitchMax) {
      pitchServoVal += pitchMoveSpeed;
      pitchServo.write(pitchServoVal);
      delay(d);
      Serial.println("DOWN");
    }
  }
}

void fireFX() {
  digitalWrite(PIN_LED, HIGH);
  tone(PIN_BUZZER, 1800, 35);
  delay(35);
  digitalWrite(PIN_LED, LOW);
  noTone(PIN_BUZZER);
}

void fire() {
  fireFX();
  rollServo.write(rollStopSpeed + rollMoveSpeed);
  delay(rollPrecision);
  rollServo.write(rollStopSpeed);
  delay(5);
  Serial.println("FIRING");
}

void fireAll() {
  fireFX();
  rollServo.write(rollStopSpeed + rollMoveSpeed);
  delay(rollPrecision * 6);
  rollServo.write(rollStopSpeed);
  delay(5);
  Serial.println("FIRING ALL");
}

void shakeHeadYes(int moves) {
  Serial.println("YES");
  int startAngle = pitchServoVal;
  int nodAngle = startAngle + 20;
  for (int i = 0; i < moves; i++) {
    for (int a = startAngle; a <= nodAngle; a++) { pitchServo.write(a); delay(7); }
    delay(50);
    for (int a = nodAngle; a >= startAngle; a--) { pitchServo.write(a); delay(7); }
    delay(50);
  }
}

void shakeHeadNo(int moves) {
  Serial.println("NO");
  for (int i = 0; i < moves; i++) {
    yawServo.write(140); delay(190);
    yawServo.write(yawStopSpeed); delay(50);
    yawServo.write(40); delay(190);
    yawServo.write(yawStopSpeed); delay(50);
  }
}

void shootAroundRandomly() {
  fireFX();
  rollServo.write(rollStopSpeed + rollMoveSpeed);
  leftMove(6);
  rollServo.write(rollStopSpeed);
  delay(5);
  Serial.println("FIRING ALL RANDOMLY AROUND");
}

// Funky robot dance: head-bang nods + left-right pan (stiff robot style)
void turretDance() {
  Serial.println("DANCE!");
  int startPitch = pitchServoVal;
  int lowPitch = (startPitch + 30) > pitchMax ? pitchMax : startPitch + 30;
  int highPitch = (startPitch - 25) < pitchMin ? pitchMin : startPitch - 25;
  const int stepMs = 60;

  for (int bar = 0; bar < 2; bar++) {
    // Head bang: down, up, down, up
    pitchServo.write(lowPitch);  pitchServoVal = lowPitch;  delay(stepMs);
    pitchServo.write(highPitch); pitchServoVal = highPitch; delay(stepMs);
    pitchServo.write(lowPitch);  pitchServoVal = lowPitch;  delay(stepMs);
    pitchServo.write(highPitch); pitchServoVal = highPitch; delay(stepMs);
    // Look left, right, left, right
    yawServo.write(yawStopSpeed + yawMoveSpeed); delay(stepMs);
    yawServo.write(yawStopSpeed);                delay(20);
    yawServo.write(yawStopSpeed - yawMoveSpeed); delay(stepMs);
    yawServo.write(yawStopSpeed);                delay(20);
    yawServo.write(yawStopSpeed + yawMoveSpeed); delay(stepMs);
    yawServo.write(yawStopSpeed);                delay(20);
    yawServo.write(yawStopSpeed - yawMoveSpeed); delay(stepMs);
    yawServo.write(yawStopSpeed);                delay(stepMs);
  }
  // Quick barrel spin as finisher
  fireFX();
  rollServo.write(rollStopSpeed + rollMoveSpeed);
  delay(rollPrecision);
  rollServo.write(rollStopSpeed);
  delay(50);
  pitchServoVal = startPitch;
  pitchServo.write(startPitch);
  Serial.println("DANCE DONE");
}

// Read ATmega328P internal temperature sensor (chip temp, ~±5°C, not room temp).
int readChipTempC() {
  ADMUX = (3 << REFS0) | (8 << MUX0);   // 1.1V ref, internal temp channel
  ADCSRA = (1 << ADEN) | (1 << ADSC) | (7 << ADPS0);
  while (ADCSRA & (1 << ADSC)) { }
  int raw = ADCW;
  return (raw * 100L - 32431) / 122;    // approx °C (datasheet curve)
}

void reportChipTemp() {
  int c = readChipTempC();
  Serial.print(F("Chip temp: "));
  Serial.print(c);
  Serial.println(F(" C (board/chip, not room)"));
}

void homeServos() {
  yawServo.write(yawStopSpeed);
  delay(20);
  rollServo.write(rollStopSpeed);
  delay(100);
  pitchServo.write(100);
  delay(100);
  pitchServoVal = 100;
  Serial.println("HOMING");
}

// --- Contest upgrade: Find Remote mode ---
// Slowly scans; when IR detected, fires in that direction and exits.
void findRemoteStep() {
  if (IrReceiver.decode()) {
    Serial.println(F("REMOTE FOUND – FIRING!"));
    fire();
    delay(100);
    IrReceiver.resume();
    currentMode = MODE_NORMAL;
    return;
  }
  IrReceiver.resume();

  unsigned long now = millis();
  if (now - lastModeStep < 80) return;
  lastModeStep = now;

  findRemoteAngle += 3;
  if (findRemoteAngle > 180) findRemoteAngle = 0;
  if (findRemoteAngle < 0) findRemoteAngle = 180;
  yawServo.write(findRemoteAngle);
}

// --- Contest upgrade: Guard mode ---
// Patrols left-right; when IR detected, alerts (fire + dance) and exits.
void guardStep() {
  if (IrReceiver.decode()) {
    Serial.println(F("INTRUDER – ALERT!"));
    fire();
    delay(80);
    fire();
    delay(80);
    fire();
    turretDance();
    IrReceiver.resume();
    currentMode = MODE_NORMAL;
    return;
  }
  IrReceiver.resume();

  unsigned long now = millis();
  if (now - lastModeStep < 120) return;
  lastModeStep = now;

  guardAngle += 8 * guardDirection;
  if (guardAngle >= 160) { guardAngle = 160; guardDirection = -1; }
  if (guardAngle <= 20)  { guardAngle = 20;  guardDirection = 1;  }
  yawServo.write(guardAngle);
}

// --- Contest upgrade: Burst fire (3 rapid shots) ---
void burstFire() {
  Serial.println(F("BURST FIRE"));
  for (int i = 0; i < 3; i++) {
    fireFX();
    rollServo.write(rollStopSpeed + rollMoveSpeed);
    delay(rollPrecision / 2);
    rollServo.write(rollStopSpeed);
    delay(30);
  }
}

// --- Contest upgrade: Disco dance (strobe-style) ---
void discoDance() {
  Serial.println(F("DISCO!"));
  int startPitch = pitchServoVal;
  const int stepMs = 40;

  for (int bar = 0; bar < 4; bar++) {
    // Quick yaw left-right-left-right
    yawServo.write(60);  delay(stepMs);
    yawServo.write(120); delay(stepMs);
    yawServo.write(60);  delay(stepMs);
    yawServo.write(120); delay(stepMs);
    // Nod + fire
    pitchServo.write(startPitch + 25); pitchServoVal = startPitch + 25; delay(stepMs);
    pitchServo.write(startPitch - 15); pitchServoVal = startPitch - 15; delay(stepMs);
    fireFX();
    rollServo.write(rollStopSpeed + rollMoveSpeed);
    delay(rollPrecision);
    rollServo.write(rollStopSpeed);
    delay(stepMs);
  }
  pitchServoVal = startPitch;
  pitchServo.write(startPitch);
  Serial.println(F("DISCO DONE"));
}

// --- Contest upgrade: Overheat drama ---
// When chip is hot, turret "overheats" dramatically.
void overheatDrama() {
  Serial.println(F("OVERHEAT! SHUTTING DOWN..."));
  int t = readChipTempC();
  Serial.print(F("Chip temp: ")); Serial.print(t); Serial.println(F(" C"));

  // Shake violently
  for (int i = 0; i < 5; i++) {
    yawServo.write(50);  delay(60);
    yawServo.write(130); delay(60);
  }
  yawServo.write(yawStopSpeed);

  // Slow "power down" – droop
  for (int a = pitchServoVal; a <= pitchMax; a += 3) {
    pitchServo.write(a);
    delay(80);
  }
  pitchServoVal = pitchMax;

  Serial.println(F("Systems offline. Cool down and press any button to reset."));
  // Wait for any IR to "reboot"
  while (1) {
    if (IrReceiver.decode()) {
      IrReceiver.resume();
      homeServos();
      Serial.println(F("Reboot complete."));
      return;
    }
    delay(50);
  }
}
