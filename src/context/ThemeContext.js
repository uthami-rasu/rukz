import { createContext, useContext } from "react";

export const ThemeCtx = createContext(null);
export const useTheme = () => useContext(ThemeCtx);

export function makeTheme(dark) {
  return dark ? {
    isDark: true,
    bg:             "#0C0C0E",        // Deep obsidian black
    bgSecond:       "#16161A",        // Slightly raised dark surface
    bgTertiary:     "#222228",        // Control background
    surface:        "#16161A",
    card:           "#16161A",
    cardRaised:     "#222228",
    groupedBg:      "#0C0C0E",
    insetCard:      "#16161A",
    labelPrimary:   "#FFFFFF",
    labelSecondary: "#A5A5B2",
    labelTertiary:  "#70707D",
    labelQuaternary:"#4A4A52",
    separator:      "#282830",
    separatorOpaque:"#282830",
    fillPrimary:    "#7B61FF",        // Lilac/purple accent
    fillSecondary:  "#7B61FF24",
    fillTertiary:   "#2C2C35",
    fillQuaternary: "#1E1E24",
    blue:           "#7B61FF",        // Lilac/purple
    green:          "#A8C3B1",        // Soft Sage Green accent
    red:            "#FF6F61",        // Pastel Coral/Orange
    amber:          "#FCD05F",        // Sunny yellow
    indigo:         "#7B61FF",
    ink:            "#FFFFFF",
    inkSecond:      "#A5A5B2",
    inkThird:       "#70707D",
    inkInverse:     "#0C0C0E",
    border:         "#282830",        // High contrast border
    pill:           "#222228",
    pillActive:     "#FFFFFF",
    pillText:       "#A5A5B2",
    pillTextAct:    "#0C0C0E",
    shadow: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    }
  } : {
    isDark: false,
    bg:             "#F4F4F6",        // Premium light cool-grey/off-white background
    bgSecond:       "#FFFFFF",        // Pure white cards
    bgTertiary:     "#E5E5EA",        // Control background
    surface:        "#FFFFFF",
    card:           "#FFFFFF",
    cardRaised:     "#E5E5EA",
    groupedBg:      "#F4F4F6",
    insetCard:      "#FFFFFF",
    labelPrimary:   "#1C1C1E",        // Crisp professional near-black
    labelSecondary: "#5C5C60",
    labelTertiary:  "#8E8E93",
    labelQuaternary:"#AEAEB2",
    separator:      "#E5E5EA",
    separatorOpaque:"#E5E5EA",
    fillPrimary:    "#7B61FF",        // Lilac/purple accent
    fillSecondary:  "#7B61FF1A",
    fillTertiary:   "#E5E5EA",
    fillQuaternary: "#F4F4F6",
    blue:           "#7B61FF",        // Lilac/purple
    green:          "#34C759",        // Crisp vibrant green
    red:            "#FF3B30",        // Crisp vibrant red
    amber:          "#FFCC00",        // Crisp vibrant yellow
    indigo:         "#7B61FF",
    ink:            "#1C1C1E",
    inkSecond:      "#5C5C60",
    inkThird:       "#8E8E93",
    inkInverse:     "#FFFFFF",
    border:         "#E5E5EA",        // Soft border for iOS premium feel
    pill:           "#FFFFFF",
    pillActive:     "#7B61FF",
    pillText:       "#5C5C60",
    pillTextAct:    "#FFFFFF",
    shadow: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    }
  };
}
