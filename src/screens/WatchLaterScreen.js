import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking, Image, Platform, TextInput, AppState } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Notifications from "expo-notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import { PlayCircle, Trash2, Plus, Bell, BellOff, ExternalLink, Bookmark, Video, FileText, Globe, Clock, Pencil, ChevronDown } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import SectionHeader from "../components/ui/SectionHeader";
import GroupCard from "../components/ui/GroupCard";
import Sheet from "../components/ui/Sheet";
import SheetBtn from "../components/ui/SheetBtn";
import AppleInput from "../components/ui/AppleInput";
import AppleSelect from "../components/ui/AppleSelect";
import { formatDateString } from "../utils/helpers";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function WatchLaterScreen({ state, dispatch, sharedUrlToPreFill, clearSharedUrlToPreFill }) {
  const t = useTheme();
  const items = state.watchLater || [];
  const categories = state.watchLaterCategories || ["YouTube", "Instagram", "Tutorials", "Articles", "Other"];

  const [activeCategory, setActiveCategory] = useState("All");
  const [clipboardUrl, setClipboardUrl] = useState("");
  const [showAddSheet, setShowAddSheet] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("YouTube");
  const [checkTime, setCheckTime] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(true);

  // DatePicker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("date"); // "date" | "time"
  const [pickerDate, setPickerDate] = useState(new Date());

  // Custom Category Add
  const [newCatName, setNewCatName] = useState("");
  const [showCatSheet, setShowCatSheet] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  // Editing state
  const [editingItem, setEditingItem] = useState(null);

  // Check clipboard on mount and foreground
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const text = await Clipboard.getStringAsync();
        if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
          const exists = items.some(x => x.url === text);
          if (!exists) {
            setClipboardUrl(text);
          } else {
            setClipboardUrl("");
          }
        } else {
          setClipboardUrl("");
        }
      } catch (e) {
        console.warn("Error reading clipboard:", e);
      }
    };

    checkClipboard();

    const sub = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkClipboard();
      }
    });
    return () => sub.remove();
  }, [items]);

  // Pre-fill shared url if available
  useEffect(() => {
    if (sharedUrlToPreFill) {
      setUrl(sharedUrlToPreFill);
      if (sharedUrlToPreFill.includes("youtube.com") || sharedUrlToPreFill.includes("youtu.be")) {
        setCategory("YouTube");
      } else if (sharedUrlToPreFill.includes("instagram.com")) {
        setCategory("Instagram");
      } else {
        setCategory("Other");
      }
      setEditingItem(null);
      setShowAddSheet(true);
      clearSharedUrlToPreFill();
    }
  }, [sharedUrlToPreFill]);

  const handleDateChange = (event, selectedDate) => {
    if (event.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }
    const currentDate = selectedDate || pickerDate;
    setPickerDate(currentDate);

    if (Platform.OS === "android") {
      if (pickerMode === "date") {
        setPickerMode("time");
      } else {
        setShowDatePicker(false);
        setCheckTime(formatDateString(currentDate));
      }
    } else {
      setCheckTime(formatDateString(currentDate));
    }
  };

  // YouTube video ID parser to fetch video thumbnail URL offline
  function getYoutubeThumbnail(link) {
    if (!link) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = link.match(regExp);
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
    }
    return null;
  }

  // Get nice domain brand icon & details
  function getLinkMeta(link) {
    if (!link) return { icon: Globe, color: t.blue, label: "Link" };
    if (link.includes("youtube.com") || link.includes("youtu.be")) {
      return { icon: Video, color: "#FF0000", label: "YouTube" };
    }
    if (link.includes("instagram.com")) {
      return { icon: Video, color: "#E1306C", label: "Instagram" };
    }
    if (link.includes("medium.com") || link.includes("wikipedia.org") || link.endsWith(".pdf")) {
      return { icon: FileText, color: "#121214", label: "Article" };
    }
    return { icon: Globe, color: t.blue, label: "Web" };
  }

  // Schedule local notification
  async function scheduleLocalAlert(item) {
    if (!item.reminderEnabled || !item.checkTime) return null;
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return null;

      const date = new Date(item.checkTime.replace(" ", "T"));
      if (isNaN(date.getTime()) || date <= new Date()) return null;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🔔 Watch Later Reminder`,
          body: `${item.category}: ${item.title || item.url}`,
          categoryIdentifier: "watch-later-reminder",
          data: { url: item.url, itemId: item.id, itemTitle: item.title || item.url, category: item.category },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: date,
          channelId: "default",
        },
      });
      return id;
    } catch (e) {
      console.warn("Could not schedule notification:", e);
      return null;
    }
  }

  // Save or update link item
  const handleSaveItem = async () => {
    if (!url.trim()) return;
    const itemTitle = title.trim() || url.trim();
    const finalCheckTime = checkTime.trim() || formatDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));

    if (editingItem) {
      if (editingItem.reminderId) {
        try {
          await Notifications.cancelScheduledNotificationAsync(editingItem.reminderId);
        } catch (e) {
          console.warn("Could not cancel notification:", e);
        }
      }

      const updatedItem = {
        ...editingItem,
        title: itemTitle,
        url: url.trim(),
        category,
        checkTime: finalCheckTime,
        reminderEnabled,
      };

      let newReminderId = null;
      if (reminderEnabled) {
        newReminderId = await scheduleLocalAlert(updatedItem);
      }
      updatedItem.reminderId = newReminderId;

      dispatch({ type: "UPDATE_WATCH_LATER", item: updatedItem });
    } else {
      const newItem = {
        id: Date.now() + Math.random(),
        title: itemTitle,
        url: url.trim(),
        category,
        checkTime: finalCheckTime,
        reminderEnabled,
        createdDate: new Date().toISOString().slice(0, 10),
      };

      let newReminderId = null;
      if (reminderEnabled) {
        newReminderId = await scheduleLocalAlert(newItem);
      }
      newItem.reminderId = newReminderId;

      dispatch({ type: "ADD_WATCH_LATER", item: newItem });
    }

    // Reset Form
    setTitle("");
    setUrl("");
    setCheckTime("");
    setReminderEnabled(true);
    setEditingItem(null);
    setShowAddSheet(false);
    setClipboardUrl("");
    setShowCatDropdown(false);
  };

  const handleQuickAddFromClipboard = () => {
    setUrl(clipboardUrl);
    if (clipboardUrl.includes("youtube.com") || clipboardUrl.includes("youtu.be")) {
      setCategory("YouTube");
    } else if (clipboardUrl.includes("instagram.com")) {
      setCategory("Instagram");
    } else {
      setCategory("Other");
    }
    setEditingItem(null);
    setShowAddSheet(true);
  };

  const handleOpenLink = (link) => {
    if (!link) return;
    let targetUrl = link.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }
    Linking.openURL(targetUrl).catch(err => console.error("Couldn't open link", err));
  };

  const handleDeleteItem = async (item) => {
    if (item.reminderId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(item.reminderId);
      } catch (e) {
        console.warn("Could not cancel notification:", e);
      }
    }
    dispatch({ type: "DELETE_WATCH_LATER", id: item.id });
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setTitle(item.title || "");
    setUrl(item.url || "");
    setCategory(item.category || "YouTube");
    setCheckTime(item.checkTime || "");
    setReminderEnabled(item.reminderEnabled ?? true);
    setShowCatDropdown(false);
    if (item.checkTime) {
      const parsedDate = new Date(item.checkTime.replace(" ", "T"));
      if (!isNaN(parsedDate.getTime())) {
        setPickerDate(parsedDate);
      }
    }
    setShowAddSheet(true);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    dispatch({ type: "ADD_WATCH_LATER_CATEGORY", category: newCatName.trim() });
    setNewCatName("");
    setShowCatSheet(false);
  };

  const renderItemCard = (item) => {
    const meta = getLinkMeta(item.url);
    const Icon = meta.icon;
    const ytThumb = getYoutubeThumbnail(item.url);
    const isOverdue = new Date(item.checkTime.replace(" ", "T")) < new Date();

    return (
      <View
        key={item.id}
        style={[{
          backgroundColor: t.isDark ? "#16161A" : "#FFFFFF",
          borderRadius: 16, overflow: "hidden",
          borderWidth: 1.5, borderColor: t.border,
        }, t.shadow]}
      >
        {ytThumb && (
          <TouchableOpacity onPress={() => handleOpenLink(item.url)} activeOpacity={0.9} style={{ height: 160, width: "100%", position: "relative" }}>
            <Image source={{ uri: ytThumb }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            <View style={{
              position: "absolute", inset: 0,
              alignItems: "center", justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.2)"
            }}>
              <View style={{
                width: 52, height: 52, borderRadius: 26,
                backgroundColor: "#FF0000",
                alignItems: "center", justifyContent: "center",
              }}>
                <PlayCircle size={32} color="#FFF" fill="#FFF" />
              </View>
            </View>
          </TouchableOpacity>
        )}

        <View style={{ padding: 18 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <View style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              backgroundColor: meta.color + "15",
              paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8,
              borderWidth: 1, borderColor: meta.color + "25"
            }}>
              <Icon size={12} color={meta.color} strokeWidth={2.5} />
              <Text style={{ fontSize: 9, fontWeight: "900", color: meta.color === "#121214" && !t.isDark ? "#121214" : (meta.color === "#121214" ? "#FFF" : meta.color), letterSpacing: 0.5 }}>
                {meta.label.toUpperCase()}
              </Text>
            </View>

            {item.reminderEnabled ? (
              <Bell size={14} color={t.blue} strokeWidth={2.5} />
            ) : (
              <BellOff size={14} color={t.inkThird} strokeWidth={2} />
            )}
          </View>

          <Text numberOfLines={2} style={{ fontSize: 16, fontWeight: "800", color: t.labelPrimary, lineHeight: 22, marginBottom: 8 }}>
            {item.title}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 10, color: t.inkThird, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 }}>Check Time</Text>
              <Text style={{ fontSize: 12, fontWeight: "700", color: isOverdue ? t.red : t.labelSecondary, marginTop: 2 }}>
                {item.checkTime}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => handleEditItem(item)}
                style={{
                  width: 38, height: 38, borderRadius: 10,
                  backgroundColor: t.isDark ? "#222228" : "#E5E5EA",
                  alignItems: "center", justifyContent: "center",
                  borderWidth: 1.5, borderColor: t.border,
                }}
              >
                <Pencil size={15} color={t.labelSecondary} strokeWidth={2.5} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleOpenLink(item.url)}
                style={{
                  width: 38, height: 38, borderRadius: 10,
                  backgroundColor: t.blue,
                  alignItems: "center", justifyContent: "center",
                  borderWidth: t.isDark ? 0 : 1.5, borderColor: t.border,
                }}
              >
                <ExternalLink size={16} color="#FFF" strokeWidth={2.5} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDeleteItem(item)}
                style={{
                  width: 38, height: 38, borderRadius: 10,
                  backgroundColor: t.isDark ? "#222228" : "#E5E5EA",
                  alignItems: "center", justifyContent: "center",
                  borderWidth: 1.5, borderColor: t.border,
                }}
              >
                <Trash2 size={16} color={t.red} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const filteredItems = activeCategory === "All"
    ? items
    : items.filter(x => x.category === activeCategory);

  return (
    <View style={{ flex: 1 }}>
      {/* Category List Horiz Scroll */}
      <View style={{ marginBottom: 14 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          <TouchableOpacity
            onPress={() => setActiveCategory("All")}
            style={{
              paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
              backgroundColor: activeCategory === "All" ? t.blue : (t.isDark ? "#16161A" : "#FFFFFF"),
              borderWidth: 1.5, borderColor: t.border,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "800", color: activeCategory === "All" ? "#FFFFFF" : t.labelPrimary }}>ALL</Text>
          </TouchableOpacity>

          {categories.map(c => (
            <TouchableOpacity
              key={c}
              onPress={() => setActiveCategory(c)}
              style={{
                paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
                backgroundColor: activeCategory === c ? t.blue : (t.isDark ? "#16161A" : "#FFFFFF"),
                borderWidth: 1.5, borderColor: t.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "800", color: activeCategory === c ? "#FFFFFF" : t.labelPrimary }}>{c.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={() => setShowCatSheet(true)}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
              backgroundColor: t.isDark ? "#222228" : "#E5E5EA",
              borderWidth: 1.5, borderColor: t.border,
              flexDirection: "row", alignItems: "center", gap: 6
            }}
          >
            <Plus size={13} color={t.labelPrimary} strokeWidth={3} />
            <Text style={{ fontSize: 13, fontWeight: "800", color: t.labelPrimary }}>CATEGORY</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Clipboard Alert banner */}
        {clipboardUrl !== "" && (
          <View style={[{
            backgroundColor: t.isDark ? "#222228" : "#E4ECE7",
            borderRadius: 16, padding: 16, marginBottom: 16,
            borderWidth: 1.5, borderColor: t.border,
          }, t.shadow]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Bookmark size={15} color={t.blue} strokeWidth={2.5} />
              <Text style={{ fontSize: 11, fontWeight: "900", color: t.blue, letterSpacing: 0.8, textTransform: "uppercase" }}>Link Found in Clipboard</Text>
            </View>
            <Text numberOfLines={1} style={{ fontSize: 14, color: t.labelPrimary, marginBottom: 14 }}>{clipboardUrl}</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={handleQuickAddFromClipboard}
                style={{
                  backgroundColor: t.blue, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10,
                  borderWidth: t.isDark ? 0 : 1.5, borderColor: t.border,
                }}
              >
                <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "800", textTransform: "uppercase" }}>Quick Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setClipboardUrl("")}
                style={{
                  backgroundColor: t.isDark ? "#16161A" : "#FFFFFF", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10,
                  borderWidth: 1.5, borderColor: t.border,
                }}
              >
                <Text style={{ color: t.labelPrimary, fontSize: 12, fontWeight: "800", textTransform: "uppercase" }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Empty State */}
        {filteredItems.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 64, gap: 10 }}>
            <View style={{
              width: 76, height: 76, borderRadius: 16,
              backgroundColor: t.blue + "15",
              alignItems: "center", justifyContent: "center", marginBottom: 14,
              borderWidth: 1.5, borderColor: t.border,
            }}>
              <PlayCircle size={36} color={t.blue} strokeWidth={2} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "800", color: t.labelPrimary, textTransform: "uppercase", letterSpacing: 0.5 }}>No links saved</Text>
            <Text style={{ fontSize: 14, color: t.inkThird, textAlign: "center", maxWidth: 220, lineHeight: 20, marginBottom: 16 }}>
              Add a YouTube video, Instagram reel, or reference link to watch or read later.
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setEditingItem(null);
                  setTitle("");
                  setUrl("");
                  setCheckTime("");
                  setReminderEnabled(true);
                  setShowAddSheet(true);
                }}
                activeOpacity={0.7}
                style={{
                  backgroundColor: t.blue, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12,
                  borderWidth: t.isDark ? 0 : 1.5, borderColor: t.border,
                }}
              >
                <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "800", textTransform: "uppercase" }}>Add Link</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowCatSheet(true)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: t.isDark ? "#222228" : "#FFFFFF", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12,
                  borderWidth: 1.5, borderColor: t.border,
                }}
              >
                <Text style={{ color: t.labelPrimary, fontSize: 12, fontWeight: "800", textTransform: "uppercase" }}>Add Category</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          activeCategory === "All" ? (
            <View style={{ gap: 20 }}>
              {categories.map(cat => {
                const catItems = items.filter(item => item.category === cat);
                if (catItems.length === 0) return null;
                return (
                  <View key={cat} style={{ gap: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10, marginBottom: 4 }}>
                      <View style={{ height: 1.5, flex: 1, backgroundColor: t.border }} />
                      <Text style={{ fontSize: 11, fontWeight: "900", color: t.labelSecondary, letterSpacing: 1.5, textTransform: "uppercase" }}>
                        {cat} ({catItems.length})
                      </Text>
                      <View style={{ height: 1.5, flex: 1, backgroundColor: t.border }} />
                    </View>
                    
                    <View style={{ gap: 14 }}>
                      {catItems.map(item => renderItemCard(item))}
                    </View>
                  </View>
                );
              })}
              {(() => {
                const extraItems = items.filter(item => !categories.includes(item.category));
                if (extraItems.length === 0) return null;
                return (
                  <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10, marginBottom: 4 }}>
                      <View style={{ height: 1.5, flex: 1, backgroundColor: t.border }} />
                      <Text style={{ fontSize: 11, fontWeight: "900", color: t.labelSecondary, letterSpacing: 1.5, textTransform: "uppercase" }}>
                        OTHER / UNCATEGORIZED ({extraItems.length})
                      </Text>
                      <View style={{ height: 1.5, flex: 1, backgroundColor: t.border }} />
                    </View>
                    <View style={{ gap: 14 }}>
                      {extraItems.map(item => renderItemCard(item))}
                    </View>
                  </View>
                );
              })()}
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {filteredItems.map(item => renderItemCard(item))}
            </View>
          )
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => setShowAddSheet(true)}
        activeOpacity={0.7}
        style={[{
          position: "absolute", bottom: 20, right: 20,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: t.blue,
          alignItems: "center", justifyContent: "center",
          borderWidth: t.isDark ? 0 : 1.5, borderColor: t.border,
        }, t.shadow]}
      >
        <Plus size={24} color="#FFF" strokeWidth={3} />
      </TouchableOpacity>

      {/* Manage Categories Sheet */}
      <Sheet title="Manage Categories" visible={showCatSheet} onClose={() => setShowCatSheet(false)}>
        <View style={{ gap: 16 }}>
          {/* Add Category Section */}
          <Text style={{ fontSize: 11, fontWeight: "800", color: t.inkThird, textTransform: "uppercase", letterSpacing: 0.8 }}>
            Create Category
          </Text>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <View style={{
              flex: 1,
              backgroundColor: t.isDark ? "#222228" : "#FFFFFF",
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: t.border,
              paddingHorizontal: 12,
            }}>
              <TextInput
                placeholder="e.g. Design, News, Reels"
                value={newCatName}
                onChangeText={setNewCatName}
                placeholderTextColor={t.inkThird}
                style={{ color: t.labelPrimary, paddingVertical: 10, fontSize: 13, fontWeight: "600" }}
              />
            </View>
            <TouchableOpacity
              onPress={handleAddCategory}
              activeOpacity={0.7}
              style={{
                backgroundColor: t.blue,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: t.isDark ? 0 : 1.5,
                borderColor: t.border,
                height: 42,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "900", color: "#FFFFFF" }}>ADD</Text>
            </TouchableOpacity>
          </View>

          {/* Categories List Section */}
          <Text style={{ fontSize: 11, fontWeight: "800", color: t.inkThird, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 10 }}>
            Existing Categories
          </Text>
          <View style={{
            backgroundColor: t.isDark ? "#16161A" : "#FFFFFF",
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: t.border,
            overflow: "hidden",
            marginBottom: 10
          }}>
            {categories.map((c, idx) => {
              const isDefault = ["YouTube", "Instagram", "Tutorials", "Articles", "Other"].includes(c);
              return (
                <View key={c}>
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: t.labelPrimary }}>
                      {c.toUpperCase()}
                    </Text>
                    {isDefault ? (
                      <Text style={{ fontSize: 10, fontWeight: "800", color: t.inkThird }}>DEFAULT</Text>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          dispatch({ type: "DELETE_WATCH_LATER_CATEGORY", category: c });
                          if (activeCategory === c) {
                            setActiveCategory("All");
                          }
                        }}
                        activeOpacity={0.7}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          backgroundColor: t.red + "15",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Trash2 size={14} color={t.red} strokeWidth={2} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {idx < categories.length - 1 && (
                    <View style={{ height: 1, backgroundColor: t.separator }} />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </Sheet>

      {/* Add/Edit Watch Later Sheet */}
      <Sheet title={editingItem ? "Edit Watch Later" : "Add Watch Later"} visible={showAddSheet} onClose={() => { setShowAddSheet(false); setEditingItem(null); }}>
        <ScrollView style={{ gap: 16, maxHeight: 400 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
          <View style={{ gap: 16, paddingBottom: 10 }}>
            <AppleInput
              label="URL / Link"
              placeholder="e.g. https://www.youtube.com/watch?v=..."
              value={url}
              onChangeText={setUrl}
            />

            <AppleInput
              label="Title (Optional)"
              placeholder="e.g. React Native Tutorial"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={{ fontSize: 11, fontWeight: "800", color: t.inkThird, marginBottom: 8, paddingLeft: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Category
            </Text>
            
            {/* Selection Box */}
            <TouchableOpacity
              onPress={() => setShowCatDropdown(!showCatDropdown)}
              activeOpacity={0.8}
              style={{
                backgroundColor: t.isDark ? "#222228" : "#FFFFFF",
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: t.border,
                paddingHorizontal: 16,
                paddingVertical: 15,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10
              }}
            >
              <Text style={{ fontSize: 15, color: t.labelPrimary, fontWeight: "600" }}>
                {category ? category.toUpperCase() : "SELECT CATEGORY"}
              </Text>
              <ChevronDown size={16} color={t.inkThird} strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Dropdown Panel */}
            {showCatDropdown && (
              <View style={{
                backgroundColor: t.isDark ? "#1C1C24" : "#F2F2F7",
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: t.border,
                padding: 12,
                marginTop: -4,
                marginBottom: 12,
                gap: 10
              }}>
                {/* Search Input for Category */}
                <View style={{
                  backgroundColor: t.isDark ? "#222228" : "#FFFFFF",
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: t.border,
                  paddingHorizontal: 12,
                }}>
                  <TextInput
                    placeholder="Search or type new category..."
                    value={catSearch}
                    onChangeText={setCatSearch}
                    placeholderTextColor={t.inkThird}
                    style={{ color: t.labelPrimary, paddingVertical: 8, fontSize: 13, fontWeight: "600" }}
                  />
                </View>

                {/* Wrapped Category Options (no nested ScrollView to avoid gesture conflicts) */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {/* Add New Category inline if typed name is not empty and doesn't match */}
                  {catSearch.trim() !== "" && !categories.some(c => c.toLowerCase() === catSearch.trim().toLowerCase()) && (
                    <TouchableOpacity
                      onPress={() => {
                        const cleaned = catSearch.trim();
                        dispatch({ type: "ADD_WATCH_LATER_CATEGORY", category: cleaned });
                        setCategory(cleaned);
                        setCatSearch("");
                        setShowCatDropdown(false);
                      }}
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
                        backgroundColor: t.blue,
                        borderWidth: t.isDark ? 0 : 1.5, borderColor: t.border,
                        flexDirection: "row", alignItems: "center", gap: 6
                      }}
                    >
                      <Plus size={13} color="#FFFFFF" strokeWidth={3} />
                      <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFFFFF" }}>CREATE "{catSearch.toUpperCase()}"</Text>
                    </TouchableOpacity>
                  )}

                  {categories
                    .filter(c => c.toLowerCase().includes(catSearch.toLowerCase()))
                    .map(c => {
                      const isSelected = category === c;
                      return (
                        <TouchableOpacity
                          key={c}
                          onPress={() => {
                            setCategory(c);
                            setCatSearch("");
                            setShowCatDropdown(false);
                          }}
                          activeOpacity={0.7}
                          style={{
                            paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
                            backgroundColor: isSelected ? t.blue : (t.isDark ? "#222228" : "#FFFFFF"),
                            borderWidth: 1.5, borderColor: isSelected ? t.blue : t.border,
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: "800", color: isSelected ? "#FFFFFF" : t.labelPrimary }}>
                            {c.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </View>
            )}

            {/* Native Date Picker Integration with Presets */}
            <Text style={{ fontSize: 11, fontWeight: "800", color: t.inkThird, marginBottom: 8, paddingLeft: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Check-in Date & Time
            </Text>
            
            {/* Quick Presets */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {[
                { label: "+1 Hr", offset: 1 * 60 * 60 * 1000 },
                { label: "+3 Hr", offset: 3 * 60 * 60 * 1000 },
                { label: "Tomorrow", offset: 24 * 60 * 60 * 1000 },
                { label: "Next Week", offset: 7 * 24 * 60 * 60 * 1000 },
              ].map(preset => (
                <TouchableOpacity
                  key={preset.label}
                  onPress={() => {
                    const d = new Date(Date.now() + preset.offset);
                    setPickerDate(d);
                    setCheckTime(formatDateString(d));
                  }}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                    backgroundColor: t.isDark ? "#222228" : "#E5E5EA",
                    borderWidth: 1, borderColor: t.border
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: t.labelSecondary }}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {Platform.OS === "ios" ? (
              <View style={{
                backgroundColor: t.isDark ? "#222228" : "#FFFFFF",
                borderRadius: 14, borderWidth: 1.5, borderColor: t.border,
                padding: 10, alignItems: "center", marginBottom: 16
              }}>
                <DateTimePicker
                  value={pickerDate}
                  mode="datetime"
                  display="default"
                  themeVariant={t.isDark ? "dark" : "light"}
                  onChange={(event, d) => {
                    if (d) {
                      setPickerDate(d);
                      setCheckTime(formatDateString(d));
                    }
                  }}
                />
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => { setPickerMode("date"); setShowDatePicker(true); }}
                activeOpacity={0.8}
                style={{
                  backgroundColor: t.isDark ? "#222228" : "#FFFFFF",
                  borderRadius: 14, borderWidth: 1.5, borderColor: t.border,
                  paddingVertical: 15, paddingHorizontal: 16, marginBottom: 16,
                  flexDirection: "row", alignItems: "center", gap: 10
                }}
              >
                <Clock size={16} color={t.labelSecondary} strokeWidth={2.5} />
                <Text style={{ fontSize: 15, fontWeight: "600", color: checkTime ? t.labelPrimary : t.inkThird }}>
                  {checkTime || "Tap to select Custom Date & Time"}
                </Text>
              </TouchableOpacity>
            )}

            {showDatePicker && Platform.OS !== "ios" && (
              <DateTimePicker
                value={pickerDate}
                mode={pickerMode}
                display="default"
                onChange={handleDateChange}
              />
            )}

            <Text style={{ fontSize: 11, fontWeight: "800", color: t.inkThird, marginBottom: 8, paddingLeft: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Reminder Notification
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setReminderEnabled(true)}
                activeOpacity={0.7}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center",
                  backgroundColor: reminderEnabled ? t.blue : (t.isDark ? "#222228" : "#E5E5EA"),
                  borderWidth: 1.5, borderColor: reminderEnabled ? t.blue : t.border
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "800", color: reminderEnabled ? "#FFFFFF" : t.labelPrimary }}>YES, NOTIFY</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setReminderEnabled(false)}
                activeOpacity={0.7}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center",
                  backgroundColor: !reminderEnabled ? t.blue : (t.isDark ? "#222228" : "#E5E5EA"),
                  borderWidth: 1.5, borderColor: !reminderEnabled ? t.blue : t.border
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "800", color: !reminderEnabled ? "#FFFFFF" : t.labelPrimary }}>NO, JUST SAVE</Text>
              </TouchableOpacity>
            </View>

            <SheetBtn onClick={handleSaveItem}>{editingItem ? "Update Link" : "Save Link"}</SheetBtn>
          </View>
        </ScrollView>
      </Sheet>
    </View>
  );
}
