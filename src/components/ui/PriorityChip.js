import React from "react";
import { View, Text } from "react-native";
import { Flag } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";

const MAP_DARK  = { High: "#FF453A", Medium: "#FFD60A", Low: "#30D158" };
const MAP_LIGHT = { High: "#FF3B30", Medium: "#FF9500", Low: "#34C759" };

export default function PriorityChip({ priority }) {
  const t = useTheme();
  const c = t.isDark ? MAP_DARK[priority] || MAP_DARK.Medium : MAP_LIGHT[priority] || MAP_LIGHT.Medium;
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 4,
      backgroundColor: c + "1A",
      borderRadius: 6,
      paddingHorizontal: 8, paddingVertical: 3,
      alignSelf: "flex-start",
      borderWidth: 0.5, borderColor: c + "40",
    }}>
      <Flag size={9} color={c} fill={c} />
      <Text style={{ fontSize: 11, fontWeight: "700", color: c, letterSpacing: 0.1 }}>
        {priority}
      </Text>
    </View>
  );
}
