import React, { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Heart,
  Thermometer,
  Wind,
  Wifi,
  WifiOff,
  Clock,
  RefreshCw,
  Droplets,
  Box,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";

const THINGSPEAK_CHANNEL_ID = "3299978";
const THINGSPEAK_API_KEY = "FW0N2ZJVIPXBVSIQ";
const REFRESH_INTERVAL = 15000;
const HISTORY_COUNT = 100;
const chartGridColor = "hsl(var(--border))";
const chartTickColor = "hsl(var(--muted-foreground))";
const chartTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "500",
  color: "hsl(var(--foreground))",
};

interface ThingSpeakEntry {
  created_at: string;
  entry_id: number;
  field1: string | null;
  field2: string | null;
  field3: string | null;
  field4: string | null;
  field5: string | null;
  field6: string | null;
}

interface ThingSpeakResponse {
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

interface VitalData {
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
  incubatorHumidity: number | null;
  incubatorTemperature: number | null;
  timestamp: string | null;
  entryId: number | null;
}

interface ChartDataPoint {
  time: string;
  fullTime: string;
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
}

type DeviceStatus = "online" | "offline" | "waiting";

const LiveMonitoring: React.FC = () => {
  const location = useLocation();
  const [currentVitals, setCurrentVitals] = useState<VitalData>({
    heartRate: null,
    spo2: null,
    temperature: null,
    incubatorHumidity: null,
    incubatorTemperature: null,
    timestamp: null,
    entryId: null,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>("waiting");
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousEntryId, setPreviousEntryId] = useState<number | null>(null);
  const [chartAnimationNonce, setChartAnimationNonce] = useState(0);
  const hasPlayedOpenAnimation = useRef(false);

  const validateAndParseEntry = (entry: ThingSpeakEntry) => {
    const parseField = (val: string | null) => (val ? parseFloat(val) : null);

    const hrRaw = parseField(entry.field1);
    const spo2Raw = parseField(entry.field2);
    // field3 is SpO2 Min - not used
    const tempRaw = parseField(entry.field4); // field4 = Body Temp (°C)
    const incTempRaw = parseField(entry.field5); // field5 = Room/Incubator Temp (°C)
    const incHumRaw = parseField(entry.field6); // field6 = Humidity (%)

    return {
      heartRate:
        hrRaw !== null && !isNaN(hrRaw) && hrRaw > 0 && hrRaw < 300
          ? hrRaw
          : null,
      spo2:
        spo2Raw !== null && !isNaN(spo2Raw) && spo2Raw > 0 && spo2Raw <= 100
          ? spo2Raw
          : null,
      temperature:
        tempRaw !== null && !isNaN(tempRaw) && tempRaw > 20 && tempRaw < 45
          ? tempRaw
          : null,
      incubatorHumidity:
        incHumRaw !== null &&
        !isNaN(incHumRaw) &&
        incHumRaw >= 0 &&
        incHumRaw <= 100
          ? incHumRaw
          : null,
      incubatorTemperature:
        incTempRaw !== null &&
        !isNaN(incTempRaw) &&
        incTempRaw > -10 &&
        incTempRaw < 60
          ? incTempRaw
          : null,
    };
  };

  const fetchLatestData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const latestUrl = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_API_KEY}&results=1`;
      const latestResponse = await fetch(latestUrl);

      if (!latestResponse.ok)
        throw new Error("Failed to fetch from ThingSpeak");

      const latestData: ThingSpeakResponse = await latestResponse.json();

      if (!latestData.feeds || latestData.feeds.length === 0) {
        setDeviceStatus("offline");
        setCurrentVitals({
          heartRate: null,
          spo2: null,
          temperature: null,
          incubatorHumidity: null,
          incubatorTemperature: null,
          timestamp: null,
          entryId: null,
        });
        return;
      }

      const latestEntry = latestData.feeds[0];
      const timeDiff =
        (Date.now() - new Date(latestEntry.created_at).getTime()) / 1000;

      if (timeDiff > 60) setDeviceStatus("offline");
      else if (
        previousEntryId !== null &&
        latestEntry.entry_id === previousEntryId
      )
        setDeviceStatus("waiting");
      else setDeviceStatus("online");

      setPreviousEntryId(latestEntry.entry_id);
      const parsed = validateAndParseEntry(latestEntry);

      setCurrentVitals({
        ...parsed,
        timestamp: latestEntry.created_at,
        entryId: latestEntry.entry_id,
      });
      setLastFetchTime(new Date());
    } catch (err) {
      console.error("Error fetching ThingSpeak data:", err);
      setError("Failed to connect to ThingSpeak");
      setDeviceStatus("offline");
    } finally {
      setIsRefreshing(false);
    }
  }, [previousEntryId]);

  const fetchHistoricalData = useCallback(async () => {
    try {
      const historyUrl = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_API_KEY}&results=${HISTORY_COUNT}`;
      const historyResponse = await fetch(historyUrl);
      if (!historyResponse.ok) return;

      const historyData: ThingSpeakResponse = await historyResponse.json();
      if (!historyData.feeds || historyData.feeds.length === 0) {
        setChartData([]);
        return;
      }

      const formattedData: ChartDataPoint[] = historyData.feeds.map((entry) => {
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
      setChartData(formattedData);
    } catch (err) {
      console.error("Error fetching historical data:", err);
    }
  }, []);

  useEffect(() => {
    fetchLatestData();
    fetchHistoricalData();
    const interval = setInterval(() => {
      fetchLatestData();
      fetchHistoricalData();
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchLatestData, fetchHistoricalData]);

  useEffect(() => {
    setChartAnimationNonce((previous) => previous + 1);
  }, [location.key]);

  useEffect(() => {
    if (chartData.length === 0 || hasPlayedOpenAnimation.current) {
      return;
    }

    hasPlayedOpenAnimation.current = true;

    const timer = window.setTimeout(() => {
      setChartAnimationNonce((previous) => previous + 1);
    }, 60);

    return () => window.clearTimeout(timer);
  }, [chartData.length]);

  const handleManualRefresh = () => {
    fetchLatestData();
    fetchHistoricalData();
  };

  const getStatusBadge = () => {
    switch (deviceStatus) {
      case "online":
        return (
          <Badge className="bg-status-normal/10 text-status-normal border-status-normal/30 gap-1.5 px-3 py-1">
            <Wifi className="h-3.5 w-3.5" />
            Live
          </Badge>
        );
      case "waiting":
        return (
          <Badge className="bg-status-warning/10 text-status-warning border-status-warning/30 gap-1.5 px-3 py-1">
            <Clock className="h-3.5 w-3.5" />
            Waiting
          </Badge>
        );
      case "offline":
        return (
          <Badge className="bg-status-critical/10 text-status-critical border-status-critical/30 gap-1.5 px-3 py-1">
            <WifiOff className="h-3.5 w-3.5" />
            Offline
          </Badge>
        );
    }
  };

  // === Main Dashboard ===
  return (
    <DashboardLayout>
      <div className="relative isolate space-y-6 animate-fade-in overflow-hidden rounded-[28px] p-1">
        <div className="relative space-y-6 rounded-[26px] p-5 lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/15">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  NeoGuard NICU Monitoring
                </h1>
                <p className="text-sm text-muted-foreground">
                  Real-time neonatal vital signs and incubator environment
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {getStatusBadge()}
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-lg border border-status-critical/30 bg-status-critical/10 p-4">
              <p className="text-sm text-status-critical">{error}</p>
            </div>
          )}

          {/* Status Bar */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {lastFetchTime && (
              <span>Last updated: {lastFetchTime.toLocaleTimeString()}</span>
            )}
            {currentVitals.timestamp && (
              <span>
                Sensor: {new Date(currentVitals.timestamp).toLocaleString()}
              </span>
            )}
            <span>Auto-refresh: 15s</span>
          </div>

          {/* ===== TOP SECTION: Vital Signs Cards ===== */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Heart className="h-5 w-5 text-rose-400" /> Neonatal Vital Signs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <VitalCard
                title="Heart Rate"
                value={currentVitals.heartRate}
                unit="BPM"
                icon={<Heart className="h-5 w-5 text-rose-400" />}
                color="bg-rose-500"
                normalRange={{ min: 100, max: 180 }}
                glowClass="glow-hover-critical"
              />
              <VitalCard
                title="Blood Oxygen (SpO₂)"
                value={currentVitals.spo2}
                unit="%"
                icon={<Wind className="h-5 w-5 text-blue-400" />}
                color="bg-blue-500"
                normalRange={{ min: 90, max: 100 }}
                glowClass="glow-hover-primary"
              />
              <VitalCard
                title="Body Temperature"
                value={currentVitals.temperature}
                unit="°C"
                icon={<Thermometer className="h-5 w-5 text-amber-400" />}
                color="bg-amber-500"
                normalRange={{ min: 36.0, max: 37.5 }}
                glowClass="glow-hover-warning"
                outOfRangeColorClass="text-amber-400"
                outOfRangeBarClass="bg-amber-500"
                outOfRangeGlowClass="glow-hover-warning"
              />
            </div>
          </div>

          {/* ===== Vital Signs Graphs ===== */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Historical Trends
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <VitalChart
                title="Heart Rate Trend"
                dataKey="heartRate"
                color="#f43f5e"
                unit="BPM"
                data={chartData}
                glowClass="glow-hover-critical"
                normalRange={{ min: 100, max: 180 }}
                animationNonce={chartAnimationNonce}
              />
              <VitalChart
                title="SpO₂ Trend"
                dataKey="spo2"
                color="#3b82f6"
                unit="%"
                data={chartData}
                glowClass="glow-hover-primary"
                normalRange={{ min: 90, max: 100 }}
                animationNonce={chartAnimationNonce}
              />
              <VitalChart
                title="Temperature Trend"
                dataKey="temperature"
                color="#f59e0b"
                unit="°C"
                data={chartData}
                glowClass="glow-hover-warning"
                normalRange={{ min: 36.0, max: 37.5 }}
                animationNonce={chartAnimationNonce}
              />
            </div>
          </div>

          {/* ===== MIDDLE/BOTTOM: Incubator Monitoring ===== */}
          <div className="grid grid-cols-1 gap-6">
            {/* Incubator Panel */}
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5 backdrop-blur-sm">
              <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 to-teal-500" />
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Box className="h-5 w-5 text-primary" />
                  </div>
                  Incubator Monitoring
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Real-time incubator environment data
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Incubator Temperature */}
                  <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="h-4 w-4 text-orange-400" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Incubator Temp
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-3xl font-bold tabular-nums ${currentVitals.incubatorTemperature === null ? "text-muted-foreground/60" : "text-orange-500 dark:text-orange-300"}`}
                      >
                        {currentVitals.incubatorTemperature !== null
                          ? currentVitals.incubatorTemperature.toFixed(1)
                          : "--"}
                      </span>
                      <span className="text-sm text-muted-foreground">°C</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground/80">
                      Normal: 32–36 °C
                    </p>
                  </div>
                  {/* Incubator Humidity */}
                  <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="h-4 w-4 text-teal-400" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Incubator Humidity
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-3xl font-bold tabular-nums ${currentVitals.incubatorHumidity === null ? "text-muted-foreground/60" : "text-teal-500 dark:text-teal-300"}`}
                      >
                        {currentVitals.incubatorHumidity !== null
                          ? currentVitals.incubatorHumidity.toFixed(1)
                          : "--"}
                      </span>
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground/80">
                      Normal: 40–60 %
                    </p>
                  </div>
                </div>
                {/* Incubator Status */}
                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 p-3">
                  <span className="text-sm font-medium text-foreground">
                    Incubator Status
                  </span>
                  <IncubatorStatusBadge
                    temp={currentVitals.incubatorTemperature}
                    humidity={currentVitals.incubatorHumidity}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <footer className="mt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 NeoGuard Hospital Systems</p>
          </footer>
        </div>
      </div>
    </DashboardLayout>
  );
};

// === Sub-components ===

const VitalCard: React.FC<{
  title: string;
  value: number | null;
  unit: string;
  icon: React.ReactNode;
  color: string;
  normalRange?: { min: number; max: number };
  glowClass?: string;
  outOfRangeColorClass?: string;
  outOfRangeBarClass?: string;
  outOfRangeGlowClass?: string;
}> = ({
  title,
  value,
  unit,
  icon,
  color,
  normalRange,
  glowClass,
  outOfRangeColorClass,
  outOfRangeBarClass,
  outOfRangeGlowClass,
}) => {
  const isOffline = value === null;
  const isOutOfRange =
    normalRange &&
    value !== null &&
    (value < normalRange.min || value > normalRange.max);
  const resolvedGlowClass = isOutOfRange
    ? (outOfRangeGlowClass ?? "glow-hover-critical")
    : (glowClass ?? "glow-hover-primary");
  return (
    <Card
      className={`overflow-hidden border-border/70 bg-card/80 backdrop-blur-sm ${resolvedGlowClass}`}
    >
      <div
        className={`h-1 w-full ${isOffline ? "bg-border" : isOutOfRange ? (outOfRangeBarClass ?? "bg-status-critical") : color}`}
      />
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center gap-2">
          <div
            className={`rounded-lg p-2 ${isOffline ? "bg-muted" : `${color}/20`}`}
          >
            {icon}
          </div>
          <CardTitle className="text-sm font-medium text-foreground">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-baseline gap-1">
          <span
            className={`text-4xl font-bold tabular-nums ${isOffline ? "text-muted-foreground/60" : isOutOfRange ? (outOfRangeColorClass ?? "text-status-critical") : "text-foreground"}`}
          >
            {isOffline ? "--" : value}
          </span>
          <span className="text-lg text-muted-foreground">{unit}</span>
        </div>
        {normalRange && !isOffline && (
          <p className="mt-1 text-xs text-muted-foreground/80">
            Normal: {normalRange.min}–{normalRange.max} {unit}
          </p>
        )}
        {isOffline && (
          <p className="mt-1 text-xs text-muted-foreground/80">
            No sensor data available
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const VitalChart: React.FC<{
  title: string;
  dataKey: "heartRate" | "spo2" | "temperature";
  color: string;
  unit: string;
  data: ChartDataPoint[];
  glowClass?: string;
  normalRange?: { min: number; max: number };
  animationNonce?: number;
}> = ({
  title,
  dataKey,
  color,
  unit,
  data,
  glowClass,
  normalRange,
  animationNonce = 0,
}) => {
  const chartId = useRef(`vital-chart-${dataKey}`).current;
  const validData = data.filter((d) => d[dataKey] !== null);

  const numericValues = validData
    .map((d) => d[dataKey])
    .filter((value): value is number => typeof value === "number");

  const latestValue = numericValues[numericValues.length - 1] ?? null;
  const isOutOfRange =
    latestValue !== null &&
    normalRange !== undefined &&
    (latestValue < normalRange.min || latestValue > normalRange.max);

  const dataMin = numericValues.length > 0 ? Math.min(...numericValues) : 0;
  const dataMax = numericValues.length > 0 ? Math.max(...numericValues) : 0;
  const rangeSpan =
    normalRange !== undefined
      ? normalRange.max - normalRange.min
      : Math.max(1, dataMax - dataMin);
  const padding = Math.max(1, rangeSpan * 0.2);
  const yMin =
    normalRange !== undefined
      ? Math.min(dataMin, normalRange.min) - padding
      : dataMin - padding;
  const yMax =
    normalRange !== undefined
      ? Math.max(dataMax, normalRange.max) + padding
      : dataMax + padding;
  const yDomain =
    dataKey === "spo2" ? [88, 100] : ([yMin, yMax] as [number, number]);

  if (validData.length === 0) {
    return (
      <Card
        className={`border-border/70 bg-card/80 backdrop-blur-sm ${glowClass ?? "glow-hover-primary"}`}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-48 flex items-center justify-center">
          <p className="text-sm text-muted-foreground/80">
            No historical data available
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card
      className={`card-medical overflow-hidden border-primary/20 bg-card/90 backdrop-blur-sm ${glowClass ?? "glow-hover-primary"}`}
    >
      <div className="h-1 w-full" style={{ backgroundColor: color }} />
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-bold text-foreground">
            {title}
          </CardTitle>
          <div className="text-right">
            <span
              className={`text-3xl font-bold tabular-nums ${isOutOfRange ? "text-status-critical" : "text-foreground"}`}
            >
              {latestValue !== null ? latestValue : "--"}
            </span>
            <span className="ml-1 text-sm font-medium text-muted-foreground">
              {unit}
            </span>
          </div>
        </div>
        {normalRange && (
          <p className="text-xs font-medium text-muted-foreground mt-1">
            Normal range: {normalRange.min} - {normalRange.max} {unit}
          </p>
        )}
      </CardHeader>
      <CardContent className="h-52 pb-5">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            key={`${chartId}-${animationNonce}`}
            data={validData}
            margin={{ top: 8, right: 10, left: -12, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={`live-gradient-${chartId}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke={chartGridColor}
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: chartTickColor }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: chartTickColor }}
              tickLine={false}
              axisLine={false}
              domain={yDomain}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              labelFormatter={(_, payload) =>
                payload[0]?.payload?.fullTime || ""
              }
              formatter={(value: number) => [`${value} ${unit}`, title]}
            />
            {normalRange && (
              <>
                <ReferenceLine
                  y={normalRange.min}
                  stroke="hsl(var(--status-warning))"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                />
                <ReferenceLine
                  y={normalRange.max}
                  stroke="hsl(var(--status-warning))"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                />
              </>
            )}
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#live-gradient-${chartId})`}
              dot={false}
              activeDot={{
                r: 5,
                fill: color,
                strokeWidth: 2,
                stroke: "hsl(var(--card))",
              }}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const IncubatorStatusBadge: React.FC<{
  temp: number | null;
  humidity: number | null;
}> = ({ temp, humidity }) => {
  if (temp === null && humidity === null) {
    return (
      <Badge className="border-muted-foreground/30 bg-muted/40 text-muted-foreground">
        No Data
      </Badge>
    );
  }
  const tempOk = temp !== null && temp >= 32 && temp <= 36;
  const humOk = humidity !== null && humidity >= 40 && humidity <= 60;
  if (tempOk && humOk) {
    return (
      <Badge className="bg-status-normal/10 text-status-normal border-status-normal/30">
        Optimal
      </Badge>
    );
  }
  if ((temp !== null && !tempOk) || (humidity !== null && !humOk)) {
    return (
      <Badge className="bg-status-warning/10 text-status-warning border-status-warning/30">
        Needs Attention
      </Badge>
    );
  }
  return (
    <Badge className="bg-status-normal/10 text-status-normal border-status-normal/30">
      Normal
    </Badge>
  );
};

export default LiveMonitoring;
