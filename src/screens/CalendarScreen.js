import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { CalendarDays, ChevronLeft, ChevronRight, Target, CheckCircle2, ListTodo } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import SectionHeader from "../components/ui/SectionHeader";
import GroupCard from "../components/ui/GroupCard";

export default function CalendarScreen({ state }) {
  const t = useTheme();
  const now = new Date();
  const [year, setYear]     = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth());
  const [selected, setSelected] = useState(null);
  const { goals, tasks } = state;

  const monthName = new Date(year, month).toLocaleString("default", { month: "long" });
  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMo  = new Date(year, month + 1, 0).getDate();

  const eventDates = useMemo(() => {
    const map = {};
    const pfx = `${year}-${String(month + 1).padStart(2, "0")}`;
    goals.forEach(g => {
      if (g.targetDate?.startsWith(pfx)) {
        const d = parseInt(g.targetDate.slice(8));
        map[d] = [...(map[d] || []), { type: "goal", name: g.name }];
      }
    });
    tasks.forEach(tk => {
      if (tk.dueDate?.startsWith(pfx)) {
        const d = parseInt(tk.dueDate.slice(8));
        map[d] = [...(map[d] || []), { type: "task", name: tk.name, status: tk.status }];
      }
    });
    return map;
  }, [year, month, goals, tasks]);

  const cells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDay; i++) arr.push({ blank: true, key: `b${i}` });
    for (let d = 1; d <= daysInMo; d++) arr.push({ blank: false, day: d, key: `d${d}` });
    return arr;
  }, [firstDay, daysInMo]);

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[{
        backgroundColor: t.isDark ? "#16161A" : "#FFFFFF",
        borderRadius: 16, padding: 18, marginBottom: 16,
        borderWidth: 1.5, borderColor: t.border,
      }, t.shadow]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity
            onPress={prevMonth}
            activeOpacity={0.7}
            style={{
              backgroundColor: t.isDark ? "#222228" : "#E4ECE7",
              borderRadius: 12, width: 34, height: 34,
              alignItems: "center", justifyContent: "center",
              borderWidth: 1, borderColor: t.border,
            }}
          >
            <ChevronLeft size={16} color={t.labelPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <CalendarDays size={16} color={t.blue} strokeWidth={2.5} />
            <Text style={{ fontSize: 15, fontWeight: "900", color: t.labelPrimary, textTransform: "uppercase", letterSpacing: 0.8 }}>{monthName} {year}</Text>
          </View>
          <TouchableOpacity
            onPress={nextMonth}
            activeOpacity={0.7}
            style={{
              backgroundColor: t.isDark ? "#222228" : "#E4ECE7",
              borderRadius: 12, width: 34, height: 34,
              alignItems: "center", justifyContent: "center",
              borderWidth: 1, borderColor: t.border,
            }}
          >
            <ChevronRight size={16} color={t.labelPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: t.inkThird, letterSpacing: 0.5 }}>{d}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {cells.map(cell => {
            if (cell.blank) return <View key={cell.key} style={{ width: "14.28%", height: 42 }} />;
            const d = cell.day;
            const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
            const hasDot  = !!eventDates[d];
            const isSel   = selected === d;
            return (
              <TouchableOpacity
                key={cell.key}
                onPress={() => setSelected(isSel ? null : d)}
                activeOpacity={0.8}
                style={{
                  width: "14.28%", alignItems: "center", paddingVertical: 10, borderRadius: 10,
                  backgroundColor: isSel ? t.blue : "transparent",
                }}
              >
                <Text style={{
                  fontSize: 15,
                  fontWeight: isToday || isSel ? "900" : "600",
                  color: isSel ? "#FFFFFF" : isToday ? t.blue : t.labelPrimary,
                }}>{d}</Text>
                {hasDot && (
                  <View style={{
                    width: 5, height: 5, borderRadius: 2.5,
                    backgroundColor: isSel ? "#FFFFFF" : t.blue,
                    marginTop: 3,
                  }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {selected && (
        <View>
          <SectionHeader>{monthName} {selected}</SectionHeader>
          {(eventDates[selected] || []).length === 0 ? (
            <GroupCard>
              <View style={{ paddingVertical: 32, alignItems: "center", gap: 10 }}>
                <View style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: t.isDark ? "#222228" : "#E4ECE7", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: t.border }}>
                  <CalendarDays size={22} color={t.blue} strokeWidth={2.5} />
                </View>
                <Text style={{ color: t.labelPrimary, fontSize: 14, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Nothing scheduled</Text>
              </View>
            </GroupCard>
          ) : (
            <GroupCard>
              {(eventDates[selected] || []).map((ev, i, arr) => (
                <View key={i}>
                  <View style={{ paddingVertical: 16, paddingHorizontal: 18, flexDirection: "row", gap: 14, alignItems: "center" }}>
                    <View style={{
                      width: 38, height: 38, borderRadius: 10,
                      backgroundColor: ev.type === "goal" ? t.red + "15" : t.blue + "15",
                      alignItems: "center", justifyContent: "center",
                      borderWidth: 1, borderColor: ev.type === "goal" ? t.red + "25" : t.blue + "25",
                    }}>
                      {ev.type === "goal" ? (
                        <Target size={16} color={t.red} strokeWidth={2.5} />
                      ) : ev.status === "completed" ? (
                        <CheckCircle2 size={16} color={t.green} strokeWidth={2.5} />
                      ) : (
                        <ListTodo size={16} color={t.blue} strokeWidth={2.5} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: t.labelPrimary }}>{ev.name}</Text>
                      <Text style={{ fontSize: 12, color: t.inkThird, marginTop: 2, fontWeight: "500" }}>{ev.type === "goal" ? "Goal deadline" : "Task due"}</Text>
                    </View>
                  </View>
                  {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: t.separator, marginLeft: 70 }} />}
                </View>
              ))}
            </GroupCard>
          )}
        </View>
      )}
    </ScrollView>
  );
}
