import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Layers, AlignLeft, ListTodo, Plus, Trash2, ChevronRight, Archive } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { pct } from "../utils/helpers";
import SectionHeader from "../components/ui/SectionHeader";
import ProgressBar from "../components/ui/ProgressBar";
import ProgressRing from "../components/ui/ProgressRing";
import Sheet from "../components/ui/Sheet";
import AppleInput from "../components/ui/AppleInput";
import SheetBtn from "../components/ui/SheetBtn";
import NewItemRow from "../components/ui/NewItemRow";

export default function GoalDetailScreen({ state, dispatch, params, navigate, goBack }) {
  const t = useTheme();
  const { goals, subGoals, tasks } = state;
  const goal = goals.find(g => g.id === params.goalId);
  if (!goal) return null;

  const gSubs  = subGoals.filter(s => s.goalId === goal.id);
  const gTasks = tasks.filter(tk => gSubs.some(s => s.id === tk.subGoalId));
  const gDone  = gTasks.filter(tk => tk.status === "completed").length;
  const gPct   = pct(gDone, gTasks.length);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ name: "", description: "" });
  const PALETTE = [t.blue, t.green, t.red, t.amber, t.indigo];

  function add() {
    if (!form.name.trim()) return;
    dispatch({ type: "ADD_SUBGOAL", subGoal: { id: Date.now(), goalId: goal.id, ...form } });
    setForm({ name: "", description: "" });
    setShowAdd(false);
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero card ── */}
        <View style={[{
          backgroundColor: t.isDark ? "#16161A" : "#FFFFFF",
          borderRadius: 16, padding: 22, marginBottom: 14,
          borderWidth: 1.5, borderColor: t.border,
        }, t.shadow]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
            {/* Ring */}
            <View style={{ position: "relative" }}>
              <ProgressRing value={gPct} size={86} stroke={7} color={t.blue} />
              <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 19, fontWeight: "900", color: t.labelPrimary, letterSpacing: -0.5 }}>{gPct}%</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={{ flex: 1 }}>
              {goal.description ? (
                <Text style={{ fontSize: 13, color: t.inkThird, marginBottom: 14, lineHeight: 19, fontWeight: "500" }}>{goal.description}</Text>
              ) : null}
              <View style={{ flexDirection: "row", gap: 0 }}>
                {[
                  { v: gSubs.length, l: "Areas",   c: t.labelPrimary },
                  { v: gDone,        l: "Done",     c: t.green },
                  { v: gTasks.length - gDone, l: "Left", c: t.amber },
                ].map(({ v, l, c }, i) => (
                  <React.Fragment key={l}>
                    {i > 0 && <View style={{ width: 1, backgroundColor: t.separator, marginHorizontal: 16 }} />}
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ fontSize: 24, fontWeight: "900", color: c, letterSpacing: -1 }}>{v}</Text>
                      <Text style={{ fontSize: 11, color: t.inkThird, fontWeight: "800", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{l}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ── Focus areas ── */}
        <SectionHeader>Focus Areas</SectionHeader>
        <View style={[{
          backgroundColor: t.isDark ? "#16161A" : "#FFFFFF",
          borderRadius: 16, overflow: "hidden",
          borderWidth: 1.5, borderColor: t.border,
          marginBottom: 8,
        }, t.shadow]}>
          {gSubs.map((sg, i) => {
            const sgTasks = tasks.filter(tk => tk.subGoalId === sg.id);
            const sgDone  = sgTasks.filter(tk => tk.status === "completed").length;
            const sgPct   = pct(sgDone, sgTasks.length);
            const color   = PALETTE[i % PALETTE.length];
            return (
              <View key={sg.id}>
                <TouchableOpacity
                  activeOpacity={0.65}
                  onPress={() => navigate("subGoalDetail", { subGoalId: sg.id })}
                  style={{ paddingVertical: 20, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 14 }}
                >
                  {/* Tinted icon */}
                  <View style={{
                    width: 42, height: 42, borderRadius: 10,
                    backgroundColor: color + "18",
                    alignItems: "center", justifyContent: "center",
                    borderWidth: 1, borderColor: color + "25",
                  }}>
                    <ListTodo size={18} color={color} strokeWidth={2.5} />
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: t.labelPrimary, letterSpacing: -0.2 }}>{sg.name}</Text>
                      <Text style={{ fontSize: 13, fontWeight: "900", color: color }}>{sgPct}%</Text>
                    </View>
                    <ProgressBar value={sgPct} color={color} height={5} />
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                      <Text style={{ fontSize: 12, color: t.green, fontWeight: "700" }}>✓ {sgDone}</Text>
                      <Text style={{ fontSize: 12, color: t.inkThird, fontWeight: "500" }}>○ {sgTasks.length - sgDone} left</Text>
                    </View>
                  </View>

                  <ChevronRight size={15} color={t.inkThird} strokeWidth={3} />
                </TouchableOpacity>
                {i < gSubs.length - 1 && <View style={{ height: 1, backgroundColor: t.separator, marginLeft: 74 }} />}
              </View>
            );
          })}

          {gSubs.length > 0 && <View style={{ height: 1, backgroundColor: t.separator }} />}
          <NewItemRow label="New Focus Area" onClick={() => setShowAdd(true)} />
        </View>

        {/* Action Buttons: Archive & Delete */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
          <TouchableOpacity
            onPress={() => {
              if (goal.status === "archived") {
                dispatch({ type: "UNARCHIVE_GOAL", id: goal.id });
                Alert.alert("Goal Unarchived", "This goal is now active again.");
              } else {
                dispatch({ type: "ARCHIVE_GOAL", id: goal.id });
                Alert.alert("Goal Archived", "This goal has been archived.");
                goBack();
              }
            }}
            activeOpacity={0.7}
            style={{
              flex: 1, paddingVertical: 16, borderRadius: 14,
              backgroundColor: t.isDark ? "#222228" : "#E5E5EA",
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
              borderWidth: 1.5, borderColor: t.border,
            }}
          >
            <Archive size={16} color={t.labelPrimary} strokeWidth={2.5} />
            <Text style={{ color: t.labelPrimary, fontWeight: "800", fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {goal.status === "archived" ? "Unarchive" : "Archive"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Alert.alert("Delete Goal", "Delete this goal and all its areas & tasks? This cannot be undone.", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => { dispatch({ type: "DELETE_GOAL", id: goal.id }); goBack(); } },
            ])}
            activeOpacity={0.7}
            style={{
              flex: 1, paddingVertical: 16, borderRadius: 14,
              backgroundColor: t.red + "12",
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
              borderWidth: 1.5, borderColor: t.red + "25",
            }}
          >
            <Trash2 size={16} color={t.red} strokeWidth={2.5} />
            <Text style={{ color: t.red, fontWeight: "800", fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Area sheet */}
      <Sheet title="New Focus Area" visible={showAdd} onClose={() => setShowAdd(false)}>
        <AppleInput autoFocus label="Name" icon={Layers} placeholder="e.g. Kubernetes" value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
        <AppleInput label="Description" icon={AlignLeft} placeholder="Brief description" value={form.description} onChangeText={v => setForm({ ...form, description: v })} />
        <SheetBtn onClick={add} icon={Plus}>Create Area</SheetBtn>
      </Sheet>
    </View>
  );
}
