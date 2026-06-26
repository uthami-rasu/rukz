import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity,
  SafeAreaView, Platform, Alert, BackHandler,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts, Caveat_400Regular, Caveat_700Bold } from "@expo-google-fonts/caveat";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import * as XLSX from "xlsx";
import { ChevronLeft, Sun, Moon, Share2, Download, Upload, User } from "lucide-react-native";

// Context & theme
import { ThemeCtx, makeTheme } from "./src/context/ThemeContext";

// Storage & state
import { SEED, loadLocalData, saveLocalData } from "./src/storage/db";
import { reducer } from "./src/storage/reducer";

// Navigation config
import { TABS, TAB_TITLES } from "./src/navigation/config";

// Shared UI atoms
import { FullSep } from "./src/components/ui/Separators";
import SectionHeader from "./src/components/ui/SectionHeader";
import GroupCard from "./src/components/ui/GroupCard";
import Sheet from "./src/components/ui/Sheet";
import Chevron from "./src/components/ui/Chevron";

// Screens
import DashboardScreen    from "./src/screens/DashboardScreen";
import GoalsScreen        from "./src/screens/GoalsScreen";
import GoalDetailScreen   from "./src/screens/GoalDetailScreen";
import SubGoalDetailScreen from "./src/screens/SubGoalDetailScreen";
import SearchScreen       from "./src/screens/SearchScreen";
import CalendarScreen     from "./src/screens/CalendarScreen";
import StatisticsScreen   from "./src/screens/StatisticsScreen";

export default function App() {
  const [fontsLoaded] = useFonts({ Caveat_400Regular, Caveat_700Bold });
  const [dark, setDark]           = useState(true);
  const theme                     = makeTheme(dark);
  const [appState, setAppState]   = useState(SEED);
  const [tab, setTab]             = useState("dashboard");
  const [stack, setStack]         = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadLocalData().then(data => setAppState(data));
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (stack.length > 0) { goBack(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [stack]);

  const dispatch = action => {
    setAppState(s => {
      const next = reducer(s, action);
      saveLocalData(next);
      return next;
    });
  };

  const navigate = (screen, params = {}) => setStack(s => [...s, { screen, params }]);
  const goBack   = ()                    => setStack(s => s.slice(0, -1));
  const current  = stack[stack.length - 1];

  const headerTitle = current
    ? current.screen === "goalDetail"
      ? (appState.goals.find(g => g.id === current.params?.goalId)?.name || "Goal")
      : current.screen === "subGoalDetail"
        ? (appState.subGoals.find(s => s.id === current.params?.subGoalId)?.name || "Area")
        : ""
    : TAB_TITLES[tab];

  // ── File operations ──────────────────────────────────────────

  const handleExport = async () => {
    try {
      const jsonString = JSON.stringify(appState, null, 2);
      if (Platform.OS === "web") {
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "rukz_backup.json";
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      } else {
        const fileUri = `${FileSystem.documentDirectory}productivity_backup.json`;
        await FileSystem.writeAsStringAsync(fileUri, jsonString, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { mimeType: "application/json", dialogTitle: "Export Productivity Backup", UTI: "public.json" });
        } else Alert.alert("Error", "Sharing is not available on this device.");
      }
    } catch (e) { console.error(e); Alert.alert("Error", "Could not export database backup."); }
  };

  const handleImport = async () => {
    Alert.alert("Confirm Import", "This will replace all your current data on this phone. Do you want to proceed?", [
      { text: "Cancel", style: "cancel" },
      { text: "Import & Overwrite", style: "destructive", onPress: async () => {
        try {
          const result = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true });
          if (result.canceled || !result.assets?.length) return;
          const pickedFile = result.assets[0];
          let content;
          if (Platform.OS === "web") {
            content = pickedFile.file
              ? await new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.onerror = rej; r.readAsText(pickedFile.file); })
              : await (await fetch(pickedFile.uri)).text();
          } else {
            content = await FileSystem.readAsStringAsync(pickedFile.uri, { encoding: FileSystem.EncodingType.UTF8 });
          }
          const parsed = JSON.parse(content);
          if (parsed.goals && parsed.subGoals && parsed.tasks) {
            dispatch({ type: "SET_STATE", state: parsed });
            setShowSettings(false);
            Alert.alert("Success", "Data imported successfully.");
          } else Alert.alert("Error", "Invalid backup file structure.");
        } catch (e) { console.error(e); Alert.alert("Error", "Could not read backup file."); }
      }},
    ]);
  };

  const handleExcelImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/csv"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const pickedFile = result.assets[0];
      let workbook;
      if (Platform.OS === "web") {
        const ab = pickedFile.file
          ? await new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.onerror = rej; r.readAsArrayBuffer(pickedFile.file); })
          : await (await fetch(pickedFile.uri)).arrayBuffer();
        workbook = XLSX.read(ab, { type: "array" });
      } else {
        const b64 = await FileSystem.readAsStringAsync(pickedFile.uri, { encoding: FileSystem.EncodingType.Base64 });
        workbook = XLSX.read(b64, { type: "base64" });
      }
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      if (!rows.length) { Alert.alert("Import Error", "The selected file contains no data rows."); return; }

      let tempGoals = [...appState.goals], tempSubGoals = [...appState.subGoals], tempTasks = [...appState.tasks];
      const gid = () => Date.now() + Math.random();
      let ga = 0, sa = 0, ta = 0;

      rows.forEach(row => {
        const goalName   = row["Goal Name"] || row["GoalName"] || row["goal_name"] || row["Goal"];
        if (!goalName) return;
        const goalDesc   = row["Goal Description"] || row["GoalDescription"] || row["goal_description"] || "";
        const goalTarget = row["Goal Target Date"] || row["GoalTargetDate"] || row["goal_target_date"] || "";
        const areaName   = row["Area Name"] || row["AreaName"] || row["area_name"] || row["Area"] || row["Focus Area"] || row["FocusArea"];
        const areaDesc   = row["Area Description"] || row["AreaDescription"] || row["area_description"] || "";
        const taskName   = row["Task Name"] || row["TaskName"] || row["task_name"] || row["Task"];
        const taskNotes  = row["Task Notes"] || row["TaskNotes"] || row["task_notes"] || "";
        const taskDue    = row["Task Due Date"] || row["TaskDueDate"] || row["task_due_date"] || "";
        const taskPri    = row["Task Priority"] || row["TaskPriority"] || row["task_priority"] || "Medium";

        let goal = tempGoals.find(g => g.name.trim().toLowerCase() === goalName.trim().toLowerCase());
        if (!goal) { goal = { id: gid(), name: goalName.trim(), description: goalDesc.trim(), targetDate: goalTarget.trim(), status: "active", createdDate: new Date().toISOString().slice(0, 10) }; tempGoals.push(goal); ga++; }

        let subGoal = null;
        if (areaName) {
          subGoal = tempSubGoals.find(s => s.goalId === goal.id && s.name.trim().toLowerCase() === areaName.trim().toLowerCase());
          if (!subGoal) { subGoal = { id: gid(), goalId: goal.id, name: areaName.trim(), description: areaDesc.trim() }; tempSubGoals.push(subGoal); sa++; }
        }
        if (taskName && subGoal) {
          tempTasks.push({ id: gid(), subGoalId: subGoal.id, name: taskName.trim(), notes: taskNotes.trim(), dueDate: taskDue.trim(), priority: ["High", "Medium", "Low"].includes(taskPri.trim()) ? taskPri.trim() : "Medium", status: "pending", completedDate: null });
          ta++;
        }
      });

      dispatch({ type: "SET_STATE", state: { goals: tempGoals, subGoals: tempSubGoals, tasks: tempTasks } });
      setShowSettings(false);
      Alert.alert("Import Complete", `Added:\n- ${ga} new Goal(s)\n- ${sa} new Focus Area(s)\n- ${ta} new Task(s)`);
    } catch (e) { console.error(e); Alert.alert("Import Error", "Failed to parse the Excel file."); }
  };

  const handleDownloadTemplate = async () => {
    try {
      const csv =
        "Goal Name,Goal Description,Goal Target Date,Area Name,Area Description,Task Name,Task Notes,Task Due Date,Task Priority\n" +
        "Health & Fitness,Improve cardiovascular health and strength,2026-12-31,Cardio training,Running and HIIT,Morning Run,5km outdoor jog,2026-07-01,Medium\n" +
        "Career Development,Learn cloud native technologies,2026-12-31,Kubernetes Mastery,Get certified,Read Kubernetes Docs,Study Pod lifecycle,2026-07-10,Medium";
      if (Platform.OS === "web") {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "goals_template.csv";
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      } else {
        const fileUri = `${FileSystem.documentDirectory}goals_template.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { mimeType: "text/csv", dialogTitle: "Download Goals Template", UTI: "public.comma-separated-values-text" });
        } else Alert.alert("Error", "Sharing is not available on this device.");
      }
    } catch (e) { console.error(e); Alert.alert("Error", "Could not download template."); }
  };

  // ── Screen router ────────────────────────────────────────────

  function renderScreen() {
    if (current) {
      if (current.screen === "goalDetail")
        return <GoalDetailScreen state={appState} dispatch={dispatch} params={current.params} navigate={navigate} goBack={goBack} />;
      if (current.screen === "subGoalDetail")
        return <SubGoalDetailScreen state={appState} dispatch={dispatch} params={current.params} goBack={goBack} navigate={navigate} />;
    }
    switch (tab) {
      case "dashboard": return <DashboardScreen state={appState} setTab={setTab} setShowSettings={setShowSettings} handleDownloadTemplate={handleDownloadTemplate} navigate={navigate} />;
      case "goals":     return <GoalsScreen     state={appState} dispatch={dispatch} navigate={navigate} />;
      case "search":    return <SearchScreen    state={appState} navigate={navigate} />;
      case "calendar":  return <CalendarScreen  state={appState} />;
      case "stats":     return <StatisticsScreen state={appState} />;
    }
  }

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  return (
    <ThemeCtx.Provider value={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <StatusBar style={dark ? "light" : "dark"} />

        {/* Header */}
        <View style={{
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}>
          {current && (
            <TouchableOpacity
              onPress={goBack}
              activeOpacity={0.7}
              style={[{
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: theme.isDark ? "#222228" : "#FFFFFF",
                alignItems: "center", justifyContent: "center",
                borderWidth: theme.isDark ? 0.5 : 1.5,
                borderColor: theme.border,
              }, theme.shadow]}
            >
              <ChevronLeft size={18} color={theme.labelPrimary} strokeWidth={3} />
            </TouchableOpacity>
          )}
          <Text numberOfLines={1} style={{
            fontSize: headerTitle === "Rukz" ? 38 : 22,
            fontWeight: "900",
            color: theme.labelPrimary,
            flex: 1,
            letterSpacing: headerTitle === "Rukz" ? 0 : 1.5,
            fontFamily: headerTitle === "Rukz" ? "Caveat_700Bold" : undefined,
            textTransform: headerTitle === "Rukz" ? "none" : "uppercase",
          }}>
            {headerTitle}
          </Text>
          {!current && (
            <TouchableOpacity
              onPress={() => setShowSettings(true)}
              activeOpacity={0.7}
              style={[{
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: theme.isDark ? "#222228" : "#FFFFFF",
                alignItems: "center", justifyContent: "center",
                borderWidth: theme.isDark ? 0.5 : 1.5,
                borderColor: theme.border,
              }, theme.shadow]}
            >
              <User size={16} color={theme.labelPrimary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <View style={{ flex: 1, backgroundColor: theme.groupedBg }}>
          <View style={{ flex: 1, paddingTop: 8 }}>{renderScreen()}</View>
        </View>

        {/* Tab Bar */}
        {!current && (
          <View style={{
            backgroundColor: dark ? "rgba(22,22,24,0.97)" : "rgba(250,250,252,0.97)",
            borderTopWidth: 0.5,
            borderTopColor: theme.separator,
            paddingTop: 10,
            paddingBottom: 6,
            flexDirection: "row",
          }}>
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => { setTab(id); setStack([]); }}
                  activeOpacity={0.7}
                  style={{ flex: 1, alignItems: "center", gap: 4, paddingVertical: 2 }}
                >
                  {/* Icon with active pill background */}
                  <View style={{
                    width: 48, height: 30, borderRadius: 15,
                    backgroundColor: active
                      ? (dark ? theme.blue + "22" : theme.blue + "18")
                      : "transparent",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon
                      size={21}
                      color={active ? theme.blue : theme.inkThird}
                      strokeWidth={active ? 2.2 : 1.6}
                    />
                  </View>
                  <Text style={{
                    fontSize: 10,
                    fontWeight: active ? "700" : "400",
                    color: active ? theme.blue : theme.inkThird,
                    letterSpacing: active ? 0.1 : 0,
                  }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Settings Sheet */}
        <Sheet title="Settings & Sync" visible={showSettings} onClose={() => setShowSettings(false)}>
          <View style={{ gap: 16 }}>
            <SectionHeader>Theme Preferences</SectionHeader>
            <GroupCard>
              <TouchableOpacity onPress={() => setDark(!dark)} style={{ padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  {dark ? <Sun size={18} color={theme.amber} /> : <Moon size={18} color={theme.indigo} />}
                  <Text style={{ fontSize: 16, color: theme.labelPrimary }}>{dark ? "Light Mode" : "Dark Mode"}</Text>
                </View>
                <Chevron />
              </TouchableOpacity>
            </GroupCard>

            <SectionHeader>Backup & Data Migration</SectionHeader>
            <Text style={{ fontSize: 13, color: theme.inkThird, lineHeight: 18, paddingHorizontal: 4 }}>
              Since this app is entirely backend-free, your data is saved only on this phone. Export your data to transfer it to another device or save a backup.
            </Text>
            <GroupCard>
              {[
                { label: "Export Data",          sub: "Save or share your backup JSON file",        icon: Share2,   color: theme.blue,   onPress: handleExport         },
                { label: "Import JSON",           sub: "Restore or sync data from a JSON file",     icon: Download, color: theme.green,  onPress: handleImport         },
                { label: "Upload Excel / CSV",    sub: "Bulk import goals, areas, and tasks",       icon: Upload,   color: theme.indigo, onPress: handleExcelImport    },
                { label: "Download CSV Template", sub: "Get the sample structure for bulk uploads", icon: Download, color: theme.amber,  onPress: handleDownloadTemplate },
              ].map(({ label, sub, icon: Icon, color, onPress }, idx, arr) => (
                <React.Fragment key={label}>
                  <TouchableOpacity onPress={onPress} style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: color + "20", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={16} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, color: theme.labelPrimary, fontWeight: "500" }}>{label}</Text>
                      <Text style={{ fontSize: 12, color: theme.inkThird, marginTop: 2 }}>{sub}</Text>
                    </View>
                    <Chevron />
                  </TouchableOpacity>
                  {idx < arr.length - 1 && <FullSep />}
                </React.Fragment>
              ))}
            </GroupCard>

            <View style={{ alignItems: "center", marginTop: 20 }}>
              <Text style={{ fontSize: 11, color: theme.inkThird }}>Rukz · v1.0.0</Text>
            </View>
          </View>
        </Sheet>
      </SafeAreaView>
    </ThemeCtx.Provider>
  );
}
