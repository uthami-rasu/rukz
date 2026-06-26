import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";

export default function AppleSelect({ label, icon: Icon, value, options, onChange }) {
  const t = useTheme();
  const handlePress = () => {
    Alert.alert(
      `Select ${label}`,
      "",
      options.map(opt => ({ text: opt, onPress: () => onChange(opt) })),
      { cancelable: true }
    );
  };
  return (
    <TouchableOpacity onPress={handlePress} style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ fontSize: 11, fontWeight: "800", color: t.inkThird, marginBottom: 8, paddingLeft: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>
          {label}
        </Text>
      )}
      <View style={{
        backgroundColor: t.isDark ? "#222228" : "#FFFFFF",
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: t.border,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 15,
      }}>
        {Icon && <Icon size={16} color={t.labelSecondary} style={{ marginRight: 10 }} strokeWidth={2.5} />}
        <Text style={{ fontSize: 15, color: t.labelPrimary, flex: 1, fontWeight: "600" }}>{value}</Text>
        <ChevronRight size={15} color={t.inkThird} strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
  );
}
