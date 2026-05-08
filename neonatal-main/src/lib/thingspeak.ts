// Read ThingSpeak configuration from Vite environment variables. Fall back to
// the original values when the env vars are not provided to preserve
// developer convenience.
const _env = (import.meta.env as any) || {};
export const THINGSPEAK_CHANNEL_ID =
  _env.VITE_THINGSPEAK_CHANNEL_ID ?? "3299978";
export const THINGSPEAK_API_KEY = _env.VITE_THINGSPEAK_API_KEY ?? "";
if (!THINGSPEAK_API_KEY) {
  // Warn in dev when key is missing to make debugging easier.
  // Production builds should provide these via an env file or CI.
  console.warn(
    "VITE_THINGSPEAK_API_KEY is not set. ThingSpeak requests may fail.",
  );
}
export const HISTORY_COUNT = 100;

export interface ThingSpeakEntry {
  created_at: string;
  entry_id: number;
  field1: string | null;
  field2: string | null;
  field3: string | null;
  field4: string | null;
  field5: string | null;
  field6: string | null;
}

export interface ThingSpeakResponse {
  channel: {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
    last_entry_id: number;
  };
  feeds: ThingSpeakEntry[];
}

export interface VitalData {
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
  incubatorHumidity: number | null;
  incubatorTemperature: number | null;
  timestamp: string | null;
  entryId: number | null;
}

export interface ChartDataPoint {
  time: string;
  fullTime: string;
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
}

export function createEmptyVitals(): VitalData {
  return {
    heartRate: null,
    spo2: null,
    temperature: null,
    incubatorHumidity: null,
    incubatorTemperature: null,
    timestamp: null,
    entryId: null,
  };
}

export function validateAndParseEntry(entry: ThingSpeakEntry) {
  const parseField = (val: string | null) => (val ? parseFloat(val) : null);

  const heartRateRaw = parseField(entry.field1);
  const spo2Raw = parseField(entry.field2);
  const temperatureRaw = parseField(entry.field4);
  const incubatorTemperatureRaw = parseField(entry.field5);
  const incubatorHumidityRaw = parseField(entry.field6);

  return {
    heartRate:
      heartRateRaw !== null &&
      !Number.isNaN(heartRateRaw) &&
      heartRateRaw > 0 &&
      heartRateRaw < 300
        ? heartRateRaw
        : null,
    spo2:
      spo2Raw !== null &&
      !Number.isNaN(spo2Raw) &&
      spo2Raw > 0 &&
      spo2Raw <= 100
        ? spo2Raw
        : null,
    temperature:
      temperatureRaw !== null &&
      !Number.isNaN(temperatureRaw) &&
      temperatureRaw > 20 &&
      temperatureRaw < 45
        ? temperatureRaw
        : null,
    incubatorHumidity:
      incubatorHumidityRaw !== null &&
      !Number.isNaN(incubatorHumidityRaw) &&
      incubatorHumidityRaw >= 0 &&
      incubatorHumidityRaw <= 100
        ? incubatorHumidityRaw
        : null,
    incubatorTemperature:
      incubatorTemperatureRaw !== null &&
      !Number.isNaN(incubatorTemperatureRaw) &&
      incubatorTemperatureRaw > -10 &&
      incubatorTemperatureRaw < 60
        ? incubatorTemperatureRaw
        : null,
  };
}

export function mapHistoryEntries(
  entries: ThingSpeakEntry[],
): ChartDataPoint[] {
  return entries.map((entry) => {
    const timestamp = new Date(entry.created_at);
    const parsed = validateAndParseEntry(entry);

    return {
      time: timestamp.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      fullTime: timestamp.toLocaleString(),
      heartRate: parsed.heartRate,
      spo2: parsed.spo2,
      temperature: parsed.temperature,
    };
  });
}

export async function fetchThingSpeakFeed(
  results: number,
): Promise<ThingSpeakResponse> {
  const url = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_API_KEY}&results=${results}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch from ThingSpeak");
  }

  return response.json();
}
