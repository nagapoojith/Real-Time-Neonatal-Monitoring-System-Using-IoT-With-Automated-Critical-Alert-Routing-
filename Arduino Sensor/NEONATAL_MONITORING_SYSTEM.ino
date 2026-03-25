#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include "spo2_algorithm.h"
#include <OneWire.h>
#include <DallasTemperature.h>
#include "DHT.h"
#include <WiFi.h>
#include <HTTPClient.h>

MAX30105 sensor;

// ════════════════════════════════════════════════════
// CREDENTIALS
// ════════════════════════════════════════════════════
#define WIFI_SSID        "MDJR's WLAN (OMEN)"
#define WIFI_PASSWORD    "885b8ed-801"
#define TS_WRITE_KEY     "P66U7TBNJ7NKN1AC"
#define TS_URL           "http://api.thingspeak.com/update"
#define TS_MIN_INTERVAL  15000UL


// ════════════════════════════════════════════════════
// PIN CONFIG
// ════════════════════════════════════════════════════
#define ONE_WIRE_BUS 5
#define DHTPIN       4
#define DHTTYPE      DHT11

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature ds18b20(&oneWire);
DHT dht(DHTPIN, DHTTYPE);


// ════════════════════════════════════════════════════
// MODE SELECT — comment out for adult testing
// ════════════════════════════════════════════════════
// #define NEONATAL_MODE

#ifdef NEONATAL_MODE
  #define IBI_MIN_MS   250
  #define IBI_MAX_MS   700
#else
  #define IBI_MIN_MS   300
  #define IBI_MAX_MS   1500
#endif


// ════════════════════════════════════════════════════
// MAX30102 CONFIG
// ════════════════════════════════════════════════════
#define SAMPLE_AVG        4
#define SAMPLE_RATE       400
#define PULSE_WIDTH       411
#define ADC_RANGE         4096

#define FINGER_ON_THRESH  50000UL
#define FINGER_OFF_THRESH 40000UL
#define IR_TARGET_LOW     80000UL
#define IR_TARGET_HIGH    160000UL
#define IR_SATURATED      260000UL
#define BRIGHTNESS_EVERY  4
#define BEAT_BUF_SIZE     6
#define SPO2_BUF_SIZE     100
#define SLIDE_SIZE        25
#define SPO2_EMA_ALPHA    0.30f
#define SPO2_VALID_MIN    85
#define SPO2_LOCK_COUNT   3
#define PI_WEAK_ENTER     0.40f
#define PI_WEAK_EXIT      0.70f
#define PI_MAX            3.0f
#define HR_EMA_ALPHA      0.25f


// ════════════════════════════════════════════════════
// SENSOR FLAGS
// ════════════════════════════════════════════════════
bool maxFound  = false;
bool dhtFound  = false;
bool ds18Found = false;


// ════════════════════════════════════════════════════
// BUFFERS
// ════════════════════════════════════════════════════
static uint32_t irBuf[SPO2_BUF_SIZE];
static uint32_t redBuf[SPO2_BUF_SIZE];
static uint32_t newIR[SLIDE_SIZE];
static uint32_t newRed[SLIDE_SIZE];


// ════════════════════════════════════════════════════
// HR STATE
// ════════════════════════════════════════════════════
byte  rates[BEAT_BUF_SIZE];
byte  rateSpot   = 0;
long  lastBeatMs = 0;
float beatAvg    = 0;
float hrEMA      = 0;
bool  beatsReady = false;
int   beatCount  = 0;


// ════════════════════════════════════════════════════
// SPO2 STATE
// ════════════════════════════════════════════════════
int32_t rawSpO2, rawHR_unused;
int8_t  validSpO2, validHR_unused;
float   filtSpO2        = 0;
bool    spO2Ready       = false;
int     spO2Streak      = 0;
int     spO2SampleCount = 0;
bool    spO2BufferFull  = false;


// ════════════════════════════════════════════════════
// ENV SENSOR STATE
// ════════════════════════════════════════════════════
float bodyTemp     = 0.0f;
float roomTemp     = 0.0f;
float humidity     = 0.0f;
unsigned long lastEnvRead  = 0;
unsigned long lastTSUpdate = 0;
#define ENV_READ_INTERVAL 2000


// ════════════════════════════════════════════════════
// AVERAGING ACCUMULATORS
// ════════════════════════════════════════════════════
float tsHRSum       = 0;
float tsSpO2Sum     = 0;
float tsSpO2Min     = 999.0f;
float tsBodySum     = 0;
float tsRoomSum     = 0;
float tsHumSum      = 0;
int   tsSampleCount = 0;


// ════════════════════════════════════════════════════
// BRIGHTNESS + FINGER STATE
// ════════════════════════════════════════════════════
byte ledPower           = 60;
int  brightnessCooldown = 0;
bool fingerOn           = false;


// ════════════════════════════════════════════════════
// PRINT STATE
// ════════════════════════════════════════════════════
int  lastLockState = -1;
int  lastPIState   = -1;
bool piWeak        = false;


// ════════════════════════════════════════════════════
// PERFUSION INDEX
// ════════════════════════════════════════════════════
float getPerfusionIndex() {
  int64_t sumIR = 0;
  for (int i = 0; i < SPO2_BUF_SIZE; i++) sumIR += irBuf[i];
  float dc = (float)sumIR / SPO2_BUF_SIZE;
  if (dc < 1.0f) return 0;
  float sumSq = 0;
  for (int i = 0; i < SPO2_BUF_SIZE; i++) {
    float d = (float)irBuf[i] - dc;
    sumSq += d * d;
  }
  return (sqrtf(sumSq / SPO2_BUF_SIZE) / dc) * 100.0f;
}


// ════════════════════════════════════════════════════
// AUTO BRIGHTNESS
// ════════════════════════════════════════════════════
void adaptBrightness() {
  int64_t sum = 0;
  for (int i = 0; i < SPO2_BUF_SIZE; i++) sum += irBuf[i];
  long avg = (long)(sum / SPO2_BUF_SIZE);

  if (avg >= (long)IR_SATURATED) {
    ledPower = (byte)constrain((int)ledPower - 30, 10, 255);
    sensor.setPulseAmplitudeIR(ledPower);
    sensor.setPulseAmplitudeRed(ledPower);
    brightnessCooldown = 0;
    return;
  }

  brightnessCooldown++;
  if (brightnessCooldown < BRIGHTNESS_EVERY) return;
  brightnessCooldown = 0;

  bool changed   = false;
  long midTarget = (long)((IR_TARGET_LOW + IR_TARGET_HIGH) / 2);
  long error     = avg - midTarget;
  byte step      = (byte)constrain(abs(error) / 10000, 2, 20);

  if (avg < (long)IR_TARGET_LOW) {
    ledPower = (byte)constrain((int)ledPower + step, 0, 255);
    changed  = true;
  } else if (avg > (long)IR_TARGET_HIGH) {
    ledPower = (byte)constrain((int)ledPower - step, 10, 255);
    changed  = true;
  }

  if (changed) {
    sensor.setPulseAmplitudeIR(ledPower);
    sensor.setPulseAmplitudeRed(ledPower);
  }
}


// ════════════════════════════════════════════════════
// MAXIM SPO2
// ════════════════════════════════════════════════════
void runMaxim() {
  maxim_heart_rate_and_oxygen_saturation(
    irBuf, SPO2_BUF_SIZE, redBuf,
    &rawSpO2,      &validSpO2,
    &rawHR_unused, &validHR_unused
  );

  if (validSpO2 && rawSpO2 >= SPO2_VALID_MIN && rawSpO2 <= 100) {
    spO2Streak = min(spO2Streak + 1, 10);
    float clamped = min((float)rawSpO2, 99.0f);
    filtSpO2 = (filtSpO2 < 1.0f)
               ? clamped
               : min((1.0f - SPO2_EMA_ALPHA) * filtSpO2
                     + SPO2_EMA_ALPHA * clamped, 99.0f);
    if (spO2Streak >= SPO2_LOCK_COUNT) spO2Ready = true;
  } else {
    spO2Streak = max(spO2Streak - 1, 0);
    if (spO2Streak == 0) spO2Ready = false;
  }
}


// ════════════════════════════════════════════════════
// ENV SENSORS
// ════════════════════════════════════════════════════
void readEnvSensors() {
  if (millis() - lastEnvRead < ENV_READ_INTERVAL) return;
  lastEnvRead = millis();

  if (ds18Found) {
    ds18b20.requestTemperatures();
    delay(400);
    float t = ds18b20.getTempCByIndex(0);
    if (t != DEVICE_DISCONNECTED_C && t != 85.0f && t > 20.0f && t < 42.0f)
      bodyTemp = t;
  }

  if (dhtFound) {
    float h = dht.readHumidity();
    float r = dht.readTemperature();
    if (!isnan(h) && !isnan(r)) {
      humidity = h;
      roomTemp = r;
    }
  }
}


// ════════════════════════════════════════════════════
// THINGSPEAK UPLOAD
// field1=HR      field2=SpO2Avg  field3=SpO2Min
// field4=BodyTemp field5=RoomTemp field6=Humidity
// ════════════════════════════════════════════════════
void uploadThingSpeak(float hr, float spo2Avg, float spo2Min,
                      float bodyT, float roomT, float hum) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("║  [ThingSpeak] ✗ No WiFi connection");
    return;
  }

  String url = String(TS_URL) + "?api_key=" + TS_WRITE_KEY;

  if (maxFound  && hr      > 0)   url += "&field1=" + String((int)hr);
  if (maxFound  && spo2Avg > 0)   url += "&field2=" + String(spo2Avg, 1);
  if (maxFound  && spo2Min > 0)   url += "&field3=" + String(spo2Min, 1);
  if (ds18Found && bodyT   > 0)   url += "&field4=" + String(bodyT,   1);
  if (dhtFound  && roomT   > 0)   url += "&field5=" + String(roomT,   1);
  if (dhtFound  && hum     > 0)   url += "&field6=" + String(hum,     0);

  HTTPClient http;
  http.begin(url);
  int code = http.GET();
  http.end();

  if      (code == 200) Serial.println("║  [ThingSpeak] ✓ Updated successfully");
  else if (code == 0)   Serial.println("║  [ThingSpeak] ✗ No response (check key/network)");
  else                  Serial.printf ("║  [ThingSpeak] ✗ Failed — HTTP %d\n", code);
}


// ════════════════════════════════════════════════════
// COMBINED UPLOAD
// ════════════════════════════════════════════════════
void doUpload() {
  if (tsSampleCount == 0) return;
  if (millis() - lastTSUpdate < TS_MIN_INTERVAL) return;
  lastTSUpdate = millis();

  float avgHR   = (tsHRSum   > 0) ? tsHRSum   / tsSampleCount : 0;
  float avgSpO2 = (tsSpO2Sum > 0) ? tsSpO2Sum / tsSampleCount : 0;
  float minSpO2 = (tsSpO2Min < 999) ? tsSpO2Min : 0;
  float avgBody = (tsBodySum > 0)  ? tsBodySum / tsSampleCount : 0;
  float avgRoom = (tsRoomSum > 0)  ? tsRoomSum / tsSampleCount : 0;
  float avgHum  = (tsHumSum  > 0)  ? tsHumSum  / tsSampleCount : 0;

  Serial.println();
  Serial.println("╔══════════════════════════════╗");
  Serial.println("║     Uploading to Cloud...    ║");
  Serial.println("╠══════════════════════════════╣");
  if (maxFound  && avgHR   > 0) Serial.printf("║  HR (avg)    : %d BPM\n",      (int)avgHR);
  if (maxFound  && avgSpO2 > 0) Serial.printf("║  SpO2 (avg)  : %.1f%%\n",      avgSpO2);
  if (maxFound  && minSpO2 > 0) Serial.printf("║  SpO2 (min)  : %.1f%%\n",      minSpO2);
  if (ds18Found && avgBody > 0) Serial.printf("║  Body Temp   : %.1f°C\n",      avgBody);
  if (dhtFound  && avgRoom > 0) Serial.printf("║  Room Temp   : %.1f°C\n",      avgRoom);
  if (dhtFound  && avgHum  > 0) Serial.printf("║  Humidity    : %.0f%%\n",      avgHum);
  Serial.printf(                              "║  Samples     : %d readings\n", tsSampleCount);
  Serial.println("╠══════════════════════════════╣");

  uploadThingSpeak(avgHR, avgSpO2, minSpO2, avgBody, avgRoom, avgHum);

  Serial.println("╚══════════════════════════════╝");
  Serial.println();

  // Reset accumulators
  tsHRSum       = 0;
  tsSpO2Sum     = 0;
  tsSpO2Min     = 999.0f;
  tsBodySum     = 0;
  tsRoomSum     = 0;
  tsHumSum      = 0;
  tsSampleCount = 0;
}


// ════════════════════════════════════════════════════
// FULL RESET
// ════════════════════════════════════════════════════
void resetAll() {
  for (int i = 0; i < BEAT_BUF_SIZE; i++) rates[i] = 0;
  rateSpot        = 0;
  lastBeatMs      = 0;
  beatAvg         = 0;
  hrEMA           = 0;
  beatsReady      = false;
  beatCount       = 0;

  memset(irBuf,  0, sizeof(irBuf));
  memset(redBuf, 0, sizeof(redBuf));
  memset(newIR,  0, sizeof(newIR));
  memset(newRed, 0, sizeof(newRed));

  filtSpO2        = 0;
  spO2Ready       = false;
  spO2Streak      = 0;
  spO2SampleCount = 0;
  spO2BufferFull  = false;

  brightnessCooldown = 0;
  ledPower           = 60;
  sensor.setPulseAmplitudeIR(ledPower);
  sensor.setPulseAmplitudeRed(ledPower);

  lastLockState = -1;
  lastPIState   = -1;
  piWeak        = false;

  tsHRSum       = 0;
  tsSpO2Sum     = 0;
  tsSpO2Min     = 999.0f;
  tsBodySum     = 0;
  tsRoomSum     = 0;
  tsHumSum      = 0;
  tsSampleCount = 0;

  for (int i = 0; i < 30; i++) {
    while (!sensor.available()) sensor.check();
    sensor.nextSample();
  }
}


// ════════════════════════════════════════════════════
// SETUP
// ════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  delay(3000);

  Serial.println("============================");
  Serial.println(" NeoGuard Monitoring System ");
  Serial.println("============================");
  Serial.println();

  // ── WiFi ──
  Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int wifiTries = 0;
  while (WiFi.status() != WL_CONNECTED && wifiTries < 20) {
    delay(500);
    Serial.print(".");
    wifiTries++;
  }
  if (WiFi.status() == WL_CONNECTED)
    Serial.printf("\nWiFi Connected! IP: %s\n\n",
                  WiFi.localIP().toString().c_str());
  else
    Serial.println("\nWiFi failed — continuing offline.\n");

  Wire.begin(21, 22);
  Wire.setClock(400000);

  // ── MAX30102 ──
  if (sensor.begin(Wire, I2C_SPEED_FAST)) {
    maxFound = true;
    Serial.println("MAX30102 Found!");
  } else {
    Serial.println("MAX30102 NOT found — HR/SpO2 unavailable.");
  }

  // ── DHT11 ──
  dht.begin();
  delay(1500);
  float testH = dht.readHumidity();
  float testR = dht.readTemperature();
  if (!isnan(testH) && !isnan(testR)) {
    dhtFound = true;
    roomTemp = testR;
    humidity = testH;
    Serial.println("DHT11   Found!");
  } else {
    Serial.println("DHT11 NOT found — Room Temp/Humidity unavailable.");
  }

  // ── DS18B20 ──
  ds18b20.begin();
  delay(1000);
  ds18b20.setWaitForConversion(false);
  ds18b20.setResolution(11);
  ds18b20.requestTemperatures();
  delay(400);
  ds18b20.getTempCByIndex(0);
  ds18b20.requestTemperatures();
  delay(400);
  float testB = ds18b20.getTempCByIndex(0);
  if (ds18b20.getDeviceCount() > 0 &&
      testB != DEVICE_DISCONNECTED_C &&
      testB != 85.0f) {
    ds18Found = true;
    bodyTemp  = testB;
    Serial.println("DS18B20 Found!");
  } else {
    Serial.println("DS18B20 NOT found — Body Temp unavailable.");
  }

  Serial.println();
  Serial.println("============================");
  Serial.println("      Preparing Setup       ");
  Serial.println("============================");
  Serial.println();

  // ── MAX30102 Pre-warm ──
  if (maxFound) {
    Serial.println("MAX30102:");
    sensor.setup(ledPower, SAMPLE_AVG, 2, SAMPLE_RATE, PULSE_WIDTH, ADC_RANGE);
    sensor.setPulseAmplitudeRed(ledPower);
    sensor.setPulseAmplitudeGreen(0);

    for (int i = 0; i < 50; i++) {
      while (!sensor.available()) sensor.check();
      sensor.nextSample();
    }

    Serial.println("Pre-warming brightness...");
    for (int attempt = 0; attempt < 15; attempt++) {
      int64_t preSum = 0;
      for (int s = 0; s < 25; s++) {
        while (!sensor.available()) sensor.check();
        preSum += sensor.getIR();
        sensor.nextSample();
      }
      long preAvg = (long)(preSum / 25);

      if (preAvg < 5000) {
        ledPower = 60;
        sensor.setPulseAmplitudeIR(ledPower);
        sensor.setPulseAmplitudeRed(ledPower);
        Serial.println("No finger during pre-warm. Using default brightness.");
        break;
      }

      if (preAvg >= (long)IR_TARGET_LOW && preAvg <= (long)IR_TARGET_HIGH) break;

      long midTarget = (long)((IR_TARGET_LOW + IR_TARGET_HIGH) / 2);
      long preError  = preAvg - midTarget;
      byte preStep   = (byte)constrain(abs(preError) / 10000, 2, 20);

      if (preAvg < (long)IR_TARGET_LOW)
        ledPower = (byte)constrain((int)ledPower + preStep, 0, 255);
      else
        ledPower = (byte)constrain((int)ledPower - preStep, 10, 255);

      sensor.setPulseAmplitudeIR(ledPower);
      sensor.setPulseAmplitudeRed(ledPower);
      delay(80);
    }
    Serial.print("Pre-warm done. Brightness: ");
    Serial.println(ledPower);
    Serial.println();
  }

  // ── DHT11 Baseline ──
  if (dhtFound) {
    Serial.println("DHT11:");
    Serial.printf("Baseline: %.1f°C | %.0f%% RH  (Stable)\n", testR, testH);
    Serial.println();
  }

  // ── DS18B20 Baseline ──
  if (ds18Found) {
    Serial.println("DS18B20:");
    if (testB > 20.0f && testB < 42.0f)
      Serial.printf("Baseline: %.1f°C  (Skin-normal)\n", testB);
    else
      Serial.printf("Baseline: %.1f°C  (Probe not on skin yet)\n", testB);
    Serial.println();
  }

  Serial.println("============================");
  Serial.println("       Sensors Ready        ");
  Serial.println("============================");
  Serial.println();

  memset(irBuf,  0, sizeof(irBuf));
  memset(redBuf, 0, sizeof(redBuf));

  if (maxFound)
    Serial.println("Place finger on sensor...");
  else
    Serial.println("MAX30102 absent — uploading env data only.");
  Serial.println();
}


// ════════════════════════════════════════════════════
// LOOP
// ════════════════════════════════════════════════════
void loop() {

  // ── MAX absent: env-only mode ──
  if (!maxFound) {
    readEnvSensors();
    if (millis() - lastTSUpdate >= TS_MIN_INTERVAL) {

      Serial.println();
      Serial.println("╔══════════════════════════════╗");
      Serial.println("║     Uploading to Cloud...    ║");
      Serial.println("╠══════════════════════════════╣");
      if (ds18Found && bodyTemp > 0) Serial.printf("║  Body Temp   : %.1f°C\n", bodyTemp);
      if (dhtFound  && roomTemp > 0) Serial.printf("║  Room Temp   : %.1f°C\n", roomTemp);
      if (dhtFound  && humidity > 0) Serial.printf("║  Humidity    : %.0f%%\n", humidity);
      Serial.println("╠══════════════════════════════╣");

      uploadThingSpeak(0, 0, 0, bodyTemp, roomTemp, humidity);
      lastTSUpdate = millis();

      Serial.println("╚══════════════════════════════╝");
      Serial.println();
    }
    delay(2000);
    return;
  }

  // ── Normal MAX30102 loop ──
  while (!sensor.available()) {
    sensor.check();
    yield();
  }

  uint32_t irVal  = sensor.getIR();
  uint32_t redVal = sensor.getRed();
  sensor.nextSample();

  // ── Finger detection ──
  if (!fingerOn && irVal >= FINGER_ON_THRESH) {
    fingerOn = true;
    Serial.println("Finger detected. Measuring...");
  } else if (fingerOn && irVal < FINGER_OFF_THRESH) {
    fingerOn = false;
    Serial.println("----------------------------");
    Serial.println("Finger removed.");
    Serial.println("----------------------------");
    Serial.println();
    resetAll();
    return;
  }

  if (!fingerOn) return;

  // ── PATH A: HR via beat-to-beat IBI ──
  if (checkForBeat((long)(irVal >> 2))) {
    long now   = millis();
    long delta = now - lastBeatMs;
    lastBeatMs = now;

    if (delta >= IBI_MIN_MS && delta <= IBI_MAX_MS) {
      byte bpm        = (byte)(60000L / delta);
      rates[rateSpot] = bpm;
      rateSpot        = (rateSpot + 1) % BEAT_BUF_SIZE;
      beatCount++;

      if (beatCount >= BEAT_BUF_SIZE) {
        beatsReady = true;
        int sum = 0;
        for (int i = 0; i < BEAT_BUF_SIZE; i++) sum += rates[i];
        beatAvg = (float)sum / BEAT_BUF_SIZE;
        hrEMA = (hrEMA < 1.0f)
                ? beatAvg
                : (1.0f - HR_EMA_ALPHA) * hrEMA + HR_EMA_ALPHA * beatAvg;
      }
    }
  }

  // ── PATH B: SpO2 via Maxim sliding window ──
  if (!spO2BufferFull) {

    irBuf[spO2SampleCount]  = irVal;
    redBuf[spO2SampleCount] = redVal;
    spO2SampleCount++;

    if (spO2SampleCount >= SPO2_BUF_SIZE) {
      spO2BufferFull  = true;
      spO2SampleCount = 0;
      adaptBrightness();
      runMaxim();
    }

  } else {

    newIR[spO2SampleCount]  = irVal;
    newRed[spO2SampleCount] = redVal;
    spO2SampleCount++;

    if (spO2SampleCount >= SLIDE_SIZE) {
      spO2SampleCount = 0;

      memmove(irBuf,  irBuf  + SLIDE_SIZE,
              (SPO2_BUF_SIZE - SLIDE_SIZE) * sizeof(uint32_t));
      memmove(redBuf, redBuf + SLIDE_SIZE,
              (SPO2_BUF_SIZE - SLIDE_SIZE) * sizeof(uint32_t));
      memcpy(irBuf  + (SPO2_BUF_SIZE - SLIDE_SIZE),
             newIR,  SLIDE_SIZE * sizeof(uint32_t));
      memcpy(redBuf + (SPO2_BUF_SIZE - SLIDE_SIZE),
             newRed, SLIDE_SIZE * sizeof(uint32_t));

      adaptBrightness();
      runMaxim();

      // ── Output ──
      if (beatsReady && (spO2Ready || filtSpO2 >= 1.0f)) {

        float pi = getPerfusionIndex();

        if (!piWeak && pi < PI_WEAK_ENTER) piWeak = true;
        if ( piWeak && pi > PI_WEAK_EXIT)  piWeak = false;
        int piState = piWeak ? 0 : (pi >= PI_MAX) ? 2 : 1;

        if (piState != lastPIState) {
          if      (piState == 0) Serial.println("Weak signal — press finger more firmly.");
          else if (piState == 2) Serial.println("Motion detected — hold finger still.");
          lastPIState = piState;
        }

        if (piState == 1) {
          readEnvSensors();

          // ── Serial live print ──
          Serial.printf(
            "HR: %d BPM  |  SpO2: %d%%  |  Body Temp: %s  |  Room Temp: %s  |  Air Hum: %s\n",
            (int)hrEMA,
            (int)filtSpO2,
            ds18Found ? (String(bodyTemp, 1) + "C").c_str() : "N/A",
            dhtFound  ? (String(roomTemp, 1) + "C").c_str() : "N/A",
            dhtFound  ? (String(humidity, 0) + "%").c_str() : "N/A"
          );

          // ── Accumulate ──
          if (hrEMA    > 0) tsHRSum   += hrEMA;
          if (filtSpO2 > 0) {
            tsSpO2Sum += filtSpO2;
            if (filtSpO2 < tsSpO2Min) tsSpO2Min = filtSpO2;
          }
          if (ds18Found && bodyTemp > 0) tsBodySum += bodyTemp;
          if (dhtFound  && roomTemp > 0) tsRoomSum += roomTemp;
          if (dhtFound  && humidity > 0) tsHumSum  += humidity;
          tsSampleCount++;

          // ── Upload every 15s ──
          doUpload();
        }

      } else {
        int lockState = (beatsReady ? 1 : 0) +
                        ((spO2Ready || filtSpO2 >= 1.0f) ? 2 : 0);
        if (lockState != lastLockState) {
          Serial.printf("Locking... HR:%-7s  SpO2:%s\n",
                        beatsReady                      ? "Ready" : "Waiting",
                        (spO2Ready || filtSpO2 >= 1.0f) ? "Ready" : "Waiting");
          lastLockState = lockState;
        }
      }
    }
  }
}
