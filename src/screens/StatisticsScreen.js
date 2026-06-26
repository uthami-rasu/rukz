import React from "react";
import { View, Text, ScrollView } from "react-native";
import { CheckCircle2, Circle as CircleIcon, TrendingUp, Target, AlertCircle, Calendar, ShieldAlert } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { pct, todayStr } from "../utils/helpers";
import SectionHeader from "../components/ui/SectionHeader";
import GroupCard from "../components/ui/GroupCard";
import ProgressBar from "../components/ui/ProgressBar";

export default function StatisticsScreen({ state }) {
  const t = useTheme();
  const activeGoals = state.goals.filter(g => g.status !== "archived");
  const activeSubGoals = state.subGoals.filter(s => activeGoals.some(g => g.id === s.goalId));
  const activeTasks = state.tasks.filter(tk => activeSubGoals.some(s => s.id === tk.subGoalId));

  const goals = activeGoals;
  const subGoals = activeSubGoals;
  const tasks = activeTasks;

  const done    = tasks.filter(tk => tk.status === "completed").length;
  const pending = tasks.length - done;
  const months  = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  const bars    = [22, 38, 47, 35, 61, done, 0];
  const maxBar  = Math.max(...bars, 1);
  const colors  = [t.blue, t.green, t.red, t.amber, t.indigo];
  const today   = todayStr();

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── High level task stats ── */}
      <View style={{ flexDirection: "row", gap: 14, marginBottom: 16 }}>
        {[
          { icon: CheckCircle2, label: "Completed", value: done,    color: t.green },
          { icon: CircleIcon,   label: "Pending",   value: pending, color: t.amber },
        ].map(({ icon: Icon, label, value, color }) => (
          <View key={label} style={[{
            flex: 1,
            backgroundColor: t.isDark ? "#16161A" : "#FFFFFF",
            borderRadius: 16, padding: 18,
            borderWidth: 1.5, borderColor: t.border
          }, t.shadow]}>
            <View style={{
              width: 34, height: 34, borderRadius: 10,
              backgroundColor: color + "15",
              alignItems: "center", justifyContent: "center", marginBottom: 12,
              borderWidth: 1, borderColor: color + "25",
            }}>
              <Icon size={16} color={color} strokeWidth={2.5} />
            </View>
            <Text style={{ fontSize: 32, fontWeight: "900", color: t.labelPrimary, lineHeight: 32, letterSpacing: -1 }}>{value}</Text>
            <Text style={{ fontSize: 11, color: t.inkThird, fontWeight: "800", marginTop: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</Text>
          </View>
        ))}
      </View>

      {/* ── Completion Trend ── */}
      <View style={[{
        backgroundColor: t.isDark ? "#16161A" : "#FFFFFF",
        borderRadius: 16, padding: 18, marginBottom: 16,
        borderWidth: 1.5, borderColor: t.border
      }, t.shadow]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <TrendingUp size={16} color={t.blue} strokeWidth={2.5} />
          <Text style={{ fontSize: 13, fontWeight: "900", color: t.labelPrimary, textTransform: "uppercase", letterSpacing: 0.8 }}>Monthly Completions</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, height: 110, paddingBottom: 6 }}>
          {bars.map((v, i) => (
            <View key={i} style={{ flex: 1, alignItems: "center", gap: 8 }}>
              <View style={{
                width: "100%",
                borderRadius: 6,
                backgroundColor: i === 5 ? t.blue : (t.isDark ? "#222228" : "#E5E5EA"),
                height: `${(v / maxBar) * 100}%`,
                minHeight: 6,
                borderWidth: 1,
                borderColor: i === 5 ? t.blue : t.border,
              }} />
              <Text style={{
                fontSize: 10,
                color: i === 5 ? t.blue : t.inkThird,
                fontWeight: "900",
                textTransform: "uppercase",
              }}>{months[i]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Detailed Goal Breakdown ── */}
      <SectionHeader>Goal-Wise Analytics</SectionHeader>
      <GroupCard>
        {goals.map((g, i) => {
          const gSubs  = subGoals.filter(s => s.goalId === g.id);
          const gTasks = tasks.filter(tk => gSubs.some(s => s.id === tk.subGoalId));
          const gDone  = gTasks.filter(tk => tk.status === "completed").length;
          const gPct   = pct(gDone, gTasks.length);
          const color  = colors[i % colors.length];

          // Compute custom metrics for goal-wise analytics
          const gOverdue = gTasks.filter(tk => tk.status !== "completed" && tk.dueDate && tk.dueDate < today).length;
          const highPri  = gTasks.filter(tk => tk.priority === "High").length;
          const medPri   = gTasks.filter(tk => tk.priority === "Medium").length;
          const lowPri   = gTasks.filter(tk => tk.priority === "Low").length;

          // Goal status state
          let statusLabel = "IN PROGRESS";
          let statusColor = t.blue;
          if (gTasks.length === 0) {
            statusLabel = "NO TASKS";
            statusColor = t.inkThird;
          } else if (gPct === 100) {
            statusLabel = "COMPLETED";
            statusColor = t.green;
          } else if (gOverdue > 0) {
            statusLabel = "NEEDS ATTENTION";
            statusColor = t.red;
          }

          return (
            <View key={g.id}>
              <View style={{ paddingVertical: 20, paddingHorizontal: 18 }}>
                {/* Header Row */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, paddingRight: 8 }}>
                    <View style={{
                      width: 32, height: 32, borderRadius: 10,
                      backgroundColor: color + "15",
                      alignItems: "center", justifyContent: "center",
                      borderWidth: 1, borderColor: color + "25",
                    }}>
                      <Target size={14} color={color} strokeWidth={2.5} />
                    </View>
                    <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: "700", color: t.labelPrimary }}>{g.name}</Text>
                  </View>

                  {/* Status badge */}
                  <View style={{
                    flexDirection: "row", alignItems: "center", gap: 5,
                    backgroundColor: statusColor + "15",
                    paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8,
                    borderWidth: 1, borderColor: statusColor + "25"
                  }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
                    <Text style={{ fontSize: 9, fontWeight: "900", color: statusColor, letterSpacing: 0.5 }}>{statusLabel}</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, color: t.inkThird, fontWeight: "600" }}>Overall Goal Progress</Text>
                  <Text style={{ fontSize: 13, fontWeight: "900", color: color }}>{gPct}%</Text>
                </View>
                <ProgressBar value={gPct} color={color} height={6} style={{ marginBottom: 16 }} />

                {/* Analytics Grid */}
                <View style={{
                  flexDirection: "row",
                  backgroundColor: t.isDark ? "#222228" : "#F4F4F6",
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  borderWidth: 1,
                  borderColor: t.border,
                }}>
                  {/* Focus Areas */}
                  <View style={{ flex: 1.2, alignItems: "center" }}>
                    <Text style={{ fontSize: 18, fontWeight: "900", color: t.labelPrimary }}>{gSubs.length}</Text>
                    <Text style={{ fontSize: 9, color: t.inkThird, fontWeight: "800", textTransform: "uppercase", marginTop: 2 }}>Areas</Text>
                  </View>

                  <View style={{ width: 1, backgroundColor: t.separator }} />

                  {/* Tasks breakdown */}
                  <View style={{ flex: 2, alignItems: "center" }}>
                    <Text style={{ fontSize: 18, fontWeight: "900", color: t.labelPrimary }}>{gDone}<Text style={{ fontSize: 13, color: t.inkThird, fontWeight: "600" }}>/{gTasks.length}</Text></Text>
                    <Text style={{ fontSize: 9, color: t.inkThird, fontWeight: "800", textTransform: "uppercase", marginTop: 2 }}>Tasks Done</Text>
                  </View>

                  <View style={{ width: 1, backgroundColor: t.separator }} />

                  {/* Priorities */}
                  <View style={{ flex: 2.2, alignItems: "center" }}>
                    <View style={{ flexDirection: "row", gap: 4, alignItems: "baseline" }}>
                      <Text style={{ fontSize: 15, fontWeight: "900", color: t.red }}>{highPri}</Text>
                      <Text style={{ fontSize: 11, color: t.inkThird, fontWeight: "800" }}>·</Text>
                      <Text style={{ fontSize: 15, fontWeight: "900", color: t.amber }}>{medPri}</Text>
                      <Text style={{ fontSize: 11, color: t.inkThird, fontWeight: "800" }}>·</Text>
                      <Text style={{ fontSize: 15, fontWeight: "900", color: t.green }}>{lowPri}</Text>
                    </View>
                    <Text style={{ fontSize: 9, color: t.inkThird, fontWeight: "800", textTransform: "uppercase", marginTop: 4 }}>H · M · L Pri</Text>
                  </View>

                  <View style={{ width: 1, backgroundColor: t.separator }} />

                  {/* Overdue */}
                  <View style={{ flex: 1.5, alignItems: "center" }}>
                    <Text style={{ fontSize: 18, fontWeight: "900", color: gOverdue > 0 ? t.red : t.green }}>{gOverdue}</Text>
                    <Text style={{ fontSize: 9, color: gOverdue > 0 ? t.red : t.inkThird, fontWeight: "800", textTransform: "uppercase", marginTop: 2 }}>Overdue</Text>
                  </View>
                </View>
              </View>
              {i < goals.length - 1 && <View style={{ height: 1, backgroundColor: t.separator }} />}
            </View>
          );
        })}
      </GroupCard>
    </ScrollView>
  );
}
