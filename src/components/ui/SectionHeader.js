import React from "react";
import { Text } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function SectionHeader({ children }) {
  const t = useTheme();
  return (
    <Text style={{
      fontSize: 11,
      fontWeight: "900",
      color: t.isDark ? t.labelSecondary : "#2E3831",
      letterSpacing: 1.5,
      textTransform: "uppercase",
      marginBottom: 10,
      marginTop: 26,
      paddingLeft: 4,
    }}>
      {children}
    </Text>
  );
}
