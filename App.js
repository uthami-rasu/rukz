import React, { useState, useMemo, createContext, useContext, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Modal,
  Alert,
  Platform,
  KeyboardAvoidingView,
  BackHandler
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Svg, { Circle } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import * as XLSX from "xlsx";
import { useFonts, Caveat_700Bold } from "@expo-google-fonts/caveat";

// Import Lucide icons
import {
  LayoutDashboard, Target, Search, CalendarDays, BarChart2,
  ChevronLeft, ChevronRight, Plus, X, Check, Trash2,
  Flag, Clock, AlignLeft, Sun, Moon, Circle as CircleIcon, CheckCircle2,
  TrendingUp, Layers, ListTodo, Flame, User, Sparkles,
  Share2, Download, Upload
} from "lucide-react-native";

// ─────────────────────────────────────────────────────────────
// STORAGE KEYS & DATA OPERATIONS
// ─────────────────────────────────────────────────────────────
const STORAGE_KEY = "productivity_app_data_v2";

// Seed Database (empty by default)
const SEED = {
  goals: [],
  subGoals: [],
  tasks: [],
};

const loadLocalData = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : SEED;
  } catch (e) {
    console.error("Failed to load local data:", e);
    return SEED;
  }
};

const saveLocalData = async (data) => {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error("Failed to save data:", e);
  }
};

// ─────────────────────────────────────────────────────────────
// THEME — Apple system-level color tokens
// ─────────────────────────────────────────────────────────────
const ThemeCtx = createContext(null);
const useTheme = () => useContext(ThemeCtx);

function makeTheme(dark) {
  return dark ? {
    isDark: true,
    bg:             "#121214",
    bgSecond:       "#1C1C1E",
    bgTertiary:     "#2C2C2E",
    surface:        "#1C1C1E",
    card:           "#1C1C1E",
    cardRaised:     "#2C2C2E",
    groupedBg:      "#121214",
    insetCard:      "#1C1C1E",
    labelPrimary:   "#FFFFFF",
    labelSecondary: "#EBEBF5CC",   // 80% white
    labelTertiary:  "#EBEBF599",   // 60% white
    labelQuaternary:"#EBEBF54D",   // 30% white
    separator:      "#38383A",
    separatorOpaque:"#38383A",
    fillPrimary:    "#787880",
    fillSecondary:  "#78788033",
    fillTertiary:   "#7676801E",
    fillQuaternary: "#74748014",
    blue:           "#0A84FF",
    green:          "#30D158",
    red:            "#FF453A",
    amber:          "#FFD60A",
    indigo:         "#5E5CE6",
    ink:            "#FFFFFF",
    inkSecond:      "#EBEBF5CC",
    inkThird:       "#EBEBF599",
    inkInverse:     "#000000",
    border:         "#38383A",
    pill:           "#3A3A3C",
    pillActive:     "#FFFFFF",
    pillText:       "#EBEBF5CC",
    pillTextAct:    "#000000",
    shadow: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 3,
    }
  } : {
    isDark: false,
    bg:             "#F2F2F7",
    bgSecond:       "#FFFFFF",
    bgTertiary:     "#F2F2F7",
    surface:        "#FFFFFF",
    card:           "#FFFFFF",
    cardRaised:     "#F2F2F7",
    groupedBg:      "#F2F2F7",
    insetCard:      "#FFFFFF",
    labelPrimary:   "#000000",
    labelSecondary: "#3C3C4399",
    labelTertiary:  "#3C3C4366",
    labelQuaternary:"#3C3C432E",
    separator:      "#C6C6C8",
    separatorOpaque:"#C6C6C8",
    fillPrimary:    "#787880",
    fillSecondary:  "#78788028",
    fillTertiary:   "#7676800F",
    fillQuaternary: "#74748007",
    blue:           "#007AFF",
    green:          "#34C759",
    red:            "#FF3B30",
    amber:          "#FF9500",
    indigo:         "#5856D6",
    ink:            "#000000",
    inkSecond:      "#3C3C4399",
    inkThird:       "#3C3C4366",
    inkInverse:     "#FFFFFF",
    border:         "#C6C6C8",
    pill:           "#E5E5EA",
    pillActive:     "#000000",
    pillText:       "#3C3C4399",
    pillTextAct:    "#FFFFFF",
    shadow: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    }
  };
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function daysLeft() {
  const now = new Date();
  return Math.ceil((new Date(now.getFullYear(), 11, 31).getTime() - now.getTime()) / 86400000);
}
function pct(done, total) { return total ? Math.round((done / total) * 100) : 0; }

// ─────────────────────────────────────────────────────────────
// DESIGN ATOMS (REACT NATIVE CONVERTED)
// ─────────────────────────────────────────────────────────────

function ProgressRing({ value, size = 52, stroke = 4, color }) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const c = color || t.blue;
  return (
    <View style={{ transform: [{ rotate: "-90deg" }], width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke={t.fillTertiary} strokeWidth={stroke}/>
        <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={stroke}
          strokeDasharray={[dash, circ]} strokeLinecap="round"/>
      </Svg>
    </View>
  );
}

function ProgressBar({ value, color, height = 4 }) {
  const t = useTheme();
  const c = color || t.blue;
  return (
    <View style={{ backgroundColor: t.fillTertiary, borderRadius: 99, height, overflow: "hidden" }}>
      <View style={{ width: `${value}%`, height: "100%", backgroundColor: c, borderRadius: 99 }}/>
    </View>
  );
}

function RowSep() {
  const t = useTheme();
  return <View style={{ height: 0.5, backgroundColor: t.separator, marginLeft: 52 }}/>;
}

function FullSep() {
  const t = useTheme();
  return <View style={{ height: 0.5, backgroundColor: t.separator }}/>;
}

function SectionHeader({ children }) {
  const t = useTheme();
  return (
    <Text style={{ fontSize: 12, fontWeight: "600", color: t.inkThird, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6, marginTop: 22, paddingLeft: 4 }}>
      {children}
    </Text>
  );
}

function SegmentedControl({ options, value, onChange }) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: t.fillTertiary, borderRadius: 9, padding: 2, flexDirection: "row", gap: 2, marginBottom: 16 }}>
      {options.map(o => {
        const active = value === o.value;
        return (
          <TouchableOpacity key={o.value} onPress={() => onChange(o.value)} style={{
            flex: 1, paddingVertical: 6, borderRadius: 7,
            backgroundColor: active ? (t.isDark ? "#636366" : "#FFFFFF") : "transparent",
            alignItems: 'center',
            shadowColor: active ? "#000" : "transparent",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: active ? 0.18 : 0,
            shadowRadius: 1.5,
            elevation: active ? 1 : 0
          }}>
            <Text style={{
              fontSize: 12, fontWeight: active ? "600" : "400",
              color: active ? t.labelPrimary : t.inkSecond,
            }}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function PriorityChip({ priority }) {
  const t = useTheme();
  const map = {
    High:   { color: t.red,   bg: t.red   + "20" },
    Medium: { color: t.amber, bg: t.amber + "20" },
    Low:    { color: t.green, bg: t.green + "20" },
  };
  const s = map[priority] || map.Medium;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: s.bg, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' }}>
      <Flag size={9} color={s.color} fill={s.color}/>
      <Text style={{ fontSize: 10, fontWeight: "600", color: s.color, letterSpacing: 0.2 }}>{priority}</Text>
    </View>
  );
}

function Chevron() {
  const t = useTheme();
  return <ChevronRight size={16} color={t.inkThird} strokeWidth={2}/>;
}

// ─────────────────────────────────────────────────────────────
// NATIVE BOTTOM MODAL SHEET
// ─────────────────────────────────────────────────────────────
function Sheet({ title, visible, onClose, children }) {
  const t = useTheme();
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableOpacity activeOpacity={1} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={onClose} />
        <View style={{
          backgroundColor: t.isDark ? "#1C1C1E" : "#F2F2F7",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingBottom: 34,
          maxHeight: "85%",
          borderWidth: 0.5,
          borderColor: t.border
        }}>
          <View style={{ width: 36, height: 5, backgroundColor: t.isDark ? "#48484A" : "#D1D1D6", borderRadius: 99, alignSelf: "center", marginTop: 10 }}/>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 17, fontWeight: "600", color: t.labelPrimary }}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: t.isDark ? "#3A3A3C" : "#E5E5EA", alignItems: "center", justifyContent: "center" }}>
              <X size={13} color={t.inkSecond} strokeWidth={2.5}/>
            </TouchableOpacity>
          </View>
          <FullSep/>
          <ScrollView contentContainerStyle={{ padding: 16 }}>{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AppleInput({ label, icon: Icon, value, onChangeText, ...props }) {
  const t = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ marginBottom: 12 }}>
      {label && <Text style={{ fontSize: 12, fontWeight: "500", color: t.inkThird, marginBottom: 5, paddingLeft: 2 }}>{label}</Text>}
      <View style={{
        backgroundColor: t.isDark ? "#2C2C2E" : "#FFFFFF",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: focus ? t.blue : (t.isDark ? "#3A3A3C" : "#D1D1D6"),
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
      }}>
        {Icon && <Icon size={15} color={t.inkThird} style={{ marginRight: 8 }}/>}
        <TextInput
          {...props}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholderTextColor={t.inkThird}
          style={{
            flex: 1,
            color: t.labelPrimary,
            paddingVertical: 11,
            fontSize: 15,
          }}
        />
      </View>
    </View>
  );
}

function AppleSelect({ label, icon: Icon, value, options, onChange }) {
  const t = useTheme();
  const handlePress = () => {
    Alert.alert(
      `Select ${label}`,
      "",
      options.map(opt => ({
        text: opt,
        onPress: () => onChange(opt),
      })),
      { cancelable: true }
    );
  };

  return (
    <TouchableOpacity onPress={handlePress} style={{ marginBottom: 12 }}>
      {label && <Text style={{ fontSize: 12, fontWeight: "500", color: t.inkThird, marginBottom: 5, paddingLeft: 2 }}>{label}</Text>}
      <View style={{
        backgroundColor: t.isDark ? "#2C2C2E" : "#FFFFFF",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: t.isDark ? "#3A3A3C" : "#D1D1D6",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 11
      }}>
        {Icon && <Icon size={15} color={t.inkThird} style={{ marginRight: 8 }}/>}
        <Text style={{ fontSize: 15, color: t.labelPrimary, flex: 1 }}>{value}</Text>
        <ChevronRight size={14} color={t.inkThird}/>
      </View>
    </TouchableOpacity>
  );
}

function SheetBtn({ children, onClick, icon: Icon }) {
  const t = useTheme();
  return (
    <TouchableOpacity onPress={onClick} style={{ width: "100%", backgroundColor: t.blue, borderRadius: 14, padding: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
      {Icon && <Icon size={17} color="#fff"/>}
      <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "600" }}>{children}</Text>
    </TouchableOpacity>
  );
}

function NewItemRow({ label, onClick }) {
  const t = useTheme();
  return (
    <TouchableOpacity onPress={onClick} style={{ width: "100%", flexDirection: "row", alignItems: "center", gap: 14, padding: 12, borderRadius: 12 }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: t.blue, alignItems: "center", justifyContent: "center" }}>
        <Plus size={16} color="#fff" strokeWidth={2.5}/>
      </View>
      <Text style={{ fontSize: 16, color: t.blue, fontWeight: "400" }}>{label}</Text>
    </TouchableOpacity>
  );
}

function GroupCard({ children, style = {} }) {
  const t = useTheme();
  return (
    <View style={[{ backgroundColor: t.insetCard, borderRadius: 12, overflow: "hidden" }, t.shadow, style]}>
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN: DASHBOARD
// ─────────────────────────────────────────────────────────────
function Dashboard({ state, setTab, setShowSettings, handleDownloadTemplate, fontsLoaded }) {
  const t = useTheme();
  const { goals, subGoals, tasks } = state;
  const total = tasks.length;
  const done  = tasks.filter(x => x.status === "completed").length;
  const overall = pct(done, total);
  const days = daysLeft();

  //スタンド値 (Stand - goals fully complete)
  const standPct = pct(goals.filter(g => {
    const ts = tasks.filter(tk => subGoals.filter(s => s.goalId === g.id).some(s => s.id === tk.subGoalId));
    return ts.length && ts.every(x => x.status === "completed");
  }).length, goals.length);

  if (goals.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24, paddingVertical: 64 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: t.blue + "15", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <Target size={40} color={t.blue}/>
        </View>
        <Text style={{ fontSize: 24, fontWeight: "700", color: t.labelPrimary, textAlign: "center", marginBottom: 10, letterSpacing: -0.6 }}>
          Welcome to <Text style={{ fontFamily: fontsLoaded ? "Caveat_700Bold" : Platform.select({ ios: "Snell Roundhand", android: "sans-serif" }), fontStyle: fontsLoaded ? "normal" : "italic", fontSize: 32 }}>Rukz</Text>
        </Text>
        <Text style={{ fontSize: 14, color: t.inkThird, textAlign: "center", lineHeight: 22, marginBottom: 32, paddingHorizontal: 12 }}>
          Your dashboard is empty because you haven't added any goals yet. Start tracking your life progress now!
        </Text>
        <View style={{ width: "100%", gap: 12 }}>
          <TouchableOpacity 
            onPress={() => setTab("goals")}
            style={{
              backgroundColor: t.blue,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8
            }}
          >
            <Plus size={18} color="#FFFFFF"/>
            <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 16, letterSpacing: -0.2 }}>Create Your First Goal</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleDownloadTemplate}
            style={{
              backgroundColor: t.isDark ? "#1C1C1E" : "#E5E5EA",
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              borderWidth: t.isDark ? 0.5 : 0,
              borderColor: t.border
            }}
          >
            <Download size={16} color={t.labelPrimary}/>
            <Text style={{ color: t.labelPrimary, fontWeight: "600", fontSize: 16, letterSpacing: -0.2 }}>Download CSV Template</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setShowSettings(true)}
            style={{
              backgroundColor: "transparent",
              borderRadius: 14,
              paddingVertical: 10,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8
            }}
          >
            <Upload size={14} color={t.inkThird}/>
            <Text style={{ color: t.inkThird, fontWeight: "500", fontSize: 14, letterSpacing: -0.2 }}>Already have a file? Open settings to upload</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
      {/* Hero summary card */}
      <View style={[{ backgroundColor: t.isDark ? "#1C1C1E" : "#FFFFFF", borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 0.5, borderColor: t.border }, t.shadow]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}>
          <Sparkles size={13} color={t.blue}/>
          <Text style={{ fontSize: 11, fontWeight: "600", color: t.blue, letterSpacing: 0.5, textTransform: "uppercase" }}>2026 Overview</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 18 }}>
          <View style={{ position: "relative", width: 90, height: 90 }}>
            {/* Triple ring simulation in React Native */}
            <View style={{ transform: [{ rotate: "-90deg" }] }}>
              <Svg width={90} height={90}>
                {/* Ring 3 – Tasks */}
                <Circle cx={45} cy={45} r={38} fill="none" stroke={t.fillTertiary} strokeWidth={6}/>
                <Circle cx={45} cy={45} r={38} fill="none" stroke={t.blue} strokeWidth={6}
                  strokeDasharray={[(overall/100)*2*Math.PI*38, 2*Math.PI*38]} strokeLinecap="round"/>
                {/* Ring 2 – Areas */}
                <Circle cx={45} cy={45} r={28} fill="none" stroke={t.fillTertiary} strokeWidth={6}/>
                <Circle cx={45} cy={45} r={28} fill="none" stroke={t.green} strokeWidth={6}
                  strokeDasharray={[(pct(done, total)/100)*2*Math.PI*28, 2*Math.PI*28]} strokeLinecap="round"/>
                {/* Ring 1 – Goals */}
                <Circle cx={45} cy={45} r={18} fill="none" stroke={t.fillTertiary} strokeWidth={6}/>
                <Circle cx={45} cy={45} r={18} fill="none" stroke={t.red} strokeWidth={6}
                  strokeDasharray={[(standPct/100)*2*Math.PI*18, 2*Math.PI*18]} strokeLinecap="round"/>
              </Svg>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 42, fontWeight: "700", color: t.labelPrimary, letterSpacing: -1 }}>
              {overall}<Text style={{ fontSize: 22, fontWeight: "500", color: t.inkSecond }}>%</Text>
            </Text>
            <Text style={{ fontSize: 13, color: t.inkSecond, marginTop: 2, marginBottom: 12 }}>Overall complete</Text>
            {[
              { label: "Tasks", value: overall, color: t.blue },
              { label: "Exercise", value: pct(done, total), color: t.green },
              { label: "Stand", value: standPct, color: t.red },
            ].map(r => (
              <View key={r.label} style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: r.color }}/>
                <Text style={{ fontSize: 11, color: t.inkThird, width: 58 }}>{r.label}</Text>
                <View style={{ flex: 1, backgroundColor: t.fillTertiary, borderRadius: 99, height: 3 }}>
                  <View style={{ width: `${r.value}%`, height: "100%", backgroundColor: r.color, borderRadius: 99 }}/>
                </View>
                <Text style={{ fontSize: 11, fontWeight: "600", color: t.inkSecond, minWidth: 26, textAlign: "right" }}>{r.value}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Days left */}
        <View style={{ backgroundColor: t.isDark ? "#2C2C2E" : "#F2F2F7", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <Flame size={14} color={t.amber}/>
            <Text style={{ fontSize: 13, fontWeight: "500", color: t.inkSecond }}>Days left in 2026</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: "700", color: t.labelPrimary, letterSpacing: -0.5 }}>{days}</Text>
        </View>
      </View>

      {/* Stats strip */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
        {[
          { icon: Target,   label: "Goals",    value: goals.length,    color: t.red },
          { icon: Layers,   label: "Areas",    value: subGoals.length, color: t.green },
          { icon: ListTodo, label: "Tasks",    value: total,           color: t.blue },
        ].map(({ icon: Icon, label, value, color }) => (
          <View key={label} style={[{ flex: 1, backgroundColor: t.isDark ? "#1C1C1E" : "#FFFFFF", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 14, borderWidth: 0.5, borderColor: t.border }, t.shadow]}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: color + "20", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              <Icon size={14} color={color}/>
            </View>
            <Text style={{ fontSize: 24, fontWeight: "700", color: t.labelPrimary, letterSpacing: -0.5 }}>{value}</Text>
            <Text style={{ fontSize: 11, color: t.inkThird, marginTop: 3, fontWeight: "500" }}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Task status */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 22 }}>
        {[
          { icon: CheckCircle2, label: "Completed", value: done,        color: t.green },
          { icon: CircleIcon,   label: "Pending",   value: total - done, color: t.amber },
        ].map(({ icon: Icon, label, value, color }) => (
          <View key={label} style={[{ flex: 1, backgroundColor: t.isDark ? "#1C1C1E" : "#FFFFFF", borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: t.border }, t.shadow]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Icon size={14} color={color}/>
              <Text style={{ fontSize: 11, color: color, fontWeight: "600" }}>{label}</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: "700", color: t.labelPrimary, letterSpacing: -0.5 }}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Goal progress */}
      <SectionHeader>Goal progress</SectionHeader>
      <GroupCard>
        {goals.map((g, i) => {
          const gSubs  = subGoals.filter(s => s.goalId === g.id);
          const gTasks = tasks.filter(tk => gSubs.some(s => s.id === tk.subGoalId));
          const gDone  = gTasks.filter(tk => tk.status === "completed").length;
          const gPct   = pct(gDone, gTasks.length);
          const color  = [t.red, t.green, t.blue][i % 3];
          return (
            <View key={g.id}>
              <View style={{ padding: 13 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: color + "20", alignItems: "center", justifyContent: "center" }}>
                      <Target size={13} color={color}/>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: "500", color: t.labelPrimary }}>{g.name}</Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: t.inkSecond }}>{gPct}%</Text>
                </View>
                <ProgressBar value={gPct} color={color} height={5}/>
                <View style={{ flexDirection: "row", gap: 12, marginTop: 7 }}>
                  <Text style={{ fontSize: 11, color: t.inkThird }}>{gSubs.length} areas</Text>
                  <Text style={{ fontSize: 11, color: t.green, fontWeight: "500" }}>✓ {gDone}</Text>
                  <Text style={{ fontSize: 11, color: t.inkThird }}>○ {gTasks.length - gDone}</Text>
                </View>
              </View>
              {i < goals.length - 1 && <FullSep/>}
            </View>
          );
        })}
      </GroupCard>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN: GOALS
// ─────────────────────────────────────────────────────────────
function GoalsScreen({ state, dispatch, navigate }) {
  const t = useTheme();
  const { goals, subGoals, tasks } = state;
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", targetDate: "" });

  function stats(g) {
    const subs = subGoals.filter(s => s.goalId === g.id);
    const ts   = tasks.filter(tk => subs.some(s => s.id === tk.subGoalId));
    const done = ts.filter(tk => tk.status === "completed").length;
    return { subs: subs.length, total: ts.length, done, p: pct(done, ts.length) };
  }
  function add() {
    if (!form.name.trim()) return;
    dispatch({ type: "ADD_GOAL", goal: { id: Date.now(), ...form, status: "active", createdDate: new Date().toISOString().slice(0,10) } });
    setForm({ name: "", description: "", targetDate: "" }); setShowAdd(false);
  }

  const colors = [t.red, t.green, t.blue, t.amber, t.indigo];

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
      <SectionHeader>All Goals</SectionHeader>
      <GroupCard style={{ marginBottom: 8 }}>
        {goals.map((g, i) => {
          const s = stats(g);
          const color = colors[i % colors.length];
          return (
            <View key={g.id}>
              <TouchableOpacity onPress={() => navigate("goalDetail", { goalId: g.id })}
                style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: color + "20", alignItems: "center", justifyContent: "center" }}>
                  <Target size={18} color={color}/>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "500", color: t.labelPrimary, marginBottom: 2 }}>{g.name}</Text>
                  <Text numberOfLines={1} style={{ fontSize: 12, color: t.inkThird, marginBottom: 6 }}>{g.description}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <ProgressBar value={s.p} color={color} height={4}/>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: t.inkSecond }}>{s.p}%</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 5 }}>
                    <Text style={{ fontSize: 11, color: t.inkThird }}>{s.subs} areas</Text>
                    <Text style={{ fontSize: 11, color: t.green }}>✓ {s.done}</Text>
                    <Text style={{ fontSize: 11, color: t.inkThird }}>○ {s.total - s.done}</Text>
                    {g.targetDate && <Text style={{ fontSize: 11, color: t.inkThird, marginLeft: "auto" }}>{g.targetDate}</Text>}
                  </View>
                </View>
                <Chevron/>
              </TouchableOpacity>
              {i < goals.length - 1 && <FullSep/>}
            </View>
          );
        })}
        <FullSep/>
        <NewItemRow label="New Goal" onClick={() => setShowAdd(true)}/>
      </GroupCard>

      <Sheet title="New Goal" visible={showAdd} onClose={() => setShowAdd(false)}>
        <AppleInput label="Goal Name" icon={Target} placeholder="e.g. Career Growth" value={form.name} onChangeText={t => setForm({ ...form, name: t })}/>
        <AppleInput label="Description" icon={AlignLeft} placeholder="What are you working towards?" value={form.description} onChangeText={t => setForm({ ...form, description: t })}/>
        <AppleInput label="Target Date" icon={CalendarDays} placeholder="YYYY-MM-DD" value={form.targetDate} onChangeText={t => setForm({ ...form, targetDate: t })}/>
        <SheetBtn onClick={add} icon={Plus}>Create Goal</SheetBtn>
      </Sheet>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN: GOAL DETAIL
// ─────────────────────────────────────────────────────────────
function GoalDetail({ state, dispatch, params, navigate, goBack }) {
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
  function add() {
    if (!form.name.trim()) return;
    dispatch({ type: "ADD_SUBGOAL", subGoal: { id: Date.now(), goalId: goal.id, ...form } });
    setForm({ name: "", description: "" }); setShowAdd(false);
  }

  const colors = [t.red, t.green, t.blue, t.amber, t.indigo];

  return (
    <ScrollView style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
      {/* Hero ring card */}
      <View style={[{ backgroundColor: t.isDark ? "#1C1C1E" : "#FFFFFF", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 0.5, borderColor: t.border, flexDirection: "row", alignItems: "center", gap: 18 }, t.shadow]}>
        <View style={{ position: "relative" }}>
          <ProgressRing value={gPct} size={72} stroke={6} color={t.blue}/>
          <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: t.labelPrimary }}>{gPct}%</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          {goal.description && <Text style={{ fontSize: 13, color: t.inkThird, marginBottom: 10, lineHeight: 18 }}>{goal.description}</Text>}
          <View style={{ flexDirection: "row", gap: 14 }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: t.labelPrimary }}>{gSubs.length}</Text>
              <Text style={{ fontSize: 10, color: t.inkThird, fontWeight: "500" }}>Areas</Text>
            </View>
            <View style={{ width: 0.5, backgroundColor: t.separator }}/>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: t.green }}>{gDone}</Text>
              <Text style={{ fontSize: 10, color: t.inkThird, fontWeight: "500" }}>Done</Text>
            </View>
            <View style={{ width: 0.5, backgroundColor: t.separator }}/>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: t.amber }}>{gTasks.length - gDone}</Text>
              <Text style={{ fontSize: 10, color: t.inkThird, fontWeight: "500" }}>Left</Text>
            </View>
          </View>
        </View>
      </View>

      <SectionHeader>Focus Areas</SectionHeader>
      <GroupCard style={{ marginBottom: 8 }}>
        {gSubs.map((sg, i) => {
          const sgTasks = tasks.filter(tk => tk.subGoalId === sg.id);
          const sgDone  = sgTasks.filter(tk => tk.status === "completed").length;
          const sgPct   = pct(sgDone, sgTasks.length);
          const color   = colors[i % colors.length];
          return (
            <View key={sg.id}>
              <TouchableOpacity onPress={() => navigate("subGoalDetail", { subGoalId: sg.id })}
                style={{ padding: 13, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: color + "20", alignItems: "center", justifyContent: "center" }}>
                  <ListTodo size={15} color={color}/>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <Text style={{ fontSize: 15, fontWeight: "500", color: t.labelPrimary }}>{sg.name}</Text>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: t.inkSecond }}>{sgPct}%</Text>
                  </View>
                  <ProgressBar value={sgPct} color={color} height={4}/>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 5 }}>
                    <Text style={{ fontSize: 11, color: t.green }}>✓ {sgDone}</Text>
                    <Text style={{ fontSize: 11, color: t.inkThird }}>○ {sgTasks.length - sgDone} left</Text>
                  </View>
                </View>
                <Chevron/>
              </TouchableOpacity>
              {i < gSubs.length - 1 && <FullSep/>}
            </View>
          );
        })}
        <FullSep/>
        <NewItemRow label="New Focus Area" onClick={() => setShowAdd(true)}/>
      </GroupCard>

      <Sheet title="New Focus Area" visible={showAdd} onClose={() => setShowAdd(false)}>
        <AppleInput label="Name" icon={Layers} placeholder="e.g. Kubernetes" value={form.name} onChangeText={t => setForm({ ...form, name: t })}/>
        <AppleInput label="Description" icon={AlignLeft} placeholder="Brief description" value={form.description} onChangeText={t => setForm({ ...form, description: t })}/>
        <SheetBtn onClick={add} icon={Plus}>Create Area</SheetBtn>
      </Sheet>

      {/* Delete Goal button */}
      <TouchableOpacity 
        onPress={() => {
          Alert.alert(
            "Delete Goal",
            "Are you sure you want to delete this goal, including all its focus areas and tasks? This action cannot be undone.",
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Delete", 
                style: "destructive", 
                onPress: () => {
                  dispatch({ type: "DELETE_GOAL", id: goal.id });
                  goBack();
                } 
              }
            ]
          );
        }}
        style={{
          marginTop: 24,
          padding: 14,
          backgroundColor: t.red + "15",
          borderRadius: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderWidth: 1,
          borderColor: t.red + "30"
        }}
      >
        <Trash2 size={16} color={t.red}/>
        <Text style={{ color: t.red, fontWeight: "600", fontSize: 15 }}>Delete Goal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN: SUB GOAL DETAIL
// ─────────────────────────────────────────────────────────────
function SubGoalDetail({ state, dispatch, params, goBack }) {
  const t = useTheme();
  const { subGoals, tasks } = state;
  const sg = subGoals.find(s => s.id === params.subGoalId);
  if (!sg) return null;
  const sgTasks = tasks.filter(tk => tk.subGoalId === sg.id);
  const done    = sgTasks.filter(tk => tk.status === "completed").length;
  const sgPct   = pct(done, sgTasks.length);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ name: "", notes: "", dueDate: "", priority: "Medium" });
  const [filter, setFilter]   = useState("all");

  const sorted = [...sgTasks]
    .filter(tk => filter === "all" || tk.status === filter)
    .sort((a, b) => a.status === b.status ? 0 : a.status === "completed" ? 1 : -1);

  function add() {
    if (!form.name.trim()) return;
    dispatch({ type: "ADD_TASK", task: { id: Date.now(), subGoalId: sg.id, ...form, status: "pending", completedDate: null } });
    setForm({ name: "", notes: "", dueDate: "", priority: "Medium" }); setShowAdd(false);
  }

  return (
    <ScrollView style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
      {/* Progress ring hero */}
      <View style={[{ backgroundColor: t.isDark ? "#1C1C1E" : "#FFFFFF", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 0.5, borderColor: t.border, flexDirection: "row", alignItems: "center", gap: 16 }, t.shadow]}>
        <View style={{ position: "relative" }}>
          <ProgressRing value={sgPct} size={64} stroke={6} color={t.green}/>
          <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: t.labelPrimary }}>{sgPct}%</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          {sg.description && <Text style={{ fontSize: 13, color: t.inkThird, marginBottom: 10 }}>{sg.description}</Text>}
          <View style={{ flexDirection: "row", gap: 14 }}>
            {[{ v: sgTasks.length, l: "Total", c: t.blue }, { v: done, l: "Done", c: t.green }, { v: sgTasks.length - done, l: "Left", c: t.amber }].map(({ v, l, c }) => (
              <View key={l} style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 20, fontWeight: "700", color: c }}>{v}</Text>
                <Text style={{ fontSize: 10, color: t.inkThird }}>{l}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Segmented filter */}
      <SegmentedControl
        options={[{ value: "all", label: "All" }, { value: "pending", label: "Pending" }, { value: "completed", label: "Done" }]}
        value={filter} onChange={setFilter}/>

      {/* Task list */}
      <GroupCard style={{ marginBottom: 8 }}>
        {sorted.length === 0 && (
          <View style={{ paddingVertical: 28, paddingHorizontal: 16, alignItems: "center", gap: 10 }}>
            <ListTodo size={28} color={t.inkThird}/>
            <Text style={{ color: t.inkThird, fontSize: 14 }}>No tasks here</Text>
          </View>
        )}
        {sorted.map((tk, i) => (
          <View key={tk.id}>
            <View style={{ paddingVertical: 13, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
              {/* iOS-style checkbox */}
              <TouchableOpacity onPress={() => dispatch({ type: "TOGGLE_TASK", id: tk.id })} style={{
                width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: tk.status === "completed" ? t.green : t.border,
                backgroundColor: tk.status === "completed" ? t.green : "transparent",
                alignItems: "center", justifyContent: "center"
              }}>
                {tk.status === "completed" && <Check size={14} color="#fff" strokeWidth={2.5}/>}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16, fontWeight: "400",
                  color: tk.status === "completed" ? t.inkThird : t.labelPrimary,
                  textDecorationLine: tk.status === "completed" ? "line-through" : "none",
                }}>{tk.name}</Text>
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                  <PriorityChip priority={tk.priority}/>
                  {tk.dueDate && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Clock size={10} color={t.inkThird}/>
                      <Text style={{ fontSize: 11, color: t.inkThird }}>{tk.dueDate}</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => dispatch({ type: "DELETE_TASK", id: tk.id })} style={{ padding: 4 }}>
                <Trash2 size={15} color={t.red}/>
              </TouchableOpacity>
            </View>
            {i < sorted.length - 1 && <RowSep/>}
          </View>
        ))}
        <FullSep/>
        <NewItemRow label="New Task" onClick={() => setShowAdd(true)}/>
      </GroupCard>

      <Sheet title="New Task" visible={showAdd} onClose={() => setShowAdd(false)}>
        <AppleInput label="Task Name" icon={ListTodo} placeholder="e.g. Learn Helm" value={form.name} onChangeText={t => setForm({ ...form, name: t })}/>
        <AppleInput label="Notes" icon={AlignLeft} placeholder="Optional" value={form.notes} onChangeText={t => setForm({ ...form, notes: t })}/>
        <AppleInput label="Due Date" icon={Clock} placeholder="YYYY-MM-DD" value={form.dueDate} onChangeText={t => setForm({ ...form, dueDate: t })}/>
        <AppleSelect label="Priority" icon={Flag} value={form.priority} options={["Low", "Medium", "High"]} onChange={val => setForm({ ...form, priority: val })}/>
        <SheetBtn onClick={add} icon={Plus}>Add Task</SheetBtn>
      </Sheet>

      {/* Delete Focus Area button */}
      <TouchableOpacity 
        onPress={() => {
          Alert.alert(
            "Delete Focus Area",
            "Are you sure you want to delete this focus area and all its tasks? This action cannot be undone.",
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Delete", 
                style: "destructive", 
                onPress: () => {
                  dispatch({ type: "DELETE_SUBGOAL", id: sg.id });
                  goBack();
                } 
              }
            ]
          );
        }}
        style={{
          marginTop: 24,
          padding: 14,
          backgroundColor: t.red + "15",
          borderRadius: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderWidth: 1,
          borderColor: t.red + "30"
        }}
      >
        <Trash2 size={16} color={t.red}/>
        <Text style={{ color: t.red, fontWeight: "600", fontSize: 15 }}>Delete Focus Area</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN: SEARCH
// ─────────────────────────────────────────────────────────────
function SearchScreen({ state, navigate }) {
  const t = useTheme();
  const [q, setQ] = useState("");
  const { goals, subGoals, tasks } = state;

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
    <ScrollView style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
      {/* Search bar */}
      <View style={{ position: "relative", marginBottom: 20 }}>
        <View style={{
          backgroundColor: t.isDark ? "#1C1C1E" : "#FFFFFF",
          borderWidth: 0.5,
          borderColor: t.border,
          borderRadius: 12,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
        }}>
          <Search size={15} color={t.inkThird} style={{ marginRight: 8 }}/>
          <TextInput value={q} onChangeText={setQ} placeholder="Search" placeholderTextColor={t.inkThird}
            style={{ flex: 1, color: t.labelPrimary, paddingVertical: 11, fontSize: 16 }}/>
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setQ("")} style={{ backgroundColor: t.fillSecondary, borderRadius: 10, width: 20, height: 20, alignItems: "center", justifyContent: "center" }}>
              <X size={11} color={t.inkThird} strokeWidth={2.5}/>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!q && (
        <View style={{ alignItems: "center", paddingTop: 60, gap: 10 }}>
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: t.fillTertiary, alignItems: "center", justifyContent: "center" }}>
            <Search size={26} color={t.inkThird}/>
          </View>
          <Text style={{ fontSize: 17, fontWeight: "600", color: t.labelPrimary }}>Search Everything</Text>
          <Text style={{ fontSize: 14, color: t.inkThird, maxWidth: 220, lineHeight: 20, textAlign: "center" }}>Find goals, focus areas and tasks instantly</Text>
        </View>
      )}

      {q.trim().length > 0 && !hasResults && (
        <View style={{ alignItems: "center", paddingTop: 60, gap: 8 }}>
          <Search size={28} color={t.inkThird}/>
          <Text style={{ fontSize: 15, color: t.inkSecond }}>No results for "{q}"</Text>
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
                    <TouchableOpacity onPress={() => navigate("goalDetail", { goalId: g.id })} style={{ padding: 13, flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.red + "20", alignItems: "center", justifyContent: "center" }}>
                        <Target size={15} color={t.red}/>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "500", color: t.labelPrimary }}>{g.name}</Text>
                        {g.description && <Text style={{ fontSize: 12, color: t.inkThird, marginTop: 1 }}>{g.description}</Text>}
                      </View>
                      <Chevron/>
                    </TouchableOpacity>
                    {i < results.goals.length - 1 && <FullSep/>}
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
                    <TouchableOpacity onPress={() => navigate("subGoalDetail", { subGoalId: s.id })} style={{ padding: 13, flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.green + "20", alignItems: "center", justifyContent: "center" }}>
                        <Layers size={15} color={t.green}/>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "500", color: t.labelPrimary }}>{s.name}</Text>
                        {s.description && <Text style={{ fontSize: 12, color: t.inkThird, marginTop: 1 }}>{s.description}</Text>}
                      </View>
                      <Chevron/>
                    </TouchableOpacity>
                    {i < results.subGoals.length - 1 && <FullSep/>}
                  </View>
                ))}
              </GroupCard>
            </View>
          )}

          {results.tasks.length > 0 && (
            <View>
              <SectionHeader>Tasks</SectionHeader>
              <GroupCard style={{ marginBottom: 14 }}>
                {results.tasks.map((tk, i) => (
                  <View key={tk.id}>
                    <View style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: tk.status === "completed" ? t.green : t.border, backgroundColor: tk.status === "completed" ? t.green : "transparent", alignItems: "center", justifyContent: "center" }}>
                        {tk.status === "completed" && <Check size={12} color="#fff" strokeWidth={2.5}/>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "400", color: tk.status === "completed" ? t.inkThird : t.labelPrimary, textDecorationLine: tk.status === "completed" ? "line-through" : "none" }}>{tk.name}</Text>
                        <View style={{ marginTop: 3 }}><PriorityChip priority={tk.priority}/></View>
                      </View>
                    </View>
                    {i < results.tasks.length - 1 && <RowSep/>}
                  </View>
                ))}
              </GroupCard>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN: CALENDAR
// ─────────────────────────────────────────────────────────────
function CalendarScreen({ state }) {
  const t = useTheme();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(null);
  const { goals, tasks } = state;

  const monthName = new Date(year, month).toLocaleString("default", { month: "long" });
  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMo  = new Date(year, month + 1, 0).getDate();

  const eventDates = useMemo(() => {
    const map = {};
    const pfx = `${year}-${String(month+1).padStart(2,"0")}`;
    goals.forEach(g => {
      if (g.targetDate?.startsWith(pfx)) {
        const d = parseInt(g.targetDate.slice(8));
        map[d] = [...(map[d]||[]), { type:"goal", name: g.name }];
      }
    });
    tasks.forEach(tk => {
      if (tk.dueDate?.startsWith(pfx)) {
        const d = parseInt(tk.dueDate.slice(8));
        map[d] = [...(map[d]||[]), { type:"task", name: tk.name, status: tk.status }];
      }
    });
    return map;
  }, [year, month, goals, tasks]);

  // Calendar cells generation (including leading empty blocks)
  const cells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDay; i++) {
      arr.push({ blank: true, key: `b${i}` });
    }
    for (let d = 1; d <= daysInMo; d++) {
      arr.push({ blank: false, day: d, key: `d${d}` });
    }
    return arr;
  }, [firstDay, daysInMo]);

  return (
    <ScrollView style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
      {/* Calendar card */}
      <View style={[{ backgroundColor: t.isDark ? "#1C1C1E" : "#FFFFFF", borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: t.border }, t.shadow]}>
        {/* Month nav */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <TouchableOpacity onPress={() => { if (month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }}
            style={{ backgroundColor: t.fillTertiary, borderRadius: 16, width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={16} color={t.blue}/>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <CalendarDays size={14} color={t.blue}/>
            <Text style={{ fontSize: 16, fontWeight: "600", color: t.labelPrimary }}>{monthName} {year}</Text>
          </View>
          <TouchableOpacity onPress={() => { if (month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }}
            style={{ backgroundColor: t.fillTertiary, borderRadius: 16, width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
            <ChevronRight size={16} color={t.blue}/>
          </TouchableOpacity>
        </View>

        {/* Day labels */}
        <View style={{ flexDirection: "row", marginBottom: 4 }}>
          {["S","M","T","W","T","F","S"].map((d,i) => (
            <View key={i} style={{ flex: 1, alignItems: "center", paddingVertical: 3 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: t.inkThird, letterSpacing: 0.4 }}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Dates */}
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {cells.map((cell) => {
            if (cell.blank) {
              return <View key={cell.key} style={{ width: "14.28%", height: 38 }}/>;
            }
            const d = cell.day;
            const isToday = d===now.getDate() && month===now.getMonth() && year===now.getFullYear();
            const hasDot  = !!eventDates[d];
            const isSel   = selected===d;
            return (
              <TouchableOpacity key={cell.key} onPress={() => setSelected(isSel?null:d)} style={{
                width: "14.28%",
                alignItems: "center",
                paddingVertical: 6,
                borderRadius: 10,
                backgroundColor: isSel ? t.blue : "transparent",
              }}>
                <Text style={{ fontSize: 15, fontWeight: isToday ? "700" : "400", color: isSel ? "#fff" : isToday ? t.blue : t.labelPrimary }}>{d}</Text>
                {hasDot && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isSel ? "rgba(255,255,255,0.7)" : t.blue, marginTop: 2 }}/>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Selected events */}
      {selected && (
        <View>
          <SectionHeader>{monthName} {selected}</SectionHeader>
          {(eventDates[selected]||[]).length===0
            ? <GroupCard><View style={{ padding: 22, alignItems: "center", gap: 8 }}><CalendarDays size={24} color={t.inkThird}/><Text style={{ color: t.inkThird, fontSize: 14 }}>Nothing scheduled</Text></View></GroupCard>
            : <GroupCard>
                {(eventDates[selected]||[]).map((ev, i, arr) => (
                  <View key={i}>
                    <View style={{ padding: 13, flexDirection: "row", gap: 12, alignItems: "center" }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: ev.type==="goal"?t.red+"20":t.blue+"20", alignItems: "center", justifyContent: "center" }}>
                        {ev.type==="goal" ? <Target size={16} color={t.red}/> : ev.status==="completed" ? <CheckCircle2 size={16} color={t.green}/> : <ListTodo size={16} color={t.blue}/>}
                      </View>
                      <View>
                        <Text style={{ fontSize: 15, fontWeight: "500", color: t.labelPrimary }}>{ev.name}</Text>
                        <Text style={{ fontSize: 12, color: t.inkThird, marginTop: 2 }}>{ev.type==="goal"?"Goal deadline":"Task due"}</Text>
                      </View>
                    </View>
                    {i < arr.length-1 && <FullSep/>}
                  </View>
                ))}
              </GroupCard>
          }
        </View>
      )}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN: STATISTICS
// ─────────────────────────────────────────────────────────────
function StatisticsScreen({ state }) {
  const t = useTheme();
  const { goals, subGoals, tasks } = state;
  const done    = tasks.filter(tk => tk.status==="completed").length;
  const pending = tasks.length - done;
  const months  = ["Jan","Feb","Mar","Apr","May","Jun","Jul"];
  const bars    = [22, 38, 47, 35, 61, done, 0];
  const maxBar  = Math.max(...bars, 1);
  const colors  = [t.red, t.green, t.blue, t.amber, t.indigo];

  return (
    <ScrollView style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
      {/* KPI 2-up */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
        {[
          { icon:CheckCircle2, label:"Completed", value:done,    color:t.green },
          { icon:CircleIcon,   label:"Pending",   value:pending, color:t.amber },
        ].map(({ icon:Icon, label, value, color }) => (
          <View key={label} style={[{ flex: 1, backgroundColor: t.isDark ? "#1C1C1E" : "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: t.border }, t.shadow]}>
            <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: color+"20", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Icon size={16} color={color}/>
            </View>
            <Text style={{ fontSize: 32, fontWeight: "700", color: t.labelPrimary, lineHeight: 32 }}>{value}</Text>
            <Text style={{ fontSize: 12, color: t.inkThird, fontWeight: "500", marginTop: 4 }}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Bar chart */}
      <View style={[{ backgroundColor: t.isDark ? "#1C1C1E" : "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 0.5, borderColor: t.border }, t.shadow]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <TrendingUp size={14} color={t.blue}/>
          <Text style={{ fontSize: 13, fontWeight: "600", color: t.labelPrimary }}>Monthly Completions</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: 88 }}>
          {bars.map((v, i) => (
            <View key={i} style={{ flex: 1, alignItems: "center", gap: 5 }}>
              <View style={{ width: "100%", borderRadius: 5, backgroundColor: i===5?t.blue:t.fillTertiary, height: `${(v/maxBar)*100}%`, minHeight: 4 }}/>
              <Text style={{ fontSize: 9, color: i===5?t.blue:t.inkThird, fontWeight: i===5?"700":"400" }}>{months[i]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Per-goal */}
      <SectionHeader>Goal Breakdown</SectionHeader>
      <GroupCard>
        {goals.map((g, i) => {
          const gSubs  = subGoals.filter(s => s.goalId===g.id);
          const gTasks = tasks.filter(tk => gSubs.some(s => s.id===tk.subGoalId));
          const gDone  = gTasks.filter(tk => tk.status==="completed").length;
          const gPct   = pct(gDone, gTasks.length);
          const color  = colors[i % colors.length];
          return (
            <View key={g.id}>
              <View style={{ padding: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: color+"20", alignItems: "center", justifyContent: "center" }}>
                      <Target size={13} color={color}/>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: "500", color: t.labelPrimary }}>{g.name}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: t.inkSecond }}>{gPct}%</Text>
                </View>
                <ProgressBar value={gPct} color={color} height={5}/>
                <View style={{ flexDirection: "row", gap: 12, marginTop: 7 }}>
                  <Text style={{ fontSize: 11, color: t.green, fontWeight: "500" }}>✓ {gDone} done</Text>
                  <Text style={{ fontSize: 11, color: t.inkThird }}>○ {gTasks.length-gDone} left</Text>
                </View>
              </View>
              {i < goals.length-1 && <FullSep/>}
            </View>
          );
        })}
      </GroupCard>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// STATE REDUCER
// ─────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case "SET_STATE":   return action.state;
    case "ADD_GOAL":    return { ...state, goals:    [...state.goals,    action.goal]    };
    case "ADD_SUBGOAL": return { ...state, subGoals: [...state.subGoals, action.subGoal] };
    case "ADD_TASK":    return { ...state, tasks:    [...state.tasks,    action.task]    };
    case "DELETE_TASK": return { ...state, tasks: state.tasks.filter(t => t.id!==action.id) };
    case "TOGGLE_TASK": return { ...state, tasks: state.tasks.map(t => t.id!==action.id ? t : { ...t, status: t.status==="completed"?"pending":"completed", completedDate: t.status==="completed"?null:new Date().toISOString().slice(0,10) }) };
    case "DELETE_GOAL":
      return {
        ...state,
        goals: state.goals.filter(g => g.id !== action.id),
        subGoals: state.subGoals.filter(s => s.goalId !== action.id),
        tasks: state.tasks.filter(t => !state.subGoals.some(s => s.goalId === action.id && s.id === t.subGoalId))
      };
    case "DELETE_SUBGOAL":
      return {
        ...state,
        subGoals: state.subGoals.filter(s => s.id !== action.id),
        tasks: state.tasks.filter(t => t.subGoalId !== action.id)
      };
    default: return state;
  }
}

const TABS = [
  { id:"dashboard", label:"Summary",  Icon:LayoutDashboard },
  { id:"goals",     label:"Goals",    Icon:Target          },
  { id:"search",    label:"Search",   Icon:Search          },
  { id:"calendar",  label:"Calendar", Icon:CalendarDays    },
  { id:"stats",     label:"Stats",    Icon:BarChart2       },
];
const TAB_TITLES = { dashboard:"Rukz", goals:"Goals", search:"Search", calendar:"Calendar", stats:"Statistics" };

// ─────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [fontsLoaded] = useFonts({
    Caveat_700Bold,
  });
  const [dark, setDark]         = useState(true);
  const theme                   = makeTheme(dark);
  const [appState, setAppState] = useState(SEED);
  const [tab, setTab]           = useState("dashboard");
  const [stack, setStack]       = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize and load persistent local data on start
  useEffect(() => {
    const init = async () => {
      const data = await loadLocalData();
      setAppState(data);
    };
    init();
  }, []);

  // Handle physical Android back button presses
  useEffect(() => {
    const onBackPress = () => {
      if (stack.length > 0) {
        goBack();
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [stack]);

  const dispatch = action => {
    setAppState(s => {
      const next = reducer(s, action);
      saveLocalData(next);
      return next;
    });
  };

  const navigate = (screen, params={}) => setStack(s => [...s, { screen, params }]);
  const goBack   = ()            => setStack(s => s.slice(0,-1));
  const current  = stack[stack.length-1];

  const headerTitle = current
    ? current.screen==="goalDetail"    ? (appState.goals.find(g => g.id===current.params?.goalId)?.name||"Goal")
    : current.screen==="subGoalDetail" ? (appState.subGoals.find(s => s.id===current.params?.subGoalId)?.name||"Area")
    : "" : TAB_TITLES[tab];

  // Backup & sharing operations
  const handleExport = async () => {
    try {
      const fileUri = `${FileSystem.documentDirectory}productivity_backup.json`;
      const jsonString = JSON.stringify(appState, null, 2);
      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "Export Productivity Backup",
          UTI: "public.json",
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device.");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not export database backup.");
    }
  };

  const handleImport = async () => {
    Alert.alert(
      "Confirm Import",
      "This will replace all your current data on this phone. Do you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import & Overwrite",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: "application/json",
                copyToCacheDirectory: true,
              });

              if (result.canceled || !result.assets || result.assets.length === 0) return;

              const pickedFile = result.assets[0];
              const content = await FileSystem.readAsStringAsync(pickedFile.uri, {
                encoding: FileSystem.EncodingType.UTF8,
              });

              const parsed = JSON.parse(content);
              if (parsed.goals && parsed.subGoals && parsed.tasks) {
                dispatch({ type: "SET_STATE", state: parsed });
                setShowSettings(false);
                Alert.alert("Success", "Data imported successfully.");
              } else {
                Alert.alert("Error", "Invalid backup file structure.");
              }
            } catch (e) {
              console.error(e);
              Alert.alert("Error", "Could not read backup file.");
            }
          }
        }
      ]
    );
  };

  const handleExcelImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/csv"
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const pickedFile = result.assets[0];
      const contentBase64 = await FileSystem.readAsStringAsync(pickedFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Parse spreadsheet using SheetJS
      const workbook = XLSX.read(contentBase64, { type: "base64" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet);

      if (rows.length === 0) {
        Alert.alert("Import Error", "The selected file contains no data rows.");
        return;
      }

      let tempGoals = [...appState.goals];
      let tempSubGoals = [...appState.subGoals];
      let tempTasks = [...appState.tasks];

      const generateId = () => Date.now() + Math.random();

      let goalsAdded = 0;
      let subGoalsAdded = 0;
      let tasksAdded = 0;

      rows.forEach((row) => {
        // Support flexible header names
        const goalName = row["Goal Name"] || row["GoalName"] || row["goal_name"] || row["Goal"];
        const goalDesc = row["Goal Description"] || row["GoalDescription"] || row["goal_description"] || "";
        const goalTarget = row["Goal Target Date"] || row["GoalTargetDate"] || row["goal_target_date"] || "";

        const areaName = row["Area Name"] || row["AreaName"] || row["area_name"] || row["Area"] || row["Focus Area"] || row["FocusArea"];
        const areaDesc = row["Area Description"] || row["AreaDescription"] || row["area_description"] || "";

        const taskName = row["Task Name"] || row["TaskName"] || row["task_name"] || row["Task"];
        const taskNotes = row["Task Notes"] || row["TaskNotes"] || row["task_notes"] || "";
        const taskDue = row["Task Due Date"] || row["TaskDueDate"] || row["task_due_date"] || "";
        const taskPriority = row["Task Priority"] || row["TaskPriority"] || row["task_priority"] || "Medium";

        if (!goalName) return;

        // 1. Find or create Goal
        let goal = tempGoals.find(g => g.name.trim().toLowerCase() === goalName.trim().toLowerCase());
        if (!goal) {
          goal = {
            id: generateId(),
            name: goalName.trim(),
            description: goalDesc.trim(),
            targetDate: goalTarget.trim(),
            status: "active",
            createdDate: new Date().toISOString().slice(0, 10),
          };
          tempGoals.push(goal);
          goalsAdded++;
        }

        // 2. Find or create Area under Goal
        let subGoal = null;
        if (areaName) {
          subGoal = tempSubGoals.find(s =>
            s.goalId === goal.id && s.name.trim().toLowerCase() === areaName.trim().toLowerCase()
          );
          if (!subGoal) {
            subGoal = {
              id: generateId(),
              goalId: goal.id,
              name: areaName.trim(),
              description: areaDesc.trim(),
            };
            tempSubGoals.push(subGoal);
            subGoalsAdded++;
          }
        }

        // 3. Create Task under Area
        if (taskName && subGoal) {
          const task = {
            id: generateId(),
            subGoalId: subGoal.id,
            name: taskName.trim(),
            notes: taskNotes.trim(),
            dueDate: taskDue.trim(),
            priority: ["High", "Medium", "Low"].includes(taskPriority.trim()) ? taskPriority.trim() : "Medium",
            status: "pending",
            completedDate: null,
          };
          tempTasks.push(task);
          tasksAdded++;
        }
      });

      const newState = {
        goals: tempGoals,
        subGoals: tempSubGoals,
        tasks: tempTasks
      };

      dispatch({ type: "SET_STATE", state: newState });
      setShowSettings(false);

      Alert.alert(
        "Import Complete",
        `Successfully processed spreadsheet.\n\nAdded:\n- ${goalsAdded} new Goal(s)\n- ${subGoalsAdded} new Focus Area(s)\n- ${tasksAdded} new Task(s)`
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Import Error", "Failed to parse the Excel file. Verify that the file and header columns are formatted correctly.");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const fileUri = `${FileSystem.documentDirectory}goals_template.csv`;
      const csvString = 
        "Goal Name,Goal Description,Goal Target Date,Area Name,Area Description,Task Name,Task Notes,Task Due Date,Task Priority\n" +
        "Health & Fitness,Improve cardiovascular health and strength,2026-12-31,Cardio training,Running and high-intensity interval training,Morning Run,5km outdoor jog in the park,2026-07-01,Medium\n" +
        "Health & Fitness,Improve cardiovascular health and strength,2026-12-31,Cardio training,Running and high-intensity interval training,HIIT Session,20-minute indoor tabata workout,2026-07-03,High\n" +
        "Career Development,Learn cloud native technologies and master kubernetes,2026-12-31,Kubernetes Mastery,Get certified and run production clusters,Read Kubernetes Docs,Study Pod lifecycle and services,2026-07-10,Medium";
        
      await FileSystem.writeAsStringAsync(fileUri, csvString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Download Goals Template",
          UTI: "public.comma-separated-values-text",
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device.");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not generate sample template.");
    }
  };

  function renderScreen() {
    if (current) {
      if (current.screen==="goalDetail")    return <GoalDetail    state={appState} dispatch={dispatch} params={current.params} navigate={navigate} goBack={goBack}/>;
      if (current.screen==="subGoalDetail") return <SubGoalDetail state={appState} dispatch={dispatch} params={current.params} goBack={goBack}/>;
    }
    switch(tab) {
      case "dashboard": return <Dashboard   state={appState} setTab={setTab} setShowSettings={setShowSettings} handleDownloadTemplate={handleDownloadTemplate} fontsLoaded={fontsLoaded}/>;
      case "goals":     return <GoalsScreen state={appState} dispatch={dispatch} navigate={navigate}/>;
      case "search":    return <SearchScreen state={appState} navigate={navigate}/>;
      case "calendar":  return <CalendarScreen state={appState}/>;
      case "stats":     return <StatisticsScreen  state={appState}/>;
    }
  }

  return (
    <ThemeCtx.Provider value={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <StatusBar style={dark ? "light" : "dark"} />

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10 }}>
          {current ? (
            <TouchableOpacity onPress={goBack} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <ChevronLeft size={22} color={theme.blue} strokeWidth={2}/>
              <Text style={{ fontSize: 17, color: theme.blue }}>Back</Text>
            </TouchableOpacity>
          ) : null}
          <Text numberOfLines={1} style={{
            fontSize: headerTitle === "Rukz" ? 34 : 28,
            fontWeight: "700",
            color: theme.labelPrimary,
            flex: 1,
            letterSpacing: headerTitle === "Rukz" ? 0 : -0.8,
            fontFamily: headerTitle === "Rukz" && fontsLoaded ? "Caveat_700Bold" : Platform.select({ ios: "Snell Roundhand", android: "sans-serif", default: "sans-serif" }),
            fontStyle: headerTitle === "Rukz" && !fontsLoaded ? "italic" : "normal"
          }}>
            {headerTitle}
          </Text>
          {!current && (
            <TouchableOpacity onPress={() => setShowSettings(true)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.fillTertiary, alignItems: "center", justifyContent: "center" }}>
              <User size={16} color={theme.inkSecond}/>
            </TouchableOpacity>
          )}
        </View>

        <FullSep/>

        {/* Content */}
        <View style={{ flex: 1, backgroundColor: theme.groupedBg }}>
          <View style={{ flex: 1, paddingTop: 8 }}>{renderScreen()}</View>
        </View>

        {/* Tab Bar */}
        {!current && (
          <View style={{
            backgroundColor: dark ? "rgba(28,28,30,0.92)" : "rgba(249,249,249,0.92)",
            borderTopWidth: 0.5,
            borderTopColor: theme.separator,
            paddingVertical: 8,
            flexDirection: "row"
          }}>
            {TABS.map(({ id, label, Icon }) => {
              const active = tab===id;
              return (
                <TouchableOpacity key={id} onPress={() => { setTab(id); setStack([]); }} style={{ flex: 1, alignItems: "center", gap: 3, paddingVertical: 4 }}>
                  <Icon size={22} color={active ? theme.blue : theme.inkThird} strokeWidth={active ? 2 : 1.7}/>
                  <Text style={{ fontSize: 10, fontWeight: active ? "600" : "400", color: active ? theme.blue : theme.inkThird }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Settings / Sync Drawer Sheet */}
        <Sheet title="Settings & Sync" visible={showSettings} onClose={() => setShowSettings(false)}>
          <View style={{ gap: 16 }}>
            <SectionHeader>Theme Preferences</SectionHeader>
            <GroupCard>
              <TouchableOpacity onPress={() => setDark(!dark)} style={{ padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  {dark ? <Sun size={18} color={theme.amber}/> : <Moon size={18} color={theme.indigo}/>}
                  <Text style={{ fontSize: 16, color: theme.labelPrimary }}>{dark ? "Light Mode" : "Dark Mode"}</Text>
                </View>
                <Chevron/>
              </TouchableOpacity>
            </GroupCard>

            <SectionHeader>Backup & Data Migration</SectionHeader>
            <Text style={{ fontSize: 13, color: theme.inkThird, lineHeight: 18, paddingHorizontal: 4 }}>
              Since this app is entirely backend-free, your data is saved only on this phone. Export your data to transfer it to another device or save a backup.
            </Text>

            <GroupCard>
              {/* Export Button */}
              <TouchableOpacity onPress={handleExport} style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.blue + "20", alignItems: "center", justifyContent: "center" }}>
                  <Share2 size={16} color={theme.blue}/>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, color: theme.labelPrimary, fontWeight: "500" }}>Export Data</Text>
                  <Text style={{ fontSize: 12, color: theme.inkThird, marginTop: 2 }}>Save or share your backup JSON file</Text>
                </View>
                <Chevron/>
              </TouchableOpacity>

              <FullSep/>

              {/* Import Button */}
              <TouchableOpacity onPress={handleImport} style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.green + "20", alignItems: "center", justifyContent: "center" }}>
                  <Download size={16} color={theme.green}/>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, color: theme.labelPrimary, fontWeight: "500" }}>Import JSON</Text>
                  <Text style={{ fontSize: 12, color: theme.inkThird, marginTop: 2 }}>Restore or sync data from a JSON file</Text>
                </View>
                <Chevron/>
              </TouchableOpacity>

              <FullSep/>

              {/* Excel Import Button */}
              <TouchableOpacity onPress={handleExcelImport} style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.indigo + "20", alignItems: "center", justifyContent: "center" }}>
                  <Upload size={16} color={theme.indigo}/>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, color: theme.labelPrimary, fontWeight: "500" }}>Upload Excel / CSV</Text>
                  <Text style={{ fontSize: 12, color: theme.inkThird, marginTop: 2 }}>Bulk import goals, areas, and tasks</Text>
                </View>
                <Chevron/>
              </TouchableOpacity>

              <FullSep/>

              {/* Download CSV Template Button */}
              <TouchableOpacity onPress={handleDownloadTemplate} style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.amber + "20", alignItems: "center", justifyContent: "center" }}>
                  <Download size={16} color={theme.amber}/>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, color: theme.labelPrimary, fontWeight: "500" }}>Download CSV Template</Text>
                  <Text style={{ fontSize: 12, color: theme.inkThird, marginTop: 2 }}>Get the sample structure for bulk uploads</Text>
                </View>
                <Chevron/>
              </TouchableOpacity>
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
