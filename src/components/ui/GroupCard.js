import React from "react";
import { View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function GroupCard({ children, style = {} }) {
  const t = useTheme();
  return (
    <View style={[
      {
        backgroundColor: t.isDark ? "#16161A" : "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1.5,
        borderColor: t.border,
      },
      t.shadow,
      style,
    ]}>
      {children}
    </View>
  );
}
