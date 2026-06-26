import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { Target, Layers, ListTodo, CheckCircle2, Circle as CircleIcon, Sparkles, Flame, Plus, Download, Upload, Clock, ChevronRight } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { pct, daysLeft, todayStr } from "../utils/helpers";
import SectionHeader from "../components/ui/SectionHeader";
import ProgressBar from "../components/ui/ProgressBar";
import ProgressRing from "../components/ui/ProgressRing";
import PriorityChip from "../components/ui/PriorityChip";

export default function DashboardScreen({ state, setTab, setShowSettings, handleDownloadTemplate, navigate }) {
  const t = useTheme();
  const activeGoals = state.goals.filter(g => g.status !== "archived");
  const activeSubGoals = state.subGoals.filter(s => activeGoals.some(g => g.id === s.goalId));
  const activeTasks = state.tasks.filter(tk => activeSubGoals.some(s => s.id === tk.subGoalId));

  const goals = activeGoals;
  const subGoals = activeSubGoals;
  const tasks = activeTasks;

  const total   = tasks.length;
  const done    = tasks.filter(x => x.status === "completed").length;
  const overall = pct(done, total);
  const days    = daysLeft();

  const standPct = pct(goals.filter(g => {
    const ts = tasks.filter(tk => subGoals.filter(s => s.goalId === g.id).some(s => s.id === tk.subGoalId));
    return ts.length && ts.every(x => x.status === "completed");
  }).length, goals.length);

  // ── Empty state ────────────────────────────────────────────
  if (goals.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 28, paddingVertical: 64 }}>
        {/* Icon */}
        <View style={{
          width: 86, height: 86, borderRadius: 16,
          backgroundColor: t.blue + "18",
          alignItems: "center", justifyContent: "center", marginBottom: 28,
          borderWidth: 1.5, borderColor: t.border,
        }}>
          <Target size={40} color={t.blue} />
        </View>

        <Text style={{ fontSize: 28, fontWeight: "900", color: t.labelPrimary, textAlign: "center", letterSpacing: -1, marginBottom: 10, textTransform: "uppercase" }}>
          Welcome to{" "}
          <Text style={{ fontFamily: "Caveat_700Bold", fontWeight: "normal", fontSize: 36, letterSpacing: 0, textTransform: "none", color: t.blue }}>Rukz</Text>
        </Text>
        <Text style={{ fontSize: 15, color: t.inkThird, textAlign: "center", lineHeight: 24, marginBottom: 36, maxWidth: 280 }}>
          Your personal command centre for life goals. Start by creating your first goal.
        </Text>

        <View style={{ width: "100%", gap: 12 }}>
          <TouchableOpacity onPress={() => setTab("goals")} style={[{
            backgroundColor: t.blue, borderRadius: 14, paddingVertical: 18,
            alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
            borderWidth: t.isDark ? 0 : 1.5, borderColor: t.border,
          }, t.shadow]}>
            <Plus size={18} color="#FFF" strokeWidth={3} />
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 15, letterSpacing: 0.2, textTransform: "uppercase" }}>Create Your First Goal</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDownloadTemplate} style={[{
            backgroundColor: t.isDark ? "#16161A" : "#FFFFFF",
            borderRadius: 14, paddingVertical: 16,
            alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
            borderWidth: 1.5, borderColor: t.border,
          }, t.shadow]}>
            <Download size={16} color={t.labelPrimary} strokeWidth={2.5} />
            <Text style={{ color: t.labelPrimary, fontWeight: "800", fontSize: 14, letterSpacing: 0.2, textTransform: "uppercase" }}>Download CSV Template</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowSettings(true)} style={{
            paddingVertical: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6,
          }}>
            <Upload size={13} color={t.inkThird} />
            <Text style={{ color: t.blue, fontWeight: "700", fontSize: 14 }}>Already have a file? Upload here</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Violet capacity card (inspired by reference image) ── */}
      <LinearGradient
        colors={["#7B61FF", "#4E32E0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[{
          borderRadius: 16, padding: 22, marginBottom: 14,
          borderWidth: t.isDark ? 0 : 1.5, borderColor: t.border,
        }, t.shadow]}
      >
        {/* Eyebrow */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 }}>
          <Sparkles size={12} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={{ fontSize: 10, fontWeight: "900", color: "#FFFFFF", letterSpacing: 1.5, textTransform: "uppercase" }}>
            2026 OVERVIEW
          </Text>
        </View>

        {/* Big number + rings */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 }}>
          {/* Left: hero number */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 0 }}>
              <Text style={{ fontSize: 76, fontWeight: "900", color: "#FFFFFF", letterSpacing: -3, lineHeight: 74 }}>
                {overall}
              </Text>
              <Text style={{ fontSize: 32, fontWeight: "700", color: "rgba(255,255,255,0.6)", letterSpacing: -1, marginBottom: 10 }}>%</Text>
            </View>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 }}>
              overall progress
            </Text>

            {/* Mini legend with custom colors for dark/light blend */}
            <View style={{ marginTop: 18, gap: 8 }}>
              {[
                { label: "Tasks", val: overall, col: "#FFFFFF" },
                { label: "Exercise", val: pct(done, total), col: t.green },
                { label: "Stand", val: standPct, col: t.amber }
              ].map((ring, i) => (
                <View key={ring.label} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ring.col }} />
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "600" }}>{ring.label}</Text>
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#FFFFFF", marginLeft: "auto" }}>{ring.val}%</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Right: triple rings */}
          <View style={{ width: 116, height: 116, transform: [{ rotate: "-90deg" }] }}>
            <Svg width={116} height={116}>
              {/* Outer: Tasks */}
              <Circle cx={58} cy={58} r={50} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={8} />
              <Circle cx={58} cy={58} r={50} fill="none" stroke="#FFFFFF" strokeWidth={8}
                strokeDasharray={[(overall / 100) * 2 * Math.PI * 50, 2 * Math.PI * 50]} strokeLinecap="round" />
              {/* Middle: Exercise */}
              <Circle cx={58} cy={58} r={36} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={7} />
              <Circle cx={58} cy={58} r={36} fill="none" stroke={t.green} strokeWidth={7}
                strokeDasharray={[(pct(done, total) / 100) * 2 * Math.PI * 36, 2 * Math.PI * 36]} strokeLinecap="round" />
              {/* Inner: Goals */}
              <Circle cx={58} cy={58} r={22} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={6} />
              <Circle cx={58} cy={58} r={22} fill="none" stroke={t.amber} strokeWidth={6}
                strokeDasharray={[(standPct / 100) * 2 * Math.PI * 22, 2 * Math.PI * 22]} strokeLinecap="round" />
            </Svg>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginBottom: 14 }} />

        {/* Days left */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <Flame size={15} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 }}>DAYS LEFT IN 2026</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.5 }}>{days}</Text>
        </View>
      </LinearGradient>

      {/* ── High-Contrast Multi-Colored Stat Cards (inspired by reference image) ── */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
        {[
          { icon: Target,   label: "Goals",  value: goals.length,    bg: ["#FF7E67", "#E0462B"], textColor: "#FFFFFF", iconColor: "#FFFFFF" },
          { icon: Layers,   label: "Areas",  value: subGoals.length, bg: ["#8B6EFD", "#5E3CE6"], textColor: "#FFFFFF", iconColor: "#FFFFFF" },
          { icon: ListTodo, label: "Tasks",  value: total,           bg: ["#FFD60A", "#E0A300"], textColor: "#121214", iconColor: "#121214" },
        ].map(({ icon: Icon, label, value, bg, textColor, iconColor }) => (
          <LinearGradient
            key={label}
            colors={bg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[{
              flex: 1,
              borderRadius: 16, paddingHorizontal: 14, paddingVertical: 20,
              borderWidth: t.isDark ? 0 : 1.5, borderColor: t.border,
            }, t.shadow]}
          >
            <View style={{
              width: 32, height: 32, borderRadius: 10,
              backgroundColor: textColor === "#FFFFFF" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.08)",
              alignItems: "center", justifyContent: "center", marginBottom: 14,
            }}>
              <Icon size={16} color={iconColor} strokeWidth={2.5} />
            </View>
            <Text style={{ fontSize: 32, fontWeight: "900", color: textColor, letterSpacing: -1.5, lineHeight: 32 }}>{value}</Text>
            <Text style={{ fontSize: 11, color: textColor, marginTop: 6, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", opacity: 0.8 }}>{label}</Text>
          </LinearGradient>
        ))}
      </View>

      {/* ── Completed / Pending row ── */}
      <View style={{ flexDirection: "row", gap: 14, marginBottom: 12 }}>
        {[
          { icon: CheckCircle2, label: "Completed", value: done,        bg: ["#30D158", "#1E9E3C"], color: "#FFFFFF", textColor: "#FFFFFF" },
          { icon: CircleIcon,   label: "Pending",   value: total - done, bg: ["#FF9F0A", "#D86E00"], color: "#FFFFFF", textColor: "#FFFFFF" },
        ].map(({ icon: Icon, label, value, bg, color, textColor }) => (
          <LinearGradient
            key={label}
            colors={bg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[{
              flex: 1,
              borderRadius: 16, paddingHorizontal: 18, paddingVertical: 20,
              borderWidth: t.isDark ? 0 : 1.5, borderColor: t.border,
            }, t.shadow]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Icon size={14} color={color} strokeWidth={3} />
              <Text style={{ fontSize: 11, color: textColor, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" }}>{label}</Text>
            </View>
            <Text style={{ fontSize: 38, fontWeight: "900", color: textColor, letterSpacing: -1.5, lineHeight: 38 }}>{value}</Text>
          </LinearGradient>
        ))}
      </View>

      {/* ── Today's Focus ── */}
      {(() => {
        const today      = todayStr();
        const focusTasks = tasks.filter(tk => tk.status !== "completed" && tk.dueDate && tk.dueDate <= today).slice(0, 5);
        if (!focusTasks.length) return null;
        return (
          <View>
            <SectionHeader>Today's Focus</SectionHeader>
            <View style={{
              backgroundColor: t.isDark ? "#16161A" : "#FFFFFF",
              borderRadius: 16, overflow: "hidden",
              borderWidth: 1.5, borderColor: t.border,
              marginBottom: 6,
            }}>
              {focusTasks.map((tk, i) => {
                const isOverdue = tk.dueDate < today;
                const sg = subGoals.find(s => s.id === tk.subGoalId);
                const g  = sg ? goals.find(g => g.id === sg.goalId) : null;
                const accentColor = isOverdue ? t.red : t.amber;
                return (
                  <View key={tk.id}>
                    <View style={{ paddingVertical: 18, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 14 }}>
                      <View style={{
                        width: 38, height: 38, borderRadius: 10,
                        backgroundColor: accentColor + "18",
                        alignItems: "center", justifyContent: "center",
                        borderWidth: 1, borderColor: accentColor + "25",
                      }}>
                        <Clock size={16} color={accentColor} strokeWidth={2.5} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: t.labelPrimary, letterSpacing: -0.2 }}>{tk.name}</Text>
                        {g && <Text style={{ fontSize: 12, color: t.inkThird, marginTop: 2, fontWeight: "500" }}>{g.name}{sg ? " › " + sg.name : ""}</Text>}
                        <Text style={{ fontSize: 11, color: accentColor, marginTop: 4, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 }}>
                          {isOverdue ? `Overdue · ${tk.dueDate}` : `Due today · ${tk.dueDate}`}
                        </Text>
                      </View>
                      <PriorityChip priority={tk.priority} />
                    </View>
                    {i < focusTasks.length - 1 && <View style={{ height: 1, backgroundColor: t.separator, marginLeft: 70 }} />}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })()}

      {/* ── Goal progress ── */}
      <SectionHeader>Goal Progress</SectionHeader>
      <View style={{
        backgroundColor: t.isDark ? "#16161A" : "#FFFFFF",
        borderRadius: 16, overflow: "hidden",
        borderWidth: 1.5, borderColor: t.border,
      }}>
        {goals.map((g, i) => {
          const gSubs  = subGoals.filter(s => s.goalId === g.id);
          const gTasks = tasks.filter(tk => gSubs.some(s => s.id === tk.subGoalId));
          const gDone  = gTasks.filter(tk => tk.status === "completed").length;
          const gPct   = pct(gDone, gTasks.length);
          const color  = [t.blue, t.green, t.red, t.amber, t.indigo][i % 5];
          return (
            <View key={g.id}>
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={() => navigate("goalDetail", { goalId: g.id })}
                style={{ paddingVertical: 20, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 14 }}
              >
                {/* Small progress ring */}
                <View style={{ position: "relative", width: 48, height: 48 }}>
                  <ProgressRing value={gPct} size={48} stroke={5} color={color} />
                  <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 11, fontWeight: "900", color: color }}>{gPct}</Text>
                  </View>
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: t.labelPrimary, letterSpacing: -0.2, marginBottom: 4 }}>{g.name}</Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <Text style={{ fontSize: 12, color: t.inkThird, fontWeight: "500" }}>{gSubs.length} areas</Text>
                    <Text style={{ fontSize: 12, color: t.green, fontWeight: "700" }}>✓ {gDone}</Text>
                    <Text style={{ fontSize: 12, color: t.inkThird, fontWeight: "500" }}>○ {gTasks.length - gDone} left</Text>
                  </View>
                </View>

                <ChevronRight size={15} color={t.inkThird} strokeWidth={3} />
              </TouchableOpacity>
              {i < goals.length - 1 && <View style={{ height: 1, backgroundColor: t.separator, marginLeft: 80 }} />}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
