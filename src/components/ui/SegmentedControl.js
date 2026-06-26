import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function SegmentedControl({ options, value, onChange }) {
  const t = useTheme();
  return (
    <View style={{
      backgroundColor: t.isDark ? "#16161A" : "#FFFFFF",
      borderRadius: 14,
      padding: 4,
      flexDirection: "row",
      gap: 4,
      marginBottom: 16,
      borderWidth: 1.5,
      borderColor: t.border,
    }}>
      {options.map(o => {
        const active = value === o.value;
        return (
          <TouchableOpacity
            key={o.value}
            onPress={() => onChange(o.value)}
            activeOpacity={0.8}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: active ? t.blue : "transparent",
              alignItems: "center",
            }}
          >
            <Text style={{
              fontSize: 10,
              fontWeight: "900",
              color: active ? "#FFFFFF" : t.labelSecondary,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
