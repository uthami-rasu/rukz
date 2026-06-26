import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { Search, X, Target, Layers, Check } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import SectionHeader from "../components/ui/SectionHeader";
import GroupCard from "../components/ui/GroupCard";
import Chevron from "../components/ui/Chevron";
import PriorityChip from "../components/ui/PriorityChip";

export default function SearchScreen({ state, navigate }) {
  const t = useTheme();
  const [q, setQ] = useState("");
  const activeGoals = state.goals.filter(g => g.status !== "archived");
  const activeSubGoals = state.subGoals.filter(s => activeGoals.some(g => g.id === s.goalId));
  const activeTasks = state.tasks.filter(tk => activeSubGoals.some(s => s.id === tk.subGoalId));

  const goals = activeGoals;
  const subGoals = activeSubGoals;
  const tasks = activeTasks;

  const results = useMemo(() => {
    if (!q.trim()) return null;
    const lo = q.toLowerCase();
    return {
      goals:    goals.filter(g => g.name.toLowerCase().includes(lo) || g.description?.toLowerCase().includes(lo)),
      subGoals: subGoals.filter(s => s.name.toLowerCase().includes(lo)),
      tasks:    tasks.filter(tk => tk.name.toLowerCase().includes(lo)),
    };
  }, [q, goals, subGoals, tasks]);

  const hasResults = results && (results.goals.length + results.subGoals.length + results.tasks.length > 0);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ marginBottom: 14 }}>
        <View style={[{
          backgroundColor: t.isDark ? "#16161A" : "#FFFFFF",
          borderWidth: 1.5,
          borderColor: t.border,
          borderRadius: 99,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
        }, t.shadow]}>
          <Search size={16} color={t.labelSecondary} style={{ marginRight: 10 }} strokeWidth={2.5} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by name or type..."
            placeholderTextColor={t.inkThird}
            style={{ flex: 1, color: t.labelPrimary, paddingVertical: 14, fontSize: 15, fontWeight: "600" }}
          />
          {q.length > 0 && (
            <TouchableOpacity
              onPress={() => setQ("")}
              activeOpacity={0.7}
              style={{
                backgroundColor: t.isDark ? "#2C2C35" : "#E4ECE7",
                borderRadius: 10,
                width: 20,
                height: 20,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={11} color={t.labelPrimary} strokeWidth={3} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!q && (
        <View style={{ alignItems: "center", paddingTop: 80, gap: 14 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: t.isDark ? "#16161A" : "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: t.border }}>
            <Search size={28} color={t.blue} strokeWidth={2.5} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: "900", color: t.labelPrimary, textTransform: "uppercase", letterSpacing: 0.8 }}>Search Everything</Text>
          <Text style={{ fontSize: 13, color: t.inkThird, maxWidth: 240, lineHeight: 20, textAlign: "center", fontWeight: "500" }}>Find goals, focus areas and tasks instantly</Text>
        </View>
      )}

      {q.trim().length > 0 && !hasResults && (
        <View style={{ alignItems: "center", paddingTop: 80, gap: 10 }}>
          <Search size={28} color={t.inkThird} strokeWidth={2} />
          <Text style={{ fontSize: 15, color: t.inkSecond, fontWeight: "600" }}>No results found for "{q}"</Text>
        </View>
      )}

      {hasResults && (
        <View>
          {results.goals.length > 0 && (
            <View>
              <SectionHeader>Goals</SectionHeader>
              <GroupCard style={{ marginBottom: 14 }}>
                {results.goals.map((g, i) => (
                  <View key={g.id}>
                    <TouchableOpacity
                      onPress={() => navigate("goalDetail", { goalId: g.id })}
                      activeOpacity={0.65}
                      style={{ paddingVertical: 16, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 14 }}
                    >
                      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: t.red + "15", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: t.red + "25" }}>
                        <Target size={16} color={t.red} strokeWidth={2.5} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: t.labelPrimary }}>{g.name}</Text>
                        {g.description && <Text style={{ fontSize: 12, color: t.inkThird, marginTop: 2, fontWeight: "500" }}>{g.description}</Text>}
                      </View>
                      <Chevron />
                    </TouchableOpacity>
                    {i < results.goals.length - 1 && <View style={{ height: 1, backgroundColor: t.separator, marginLeft: 70 }} />}
                  </View>
                ))}
              </GroupCard>
            </View>
          )}

          {results.subGoals.length > 0 && (
            <View>
              <SectionHeader>Focus Areas</SectionHeader>
              <GroupCard style={{ marginBottom: 14 }}>
                {results.subGoals.map((s, i) => (
                  <View key={s.id}>
                    <TouchableOpacity
                      onPress={() => navigate("subGoalDetail", { subGoalId: s.id })}
                      activeOpacity={0.65}
                      style={{ paddingVertical: 16, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 14 }}
                    >
                      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: t.green + "15", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: t.green + "25" }}>
                        <Layers size={16} color={t.green} strokeWidth={2.5} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: t.labelPrimary }}>{s.name}</Text>
                        {s.description && <Text style={{ fontSize: 12, color: t.inkThird, marginTop: 2, fontWeight: "500" }}>{s.description}</Text>}
                      </View>
                      <Chevron />
                    </TouchableOpacity>
                    {i < results.subGoals.length - 1 && <View style={{ height: 1, backgroundColor: t.separator, marginLeft: 70 }} />}
                  </View>
                ))}
              </GroupCard>
            </View>
          )}

          {results.tasks.length > 0 && (
            <View>
              <SectionHeader>Tasks</SectionHeader>
              <GroupCard style={{ marginBottom: 14 }}>
                {results.tasks.map((tk, i) => {
                  const isCompleted = tk.status === "completed";
                  return (
                    <View key={tk.id}>
                      <View style={{ paddingVertical: 14, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 14, opacity: isCompleted ? 0.6 : 1 }}>
                        <View style={{
                          width: 26, height: 26, borderRadius: 13,
                          borderWidth: 2,
                          borderColor: isCompleted ? t.green : t.border,
                          backgroundColor: isCompleted ? t.green : "transparent",
                          alignItems: "center", justifyContent: "center",
                        }}>
                          {isCompleted && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            fontSize: 15,
                            fontWeight: isCompleted ? "500" : "700",
                            color: isCompleted ? t.inkThird : t.labelPrimary,
                            textDecorationLine: isCompleted ? "line-through" : "none",
                          }}>{tk.name}</Text>
                          <View style={{ marginTop: 6 }}><PriorityChip priority={tk.priority} /></View>
                        </View>
                      </View>
                      {i < results.tasks.length - 1 && <View style={{ height: 1, backgroundColor: t.separator, marginLeft: 58 }} />}
                    </View>
                  );
                })}
              </GroupCard>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
