import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import {
  Clock,
  User,
  Users,
  FileText,
  Plus,
  CheckCircle2,
  ArrowRight,
  Stethoscope,
  Activity,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface HandoverNote {
  id: string;
  babyId: string;
  babyName: string;
  note: string;
  author: string;
  authorRole: string;
  timestamp: Date;
  category: "observation" | "medication" | "action_required" | "general";
}

type ShiftState = "active" | "previous" | "upcoming";

const SHIFTS = [
  {
    name: "Day Shift",
    time: "07:00 – 15:00",
    doctor: "Dr. Sarah Johnson",
    nurse: "RN Emily Davis",
    icon: "🌅",
    cardClass:
      "glow-hover-day border-amber-400/35 bg-amber-500/10 dark:bg-[rgba(251,191,36,0.12)] dark:border-[rgba(251,191,36,0.46)]",
    accentClass: "text-amber-300",
    barClass: "bg-amber-400",
  },
  {
    name: "Evening Shift",
    time: "15:00 – 23:00",
    doctor: "Dr. Rajesh Kumar",
    nurse: "RN Michael Chen",
    icon: "☀️",
    cardClass:
      "glow-hover-evening border-orange-400/35 bg-orange-500/10 dark:bg-[rgba(249,115,22,0.12)] dark:border-[rgba(249,115,22,0.46)]",
    accentClass: "text-orange-300",
    barClass: "bg-orange-400",
  },
  {
    name: "Night Shift",
    time: "23:00 – 07:00",
    doctor: "Dr. Priya Nair",
    nurse: "RN Jessica Williams",
    icon: "🌙",
    cardClass:
      "glow-hover-night border-violet-400/28 bg-slate-500/5 dark:bg-[rgba(99,102,241,0.10)] dark:border-[rgba(167,139,250,0.40)]",
    accentClass: "text-violet-300",
    barClass: "bg-violet-400",
  },
];

const CATEGORIES = [
  {
    value: "observation",
    label: "Observation",
    color: "text-chart-spo2",
    bg: "bg-chart-spo2/10",
  },
  {
    value: "medication",
    label: "Medication",
    color: "text-chart-movement",
    bg: "bg-chart-movement/10",
  },
  {
    value: "action_required",
    label: "Action Required",
    color: "text-status-warning",
    bg: "bg-status-warning-bg",
  },
  {
    value: "general",
    label: "General",
    color: "text-muted-foreground",
    bg: "bg-muted/30",
  },
];

const SHIFT_STATE_STYLES = {
  active: {
    label: "Active",
    badgeClass:
      "text-xs font-semibold border-emerald-500 bg-emerald-100 text-emerald-700 dark:border-emerald-400/70 dark:bg-emerald-500/20 dark:text-emerald-300 animate-pulse-soft",
  },
  previous: {
    label: "Previous",
    badgeClass:
      "text-xs font-semibold border-slate-400 bg-slate-100 text-slate-600 dark:border-slate-400/70 dark:bg-slate-500/30 dark:text-slate-300",
  },
  upcoming: {
    label: "Upcoming",
    badgeClass:
      "text-xs font-semibold border-violet-500 bg-violet-100 text-violet-700 dark:border-violet-400/70 dark:bg-violet-500/25 dark:text-violet-300",
  },
} as const;

const getCurrentMinutes = (date: Date) =>
  date.getHours() * 60 + date.getMinutes();

const getActiveShiftIndex = (currentMinutes: number) => {
  if (currentMinutes >= 420 && currentMinutes < 900) return 0; // 07:00 - 15:00
  if (currentMinutes >= 900 && currentMinutes < 1380) return 1; // 15:00 - 23:00
  return 2; // 23:00 - 07:00
};

const getShiftProgress = (activeShiftIndex: number, currentMinutes: number) => {
  if (activeShiftIndex === 0) return ((currentMinutes - 420) / 480) * 100;
  if (activeShiftIndex === 1) return ((currentMinutes - 900) / 480) * 100;
  const adjusted =
    currentMinutes >= 1380 ? currentMinutes - 1380 : currentMinutes + 60;
  return (adjusted / 480) * 100;
};

const ShiftHandover = () => {
  const { user } = useAuth();
  const { babies, alerts } = useData();
  const [now, setNow] = useState(new Date());
  const [notes, setNotes] = useState<HandoverNote[]>([
    {
      id: "1",
      babyId: babies[0]?.id || "",
      babyName: babies[0]?.name || "Baby A",
      note: "Vitals stable throughout shift. SpO₂ maintained at 96%. Feeding completed on schedule. No desaturation events observed.",
      author: "Dr. Sarah Johnson",
      authorRole: "Doctor",
      timestamp: new Date(Date.now() - 3600000),
      category: "observation",
    },
    {
      id: "2",
      babyId: babies[1]?.id || "",
      babyName: babies[1]?.name || "Baby B",
      note: "Mild temperature fluctuation noted (36.3°C). Incubator adjusted to 33.2°C. Monitor closely next shift.",
      author: "RN Emily Davis",
      authorRole: "Nurse",
      timestamp: new Date(Date.now() - 7200000),
      category: "action_required",
    },
    {
      id: "3",
      babyId: babies[0]?.id || "",
      babyName: babies[0]?.name || "Baby A",
      note: "Caffeine citrate 20mg administered at 08:00. Next dose due at 20:00.",
      author: "RN Emily Davis",
      authorRole: "Nurse",
      timestamp: new Date(Date.now() - 5400000),
      category: "medication",
    },
    {
      id: "4",
      babyId: babies[2]?.id || "",
      babyName: babies[2]?.name || "Baby C",
      note: "Parents visited from 10:00-12:00. Kangaroo care performed for 45 minutes. Baby responded well.",
      author: "RN Emily Davis",
      authorRole: "Nurse",
      timestamp: new Date(Date.now() - 9000000),
      category: "general",
    },
  ]);
  const [newNote, setNewNote] = useState("");
  const [selectedBaby, setSelectedBaby] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("observation");
  const [filterBaby, setFilterBaby] = useState("all");

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const currentMinutes = getCurrentMinutes(now);
  const activeShiftIndex = getActiveShiftIndex(currentMinutes);
  const previousShiftIndex = (activeShiftIndex + 2) % SHIFTS.length;
  const upcomingShiftIndex = (activeShiftIndex + 1) % SHIFTS.length;

  const shiftsWithState = SHIFTS.map((shift, index) => {
    let state: ShiftState = "upcoming";
    if (index === activeShiftIndex) state = "active";
    else if (index === previousShiftIndex) state = "previous";

    return { ...shift, state };
  });

  const nextShift = shiftsWithState[upcomingShiftIndex];
  const shiftProgress = getShiftProgress(activeShiftIndex, currentMinutes);

  const activeAlertCount = alerts.filter((a) => !a.acknowledged).length;

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedBaby) {
      toast.error("Please select a baby and enter a note");
      return;
    }
    const baby = babies.find((b) => b.id === selectedBaby);
    const note: HandoverNote = {
      id: Date.now().toString(),
      babyId: selectedBaby,
      babyName: baby?.name || "Unknown",
      note: newNote.trim(),
      author: user?.name || "Unknown",
      authorRole: user?.role?.replace("_", " ") || "Staff",
      timestamp: new Date(),
      category: selectedCategory as HandoverNote["category"],
    };
    setNotes((prev) => [note, ...prev]);
    setNewNote("");
    setSelectedBaby("");
    toast.success("Handover note added");
  };

  const filteredNotes =
    filterBaby === "all" ? notes : notes.filter((n) => n.babyId === filterBaby);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Shift & Handover
          </h1>
          <p className="text-muted-foreground">
            Ensure continuity of care during staff shift changes
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {shiftsWithState.map((shift) => {
            const { state } = shift;
            const isCurrent = state === "active";
            const stateStyle = SHIFT_STATE_STYLES[state];
            return (
              <Card
                key={shift.name}
                className={cn("card-medical overflow-hidden", shift.cardClass)}
              >
                <div className={cn("h-2", shift.barClass)} />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{shift.icon}</span>
                      <CardTitle className="text-base font-bold">
                        {shift.name}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className={stateStyle.badgeClass}>
                      {stateStyle.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30">
                    <Clock className={cn("w-4 h-4", shift.accentClass)} />
                    <span className="font-semibold">{shift.time}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Stethoscope
                        className={cn("w-4 h-4", shift.accentClass)}
                      />
                      <span className="text-muted-foreground">Doctor:</span>
                      <span className="font-semibold">{shift.doctor}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className={cn("w-4 h-4", shift.accentClass)} />
                      <span className="text-muted-foreground">Nurse:</span>
                      <span className="font-semibold">{shift.nurse}</span>
                    </div>
                  </div>
                  {isCurrent && (
                    <div className="pt-2 border-t border-border/30 space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Shift Progress</span>
                        <span className="font-semibold">
                          {Math.round(shiftProgress)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            shift.barClass,
                          )}
                          style={{ width: `${Math.min(100, shiftProgress)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="card-medical glow-hover-primary border-primary/30 bg-primary/5 dark:bg-primary/10 dark:border-primary/40">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl gradient-primary">
                <Activity className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Patients Under Care
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {babies.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card
            className={cn(
              "card-medical",
              activeAlertCount > 0
                ? "glow-hover-critical border-status-critical/35 bg-status-critical-bg/35 dark:bg-[rgba(255,0,60,0.14)] dark:border-[rgba(255,64,96,0.45)]"
                : "glow-hover-normal border-status-normal/35 bg-status-normal-bg/35 dark:bg-[rgba(0,255,136,0.12)] dark:border-[rgba(0,255,136,0.42)]",
            )}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div
                className={cn(
                  "p-3 rounded-xl",
                  activeAlertCount > 0
                    ? "bg-status-critical"
                    : "bg-status-normal",
                )}
              >
                <AlertCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    activeAlertCount > 0
                      ? "text-status-critical"
                      : "text-status-normal",
                  )}
                >
                  {activeAlertCount}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-medical glow-hover-primary border-primary/30 bg-primary/5 dark:bg-primary/10 dark:border-primary/40">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-spo2/10">
                <FileText className="w-5 h-5 text-chart-spo2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Handover Notes</p>
                <p className="text-2xl font-bold text-foreground">
                  {notes.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
          <ArrowRight className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Next Shift: {nextShift?.name ?? "N/A"} ({nextShift?.time ?? "N/A"}
              )
            </p>
            <p className="text-xs text-muted-foreground">
              Incoming: {nextShift?.doctor ?? "N/A"} &{" "}
              {nextShift?.nurse ?? "N/A"}
            </p>
          </div>
        </div>

        <Card className="card-medical">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add Handover Note
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                  Select Baby
                </label>
                <select
                  value={selectedBaby}
                  onChange={(e) => setSelectedBaby(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Select a baby --</option>
                  {babies.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Bed {b.bedNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Textarea
              placeholder="Enter handover note (e.g., vitals summary, medications given, pending actions, observations...)"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[100px] rounded-xl"
            />
            <Button onClick={handleAddNote} className="btn-medical gap-2">
              <FileText className="w-4 h-4" />
              Add Handover Note
            </Button>
          </CardContent>
        </Card>

        <Card className="card-medical">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Handover Notes Timeline
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={filterBaby === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterBaby("all")}
                >
                  All ({notes.length})
                </Button>
                {babies.slice(0, 5).map((b) => {
                  const count = notes.filter((n) => n.babyId === b.id).length;
                  if (count === 0) return null;
                  return (
                    <Button
                      key={b.id}
                      variant={filterBaby === b.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterBaby(b.id)}
                    >
                      {b.name} ({count})
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <CheckCircle2 className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No handover notes for this filter
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border/50" />
                <div className="space-y-4">
                  {filteredNotes.map((note) => {
                    const catCfg =
                      CATEGORIES.find((c) => c.value === note.category) ||
                      CATEGORIES[3];
                    return (
                      <div key={note.id} className="relative pl-10">
                        <div
                          className={cn(
                            "absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 border-card",
                            catCfg.bg,
                            note.category === "action_required"
                              ? "bg-status-warning"
                              : note.category === "medication"
                                ? "bg-chart-movement"
                                : note.category === "observation"
                                  ? "bg-chart-spo2"
                                  : "bg-muted-foreground/30",
                          )}
                        />
                        <div className="p-4 rounded-xl bg-muted/20 border border-border/30 space-y-2 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="text-xs font-semibold"
                              >
                                {note.babyName}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn("text-[10px]", catCfg.color)}
                              >
                                {catCfg.label}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {note.timestamp.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">
                            {note.note}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                              <span className="text-[10px] font-bold text-primary-foreground">
                                {note.author.charAt(0)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {note.author} •{" "}
                              <span className="capitalize">
                                {note.authorRole}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ShiftHandover;
