import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { ListTodo, AlignLeft, Clock, Flag, Plus, Check, Trash2, Pencil } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../context/ThemeContext";
import { pct } from "../utils/helpers";
import ProgressRing from "../components/ui/ProgressRing";
import SegmentedControl from "../components/ui/SegmentedControl";
import PriorityChip from "../components/ui/PriorityChip";
import Sheet from "../components/ui/Sheet";
import AppleInput from "../components/ui/AppleInput";
import AppleSelect from "../components/ui/AppleSelect";
import SheetBtn from "../components/ui/SheetBtn";
import NewItemRow from "../components/ui/NewItemRow";

export default function SubGoalDetailScreen({ state, dispatch, params, goBack }) {
  const t = useTheme();
  const { subGoals, tasks } = state;
  const sg = subGoals.find(s => s.id === params.subGoalId);
  if (!sg) return null;

  const sgTasks = tasks.filter(tk => tk.subGoalId === sg.id);
  const done    = sgTasks.filter(tk => tk.status === "completed").length;
  const sgPct   = pct(done, sgTasks.length);

  const [showAdd,  setShowAdd]  = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editTask, setEditTask] = useState(null);
  
  const [form,     setForm]     = useState({ name: "", notes: "", dueDate: "", priority: "Medium" });
  const [editForm, setEditForm] = useState({ name: "", notes: "", dueDate: "", priority: "Medium" });
  const [filter,   setFilter]   = useState("all");

  // Date picker states
  const [showAddDatePicker, setShowAddDatePicker] = useState(false);
  const [addPickerDate, setAddPickerDate] = useState(new Date());

  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [editPickerDate, setEditPickerDate] = useState(new Date());

  const sorted = [...sgTasks]
    .filter(tk => filter === "all" || tk.status === filter)
    .sort((a, b) => a.status === b.status ? 0 : a.status === "completed" ? 1 : -1);

  function add() {
    if (!form.name.trim()) return;
    dispatch({ type: "ADD_TASK", task: { id: Date.now(), subGoalId: sg.id, ...form, status: "pending", completedDate: null } });
    setForm({ name: "", notes: "", dueDate: "", priority: "Medium" });
    setShowAdd(false);
  }

  function openEdit(tk) {
    setEditTask(tk);
    setEditForm({ name: tk.name, notes: tk.notes || "", dueDate: tk.dueDate || "", priority: tk.priority || "Medium" });
    if (tk.dueDate) {
      const parsedDate = new Date(tk.dueDate);
      if (!isNaN(parsedDate.getTime())) {
        setEditPickerDate(parsedDate);
      }
    }
    setShowEdit(true);
  }

  function saveEdit() {
    if (!editForm.name.trim()) return;
    dispatch({ type: "EDIT_TASK", id: editTask.id, updates: editForm });
    setShowEdit(false);
    setEditTask(null);
  }

  const handleAddDateChange = (event, selectedDate) => {
    setShowAddDatePicker(false);
    if (selectedDate) {
      setAddPickerDate(selectedDate);
      setForm({ ...form, dueDate: selectedDate.toISOString().slice(0, 10) });
    }
  };

  const handleEditDateChange = (event, selectedDate) => {
    setShowEditDatePicker(false);
    if (selectedDate) {
      setEditPickerDate(selectedDate);
      setEditForm({ ...editForm, dueDate: selectedDate.toISOString().slice(0, 10) });
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero card ── */}
      <View style={[{
        backgroundColor: t.isDark ? "#16161A" : "#FFFFFF",
        borderRadius: 16, padding: 22, marginBottom: 16,
        borderWidth: 1.5, borderColor: t.border,
        flexDirection: "row", alignItems: "center", gap: 20,
      }, t.shadow]}>
        {/* Ring */}
        <View style={{ position: "relative" }}>
          <ProgressRing value={sgPct} size={80} stroke={7} color={t.green} />
          <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 17, fontWeight: "900", color: t.labelPrimary, letterSpacing: -0.5 }}>{sgPct}%</Text>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          {sg.description ? (
            <Text style={{ fontSize: 13, color: t.inkThird, marginBottom: 14, lineHeight: 19, fontWeight: "500" }}>{sg.description}</Text>
          ) : null}
          <View style={{ flexDirection: "row", gap: 0 }}>
            {[
              { v: sgTasks.length, l: "Tasks", c: t.labelPrimary },
              { v: done,           l: "Done",  c: t.green },
              { v: sgTasks.length - done, l: "Left",  c: t.amber },
            ].map(({ v, l, c }, i) => (
              <React.Fragment key={l}>
                {i > 0 && <View style={{ width: 1, backgroundColor: t.separator, marginHorizontal: 16 }} />}
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 22, fontWeight: "900", color: c, letterSpacing: -1 }}>{v}</Text>
                  <Text style={{ fontSize: 10, color: t.inkThird, fontWeight: "800", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{l}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>

      {/* Filter Segmented Control */}
      <SegmentedControl
        options={[
          { label: "All Tasks", value: "all" },
          { label: "Pending",   value: "pending" },
          { label: "Completed", value: "completed" },
        ]}
        value={filter}
        onChange={setFilter}
      />

      {/* ── Tasks ── */}
      <View style={[{
        backgroundColor: t.isDark ? "#16161A" : "#FFFFFF",
        borderRadius: 16, overflow: "hidden",
        borderWidth: 1.5, borderColor: t.border,
      }, t.shadow]}>
        {sorted.map((tk, i) => {
          const isCompleted = tk.status === "completed";
          return (
            <View key={tk.id}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => dispatch({ type: "TOGGLE_TASK", id: tk.id })}
                style={{ paddingVertical: 18, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 14, opacity: isCompleted ? 0.65 : 1 }}
              >
                {/* Circle Checkbox */}
                <View style={{
                  width: 24, height: 24, borderRadius: 12,
                  borderWidth: 2,
                  borderColor: isCompleted ? t.green : t.border,
                  backgroundColor: isCompleted ? t.green : "transparent",
                  alignItems: "center", justifyContent: "center",
                }}>
                  {isCompleted && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                </View>

                {/* Details */}
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 15,
                    fontWeight: isCompleted ? "600" : "800",
                    color: isCompleted ? t.inkThird : t.labelPrimary,
                    textDecorationLine: isCompleted ? "line-through" : "none",
                    letterSpacing: -0.2,
                  }}>{tk.name}</Text>
                  {tk.notes ? (
                    <Text style={{ fontSize: 12, color: t.inkThird, marginTop: 4, lineHeight: 16 }}>{tk.notes}</Text>
                  ) : null}

                  <View style={{ flexDirection: "row", gap: 10, alignItems: "center", marginTop: 8 }}>
                    <PriorityChip priority={tk.priority} />
                    {tk.dueDate ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Clock size={11} color={t.inkThird} />
                        <Text style={{ fontSize: 11, color: t.inkThird, fontWeight: "600" }}>{tk.dueDate}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Actions */}
                <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                  <TouchableOpacity
                    onPress={() => openEdit(tk)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                    style={{ padding: 6, borderRadius: 8 }}
                  >
                    <Pencil size={15} color={t.inkThird} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => dispatch({ type: "DELETE_TASK", id: tk.id })}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                    style={{ padding: 6, borderRadius: 8 }}
                  >
                    <Trash2 size={15} color={t.red} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              {i < sorted.length - 1 && (
                <View style={{ height: 1, backgroundColor: t.separator, marginLeft: 60 }} />
              )}
            </View>
          );
        })}

        <View style={{ height: 1, backgroundColor: t.separator }} />
        <NewItemRow label="New Task" onClick={() => setShowAdd(true)} />
      </View>

      {/* ── Sheets ── */}
      <Sheet title="New Task" visible={showAdd} onClose={() => setShowAdd(false)}>
        <AppleInput autoFocus label="Task Name" icon={ListTodo} placeholder="e.g. Learn Helm" value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
        <AppleInput label="Notes" icon={AlignLeft} placeholder="Optional details" value={form.notes} onChangeText={v => setForm({ ...form, notes: v })} />
        
        {/* Date Picker for Task Due Date */}
        <Text style={{ fontSize: 11, fontWeight: "800", color: t.inkThird, marginBottom: 8, paddingLeft: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>
          Due Date
        </Text>
        {Platform.OS === "ios" ? (
          <View style={{
            backgroundColor: t.isDark ? "#222228" : "#FFFFFF",
            borderRadius: 14, borderWidth: 1.5, borderColor: t.border,
            padding: 10, alignItems: "center", marginBottom: 16
          }}>
            <DateTimePicker
              value={addPickerDate}
              mode="date"
              display="default"
              themeVariant={t.isDark ? "dark" : "light"}
              onChange={(event, d) => {
                if (d) {
                  setAddPickerDate(d);
                  setForm({ ...form, dueDate: d.toISOString().slice(0, 10) });
                }
              }}
            />
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowAddDatePicker(true)}
            activeOpacity={0.8}
            style={{
              backgroundColor: t.isDark ? "#222228" : "#FFFFFF",
              borderRadius: 14, borderWidth: 1.5, borderColor: t.border,
              paddingVertical: 15, paddingHorizontal: 16, marginBottom: 16,
              flexDirection: "row", alignItems: "center", gap: 10
            }}
          >
            <Clock size={16} color={t.labelSecondary} strokeWidth={2.5} />
            <Text style={{ fontSize: 15, fontWeight: "600", color: form.dueDate ? t.labelPrimary : t.inkThird }}>
              {form.dueDate || "Select Due Date"}
            </Text>
          </TouchableOpacity>
        )}

        {showAddDatePicker && Platform.OS !== "ios" && (
          <DateTimePicker
            value={addPickerDate}
            mode="date"
            display="default"
            onChange={handleAddDateChange}
          />
        )}

        <AppleSelect label="Priority" icon={Flag} value={form.priority} options={["Low", "Medium", "High"]} onChange={val => setForm({ ...form, priority: val })} />
        <SheetBtn onClick={add} icon={Plus}>Add Task</SheetBtn>
      </Sheet>

      <Sheet title="Edit Task" visible={showEdit} onClose={() => { setShowEdit(false); setEditTask(null); }}>
        <AppleInput autoFocus label="Task Name" icon={ListTodo} placeholder="Task name" value={editForm.name} onChangeText={v => setEditForm({ ...editForm, name: v })} />
        <AppleInput label="Notes" icon={AlignLeft} placeholder="Optional details" value={editForm.notes} onChangeText={v => setEditForm({ ...editForm, notes: v })} />
        
        {/* Date Picker for Edit Task Due Date */}
        <Text style={{ fontSize: 11, fontWeight: "800", color: t.inkThird, marginBottom: 8, paddingLeft: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>
          Due Date
        </Text>
        {Platform.OS === "ios" ? (
          <View style={{
            backgroundColor: t.isDark ? "#222228" : "#FFFFFF",
            borderRadius: 14, borderWidth: 1.5, borderColor: t.border,
            padding: 10, alignItems: "center", marginBottom: 16
          }}>
            <DateTimePicker
              value={editPickerDate}
              mode="date"
              display="default"
              themeVariant={t.isDark ? "dark" : "light"}
              onChange={(event, d) => {
                if (d) {
                  setEditPickerDate(d);
                  setEditForm({ ...editForm, dueDate: d.toISOString().slice(0, 10) });
                }
              }}
            />
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowEditDatePicker(true)}
            activeOpacity={0.8}
            style={{
              backgroundColor: t.isDark ? "#222228" : "#FFFFFF",
              borderRadius: 14, borderWidth: 1.5, borderColor: t.border,
              paddingVertical: 15, paddingHorizontal: 16, marginBottom: 16,
              flexDirection: "row", alignItems: "center", gap: 10
            }}
          >
            <Clock size={16} color={t.labelSecondary} strokeWidth={2.5} />
            <Text style={{ fontSize: 15, fontWeight: "600", color: editForm.dueDate ? t.labelPrimary : t.inkThird }}>
              {editForm.dueDate || "Select Due Date"}
            </Text>
          </TouchableOpacity>
        )}

        {showEditDatePicker && Platform.OS !== "ios" && (
          <DateTimePicker
            value={editPickerDate}
            mode="date"
            display="default"
            onChange={handleEditDateChange}
          />
        )}

        <AppleSelect label="Priority" icon={Flag} value={editForm.priority} options={["Low", "Medium", "High"]} onChange={val => setEditForm({ ...editForm, priority: val })} />
        <SheetBtn onClick={saveEdit} icon={Check}>Save Changes</SheetBtn>
      </Sheet>

      {/* ── Delete ── */}
      <TouchableOpacity
        onPress={() => Alert.alert("Delete Focus Area", "Delete this area and all its tasks? This cannot be undone.", [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => { dispatch({ type: "DELETE_SUBGOAL", id: sg.id }); goBack(); } },
        ])}
        style={{
          marginTop: 20, padding: 18, borderRadius: 14,
          backgroundColor: t.red + "12",
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
          borderWidth: 1.5, borderColor: t.red + "25",
        }}
      >
        <Trash2 size={16} color={t.red} strokeWidth={2.5} />
        <Text style={{ color: t.red, fontWeight: "800", fontSize: 15, textTransform: "uppercase", letterSpacing: 0.5 }}>Delete Focus Area</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
