import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity,
  Platform, Alert, BackHandler, Linking, LogBox, AppState, ActivityIndicator,
  NativeModules,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Caveat_400Regular, Caveat_700Bold } from "@expo-google-fonts/caveat";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import * as XLSX from "xlsx";
import { ChevronLeft, Sun, Moon, Share2, Download, Upload, User, Cloud, RefreshCw, Check, AlertCircle } from "lucide-react-native";
import * as Notifications from "expo-notifications";
import { useShareIntent } from "expo-share-intent";
import { formatDateString } from "./src/utils/helpers";
import SegmentedControl from "./src/components/ui/SegmentedControl";
let GoogleSignin = null;
let statusCodes = {};

const hasNativeGoogleSignin = !!(NativeModules.RNGoogleSignin || NativeModules.RNGoogleSignin);

if (hasNativeGoogleSignin) {
  try {
    const GoogleLibrary = require("@react-native-google-signin/google-signin");
    GoogleSignin = GoogleLibrary.GoogleSignin;
    statusCodes = GoogleLibrary.statusCodes;

    GoogleSignin.configure({
      scopes: ["https://www.googleapis.com/auth/drive.appdata"],
      webClientId: "812843966426-2igt98s6agt5426ebet6qh4h705f4q6p.apps.googleusercontent.com",
      offlineAccess: true,
    });
  } catch (e) {
    console.warn("GoogleSignin configuration failed:", e.message);
  }
}

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



  // ── Google Backup state & handlers ───────────────────────────
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const checkGoogleSupport = () => {
    if (!hasNativeGoogleSignin) return false;
    if (Platform.OS === "web" || !GoogleSignin || typeof GoogleSignin.hasPlayServices !== "function") {
      return false;
    }
    return true;
  };

  const performGoogleDriveBackup = async (stateToBackup) => {
    const tokens = await GoogleSignin.getTokens();
    const accessToken = tokens.accessToken;

    // Find backup file in appDataFolder
    const queryUrl = 'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name%3D%27rukz_backup.json%27&fields=files(id%2Cname)';
    const searchRes = await fetch(queryUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!searchRes.ok) {
      throw new Error(`Search failed: ${searchRes.statusText}`);
    }
    
    const searchData = await searchRes.json();
    const existingFileId = searchData.files && searchData.files.length > 0 ? searchData.files[0].id : null;
    const backupBody = JSON.stringify(stateToBackup);

    if (existingFileId) {
      // Update existing file
      const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`;
      const updateRes = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: backupBody
      });
      if (!updateRes.ok) throw new Error(`Update failed: ${updateRes.statusText}`);
    } else {
      // Create new file metadata
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'rukz_backup.json',
          parents: ['appDataFolder']
        })
      });
      if (!createRes.ok) throw new Error(`Creation failed: ${createRes.statusText}`);
      
      const newFile = await createRes.json();
      const newFileId = newFile.id;

      // Upload actual data content
      const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${newFileId}?uploadType=media`;
      const uploadRes = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: backupBody
      });
      if (!uploadRes.ok) throw new Error(`Content upload failed: ${uploadRes.statusText}`);
    }
  };

  // Auto-backup watcher
  useEffect(() => {
    if (Platform.OS === "web") return;

    const checkAndBackup = async (state) => {
      const config = state.backupConfig;
      if (!config || !config.isGoogleLinked || config.frequency === "Off") return;

      const lastBackupStr = config.lastBackupTime;
      const now = new Date();
      let shouldBackup = false;

      if (!lastBackupStr) {
        shouldBackup = true;
      } else {
        const lastBackup = new Date(lastBackupStr);
        const diffMs = now.getTime() - lastBackup.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (config.frequency === "Daily" && diffDays >= 1) {
          shouldBackup = true;
        } else if (config.frequency === "Weekly" && diffDays >= 7) {
          shouldBackup = true;
        } else if (config.frequency === "Monthly" && diffDays >= 30) {
          shouldBackup = true;
        }
      }

      if (shouldBackup) {
        if (!checkGoogleSupport()) {
          console.log("Simulating background auto-backup...");
          try {
            const backupData = JSON.stringify(state);
            await AsyncStorage.setItem("google_drive_mock_backup", backupData);
            dispatch({
              type: "UPDATE_BACKUP_CONFIG",
              updates: { lastBackupTime: now.toISOString() }
            });
          } catch (e) {
            console.warn("Simulated auto-backup failed:", e);
          }
        } else {
          console.log("Running real Google Drive background auto-backup...");
          try {
            const isSignedIn = await GoogleSignin.isSignedIn();
            if (isSignedIn) {
              await GoogleSignin.signInSilently();
              await performGoogleDriveBackup(state);
              dispatch({
                type: "UPDATE_BACKUP_CONFIG",
                updates: { lastBackupTime: now.toISOString() }
              });
              console.log("Real background auto-backup successful!");
            }
          } catch (e) {
            console.error("Real background auto-backup failed:", e);
          }
        }
      }
    };

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background") {
        checkAndBackup(appState);
      }
    });

    return () => subscription.remove();
  }, [appState]);

  const handleGoogleLink = async () => {
    if (!checkGoogleSupport()) {
      if (Platform.OS === "web") {
        const email = window.prompt("Enter your Google email to link:", "user@gmail.com");
        if (!email) return;
        if (!email.includes("@")) {
          alert("Please enter a valid Google email address.");
          return;
        }
        dispatch({
          type: "UPDATE_BACKUP_CONFIG",
          updates: {
            isGoogleLinked: true,
            googleEmail: email.trim(),
            lastBackupTime: null,
          }
        });
        alert(`Successfully linked with ${email} (Simulated).`);
      } else {
        Alert.alert(
          "Link Google Account (Simulated)",
          "Since you are running in Expo Go or local environment, real Google Sign-In is unavailable. Would you like to connect a simulated account (test-user@gmail.com) to test the backup flow?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Connect (Mock)",
              onPress: () => {
                dispatch({
                  type: "UPDATE_BACKUP_CONFIG",
                  updates: {
                    isGoogleLinked: true,
                    googleEmail: "test-user@gmail.com",
                    lastBackupTime: null,
                  }
                });
                Alert.alert("Simulated Connection", "Successfully linked with test-user@gmail.com.\nAuto-backups will simulate uploads to Google Drive.");
              }
            }
          ]
        );
      }
      return;
    }

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const userObj = userInfo && (userInfo.data ? userInfo.data.user : userInfo.user);
      const email = userObj ? userObj.email : null;
      
      if (!email) {
        throw new Error("Could not retrieve email from Google Account.");
      }
      
      dispatch({
        type: "UPDATE_BACKUP_CONFIG",
        updates: {
          isGoogleLinked: true,
          googleEmail: email,
          lastBackupTime: null,
        }
      });
      Alert.alert("Google Account Linked", `Successfully linked with ${email} for Google Drive backups.`);
    } catch (error) {
      console.error(error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert("Cancelled", "Google sign-in was cancelled.");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert("In Progress", "Google sign-in is already in progress.");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Play Services", "Google Play Services is not available or outdated.");
      } else {
        Alert.alert("Sign-In Error", `Could not connect to Google: ${error.message || error}`);
      }
    }
  };

  const handleGoogleUnlink = async () => {
    Alert.alert(
      "Disconnect Google Drive",
      "Are you sure you want to disconnect your Google Account? This will stop automatic backups, but your existing backups on Google Drive will remain intact.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            if (checkGoogleSupport()) {
              try {
                await GoogleSignin.revokeAccess();
                await GoogleSignin.signOut();
              } catch (e) {
                console.log("Error revoking Google access, attempting sign out:", e);
                try {
                  await GoogleSignin.signOut();
                } catch (signOutError) {
                  console.log("Error signing out of Google:", signOutError);
                }
              }
            }
            dispatch({
              type: "UPDATE_BACKUP_CONFIG",
              updates: {
                isGoogleLinked: false,
                googleEmail: "",
                frequency: "Off",
                lastBackupTime: null,
              }
            });
          }
        }
      ]
    );
  };

  const handleGoogleBackup = async () => {
    if (backingUp) return;
    setBackingUp(true);
    try {
      if (!checkGoogleSupport()) {
        await new Promise(r => setTimeout(r, 1200));
        const backupData = JSON.stringify(appState);
        await AsyncStorage.setItem("google_drive_mock_backup", backupData);
        dispatch({
          type: "UPDATE_BACKUP_CONFIG",
          updates: { lastBackupTime: new Date().toISOString() }
        });
        Alert.alert("Simulated Backup", "Data backed up to simulated Google Drive storage.");
        return;
      }

      const isSignedIn = await GoogleSignin.isSignedIn();
      if (!isSignedIn) {
        await GoogleSignin.signIn();
      }
      await performGoogleDriveBackup(appState);
      dispatch({
        type: "UPDATE_BACKUP_CONFIG",
        updates: { lastBackupTime: new Date().toISOString() }
      });
      Alert.alert("Backup Successful", "Your data has been successfully backed up to your Google Drive App Data folder.");
    } catch (e) {
      console.error(e);
      Alert.alert("Backup Failed", `Could not complete Google Drive backup: ${e.message || e}`);
    } finally {
      setBackingUp(false);
    }
  };

  const handleGoogleRestore = async () => {
    if (restoring) return;
    Alert.alert(
      "Confirm Restore",
      "This will restore your data from Google Drive. It will merge the backed up goals, tasks, and watch later links with your current local data. Do you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore & Merge",
          onPress: async () => {
            setRestoring(true);
            try {
              let backupDataStr;

              if (!checkGoogleSupport()) {
                await new Promise(r => setTimeout(r, 1200));
                backupDataStr = await AsyncStorage.getItem("google_drive_mock_backup");
              } else {
                const isSignedIn = await GoogleSignin.isSignedIn();
                if (!isSignedIn) {
                  await GoogleSignin.signIn();
                }
                const tokens = await GoogleSignin.getTokens();
                const accessToken = tokens.accessToken;

                const queryUrl = 'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name%3D%27rukz_backup.json%27&fields=files(id%2Cname)';
                const searchRes = await fetch(queryUrl, {
                  headers: { Authorization: `Bearer ${accessToken}` }
                });
                if (!searchRes.ok) throw new Error("Search backup file failed");
                const searchData = await searchRes.json();
                const existingFileId = searchData.files && searchData.files.length > 0 ? searchData.files[0].id : null;

                if (!existingFileId) {
                  Alert.alert("No Backup Found", "No previous Rukz backups were found in your Google Drive account.");
                  return;
                }

                const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${existingFileId}?alt=media`, {
                  headers: { Authorization: `Bearer ${accessToken}` }
                });
                if (!downloadRes.ok) throw new Error("Downloading backup data failed");
                backupDataStr = await downloadRes.text();
              }

              if (!backupDataStr) {
                Alert.alert("No Backup Found", "No previous Rukz backups were found in your Google Drive account.");
                return;
              }

              const parsed = JSON.parse(backupDataStr);
              if (parsed.goals && parsed.subGoals && parsed.tasks) {
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

                dispatch({
                  type: "SET_STATE",
                  state: {
                    ...appState,
                    goals: currentGoals,
                    subGoals: currentSubGoals,
                    tasks: currentTasks,
                    watchLater: currentWatchLater,
                    watchLaterCategories: currentCategories,
                  }
                });

                Alert.alert("Restore Complete", "Your database has been successfully synchronized and merged with the backup.");
              } else {
                Alert.alert("Error", "Backup file structure is invalid.");
              }
            } catch (e) {
              console.error(e);
              Alert.alert("Error", `Could not retrieve backup: ${e.message || e}`);
            } finally {
              setRestoring(false);
            }
          }
        }
      ]
    );
  };

  const formatLastBackup = (timeStr) => {
    if (!timeStr) return "Never";
    try {
      const d = new Date(timeStr);
      return d.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
    } catch (e) {
      return "Never";
    }
  };

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

  const backupConfig = appState.backupConfig || {
    isGoogleLinked: false,
    googleEmail: "",
    frequency: "Off",
    lastBackupTime: null,
  };

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

            <SectionHeader>Google Drive Auto-Backup</SectionHeader>
            
            {!backupConfig.isGoogleLinked ? (
              <View style={{
                backgroundColor: theme.isDark ? "#1C1C22" : "#FFFFFF",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1.5,
                borderColor: theme.border,
                gap: 12,
                ...theme.shadow
              }}>
                <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                  <View style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    backgroundColor: theme.blue + "15",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Cloud size={20} color={theme.blue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, color: theme.labelPrimary, fontWeight: "700" }}>Google Account Sync</Text>
                    <Text style={{ fontSize: 12, color: theme.inkThird, marginTop: 2 }}>Secure backup & sync like WhatsApp</Text>
                  </View>
                </View>

                <Text style={{ fontSize: 13, color: theme.labelSecondary, lineHeight: 18 }}>
                  Connect your Google account to automatically upload your goals, focus areas, and tasks. Backups are stored privately in your Google Drive.
                </Text>

                <TouchableOpacity
                  onPress={handleGoogleLink}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: theme.blue,
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: "center",
                    marginTop: 6
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>Link Google Account</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{
                backgroundColor: theme.isDark ? "#1C1C22" : "#FFFFFF",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1.5,
                borderColor: theme.border,
                gap: 14,
                ...theme.shadow
              }}>
                {/* Connected status */}
                <View style={{ flexDirection: "row", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", gap: 12, alignItems: "center", flex: 1 }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: theme.green + "15",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Cloud size={18} color={theme.green} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: theme.inkThird, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>Connected Account</Text>
                      <Text numberOfLines={1} style={{ fontSize: 15, color: theme.labelPrimary, fontWeight: "700", marginTop: 2 }}>{backupConfig.googleEmail}</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    onPress={handleGoogleUnlink}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: theme.border,
                      backgroundColor: theme.isDark ? "#282830" : "#F4F4F6",
                    }}
                  >
                    <Text style={{ fontSize: 11, color: theme.labelPrimary, fontWeight: "700" }}>Disconnect</Text>
                  </TouchableOpacity>
                </View>

                <FullSep />

                {/* Backup Frequency */}
                <View>
                  <Text style={{ fontSize: 13, color: theme.labelSecondary, fontWeight: "700", marginBottom: 10 }}>Auto-Backup Frequency</Text>
                  <SegmentedControl
                    options={[
                      { label: "Off", value: "Off" },
                      { label: "Daily", value: "Daily" },
                      { label: "Weekly", value: "Weekly" },
                      { label: "Monthly", value: "Monthly" },
                    ]}
                    value={backupConfig.frequency}
                    onChange={(val) => {
                      dispatch({
                        type: "UPDATE_BACKUP_CONFIG",
                        updates: { frequency: val }
                      });
                    }}
                  />
                </View>

                {/* Last Backup Info */}
                <View style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  backgroundColor: theme.isDark ? "#222228" : "#F4F6F5",
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 0.5,
                  borderColor: theme.border
                }}>
                  <Text style={{ fontSize: 13, color: theme.labelSecondary }}>Last backup to Drive:</Text>
                  <Text style={{ fontSize: 13, color: theme.labelPrimary, fontWeight: "600" }}>{formatLastBackup(backupConfig.lastBackupTime)}</Text>
                </View>

                {/* Actions */}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                  <TouchableOpacity
                    onPress={handleGoogleBackup}
                    disabled={backingUp || restoring}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      backgroundColor: theme.blue,
                      borderRadius: 12,
                      paddingVertical: 12,
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 8,
                      opacity: backingUp || restoring ? 0.7 : 1
                    }}
                  >
                    {backingUp ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <RefreshCw size={14} color="#FFFFFF" />
                        <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>Backup Now</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleGoogleRestore}
                    disabled={backingUp || restoring}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      borderWidth: 1.5,
                      borderColor: theme.green,
                      backgroundColor: theme.green + "10",
                      borderRadius: 12,
                      paddingVertical: 12,
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 8,
                      opacity: backingUp || restoring ? 0.7 : 1
                    }}
                  >
                    {restoring ? (
                      <ActivityIndicator size="small" color={theme.green} />
                    ) : (
                      <>
                        <Download size={14} color={theme.green} />
                        <Text style={{ color: theme.green, fontWeight: "700", fontSize: 13 }}>Restore Sync</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <SectionHeader>Local Backup & CSV Import</SectionHeader>
            <GroupCard>
              {[
                { label: "Share Backup File",      sub: "Export local backup file for sharing/storage", icon: Share2,   color: theme.blue,   onPress: handleExport         },
                { label: "Import Backup File",     sub: "Merge local backup JSON file manually",     icon: Download, color: theme.green,  onPress: handleImport         },
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
