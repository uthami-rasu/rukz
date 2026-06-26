import React from "react";
import { View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function ProgressBar({ value, color, height = 4 }) {
  const t = useTheme();
  const c = color || t.blue;
  return (
    <View style={{ backgroundColor: t.fillTertiary, borderRadius: 99, height, overflow: "hidden" }}>
      <View style={{ width: `${value}%`, height: "100%", backgroundColor: c, borderRadius: 99 }} />
    </View>
  );
}
