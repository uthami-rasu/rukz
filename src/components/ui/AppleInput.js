import React, { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function AppleInput({ label, icon: Icon, value, onChangeText, autoFocus, ...props }) {
  const t = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ fontSize: 11, fontWeight: "800", color: t.inkThird, marginBottom: 8, paddingLeft: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>
          {label}
        </Text>
      )}
      <View style={{
        backgroundColor: t.isDark ? "#222228" : "#FFFFFF",
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: focus ? t.blue : t.border,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
      }}>
        {Icon && <Icon size={16} color={t.labelSecondary} style={{ marginRight: 10 }} strokeWidth={2.5} />}
        <TextInput
          {...props}
          value={value}
          onChangeText={onChangeText}
          autoFocus={autoFocus}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholderTextColor={t.inkThird}
          style={{ flex: 1, color: t.labelPrimary, paddingVertical: 15, fontSize: 15, fontWeight: "600" }}
        />
      </View>
    </View>
  );
}
