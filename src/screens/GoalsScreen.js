import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Platform } from "react-native";
import { Target, AlignLeft, CalendarDays, Plus, ChevronRight, Archive } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../context/ThemeContext";
import { pct } from "../utils/helpers";
import SectionHeader from "../components/ui/SectionHeader";
import ProgressBar from "../components/ui/ProgressBar";
import Sheet from "../components/ui/Sheet";
import AppleInput from "../components/ui/AppleInput";
import SheetBtn from "../components/ui/SheetBtn";
import NewItemRow from "../components/ui/NewItemRow";
import SegmentedControl from "../components/ui/SegmentedControl";

export default function GoalsScreen({ state, dispatch, navigate }) {
  const t = useTheme();
  const { goals, subGoals, tasks } = state;
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", targetDate: "" });
  const [viewMode, setViewMode] = useState("active");

  // DatePicker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  const PALETTE = [t.blue, t.green, t.red, t.amber, t.indigo];

  function stats(g) {
    const subs = subGoals.filter(s => s.goalId === g.id);
    const ts   = tasks.filter(tk => subs.some(s => s.id === tk.subGoalId));
    const done = ts.filter(tk => tk.status === "completed").length;
    return { subs: subs.length, total: ts.length, done, p: pct(done, ts.length) };
  }

  function add() {
    if (!form.name.trim()) return;
    dispatch({ type: "ADD_GOAL", goal: { id: Date.now(), ...form, status: "active", createdDate: new Date().toISOString().slice(0, 10) } });
    setForm({ name: "", description: "", targetDate: "" });
    setShowAdd(false);
  }

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setPickerDate(selectedDate);
      const formatted = selectedDate.toISOString().slice(0, 10);
      setForm({ ...form, targetDate: formatted });
    }
  };

  const filteredGoals = goals.filter(g => {
    if (viewMode === "archived") return g.status === "archived";
    return g.status !== "archived";
  });

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <SegmentedControl
        options={[
          { label: "Active Goals", value: "active" },
          { label: "Archived", value: "archived" },
        ]}
        value={viewMode}
        onChange={setViewMode}
      />

      <SectionHeader>{viewMode === "archived" ? "Archived Goals" : "Active Goals"}</SectionHeader>

      <View style={[{
        backgroundColor: t.isDark ? "#16161A" : "#FFFFFF",
        borderRadius: 16, overflow: "hidden",
        borderWidth: 1.5, borderColor: t.border,
        marginBottom: 10,
      }, t.shadow]}>
        {filteredGoals.map((g, i) => {
          const s     = stats(g);
          const color = PALETTE[i % PALETTE.length];
          return (
            <View key={g.id}>
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={() => navigate("goalDetail", { goalId: g.id })}
                style={{ paddingVertical: 20, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 14 }}
              >
                <View style={{
                  width: 46, height: 46, borderRadius: 12,
                  backgroundColor: viewMode === "archived" ? t.inkThird + "18" : color + "18",
                  alignItems: "center", justifyContent: "center",
                  borderWidth: 1, borderColor: viewMode === "archived" ? t.inkThird + "25" : color + "25",
                }}>
                  {viewMode === "archived" ? (
                    <Archive size={20} color={t.inkThird} strokeWidth={2.5} />
                  ) : (
                    <Target size={20} color={color} strokeWidth={2.5} />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: t.labelPrimary, letterSpacing: -0.3 }}>{g.name}</Text>
                    <Text style={{ fontSize: 13, fontWeight: "900", color: viewMode === "archived" ? t.inkThird : color }}>{s.p}%</Text>
                  </View>
                  {g.description ? (
                    <Text numberOfLines={1} style={{ fontSize: 13, color: t.inkThird, marginBottom: 8, lineHeight: 18, fontWeight: "500" }}>{g.description}</Text>
                  ) : null}
                  <ProgressBar value={s.p} color={viewMode === "archived" ? t.inkThird : color} height={5} />
                  <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                    <Text style={{ fontSize: 12, color: t.inkThird, fontWeight: "500" }}>{s.subs} areas</Text>
                    <Text style={{ fontSize: 12, color: t.green, fontWeight: "700" }}>✓ {s.done}</Text>
                    <Text style={{ fontSize: 12, color: t.inkThird, fontWeight: "500" }}>○ {s.total - s.done} left</Text>
                    {g.targetDate ? <Text style={{ fontSize: 11, color: t.inkThird, marginLeft: "auto", fontWeight: "700" }}>{g.targetDate}</Text> : null}
                  </View>
                </View>

                <ChevronRight size={15} color={t.inkThird} strokeWidth={3} />
              </TouchableOpacity>
              {i < filteredGoals.length - 1 && <View style={{ height: 1, backgroundColor: t.separator, marginLeft: 78 }} />}
            </View>
          );
        })}

        {filteredGoals.length === 0 && (
          <View style={{ paddingVertical: 32, alignItems: "center" }}>
            <Text style={{ color: t.inkThird, fontSize: 14, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {viewMode === "archived" ? "No archived goals" : "No active goals"}
            </Text>
          </View>
        )}

        {viewMode === "active" && (
          <>
            {filteredGoals.length > 0 && <View style={{ height: 1, backgroundColor: t.separator }} />}
            <NewItemRow label="New Goal" onClick={() => setShowAdd(true)} />
          </>
        )}
      </View>

      {/* Add sheet */}
      <Sheet title="New Goal" visible={showAdd} onClose={() => setShowAdd(false)}>
        <AppleInput autoFocus label="Goal Name" icon={Target} placeholder="e.g. Career Growth" value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
        <AppleInput label="Description" icon={AlignLeft} placeholder="What are you working towards?" value={form.description} onChangeText={v => setForm({ ...form, description: v })} />
        
        {/* Date Picker instead of Text Input */}
        <Text style={{ fontSize: 11, fontWeight: "800", color: t.inkThird, marginBottom: 8, paddingLeft: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>
          Target Date
        </Text>
        {Platform.OS === "ios" ? (
          <View style={{
            backgroundColor: t.isDark ? "#222228" : "#FFFFFF",
            borderRadius: 14, borderWidth: 1.5, borderColor: t.border,
            padding: 10, alignItems: "center", marginBottom: 16
          }}>
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="default"
              themeVariant={t.isDark ? "dark" : "light"}
              onChange={(event, d) => {
                if (d) {
                  setPickerDate(d);
                  setForm({ ...form, targetDate: d.toISOString().slice(0, 10) });
                }
              }}
            />
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
            style={{
              backgroundColor: t.isDark ? "#222228" : "#FFFFFF",
              borderRadius: 14, borderWidth: 1.5, borderColor: t.border,
              paddingVertical: 15, paddingHorizontal: 16, marginBottom: 16,
              flexDirection: "row", alignItems: "center", gap: 10
            }}
          >
            <CalendarDays size={16} color={t.labelSecondary} strokeWidth={2.5} />
            <Text style={{ fontSize: 15, fontWeight: "600", color: form.targetDate ? t.labelPrimary : t.inkThird }}>
              {form.targetDate || "Select Target Date"}
            </Text>
          </TouchableOpacity>
        )}

        {showDatePicker && Platform.OS !== "ios" && (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <SheetBtn onClick={add} icon={Plus}>Create Goal</SheetBtn>
      </Sheet>
    </ScrollView>
  );
}
