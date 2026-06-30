import React from "react";
import { View, Text, Modal, ScrollView, TouchableOpacity, Platform, KeyboardAvoidingView } from "react-native";
import { X } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";

export default function Sheet({ title, visible, onClose, children }) {
  const t = useTheme();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {/* Backdrop */}
        <TouchableOpacity
          activeOpacity={1}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          onPress={onClose}
        />

        {/* Sheet panel */}
        <View style={{
          backgroundColor: t.isDark ? "#16161A" : "#F2F2F7",
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          paddingBottom: 40,
          maxHeight: "88%",
          borderWidth: 1.5,
          borderColor: t.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
          elevation: 24,
        }}>
          {/* Drag handle */}
          <View style={{
            width: 40,
            height: 5,
            backgroundColor: t.isDark ? "#2C2C35" : "#C7C7CC",
            borderRadius: 99,
            alignSelf: "center",
            marginTop: 12,
            marginBottom: 2,
          }} />

          {/* Header */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 18,
          }}>
            <Text style={{ fontSize: 15, fontWeight: "900", color: t.labelPrimary, letterSpacing: 1, textTransform: "uppercase" }}>
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: t.isDark ? "#222228" : "#E4ECE7",
                alignItems: "center", justifyContent: "center",
                borderWidth: 1, borderColor: t.border,
              }}
            >
              <X size={14} color={t.labelPrimary} strokeWidth={3} />
            </TouchableOpacity>
          </View>

          {/* Hairline separator */}
          <View style={{ height: 1, backgroundColor: t.separator }} />

          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
