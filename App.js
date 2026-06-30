import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity,
  Platform, Alert, BackHandler, Linking, LogBox,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Caveat_400Regular, Caveat_700Bold } from "@expo-google-fonts/caveat";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import * as XLSX from "xlsx";
import { ChevronLeft, Sun, Moon, Share2, Download, Upload, User } from "lucide-react-native";
import * as Notifications from "expo-notifications";
import { useShareIntent } from "expo-share-intent";
import { formatDateString } from "./src/utils/helpers";

// Suppress hardcoded Expo Go notifications warnings in console
LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
  "`expo-notifications` functionality is not fully supported in Expo Go",
]);

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
import WatchLaterScreen   from "./src/screens/WatchLaterScreen";
import StatisticsScreen   from "./src/screens/StatisticsScreen";

// Register Notification Categories (Snooze & Turn Off actions)
if (Platform.OS !== "web") {
  Notifications.setNotificationCategoryAsync("watch-later-reminder", [
    {
      identifier: "snooze-10m",
      buttonTitle: "Snooze 10 Min",
      options: { opensAppToForeground: false }
    },
    {
      identifier: "snooze-1h",
      buttonTitle: "Snooze 1 Hour",
      options: { opensAppToForeground: false }
    },
    {
      identifier: "turn-off",
      buttonTitle: "Turn Off",
      options: { opensAppToForeground: false, isDestructive: true }
    }
  ]);
}

async function scheduleMorningVibes(state) {
  if (Platform.OS === "web") return;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    // 1. Cancel previous morning-vibe notifications
    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of allScheduled) {
      if (notif.identifier && notif.identifier.startsWith("morning-vibe-")) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    // 2. Schedule for the next 7 days
    const now = new Date();
    const quotes = [
      "Believe you can and you're halfway there.",
      "Act as if what you do makes a difference. It does.",
      "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      "Never bend your head. Always hold it high.",
      "What you get by achieving your goals is not as important as what you become.",
      "Make each day your masterpiece.",
      "The only limit to our realization of tomorrow will be our doubts of today.",
      "You are never too old to set another goal or to dream a new dream.",
      "Keep your face always toward the sunshine—and shadows will fall behind you.",
      "The best way to predict the future is to create it.",
      "Do what you can, with what you have, where you are.",
      "You don't have to be great to start, but you have to start to be great.",
      "Be so good they can't ignore you."
    ];

    const activeGoals = state.goals ? state.goals.filter(g => g.status !== "archived") : [];
    const activeSubGoals = state.subGoals ? state.subGoals.filter(s => activeGoals.some(g => g.id === s.goalId)) : [];
    const activeTasks = state.tasks ? state.tasks.filter(tk => activeSubGoals.some(s => s.id === tk.subGoalId)) : [];
    const pendingTasksCount = activeTasks.filter(tk => tk.status !== "completed").length;

    for (let i = 1; i <= 7; i++) {
      const triggerDate = new Date();
      triggerDate.setDate(now.getDate() + i);
      triggerDate.setHours(8, 0, 0, 0);

      // Days left in the year
      const year = triggerDate.getFullYear();
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
      const diffTime = endOfYear.getTime() - triggerDate.getTime();
      const daysLeftVal = Math.max(0, Math.ceil(diffTime / 86400000));

      const quote = quotes[Math.floor(Math.random() * quotes.length)];
      let bodyText = `✨ "${quote}"\nKeep going! Only ${daysLeftVal} days left in ${year}. You have ${pendingTasksCount} tasks pending.`;

      await Notifications.scheduleNotificationAsync({
        identifier: `morning-vibe-${i}`,
        content: {
          title: `🌅 Good Morning!`,
          body: bodyText,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: "default",
        },
      });
    }
  } catch (e) {
    console.warn("Error scheduling morning vibes:", e);
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({ Caveat_400Regular, Caveat_700Bold });
  const [dark, setDark]           = useState(true);
  const theme                     = makeTheme(dark);
  const [appState, setAppState]   = useState(SEED);
  const [tab, setTab]             = useState("dashboard");
  const [stack, setStack]         = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  // Share Intent state
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const [sharedUrlToPreFill, setSharedUrlToPreFill] = useState("");

  useEffect(() => {
    // Configure default Android notification channel for local alerts
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F77",
      }).catch(err => console.warn("Failed to set notification channel:", err));
    }

    loadLocalData().then(data => {
      setAppState(data);
      scheduleMorningVibes(data);
    });
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (stack.length > 0) { goBack(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [stack]);

  // Handle incoming Share Intent
  useEffect(() => {
    if (hasShareIntent && shareIntent && shareIntent.value) {
      const val = shareIntent.value;
      const match = val.match(/https?:\/\/[^\s]+/);
      const url = match ? match[0] : val;
      if (url.startsWith("http://") || url.startsWith("https://")) {
        setSharedUrlToPreFill(url);
        setTab("watchLater");
        setStack([]);
      }
      resetShareIntent();
    }
  }, [hasShareIntent, shareIntent]);

  // Handle Interactive Notification Responses (Snooze / Turn Off actions)
  useEffect(() => {
    if (Platform.OS === "web") return;
    const subscription = Notifications.addNotificationResponseReceivedListener(async response => {
      const { actionIdentifier, notification } = response;
      const { data } = notification.request.content;

      if (data && data.url) {
        if (actionIdentifier === "snooze-10m" || actionIdentifier === "snooze-1h") {
          const minutes = actionIdentifier === "snooze-10m" ? 10 : 60;
          const newDate = new Date(Date.now() + minutes * 60 * 1000);
          const checkTimeString = formatDateString(newDate);

          dispatch({
            type: "UPDATE_WATCH_LATER",
            item: { id: data.itemId, checkTime: checkTimeString, reminderEnabled: true }
          });

          const newReminderId = await Notifications.scheduleNotificationAsync({
            content: {
              title: `🔔 Watch Later Reminder (Snoozed)`,
              body: `${data.category}: ${data.itemTitle || data.url}`,
              categoryIdentifier: "watch-later-reminder",
              data: data,
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: newDate,
              channelId: "default",
            },
          });

          dispatch({
            type: "UPDATE_WATCH_LATER",
            item: { id: data.itemId, reminderId: newReminderId }
          });

        } else if (actionIdentifier === "turn-off") {
          dispatch({
            type: "UPDATE_WATCH_LATER",
            item: { id: data.itemId, reminderEnabled: false }
          });
        } else {
          let targetUrl = data.url.trim();
          if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = "https://" + targetUrl;
          }
          Linking.openURL(targetUrl).catch(err => console.error("Couldn't open link", err));
        }
      }
    });

    return () => subscription.remove();
  }, [appState]);

  const dispatch = action => {
    setAppState(s => {
      const next = reducer(s, action);
      saveLocalData(next);
      scheduleMorningVibes(next);
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
    Alert.alert("Confirm Import", "This will merge the imported goals, tasks, and watch later links with your current data without overwriting. Do you want to proceed?", [
      { text: "Cancel", style: "cancel" },
      { text: "Import & Merge", style: "default", onPress: async () => {
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
            // Intelligent Merge
            const currentGoals = [...appState.goals];
            const currentSubGoals = [...appState.subGoals];
            const currentTasks = [...appState.tasks];
            const currentWatchLater = [...(appState.watchLater || [])];
            const currentCategories = [...(appState.watchLaterCategories || ["YouTube", "Instagram", "Tutorials", "Articles", "Other"])];

            const idMap = {};

            // 1. Merge Goals
            (parsed.goals || []).forEach(g => {
              const existingGoal = currentGoals.find(cg => cg.name.trim().toLowerCase() === g.name.trim().toLowerCase());
              if (existingGoal) {
                idMap[g.id] = existingGoal.id;
                if (g.status === "active") existingGoal.status = "active";
              } else {
                const newId = Date.now() + Math.random();
                idMap[g.id] = newId;
                currentGoals.push({ ...g, id: newId, status: g.status || "active" });
              }
            });

            // 2. Merge SubGoals
            (parsed.subGoals || []).forEach(s => {
              const newGoalId = idMap[s.goalId];
              if (!newGoalId) return;
              const existingSub = currentSubGoals.find(cs => cs.goalId === newGoalId && cs.name.trim().toLowerCase() === s.name.trim().toLowerCase());
              if (existingSub) {
                idMap[s.id] = existingSub.id;
              } else {
                const newId = Date.now() + Math.random();
                idMap[s.id] = newId;
                currentSubGoals.push({ ...s, id: newId, goalId: newGoalId });
              }
            });

            // 3. Merge Tasks
            (parsed.tasks || []).forEach(t => {
              const newSubGoalId = idMap[t.subGoalId];
              if (!newSubGoalId) return;
              const existingTask = currentTasks.find(ct => ct.subGoalId === newSubGoalId && ct.name.trim().toLowerCase() === t.name.trim().toLowerCase());
              if (!existingTask) {
                currentTasks.push({ ...t, id: Date.now() + Math.random(), subGoalId: newSubGoalId });
              }
            });

            // 4. Merge Watch Later
            (parsed.watchLater || []).forEach(item => {
              const exists = currentWatchLater.some(cw => cw.url.trim().toLowerCase() === item.url.trim().toLowerCase());
              if (!exists) {
                currentWatchLater.push({ ...item, id: Date.now() + Math.random() });
              }
            });

            // 5. Merge Categories
            (parsed.watchLaterCategories || []).forEach(cat => {
              if (!currentCategories.includes(cat)) {
                currentCategories.push(cat);
              }
            });

            dispatch({
              type: "SET_STATE",
              state: {
                goals: currentGoals,
                subGoals: currentSubGoals,
                tasks: currentTasks,
                watchLater: currentWatchLater,
                watchLaterCategories: currentCategories,
              }
            });

            setShowSettings(false);
            Alert.alert("Success", "Imported and merged data successfully.");
          } else {
            Alert.alert("Error", "Invalid backup file structure.");
          }
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

      dispatch({
        type: "SET_STATE",
        state: {
          ...appState,
          goals: tempGoals,
          subGoals: tempSubGoals,
          tasks: tempTasks
        }
      });
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
      case "watchLater":
        return (
          <WatchLaterScreen
            state={appState}
            dispatch={dispatch}
            sharedUrlToPreFill={sharedUrlToPreFill}
            clearSharedUrlToPreFill={() => setSharedUrlToPreFill("")}
          />
        );
      case "stats":     return <StatisticsScreen state={appState} />;
    }
  }

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  return (
    <SafeAreaProvider>
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
            fontWeight: headerTitle === "Rukz" ? "normal" : "900",
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

            <SectionHeader>Backup & Sync (Google Drive / iCloud)</SectionHeader>
            <Text style={{ fontSize: 13, color: theme.inkThird, lineHeight: 18, paddingHorizontal: 4 }}>
              Since this app is entirely backend-free, your data is saved only on this phone. You can backup and restore your database using Google Drive, iCloud, or local storage.
            </Text>

            <View style={{
              backgroundColor: theme.isDark ? "#222228" : "#E4ECE7",
              borderRadius: 14,
              padding: 14,
              borderWidth: 1.5,
              borderColor: theme.border,
              marginBottom: 4
            }}>
              <Text style={{ fontSize: 12, color: theme.labelPrimary, fontWeight: "600", lineHeight: 18 }}>
                💡 <Text style={{ fontWeight: "800" }}>Sync via Google Drive:</Text>{"\n"}
                1. Tap <Text style={{ fontWeight: "800", color: theme.blue }}>Cloud Backup</Text> below and select "Save to Drive" (Google Drive).{"\n"}
                2. Tap <Text style={{ fontWeight: "800", color: theme.green }}>Restore Backup</Text> and choose the backup file from Google Drive to sync your data.
              </Text>
            </View>

            <GroupCard>
              {[
                { label: "Cloud Backup",          sub: "Upload backup to Google Drive, iCloud, etc.", icon: Share2,   color: theme.blue,   onPress: handleExport         },
                { label: "Restore Backup",        sub: "Sync from a Google Drive or iCloud backup file", icon: Download, color: theme.green,  onPress: handleImport         },
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
    </SafeAreaProvider>
  );
}
