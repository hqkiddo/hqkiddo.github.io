/*
 * CrunchLabs IR Turret – control with IR remote
 * Board: Arduino Nano (ATmega328). Pins: YAW=10, PITCH=11, ROLL=12, IR=9.
 */

#include <Arduino.h>
#include <Servo.h>
#include <IRremote.hpp>
#include <avr/io.h>

#define DECODE_NEC

// Remote button codes (NEC). Add more from Serial output if you use another remote.
#define CMD_LEFT   0x8
#define CMD_RIGHT  0x5A
#define CMD_UP     0x52
#define CMD_DOWN   0x18
#define CMD_OK     0x1C
#define CMD_STAR   0x16
#define CMD_HASH   0xD
#define CMD_0      0x19
#define CMD_5      0x40
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
int readChipTempC();  // ATmega328P internal temp (chip, not room)
void reportChipTemp();

void setup() {
  Serial.begin(9600);

  yawServo.attach(10);
  pitchServo.attach(11);
  rollServo.attach(12);

  IrReceiver.begin(9, ENABLE_LED_FEEDBACK);

  Serial.println(F("CrunchLabs Turret ready. IR at pin 9."));
  homeServos();
}

void loop() {
  if (!IrReceiver.decode())
    return;

  IrReceiver.printIRResultShort(&Serial);
  if (IrReceiver.decodedIRData.protocol == UNKNOWN) {
    Serial.println(F("Unknown protocol – use the hex code above to add a new button."));
    IrReceiver.printIRResultRawFormatted(&Serial, true);
  }
  Serial.println();

  IrReceiver.resume();

  switch (IrReceiver.decodedIRData.command) {
    case CMD_UP:    upMove(1); break;
    case CMD_DOWN:  downMove(1); break;
    case CMD_LEFT:  leftMove(1); break;
    case CMD_RIGHT: rightMove(1); break;
    case CMD_OK:    fire(); break;
    case CMD_STAR:  fireAll(); delay(50); break;
    case CMD_0:     shakeHeadNo(3); delay(50); break;
    case CMD_5:     turretDance(); delay(50); break;
    case CMD_7:     shootAroundRandomly(); break;
    case CMD_9:     shakeHeadYes(3); delay(50); break;
    case CMD_HASH:  reportChipTemp(); delay(50); break;
  }
  delay(5);
}

void leftMove(int moves) {
  for (int i = 0; i < moves; i++) {
    yawServo.write(yawStopSpeed + yawMoveSpeed);
    delay(yawPrecision);
    yawServo.write(yawStopSpeed);
    delay(5);
    Serial.println("LEFT");
  }
}

void rightMove(int moves) {
  for (int i = 0; i < moves; i++) {
    yawServo.write(yawStopSpeed - yawMoveSpeed);
    delay(yawPrecision);
    yawServo.write(yawStopSpeed);
    delay(5);
    Serial.println("RIGHT");
  }
}

void upMove(int moves) {
  for (int i = 0; i < moves; i++) {
    if (pitchServoVal > pitchMin) {
      pitchServoVal -= pitchMoveSpeed;
      pitchServo.write(pitchServoVal);
      delay(50);
      Serial.println("UP");
    }
  }
}

void downMove(int moves) {
  for (int i = 0; i < moves; i++) {
    if (pitchServoVal < pitchMax) {
      pitchServoVal += pitchMoveSpeed;
      pitchServo.write(pitchServoVal);
      delay(50);
      Serial.println("DOWN");
    }
  }
}

void fire() {
  rollServo.write(rollStopSpeed + rollMoveSpeed);
  delay(rollPrecision);
  rollServo.write(rollStopSpeed);
  delay(5);
  Serial.println("FIRING");
}

void fireAll() {
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
