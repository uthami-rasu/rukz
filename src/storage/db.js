import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEY = "productivity_app_data_v2";

export const SEED = {
  goals: [],
  subGoals: [],
  tasks: [],
  watchLater: [],
  watchLaterCategories: ["YouTube", "Instagram", "Tutorials", "Articles", "Other"],
  backupConfig: {
    isGoogleLinked: false,
    googleEmail: "",
    frequency: "Off", // "Off", "Daily", "Weekly", "Monthly", "Manual"
    lastBackupTime: null,
  }
};

export const loadLocalData = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (jsonValue != null) {
      const parsed = JSON.parse(jsonValue);
      return {
        goals: parsed.goals || [],
        subGoals: parsed.subGoals || [],
        tasks: parsed.tasks || [],
        watchLater: parsed.watchLater || [],
        watchLaterCategories: parsed.watchLaterCategories || ["YouTube", "Instagram", "Tutorials", "Articles", "Other"],
        backupConfig: parsed.backupConfig || {
          isGoogleLinked: false,
          googleEmail: "",
          frequency: "Off",
          lastBackupTime: null,
        }
      };
    }
    return SEED;
  } catch (e) {
    console.error("Failed to load local data:", e);
    return SEED;
  }
};

export const saveLocalData = async (data) => {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error("Failed to save data:", e);
  }
};
