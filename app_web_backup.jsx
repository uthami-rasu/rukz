import { useState, useMemo, createContext, useContext, useEffect } from "react";
import {
  LayoutDashboard, Target, Search, CalendarDays, BarChart2,
  ChevronLeft, ChevronRight, Plus, X, Check, Trash2,
  Flag, Clock, AlignLeft, Sun, Moon, Circle, CheckCircle2,
  TrendingUp, Layers, ListTodo, Award, Flame, ArrowRight,
  SlidersHorizontal, User, Sparkles, Zap, BookOpen
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// THEME — Apple system-level colour tokens
// ─────────────────────────────────────────────────────────────
const ThemeCtx = createContext(null);
const useTheme = () => useContext(ThemeCtx);

function makeTheme(dark) {
  return dark ? {
    isDark: true,
    // Backgrounds — Apple layered system
    bg:             "#000000",
    bgSecond:       "#1C1C1E",
    bgTertiary:     "#2C2C2E",
    surface:        "#1C1C1E",
    card:           "#2C2C2E",
    cardRaised:     "#3A3A3C",
    groupedBg:      "#000000",
    insetCard:      "#1C1C1E",
    // Labels
    labelPrimary:   "#FFFFFF",
    labelSecondary: "#EBEBF5CC",   // 80% white
    labelTertiary:  "#EBEBF599",   // 60% white
    labelQuaternary:"#EBEBF54D",   // 30% white
    // Separators
    separator:      "#38383A",
    separatorOpaque:"#38383A",
    // Fills
    fillPrimary:    "#787880",
    fillSecondary:  "#78788033",
    fillTertiary:   "#7676801E",
    fillQuaternary: "#74748014",
    // System colors
    blue:           "#0A84FF",
    green:          "#30D158",
    red:            "#FF453A",
    amber:          "#FFD60A",
    indigo:         "#5E5CE6",
    // Ink aliases
    ink:            "#FFFFFF",
    inkSecond:      "#EBEBF5CC",
    inkThird:       "#EBEBF599",
    inkInverse:     "#000000",
    border:         "#38383A",
    pill:           "#3A3A3C",
    pillActive:     "#FFFFFF",
    pillText:       "#EBEBF5CC",
    pillTextAct:    "#000000",
    shadow:         "0 1px 3px rgba(0,0,0,0.6)",
    heroBg:         "linear-gradient(160deg,#1C1C1E 0%,#000000 100%)",
    phoneShadow:    "0 70px 140px rgba(0,0,0,.9), 0 0 0 0.5px #3A3A3C",
    stageBg:        "#090909",
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
    shadow:         "0 1px 3px rgba(0,0,0,.08), 0 1px 1px rgba(0,0,0,.04)",
    heroBg:         "linear-gradient(160deg,#FFFFFF 0%,#F2F2F7 100%)",
    phoneShadow:    "0 40px 80px rgba(0,0,0,.18), 0 0 0 0.5px #C6C6C8",
    stageBg:        "#E5E5EA",
  };
}

// ─────────────────────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────────────────────
const SEED = {
  goals: [
    { id: 1, name: "Career Growth",   description: "Level up technical & leadership skills", targetDate: "2026-12-31", status: "active", createdDate: "2026-01-01" },
    { id: 2, name: "Health & Fitness",description: "Build sustainable wellness habits",       targetDate: "2026-09-30", status: "active", createdDate: "2026-01-01" },
    { id: 3, name: "Side Project",    description: "Ship a SaaS product",                    targetDate: "2026-10-31", status: "active", createdDate: "2026-02-01" },
  ],
  subGoals: [
    { id: 1, goalId: 1, name: "Kubernetes", description: "Container orchestration mastery" },
    { id: 2, goalId: 1, name: "Terraform",  description: "Infrastructure as code" },
    { id: 3, goalId: 1, name: "AWS",        description: "Cloud platform essentials" },
    { id: 4, goalId: 2, name: "Cardio",     description: "Running & cycling" },
    { id: 5, goalId: 2, name: "Strength",   description: "Weight training" },
    { id: 6, goalId: 3, name: "MVP Build",  description: "Core feature set" },
    { id: 7, goalId: 3, name: "Marketing",  description: "Launch preparation" },
  ],
  tasks: [
    { id: 1,  subGoalId: 1, name: "Learn Pods",        notes: "", dueDate: "2026-07-15", priority: "High",   status: "completed", completedDate: "2026-06-10" },
    { id: 2,  subGoalId: 1, name: "Learn Services",    notes: "", dueDate: "2026-07-20", priority: "High",   status: "completed", completedDate: "2026-06-15" },
    { id: 3,  subGoalId: 1, name: "Learn Deployments", notes: "", dueDate: "2026-07-25", priority: "High",   status: "completed", completedDate: "2026-06-20" },
    { id: 4,  subGoalId: 1, name: "Learn Ingress",     notes: "", dueDate: "2026-08-01", priority: "Medium", status: "pending",   completedDate: null },
    { id: 5,  subGoalId: 1, name: "Learn Helm",        notes: "", dueDate: "2026-08-10", priority: "Medium", status: "pending",   completedDate: null },
    { id: 6,  subGoalId: 2, name: "Learn Providers",   notes: "", dueDate: "2026-07-30", priority: "High",   status: "completed", completedDate: "2026-06-18" },
    { id: 7,  subGoalId: 2, name: "Learn Modules",     notes: "", dueDate: "2026-08-05", priority: "High",   status: "completed", completedDate: "2026-06-22" },
    { id: 8,  subGoalId: 2, name: "Learn State",       notes: "", dueDate: "2026-08-15", priority: "Medium", status: "pending",   completedDate: null },
    { id: 9,  subGoalId: 3, name: "Learn IAM",         notes: "", dueDate: "2026-08-20", priority: "High",   status: "completed", completedDate: "2026-06-25" },
    { id: 10, subGoalId: 3, name: "Learn VPC",         notes: "", dueDate: "2026-08-25", priority: "High",   status: "pending",   completedDate: null },
    { id: 11, subGoalId: 4, name: "5 km run",          notes: "", dueDate: "2026-07-10", priority: "Medium", status: "completed", completedDate: "2026-06-05" },
    { id: 12, subGoalId: 4, name: "10 km run",         notes: "", dueDate: "2026-08-01", priority: "Medium", status: "pending",   completedDate: null },
    { id: 13, subGoalId: 5, name: "Bench 80 kg",       notes: "", dueDate: "2026-09-01", priority: "Medium", status: "pending",   completedDate: null },
    { id: 14, subGoalId: 6, name: "Auth system",       notes: "", dueDate: "2026-07-31", priority: "High",   status: "completed", completedDate: "2026-06-20" },
    { id: 15, subGoalId: 6, name: "Dashboard UI",      notes: "", dueDate: "2026-08-15", priority: "High",   status: "pending",   completedDate: null },
    { id: 16, subGoalId: 7, name: "Landing page",      notes: "", dueDate: "2026-09-01", priority: "Medium", status: "pending",   completedDate: null },
  ],
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function daysLeft() {
  const now = new Date();
  return Math.ceil((new Date(now.getFullYear(), 11, 31) - now) / 86400000);
}
function pct(done, total) { return total ? Math.round((done / total) * 100) : 0; }

// ─────────────────────────────────────────────────────────────
// DESIGN ATOMS
// ─────────────────────────────────────────────────────────────

/** Apple-style circular progress ring */
function ProgressRing({ value, size = 52, stroke = 4, color }) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const c = color || t.blue;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={t.fillTertiary} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)" }}/>
    </svg>
  );
}

/** Thin Apple-style progress bar */
function ProgressBar({ value, color, height = 4 }) {
  const t = useTheme();
  const c = color || t.blue;
  return (
    <div style={{ background: t.fillTertiary, borderRadius: 99, height, overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", background: c, borderRadius: 99, transition: "width 0.7s cubic-bezier(.4,0,.2,1)" }}/>
    </div>
  );
}

/** SF-style inset grouped separator */
function RowSep() {
  const t = useTheme();
  return <div style={{ height: "0.5px", background: t.separator, marginLeft: 52 }}/>;
}

function FullSep() {
  const t = useTheme();
  return <div style={{ height: "0.5px", background: t.separator }}/>;
}

/** Section header — Apple uppercase small caps */
function SectionHeader({ children }) {
  const t = useTheme();
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: t.inkThird, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6, marginTop: 22, paddingLeft: 4 }}>
      {children}
    </div>
  );
}

/** iOS-style segmented control */
function SegmentedControl({ options, value, onChange }) {
  const t = useTheme();
  return (
    <div style={{ background: t.fillTertiary, borderRadius: 9, padding: 2, display: "flex", gap: 2, marginBottom: 16 }}>
      {options.map(o => {
        const active = value === o.value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            flex: 1, padding: "6px 4px", borderRadius: 7,
            background: active ? (t.isDark ? "#636366" : "#FFFFFF") : "transparent",
            border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: active ? 600 : 400,
            color: active ? t.labelPrimary : t.inkSecond,
            boxShadow: active ? "0 1px 3px rgba(0,0,0,0.18)" : "none",
            transition: "all 0.18s ease",
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

/** Priority chip */
function PriorityChip({ priority }) {
  const t = useTheme();
  const map = {
    High:   { color: t.red,   bg: t.red   + "20" },
    Medium: { color: t.amber, bg: t.amber + "20" },
    Low:    { color: t.green, bg: t.green + "20" },
  };
  const s = map[priority];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: s.bg, borderRadius: 5, padding: "2px 7px" }}>
      <Flag size={9} color={s.color} fill={s.color}/>
      <span style={{ fontSize: 10, fontWeight: 600, color: s.color, letterSpacing: "0.02em" }}>{priority}</span>
    </span>
  );
}

/** Disclosure chevron */
function Chevron() {
  const t = useTheme();
  return <ChevronRight size={16} color={t.inkThird} strokeWidth={2}/>;
}

// ─────────────────────────────────────────────────────────────
// SHEET (bottom modal — Apple sheet style)
// ─────────────────────────────────────────────────────────────
function Sheet({ title, onClose, children }) {
  const t = useTheme();
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 80, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      {/* Scrim */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}/>
      {/* Sheet */}
      <div style={{ position: "relative", background: t.isDark ? "#1C1C1E" : "#F2F2F7", borderRadius: "16px 16px 0 0", padding: "0 0 34px", maxHeight: "92%", overflowY: "auto", boxShadow: "0 -2px 20px rgba(0,0,0,0.3)" }}>
        {/* Grabber */}
        <div style={{ width: 36, height: 5, background: t.isDark ? "#48484A" : "#D1D1D6", borderRadius: 99, margin: "10px auto 0" }}/>
        {/* Title bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 12px" }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: t.labelPrimary, letterSpacing: "-0.01em" }}>{title}</span>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 99, background: t.isDark ? "#3A3A3C" : "#E5E5EA", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={13} color={t.inkSecond} strokeWidth={2.5}/>
          </button>
        </div>
        <FullSep/>
        <div style={{ padding: "16px 16px 0" }}>{children}</div>
      </div>
    </div>
  );
}

/** Apple-style inset text field */
function AppleInput({ label, icon: Icon, ...props }) {
  const t = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ fontSize: 12, fontWeight: 500, color: t.inkThird, marginBottom: 5, paddingLeft: 2 }}>{label}</div>}
      <div style={{ position: "relative", background: t.isDark ? "#2C2C2E" : "#FFFFFF", borderRadius: 10, border: `1px solid ${focus ? t.blue : t.isDark ? "#3A3A3C" : "#D1D1D6"}`, transition: "border-color 0.15s", overflow: "hidden" }}>
        {Icon && <Icon size={15} color={t.inkThird} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}/>}
        <input {...props} onFocus={e => { setFocus(true); props.onFocus?.(e); }} onBlur={e => { setFocus(false); props.onBlur?.(e); }}
          style={{ width: "100%", background: "transparent", border: "none", color: t.labelPrimary, padding: Icon ? "11px 12px 11px 36px" : "11px 12px", fontSize: 15, outline: "none", fontFamily: "inherit", boxSizing: "border-box", ...props.style }}/>
      </div>
    </div>
  );
}

function AppleSelect({ label, icon: Icon, children, ...props }) {
  const t = useTheme();
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ fontSize: 12, fontWeight: 500, color: t.inkThird, marginBottom: 5, paddingLeft: 2 }}>{label}</div>}
      <div style={{ position: "relative", background: t.isDark ? "#2C2C2E" : "#FFFFFF", borderRadius: 10, border: `1px solid ${t.isDark ? "#3A3A3C" : "#D1D1D6"}` }}>
        {Icon && <Icon size={15} color={t.inkThird} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}/>}
        <select {...props} style={{ width: "100%", background: "transparent", border: "none", color: t.labelPrimary, padding: Icon ? "11px 12px 11px 36px" : "11px 12px", fontSize: 15, outline: "none", fontFamily: "inherit", appearance: "none" }}>
          {children}
        </select>
      </div>
    </div>
  );
}

/** Apple blue primary button */
function SheetBtn({ children, onClick, icon: Icon }) {
  const t = useTheme();
  return (
    <button onClick={onClick} style={{ width: "100%", background: t.blue, color: "#FFFFFF", border: "none", borderRadius: 14, padding: "15px", fontSize: 17, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, letterSpacing: "-0.01em", transition: "opacity 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
      {Icon && <Icon size={17}/>}{children}
    </button>
  );
}

/** iOS-style "new item" row */
function NewItemRow({ label, onClick }) {
  const t = useTheme();
  return (
    <button onClick={onClick} style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12, transition: "background 0.1s" }}
      onMouseEnter={e => e.currentTarget.style.background = t.fillTertiary}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <div style={{ width: 28, height: 28, borderRadius: 99, background: t.blue, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Plus size={16} color="#fff" strokeWidth={2.5}/>
      </div>
      <span style={{ fontSize: 16, color: t.blue, fontWeight: 400 }}>{label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// GROUPED INSET LIST CARD (Apple Settings style)
// ─────────────────────────────────────────────────────────────
function GroupCard({ children, style: s = {} }) {
  const t = useTheme();
  return (
    <div style={{ background: t.insetCard, borderRadius: 12, overflow: "hidden", boxShadow: t.shadow, ...s }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN: DASHBOARD
// ─────────────────────────────────────────────────────────────
function Dashboard({ state }) {
  const t = useTheme();
  const { goals, subGoals, tasks } = state;
  const total = tasks.length;
  const done  = tasks.filter(x => x.status === "completed").length;
  const overall = pct(done, total);
  const days = daysLeft();

  // Activity ring colors — Apple Fitness style
  const ringColors = [t.red, t.green, t.blue];

  return (
    <div style={{ padding: "0 16px 32px" }}>

      {/* ── Hero summary card ── */}
      <div style={{ background: t.isDark ? "#1C1C1E" : "#FFFFFF", borderRadius: 20, padding: "20px", marginBottom: 14, boxShadow: t.shadow, border: `0.5px solid ${t.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
          <Sparkles size={13} color={t.blue}/>
          <span style={{ fontSize: 11, fontWeight: 600, color: t.blue, letterSpacing: "0.06em", textTransform: "uppercase" }}>2026 Overview</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 18 }}>
          {/* Triple ring — Fitness style */}
          <div style={{ position: "relative", width: 90, height: 90, flexShrink: 0 }}>
            <svg width={90} height={90} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
              {/* Ring 3 – blue – tasks */}
              <circle cx={45} cy={45} r={38} fill="none" stroke={t.fillTertiary} strokeWidth={7}/>
              <circle cx={45} cy={45} r={38} fill="none" stroke={t.blue} strokeWidth={7}
                strokeDasharray={`${(overall/100)*2*Math.PI*38} ${2*Math.PI*38}`} strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.9s cubic-bezier(.4,0,.2,1)" }}/>
              {/* Ring 2 – green – sub goals */}
              <circle cx={45} cy={45} r={28} fill="none" stroke={t.fillTertiary} strokeWidth={7}/>
              <circle cx={45} cy={45} r={28} fill="none" stroke={t.green} strokeWidth={7}
                strokeDasharray={`${(pct(done,total)/100)*2*Math.PI*28} ${2*Math.PI*28}`} strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.9s cubic-bezier(.4,0,.2,1)" }}/>
              {/* Ring 1 – red – goals */}
              <circle cx={45} cy={45} r={18} fill="none" stroke={t.fillTertiary} strokeWidth={7}/>
              <circle cx={45} cy={45} r={18} fill="none" stroke={t.red} strokeWidth={7}
                strokeDasharray={`${(goals.filter(g=>{ const ts=tasks.filter(tk=>subGoals.filter(s=>s.goalId===g.id).some(s=>s.id===tk.subGoalId)); return ts.length && pct(ts.filter(x=>x.status==="completed").length,ts.length)===100; }).length/goals.length)*2*Math.PI*18} ${2*Math.PI*18}`} strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.9s cubic-bezier(.4,0,.2,1)" }}/>
            </svg>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 42, fontWeight: 700, color: t.labelPrimary, letterSpacing: "-0.03em", lineHeight: 1 }}>{overall}<span style={{ fontSize: 22, fontWeight: 500, color: t.inkSecond }}>%</span></div>
            <div style={{ fontSize: 13, color: t.inkSecond, marginTop: 2, marginBottom: 12 }}>Overall complete</div>
            {[
              { label: "Move", value: overall, color: t.red },
              { label: "Exercise", value: pct(done, total), color: t.green },
              { label: "Stand", value: pct(goals.filter(g => { const ts = tasks.filter(tk => subGoals.filter(s => s.goalId === g.id).some(s => s.id === tk.subGoalId)); return ts.length && ts.every(x => x.status === "completed"); }).length, goals.length), color: t.blue },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 99, background: r.color, flexShrink: 0 }}/>
                <span style={{ fontSize: 11, color: t.inkThird, width: 58 }}>{r.label}</span>
                <div style={{ flex: 1, background: t.fillTertiary, borderRadius: 99, height: 3 }}>
                  <div style={{ width: `${r.value}%`, height: "100%", background: r.color, borderRadius: 99 }}/>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: t.inkSecond, minWidth: 26, textAlign: "right" }}>{r.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Days left */}
        <div style={{ background: t.isDark ? "#2C2C2E" : "#F2F2F7", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Flame size={14} color={t.amber}/>
            <span style={{ fontSize: 13, fontWeight: 500, color: t.inkSecond }}>Days left in 2026</span>
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: t.labelPrimary, letterSpacing: "-0.02em" }}>{days}</span>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { icon: Target,   label: "Goals",    value: goals.length,    color: t.red },
          { icon: Layers,   label: "Areas",    value: subGoals.length, color: t.green },
          { icon: ListTodo, label: "Tasks",    value: total,           color: t.blue },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{ background: t.isDark ? "#1C1C1E" : "#FFFFFF", borderRadius: 14, padding: "14px 12px", border: `0.5px solid ${t.border}`, boxShadow: t.shadow }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              <Icon size={14} color={color}/>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: t.labelPrimary, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: t.inkThird, marginTop: 3, fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Task status ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
        {[
          { icon: CheckCircle2, label: "Completed", value: done,        color: t.green },
          { icon: Circle,       label: "Pending",   value: total - done, color: t.amber },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{ background: t.isDark ? "#1C1C1E" : "#FFFFFF", borderRadius: 14, padding: "14px 14px", border: `0.5px solid ${t.border}`, boxShadow: t.shadow }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Icon size={14} color={color}/>
              <span style={{ fontSize: 11, color: color, fontWeight: 600 }}>{label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: t.labelPrimary, letterSpacing: "-0.02em" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Goal progress ── */}
      <SectionHeader>Goal progress</SectionHeader>
      <GroupCard>
        {goals.map((g, i) => {
          const gSubs  = subGoals.filter(s => s.goalId === g.id);
          const gTasks = tasks.filter(t => gSubs.some(s => s.id === t.subGoalId));
          const gDone  = gTasks.filter(t => t.status === "completed").length;
          const gPct   = pct(gDone, gTasks.length);
          const color  = [t.red, t.green, t.blue][i % 3];
          return (
            <div key={g.id}>
              <div style={{ padding: "13px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Target size={13} color={color}/>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 500, color: t.labelPrimary }}>{g.name}</span>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: t.inkSecond }}>{gPct}%</span>
                </div>
                <ProgressBar value={gPct} color={color} height={5}/>
                <div style={{ display: "flex", gap: 12, marginTop: 7 }}>
                  <span style={{ fontSize: 11, color: t.inkThird }}>{gSubs.length} areas</span>
                  <span style={{ fontSize: 11, color: t.green, fontWeight: 500 }}>✓ {gDone}</span>
                  <span style={{ fontSize: 11, color: t.inkThird }}>○ {gTasks.length - gDone}</span>
                </div>
              </div>
              {i < goals.length - 1 && <FullSep/>}
            </div>
          );
        })}
      </GroupCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN: GOALS
// ─────────────────────────────────────────────────────────────
function Goals({ state, dispatch, navigate }) {
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
    <div style={{ padding: "0 16px 32px" }}>
      <SectionHeader>All Goals</SectionHeader>
      <GroupCard style={{ marginBottom: 8 }}>
        {goals.map((g, i) => {
          const s = stats(g);
          const color = colors[i % colors.length];
          return (
            <div key={g.id}>
              <div onClick={() => navigate("goalDetail", { goalId: g.id })}
                style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = t.fillTertiary}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Target size={18} color={color}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 500, color: t.labelPrimary, marginBottom: 2 }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: t.inkThird, marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.description}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <ProgressBar value={s.p} color={color} height={4}/>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: t.inkSecond, flexShrink: 0 }}>{s.p}%</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 5 }}>
                    <span style={{ fontSize: 11, color: t.inkThird }}>{s.subs} areas</span>
                    <span style={{ fontSize: 11, color: t.green }}>✓ {s.done}</span>
                    <span style={{ fontSize: 11, color: t.inkThird }}>○ {s.total - s.done}</span>
                    {g.targetDate && <span style={{ fontSize: 11, color: t.inkThird, marginLeft: "auto" }}>{g.targetDate}</span>}
                  </div>
                </div>
                <Chevron/>
              </div>
              {i < goals.length - 1 && <FullSep/>}
            </div>
          );
        })}
        <FullSep/>
        <NewItemRow label="New Goal" onClick={() => setShowAdd(true)}/>
      </GroupCard>

      {showAdd && (
        <Sheet title="New Goal" onClose={() => setShowAdd(false)}>
          <AppleInput label="Goal Name" icon={Target} placeholder="e.g. Career Growth" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
          <AppleInput label="Description" icon={AlignLeft} placeholder="What are you working towards?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/>
          <AppleInput label="Target Date" icon={CalendarDays} type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })}/>
          <SheetBtn onClick={add} icon={Plus}>Create Goal</SheetBtn>
        </Sheet>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN: GOAL DETAIL
// ─────────────────────────────────────────────────────────────
function GoalDetail({ state, dispatch, params, navigate }) {
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
    <div style={{ padding: "0 16px 32px" }}>
      {/* Hero ring card */}
      <div style={{ background: t.isDark ? "#1C1C1E" : "#FFFFFF", borderRadius: 20, padding: "20px", marginBottom: 16, boxShadow: t.shadow, border: `0.5px solid ${t.border}`, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <ProgressRing value={gPct} size={72} stroke={6} color={t.blue}/>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: t.labelPrimary }}>{gPct}%</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {goal.description && <div style={{ fontSize: 13, color: t.inkThird, marginBottom: 10, lineHeight: 1.5 }}>{goal.description}</div>}
          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: t.labelPrimary }}>{gSubs.length}</div>
              <div style={{ fontSize: 10, color: t.inkThird, fontWeight: 500 }}>Areas</div>
            </div>
            <div style={{ width: "0.5px", background: t.separator }}/>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: t.green }}>{gDone}</div>
              <div style={{ fontSize: 10, color: t.inkThird, fontWeight: 500 }}>Done</div>
            </div>
            <div style={{ width: "0.5px", background: t.separator }}/>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: t.amber }}>{gTasks.length - gDone}</div>
              <div style={{ fontSize: 10, color: t.inkThird, fontWeight: 500 }}>Left</div>
            </div>
          </div>
        </div>
      </div>

      <SectionHeader>Focus Areas</SectionHeader>
      <GroupCard style={{ marginBottom: 8 }}>
        {gSubs.map((sg, i) => {
          const sgTasks = tasks.filter(tk => tk.subGoalId === sg.id);
          const sgDone  = sgTasks.filter(tk => tk.status === "completed").length;
          const sgPct   = pct(sgDone, sgTasks.length);
          const color   = colors[i % colors.length];
          return (
            <div key={sg.id}>
              <div onClick={() => navigate("subGoalDetail", { subGoalId: sg.id })}
                style={{ padding: "13px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = t.fillTertiary}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ListTodo size={15} color={color}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 15, fontWeight: 500, color: t.labelPrimary }}>{sg.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: t.inkSecond }}>{sgPct}%</span>
                  </div>
                  <ProgressBar value={sgPct} color={color} height={4}/>
                  <div style={{ display: "flex", gap: 10, marginTop: 5 }}>
                    <span style={{ fontSize: 11, color: t.green }}>✓ {sgDone}</span>
                    <span style={{ fontSize: 11, color: t.inkThird }}>○ {sgTasks.length - sgDone} left</span>
                  </div>
                </div>
                <Chevron/>
              </div>
              {i < gSubs.length - 1 && <FullSep/>}
            </div>
          );
        })}
        <FullSep/>
        <NewItemRow label="New Focus Area" onClick={() => setShowAdd(true)}/>
      </GroupCard>

      {showAdd && (
        <Sheet title="New Focus Area" onClose={() => setShowAdd(false)}>
          <AppleInput label="Name" icon={Layers} placeholder="e.g. Kubernetes" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
          <AppleInput label="Description" icon={AlignLeft} placeholder="Brief description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/>
          <SheetBtn onClick={add} icon={Plus}>Create Area</SheetBtn>
        </Sheet>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN: SUB GOAL DETAIL
// ─────────────────────────────────────────────────────────────
function SubGoalDetail({ state, dispatch, params }) {
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
    <div style={{ padding: "0 16px 32px" }}>
      {/* Progress ring hero */}
      <div style={{ background: t.isDark ? "#1C1C1E" : "#FFFFFF", borderRadius: 20, padding: "20px", marginBottom: 16, boxShadow: t.shadow, border: `0.5px solid ${t.border}`, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <ProgressRing value={sgPct} size={64} stroke={6} color={t.green}/>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: t.labelPrimary }}>{sgPct}%</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {sg.description && <div style={{ fontSize: 13, color: t.inkThird, marginBottom: 10 }}>{sg.description}</div>}
          <div style={{ display: "flex", gap: 14 }}>
            {[{ v: sgTasks.length, l: "Total", c: t.blue }, { v: done, l: "Done", c: t.green }, { v: sgTasks.length - done, l: "Left", c: t.amber }].map(({ v, l, c }) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
                <div style={{ fontSize: 10, color: t.inkThird }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Segmented filter */}
      <SegmentedControl
        options={[{ value: "all", label: "All" }, { value: "pending", label: "Pending" }, { value: "completed", label: "Done" }]}
        value={filter} onChange={setFilter}/>

      {/* Task list */}
      <GroupCard style={{ marginBottom: 8 }}>
        {sorted.length === 0 && (
          <div style={{ padding: "28px 16px", textAlign: "center", color: t.inkThird, fontSize: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <ListTodo size={28} color={t.inkThird}/>
            No tasks here
          </div>
        )}
        {sorted.map((tk, i) => (
          <div key={tk.id}>
            <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              {/* iOS-style checkbox */}
              <button onClick={() => dispatch({ type: "TOGGLE_TASK", id: tk.id })} style={{
                width: 26, height: 26, borderRadius: 99, border: `2px solid ${tk.status === "completed" ? t.green : t.border}`,
                background: tk.status === "completed" ? t.green : "transparent",
                cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", padding: 0
              }}>
                {tk.status === "completed" && <Check size={14} color="#fff" strokeWidth={2.5}/>}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 400, color: tk.status === "completed" ? t.inkThird : t.labelPrimary, textDecoration: tk.status === "completed" ? "line-through" : "none", transition: "all 0.2s" }}>{tk.name}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                  <PriorityChip priority={tk.priority}/>
                  {tk.dueDate && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={10} color={t.inkThird}/>
                      <span style={{ fontSize: 11, color: t.inkThird }}>{tk.dueDate}</span>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => dispatch({ type: "DELETE_TASK", id: tk.id })} style={{ background: "none", border: "none", color: t.inkThird, cursor: "pointer", padding: "4px 2px", display: "flex", alignItems: "center", borderRadius: 6 }}>
                <Trash2 size={15} color={t.red}/>
              </button>
            </div>
            {i < sorted.length - 1 && <RowSep/>}
          </div>
        ))}
        <FullSep/>
        <NewItemRow label="New Task" onClick={() => setShowAdd(true)}/>
      </GroupCard>

      {showAdd && (
        <Sheet title="New Task" onClose={() => setShowAdd(false)}>
          <AppleInput label="Task Name" icon={ListTodo} placeholder="e.g. Learn Helm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
          <AppleInput label="Notes" icon={AlignLeft} placeholder="Optional" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}/>
          <AppleInput label="Due Date" icon={Clock} type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}/>
          <AppleSelect label="Priority" icon={Flag} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
            <option>Low</option><option>Medium</option><option>High</option>
          </AppleSelect>
          <SheetBtn onClick={add} icon={Plus}>Add Task</SheetBtn>
        </Sheet>
      )}
    </div>
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
  const colors = [t.red, t.green, t.blue];

  return (
    <div style={{ padding: "0 16px 32px" }}>
      {/* Apple search bar */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={15} color={t.inkThird} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}/>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search"
          style={{ width: "100%", background: t.isDark ? "#1C1C1E" : "#FFFFFF", border: `0.5px solid ${t.border}`, borderRadius: 12, color: t.labelPrimary, padding: "11px 36px 11px 36px", fontSize: 16, outline: "none", boxSizing: "border-box", fontFamily: "inherit", boxShadow: t.shadow }}/>
        {q && (
          <button onClick={() => setQ("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: t.fillSecondary, border: "none", borderRadius: 99, width: 20, height: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={11} color={t.inkThird} strokeWidth={2.5}/>
          </button>
        )}
      </div>

      {!q && (
        <div style={{ textAlign: "center", paddingTop: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: t.fillTertiary, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Search size={26} color={t.inkThird}/>
          </div>
          <span style={{ fontSize: 17, fontWeight: 600, color: t.labelPrimary }}>Search Everything</span>
          <span style={{ fontSize: 14, color: t.inkThird, maxWidth: 220, lineHeight: 1.5, textAlign: "center" }}>Find goals, focus areas and tasks instantly</span>
        </div>
      )}

      {q && !hasResults && (
        <div style={{ textAlign: "center", paddingTop: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <Search size={28} color={t.inkThird}/>
          <span style={{ fontSize: 15, color: t.inkSecond }}>No results for "{q}"</span>
        </div>
      )}

      {hasResults && (
        <>
          {results.goals.length > 0 && (
            <><SectionHeader>Goals</SectionHeader>
            <GroupCard style={{ marginBottom: 14 }}>
              {results.goals.map((g, i) => (
                <div key={g.id}>
                  <div onClick={() => navigate("goalDetail", { goalId: g.id })} style={{ padding: "13px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = t.fillTertiary}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: t.red + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Target size={15} color={t.red}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 500, color: t.labelPrimary }}>{g.name}</div>
                      {g.description && <div style={{ fontSize: 12, color: t.inkThird, marginTop: 1 }}>{g.description}</div>}
                    </div>
                    <Chevron/>
                  </div>
                  {i < results.goals.length - 1 && <FullSep/>}
                </div>
              ))}
            </GroupCard></>
          )}
          {results.subGoals.length > 0 && (
            <><SectionHeader>Focus Areas</SectionHeader>
            <GroupCard style={{ marginBottom: 14 }}>
              {results.subGoals.map((s, i) => (
                <div key={s.id}>
                  <div onClick={() => navigate("subGoalDetail", { subGoalId: s.id })} style={{ padding: "13px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = t.fillTertiary}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: t.green + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Layers size={15} color={t.green}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 500, color: t.labelPrimary }}>{s.name}</div>
                      {s.description && <div style={{ fontSize: 12, color: t.inkThird, marginTop: 1 }}>{s.description}</div>}
                    </div>
                    <Chevron/>
                  </div>
                  {i < results.subGoals.length - 1 && <FullSep/>}
                </div>
              ))}
            </GroupCard></>
          )}
          {results.tasks.length > 0 && (
            <><SectionHeader>Tasks</SectionHeader>
            <GroupCard style={{ marginBottom: 14 }}>
              {results.tasks.map((tk, i) => (
                <div key={tk.id}>
                  <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 99, border: `2px solid ${tk.status === "completed" ? t.green : t.border}`, background: tk.status === "completed" ? t.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {tk.status === "completed" && <Check size={12} color="#fff" strokeWidth={2.5}/>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 400, color: tk.status === "completed" ? t.inkThird : t.labelPrimary, textDecoration: tk.status === "completed" ? "line-through" : "none" }}>{tk.name}</div>
                      <div style={{ marginTop: 3 }}><PriorityChip priority={tk.priority}/></div>
                    </div>
                  </div>
                  {i < results.tasks.length - 1 && <RowSep/>}
                </div>
              ))}
            </GroupCard></>
          )}
        </>
      )}
    </div>
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

  return (
    <div style={{ padding: "0 16px 32px" }}>
      {/* Calendar card */}
      <div style={{ background: t.isDark ? "#1C1C1E" : "#FFFFFF", borderRadius: 20, padding: "16px", marginBottom: 16, boxShadow: t.shadow, border: `0.5px solid ${t.border}` }}>
        {/* Month nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={() => { if (month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }}
            style={{ background: t.fillTertiary, border:"none", borderRadius:99, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ChevronLeft size={16} color={t.blue}/>
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <CalendarDays size={14} color={t.blue}/>
            <span style={{ fontSize:16, fontWeight:600, color:t.labelPrimary, letterSpacing:"-0.01em" }}>{monthName} {year}</span>
          </div>
          <button onClick={() => { if (month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }}
            style={{ background: t.fillTertiary, border:"none", borderRadius:99, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ChevronRight size={16} color={t.blue}/>
          </button>
        </div>

        {/* Day labels */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:4 }}>
          {["S","M","T","W","T","F","S"].map((d,i) => (
            <div key={i} style={{ textAlign:"center", fontSize:11, fontWeight:600, color:t.inkThird, padding:"3px 0", letterSpacing:"0.04em" }}>{d}</div>
          ))}
        </div>

        {/* Dates */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"3px 0" }}>
          {Array(firstDay).fill(null).map((_,i) => <div key={`b${i}`}/>)}
          {Array(daysInMo).fill(null).map((_,i) => {
            const d = i+1;
            const isToday = d===now.getDate() && month===now.getMonth() && year===now.getFullYear();
            const hasDot  = !!eventDates[d];
            const isSel   = selected===d;
            return (
              <div key={d} onClick={() => setSelected(isSel?null:d)} style={{ textAlign:"center", padding:"6px 2px 4px", borderRadius:10, cursor:"pointer", background: isSel ? t.blue : "transparent", transition:"background 0.15s" }}>
                <div style={{ fontSize:15, fontWeight: isToday?700:400, color: isSel?"#fff" : isToday?t.blue : t.labelPrimary }}>{d}</div>
                {hasDot && <div style={{ width:4, height:4, borderRadius:"50%", background: isSel?"rgba(255,255,255,0.7)" : t.blue, margin:"2px auto 0" }}/>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected events */}
      {selected && (
        <>
          <SectionHeader>{monthName} {selected}</SectionHeader>
          {(eventDates[selected]||[]).length===0
            ? <GroupCard><div style={{ padding:"22px 16px", textAlign:"center", color:t.inkThird, fontSize:14, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}><CalendarDays size={24} color={t.inkThird}/>Nothing scheduled</div></GroupCard>
            : <GroupCard>
                {(eventDates[selected]||[]).map((ev, i, arr) => (
                  <div key={i}>
                    <div style={{ padding:"13px 16px", display:"flex", gap:12, alignItems:"center" }}>
                      <div style={{ width:36, height:36, borderRadius:10, background: ev.type==="goal"?t.red+"20":t.blue+"20", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {ev.type==="goal" ? <Target size={16} color={t.red}/> : ev.status==="completed" ? <CheckCircle2 size={16} color={t.green}/> : <ListTodo size={16} color={t.blue}/>}
                      </div>
                      <div>
                        <div style={{ fontSize:15, fontWeight:500, color:t.labelPrimary }}>{ev.name}</div>
                        <div style={{ fontSize:12, color:t.inkThird, marginTop:2 }}>{ev.type==="goal"?"Goal deadline":"Task due"}</div>
                      </div>
                    </div>
                    {i < arr.length-1 && <FullSep/>}
                  </div>
                ))}
              </GroupCard>
          }
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN: STATISTICS
// ─────────────────────────────────────────────────────────────
function Statistics({ state }) {
  const t = useTheme();
  const { goals, subGoals, tasks } = state;
  const done    = tasks.filter(tk => tk.status==="completed").length;
  const pending = tasks.length - done;
  const months  = ["Jan","Feb","Mar","Apr","May","Jun","Jul"];
  const bars    = [22, 38, 47, 35, 61, done, 0];
  const maxBar  = Math.max(...bars, 1);
  const colors  = [t.red, t.green, t.blue, t.amber, t.indigo];

  return (
    <div style={{ padding:"0 16px 32px" }}>
      {/* KPI 2-up */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {[
          { icon:CheckCircle2, label:"Completed", value:done,    color:t.green },
          { icon:Circle,       label:"Pending",   value:pending, color:t.amber },
        ].map(({ icon:Icon, label, value, color }) => (
          <div key={label} style={{ background:t.isDark?"#1C1C1E":"#FFFFFF", borderRadius:16, padding:"16px", border:`0.5px solid ${t.border}`, boxShadow:t.shadow }}>
            <div style={{ width:32, height:32, borderRadius:9, background:color+"20", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
              <Icon size={16} color={color}/>
            </div>
            <div style={{ fontSize:32, fontWeight:700, color:t.labelPrimary, letterSpacing:"-0.02em", lineHeight:1 }}>{value}</div>
            <div style={{ fontSize:12, color:t.inkThird, fontWeight:500, marginTop:4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ background:t.isDark?"#1C1C1E":"#FFFFFF", borderRadius:16, padding:"16px", marginBottom:14, border:`0.5px solid ${t.border}`, boxShadow:t.shadow }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14 }}>
          <TrendingUp size={14} color={t.blue}/>
          <span style={{ fontSize:13, fontWeight:600, color:t.labelPrimary }}>Monthly Completions</span>
        </div>
        <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:88 }}>
          {bars.map((v, i) => (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
              <div style={{ width:"100%", borderRadius:"5px 5px 0 0", background: i===5?t.blue:t.fillTertiary, height:`${(v/maxBar)*100}%`, minHeight:4, transition:"height 0.5s ease" }}/>
              <span style={{ fontSize:9, color: i===5?t.blue:t.inkThird, fontWeight: i===5?700:400 }}>{months[i]}</span>
            </div>
          ))}
        </div>
      </div>

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
            <div key={g.id}>
              <div style={{ padding:"14px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:color+"20", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Target size={13} color={color}/>
                    </div>
                    <span style={{ fontSize:15, fontWeight:500, color:t.labelPrimary }}>{g.name}</span>
                  </div>
                  <span style={{ fontSize:14, fontWeight:600, color:t.inkSecond }}>{gPct}%</span>
                </div>
                <ProgressBar value={gPct} color={color} height={5}/>
                <div style={{ display:"flex", gap:12, marginTop:7 }}>
                  <span style={{ fontSize:11, color:t.green, fontWeight:500 }}>✓ {gDone} done</span>
                  <span style={{ fontSize:11, color:t.inkThird }}>○ {gTasks.length-gDone} left</span>
                </div>
              </div>
              {i < goals.length-1 && <FullSep/>}
            </div>
          );
        })}
      </GroupCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REDUCER
// ─────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case "ADD_GOAL":    return { ...state, goals:    [...state.goals,    action.goal]    };
    case "ADD_SUBGOAL": return { ...state, subGoals: [...state.subGoals, action.subGoal] };
    case "ADD_TASK":    return { ...state, tasks:    [...state.tasks,    action.task]    };
    case "DELETE_TASK": return { ...state, tasks: state.tasks.filter(t => t.id!==action.id) };
    case "TOGGLE_TASK": return { ...state, tasks: state.tasks.map(t => t.id!==action.id ? t : { ...t, status: t.status==="completed"?"pending":"completed", completedDate: t.status==="completed"?null:new Date().toISOString().slice(0,10) }) };
    default: return state;
  }
}

// ─────────────────────────────────────────────────────────────
// TAB CONFIG
// ─────────────────────────────────────────────────────────────
const TABS = [
  { id:"dashboard", label:"Summary",  Icon:LayoutDashboard },
  { id:"goals",     label:"Goals",    Icon:Target          },
  { id:"search",    label:"Search",   Icon:Search          },
  { id:"calendar",  label:"Calendar", Icon:CalendarDays    },
  { id:"stats",     label:"Stats",    Icon:BarChart2       },
];
const TAB_TITLES = { dashboard:"Summary", goals:"Goals", search:"Search", calendar:"Calendar", stats:"Statistics" };

// ─────────────────────────────────────────────────────────────
// CLOCK
// ─────────────────────────────────────────────────────────────
function useClock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", hour12:false }));
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", hour12:false })), 10000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ─────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark]         = useState(true);
  const theme                   = makeTheme(dark);
  const [appState, setAppState] = useState(SEED);
  const dispatch                = action => setAppState(s => reducer(s, action));
  const [tab, setTab]           = useState("dashboard");
  const [stack, setStack]       = useState([]);
  const navigate = (screen, params={}) => setStack(s => [...s, { screen, params }]);
  const goBack   = ()            => setStack(s => s.slice(0,-1));
  const current  = stack[stack.length-1];
  const time     = useClock();

  const headerTitle = current
    ? current.screen==="goalDetail"    ? (appState.goals.find(g => g.id===current.params?.goalId)?.name||"Goal")
    : current.screen==="subGoalDetail" ? (appState.subGoals.find(s => s.id===current.params?.subGoalId)?.name||"Area")
    : "" : TAB_TITLES[tab];

  function renderScreen() {
    if (current) {
      if (current.screen==="goalDetail")    return <GoalDetail    state={appState} dispatch={dispatch} params={current.params} navigate={navigate}/>;
      if (current.screen==="subGoalDetail") return <SubGoalDetail state={appState} dispatch={dispatch} params={current.params}/>;
    }
    switch(tab) {
      case "dashboard": return <Dashboard   state={appState}/>;
      case "goals":     return <Goals       state={appState} dispatch={dispatch} navigate={navigate}/>;
      case "search":    return <SearchScreen state={appState} navigate={navigate}/>;
      case "calendar":  return <CalendarScreen state={appState}/>;
      case "stats":     return <Statistics  state={appState}/>;
    }
  }

  return (
    <ThemeCtx.Provider value={theme}>
      {/* Stage */}
      <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", minHeight:"100vh", background: dark ? "#090909" : "#E5E5EA", fontFamily:"-apple-system,'SF Pro Display','SF Pro Text',system-ui,sans-serif", gap:16, padding:"20px 0" }}>

        {/* Theme toggle */}
        <button onClick={() => setDark(d=>!d)} style={{ background: theme.isDark?"#1C1C1E":"#FFFFFF", border:`0.5px solid ${theme.border}`, color:theme.labelPrimary, borderRadius:99, padding:"8px 18px", fontSize:13, fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", gap:7, boxShadow:theme.shadow, letterSpacing:"-0.01em" }}>
          {dark ? <Sun size={14} color={theme.amber}/> : <Moon size={14} color={theme.indigo}/>}
          {dark ? "Light Mode" : "Dark Mode"}
        </button>

        {/* ── Phone Shell ── */}
        <div style={{ width:393, height:852, background:theme.bg, borderRadius:54, overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:theme.phoneShadow, border:`0.5px solid ${dark?"#3A3A3C":"#C6C6C8"}`, position:"relative" }}>

          {/* iOS Status Bar */}
          <div style={{ background:theme.bg, padding:"14px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0, height:50 }}>
            <span style={{ fontSize:15, fontWeight:600, color:theme.labelPrimary, letterSpacing:"-0.02em" }}>{time}</span>
            {/* Dynamic Island */}
            <div style={{ width:120, height:34, background:"#000000", borderRadius:99, border:`0.5px solid ${dark?"#2A2A2A":"#1A1A1A"}` }}/>
            {/* Signal */}
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              {[3,4,5].map(h => <div key={h} style={{ width:3, height:h+6, background:theme.labelPrimary, borderRadius:1, opacity:0.9 }}/>)}
              {/* Wifi */}
              <svg width={15} height={12} viewBox="0 0 15 12" style={{ marginLeft:2 }}>
                <path d="M7.5 9.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" fill={theme.labelPrimary}/>
                <path d="M3.2 6.8a6 6 0 0 1 8.6 0" fill="none" stroke={theme.labelPrimary} strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M.5 4.1a9.8 9.8 0 0 1 14 0" fill="none" stroke={theme.labelPrimary} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {/* Battery */}
              <div style={{ position:"relative", width:22, height:12, border:`1.5px solid ${theme.labelPrimary}`, borderRadius:3, marginLeft:2 }}>
                <div style={{ position:"absolute", right:-5, top:"50%", transform:"translateY(-50%)", width:3, height:5, background:theme.labelPrimary, borderRadius:"0 1px 1px 0" }}/>
                <div style={{ margin:1.5, height:"calc(100% - 3px)", width:"75%", background:theme.green, borderRadius:1.5 }}/>
              </div>
            </div>
          </div>

          {/* Header — large title Apple style */}
          <div style={{ background:theme.bg, padding:"4px 20px 10px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            {current
              ? <button onClick={goBack} style={{ background:"transparent", border:"none", color:theme.blue, cursor:"pointer", display:"flex", alignItems:"center", gap:3, padding:"4px 0", fontSize:17 }}>
                  <ChevronLeft size={22} color={theme.blue} strokeWidth={2}/><span style={{ fontSize:17, color:theme.blue }}>Back</span>
                </button>
              : null
            }
            <span style={{ fontSize:28, fontWeight:700, color:theme.labelPrimary, flex:1, letterSpacing:"-0.03em", lineHeight:1.1 }}>{headerTitle}</span>
            {!current && (
              <div style={{ width:32, height:32, borderRadius:99, background:theme.fillTertiary, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <User size={16} color={theme.inkSecond}/>
              </div>
            )}
          </div>

          {/* Hairline */}
          <div style={{ height:"0.5px", background:theme.separator, flexShrink:0 }}/>

          {/* Scrollable content */}
          <div style={{ flex:1, overflowY:"auto", background:theme.groupedBg, WebkitOverflowScrolling:"touch" }}>
            <div style={{ paddingTop:8 }}>{renderScreen()}</div>
          </div>

          {/* ── Tab Bar — Apple standard ── */}
          {!current && (
            <div style={{ background: dark ? "rgba(28,28,30,0.92)" : "rgba(249,249,249,0.92)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderTop:`0.5px solid ${theme.separator}`, padding:"8px 0 28px", display:"flex", flexShrink:0 }}>
              {TABS.map(({ id, label, Icon }) => {
                const active = tab===id;
                return (
                  <button key={id} onClick={() => { setTab(id); setStack([]); }} style={{ background:"none", border:"none", cursor:"pointer", flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3.5, padding:"4px 0" }}>
                    <Icon size={22} color={active ? theme.blue : theme.inkThird} strokeWidth={active?2:1.7} style={{ transition:"all 0.15s" }}/>
                    <span style={{ fontSize:10, fontWeight:active?600:400, color:active?theme.blue:theme.inkThird, letterSpacing:"-0.01em", transition:"all 0.15s" }}>{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ fontSize:11, color:dark?"#333":"#AAAAAA", letterSpacing:"0.06em", textTransform:"uppercase" }}>Goal Tracker · iOS Prototype</div>
      </div>
    </ThemeCtx.Provider>
  );
}