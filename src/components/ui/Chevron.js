import React from "react";
import { ChevronRight } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";

export default function Chevron() {
  const t = useTheme();
  return <ChevronRight size={16} color={t.inkThird} strokeWidth={2} />;
}
