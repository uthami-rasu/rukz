import React from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../../context/ThemeContext";

export default function ProgressRing({ value, size = 52, stroke = 4, color }) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const c = color || t.blue;
  return (
    <View style={{ transform: [{ rotate: "-90deg" }], width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.fillTertiary} strokeWidth={stroke} />
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={stroke}
          strokeDasharray={[dash, circ]} strokeLinecap="round" />
      </Svg>
    </View>
  );
}
