import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function SheetBtn({ children, onClick, icon: Icon }) {
  const t = useTheme();
  return (
    <TouchableOpacity
      onPress={onClick}
      activeOpacity={0.82}
      style={{
        width: "100%",
        backgroundColor: t.blue,
        borderRadius: 14,
        paddingVertical: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 12,
        shadowColor: t.blue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
      }}
    >
      {Icon && <Icon size={17} color="#fff" strokeWidth={2.5} />}
      <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 0.2, textTransform: "uppercase" }}>{children}</Text>
    </TouchableOpacity>
  );
}
