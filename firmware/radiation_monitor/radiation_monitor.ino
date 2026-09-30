#include <SoftwareSerial.h>
#include <TinyGPS++.h>
#include <DHT.h>

#define GPS_RX 16
#define GPS_TX 17
#define DHT_PIN 4
#define RADIATION_PIN 2
#define DHT_TYPE DHT22

#define GPS_BAUD 9600
#define SERIAL_BAUD 115200

SoftwareSerial gpsSerial(GPS_RX, GPS_TX);
TinyGPSPlus gps;
DHT dht(DHT_PIN, DHT_TYPE);

volatile unsigned long pulseCount = 0;
unsigned long lastPulseTime = 0;
float doseRate = 0.0;

const float CALIBRATION_FACTOR = 0.0081;

unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 1000;

void IRAM_ATTR countPulse() {
  pulseCount++;
}

void setup() {
  Serial.begin(SERIAL_BAUD);
  gpsSerial.begin(GPS_BAUD);
  dht.begin();

  pinMode(RADIATION_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(RADIATION_PIN), countPulse, FALLING);

  Serial.println("Advanced Radiation Gamma Monitor - Starting...");
  delay(2000);
}

void loop() {
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  if (millis() - lastSendTime >= SEND_INTERVAL) {
    noInterrupts();
    unsigned long count = pulseCount;
    pulseCount = 0;
    interrupts();

    float cpm = count * 60.0;
    doseRate = cpm * CALIBRATION_FACTOR;

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temperature)) temperature = 0.0;
    if (isnan(humidity)) humidity = 0.0;

    Serial.print("{");

    Serial.print("\"lat\":");
    if (gps.location.isValid()) {
      Serial.print(gps.location.lat(), 6);
    } else {
      Serial.print("null");
    }

    Serial.print(",\"lon\":");
    if (gps.location.isValid()) {
      Serial.print(gps.location.lng(), 6);
    } else {
      Serial.print("null");
    }

    Serial.print(",\"satellites\":");
    Serial.print(gps.satellites.value());

    Serial.print(",\"gps_valid\":");
    Serial.print(gps.location.isValid() ? "true" : "false");

    Serial.print(",\"dose\":");
    Serial.print(doseRate, 4);

    Serial.print(",\"cpm\":");
    Serial.print(cpm, 1);

    Serial.print(",\"temp\":");
    Serial.print(temperature, 1);

    Serial.print(",\"hum\":");
    Serial.print(humidity, 1);

    Serial.print(",\"time\":\"");
    if (gps.time.isValid()) {
      char timeStr[10];
      sprintf(timeStr, "%02d:%02d:%02d",
        gps.time.hour(), gps.time.minute(), gps.time.second());
      Serial.print(timeStr);
    }
    Serial.print("\"");

    Serial.println("}");

    lastSendTime = millis();
  }
}
