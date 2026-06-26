import {
  LayoutDashboard, Target, Search, PlayCircle, BarChart2,
} from "lucide-react-native";

export const TABS = [
  { id: "dashboard",  label: "Summary",     Icon: LayoutDashboard },
  { id: "goals",      label: "Goals",       Icon: Target          },
  { id: "search",     label: "Search",      Icon: Search          },
  { id: "watchLater", label: "Watch Later", Icon: PlayCircle      },
  { id: "stats",      label: "Stats",       Icon: BarChart2       },
];

export const TAB_TITLES = {
  dashboard:  "Rukz",
  goals:      "Goals",
  search:     "Search",
  watchLater: "Watch Later",
  stats:      "Statistics",
};
