import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEY = "productivity_app_data_v2";

export const SEED = {
  goals: [],
  subGoals: [],
  tasks: [],
};

export const loadLocalData = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : SEED;
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
