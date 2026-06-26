import {
  LayoutDashboard, Target, Search, CalendarDays, BarChart2,
} from "lucide-react-native";

export const TABS = [
  { id: "dashboard", label: "Summary",  Icon: LayoutDashboard },
  { id: "goals",     label: "Goals",    Icon: Target          },
  { id: "search",    label: "Search",   Icon: Search          },
  { id: "calendar",  label: "Calendar", Icon: CalendarDays    },
  { id: "stats",     label: "Stats",    Icon: BarChart2       },
];

export const TAB_TITLES = {
  dashboard: "Rukz",
  goals:     "Goals",
  search:    "Search",
  calendar:  "Calendar",
  stats:     "Statistics",
};
