import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Plus } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";

export default function NewItemRow({ label, onClick }) {
  const t = useTheme();
  return (
    <TouchableOpacity
      onPress={onClick}
      activeOpacity={0.7}
      style={{
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 15,
        paddingHorizontal: 16,
        backgroundColor: t.isDark ? "#16161A" : "#FFFFFF",
      }}
    >
      <View style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: t.blue,
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Plus size={16} color="#FFFFFF" strokeWidth={3} />
      </View>
      <Text style={{
        fontSize: 12,
        color: t.blue,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 0.8,
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
