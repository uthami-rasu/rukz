import React from "react";
import { View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

/** Separator with left indent (for use between list rows with icons) */
export function RowSep() {
  const t = useTheme();
  return <View style={{ height: 0.5, backgroundColor: t.separator, marginLeft: 52 }} />;
}

/** Full-width separator */
export function FullSep() {
  const t = useTheme();
  return <View style={{ height: 0.5, backgroundColor: t.separator }} />;
}
