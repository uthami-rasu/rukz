# Rukz App Fixes — Implementation Plan

## Context

The user reports 5 bugs in the Rukz productivity app (`/home/arffy/playground/productivity/App.js`):

1. **Goal-creation sheet UI/focus issues** — opening "New Goal" doesn't auto-focus the first field, the keyboard covers inputs, and the sheet's ScrollView kills tap events
2. **Dashboard goals are not tappable** — on the Summary tab, the goal-progress list is a plain `View`; the user has to navigate to the Goals tab first to open a goal
3. **Export JSON broken** — writing to `FileSystem.documentDirectory` and sharing it silently fails
4. **Import JSON + Upload Excel/CSV broken** — same root cause as #3
5. **"Rukz" brand does not render in cursive** — the header falls back to italic / non-cursive when the Caveat font isn't yet loaded

### Root cause for #3 and #4

`expo-file-system@19.0.23` (Expo SDK 54) **deprecates and runtime-throws** the top-level `FileSystem` namespace (`readAsStringAsync`, `writeAsStringAsync`, `documentDirectory`). The current code imports `* as FileSystem from "expo-file-system"` and calls those methods → the calls throw and the user sees "Could not read/import/export".

The fix is to import from `expo-file-system/legacy` instead. Verified via https://docs.expo.dev/versions/v54.0.0/sdk/filesystem/ — every legacy method (`readAsStringAsync`, `writeAsStringAsync`, `documentDirectory`, `EncodingType`) is still available there, and this is the SDK-54 migration path documented by Expo.

### Root cause for #5

`useFonts` returns `false` until `Caveat_700Bold` finishes downloading. While loading, the header falls back to `Platform.select({ ios: "Snell Roundhand", android: "sans-serif" })` + italic — which is not cursive on Android at all. The fix is to render nothing (or a tiny placeholder) until fonts are ready, and to keep the brand using `Caveat_700Bold` once they are.

---

## Files to modify

Only **one file** changes: `App.js`. No `package.json`, `app.json`, or asset changes needed.

---

## Changes (in file order)

### A. Font loading — fix #5 (cursive "Rukz")

**Where**: top of `export default function App()`, where `useFonts` is called.

- Replace:
  ```js
  const [fontsLoaded] = useFonts({ Caveat_700Bold });
  ```
  with a wider weight set so the brand can pick the right one:
  ```js
  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });
  ```
- Add `Caveat_400Regular` to the `useFonts` import line (currently `import { useFonts, Caveat_700Bold } from "@expo-google-fonts/caveat";`).
- **Splash gate**: just before `return (`, if `!fontsLoaded`, render a minimal splash instead of the full UI:
  ```js
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontFamily: "Caveat_700Bold", fontSize: 44, color: theme.labelPrimary }}>
          Rukz
        </Text>
      </View>
    );
  }
  ```
  Wait — `Caveat_700Bold` is not registered while `fontsLoaded` is false. So inside the early-return we cannot use it. Instead render a blank screen (the platform's default splash shows behind the app while `useFonts` resolves):
  ```js
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
  ```
  This is correct: once fonts are loaded, every Text that previously used `Platform.select(... "Snell Roundhand" / italic)` fallback will use the registered Caveat family.

- Update every place that renders the brand name "Rukz" to drop the `Platform.select` fallback. Keep the `fontsLoaded` guard but always pass `Caveat_700Bold` once the guard is true (which is now always, because of the early-return). Specifically:
  - The `<Text>` inside `Dashboard`'s empty state `Welcome to Rukz` — replace the inner `<Text style={{ fontFamily: fontsLoaded ? "Caveat_700Bold" : ..., fontStyle: ..., fontSize: 32 }}>Rukz</Text>` with `<Text style={{ fontFamily: "Caveat_700Bold", fontSize: 32 }}>Rukz</Text>`. (Remove `fontsLoaded` prop from `Dashboard` since it's no longer needed.)
  - The header `<Text>` that renders the `headerTitle`. Simplify the `fontFamily` / `fontStyle` expression to always use `Caveat_700Bold` when `headerTitle === "Rukz"`. The fallback branch becomes dead code.

### B. `AppleInput` — add `autoFocus` prop

**Where**: the `AppleInput` component (around the `TextInput` usage).

- Add `autoFocus` to the destructured props and forward it to `TextInput`:
  ```js
  function AppleInput({ label, icon: Icon, value, onChangeText, autoFocus, ...props }) {
    ...
    <TextInput
      {...props}
      autoFocus={autoFocus}
      ...
    />
  ```
- This is a non-breaking change; existing call sites that don't pass `autoFocus` get `undefined`.

### C. `Sheet` — keyboard handling & tap-through

**Where**: the `Sheet` component.

Two changes:

1. **Tap-through**: in the backdrop `TouchableOpacity`, change `onPress={onClose}` to also use `onPress` only (already does) but the ScrollView inside the sheet must accept taps while the keyboard is up. Add `keyboardShouldPersistTaps="handled"` to the inner `<ScrollView>`. Also add `keyboardDismissMode="on-drag"` so dragging dismisses the keyboard.

2. **Modal ScrollView container**: the inner `<ScrollView contentContainerStyle={{ padding: 16 }}>` becomes
   ```js
   <ScrollView
     contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
     keyboardShouldPersistTaps="handled"
     keyboardDismissMode="on-drag"
   >
   ```

### D. New Goal sheet — fix #1 (focus + UI)

**Where**: `<Sheet title="New Goal" visible={showAdd} onClose={() => setShowAdd(false)}>` inside `GoalsScreen`.

- Pass `autoFocus` to the **Goal Name** input (only):
  ```jsx
  <AppleInput
    autoFocus
    label="Goal Name"
    icon={Target}
    placeholder="e.g. Career Growth"
    value={form.name}
    onChangeText={t => setForm({ ...form, name: t })}
  />
  ```
- Apply the same `autoFocus` to the Name input in:
  - `<Sheet title="New Focus Area" ...>` inside `GoalDetail` — `autoFocus` on the Name input.
  - `<Sheet title="New Task" ...>` inside `SubGoalDetail` — `autoFocus` on the Task Name input.

(No other UI changes needed for #1 once the Sheet's keyboard/tap handling is fixed and `autoFocus` is wired.)

### E. Dashboard goals tappable — fix #2

**Where**: `Dashboard` component, the `Goal progress` group card.

- Accept a new `navigate` prop (alongside existing props).
- Replace the inner `<View style={{ padding: 13 }}>` with a `<TouchableOpacity onPress={() => navigate("goalDetail", { goalId: g.id })} style={{ padding: 13 }}>`.
- Update the call site in `App()`'s `renderScreen()` to pass `navigate={navigate}` to `<Dashboard ... />`.

### F. File-system migration — fixes #3 and #4

**Where**: top of `App.js`, the `import * as FileSystem from "expo-file-system";` line.

Change to:
```js
import * as FileSystem from "expo-file-system/legacy";
```

This restores `documentDirectory`, `writeAsStringAsync`, `readAsStringAsync`, `EncodingType`, etc. — and these now actually work at runtime in SDK 54 instead of throwing.

No other changes are needed inside `handleExport`, `handleImport`, `handleExcelImport`, or `handleDownloadTemplate`. They already use:
- `FileSystem.documentDirectory` ✓
- `FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 })` ✓
- `FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 })` ✓
- `FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })` ✓
- `Sharing.isAvailableAsync()` / `Sharing.shareAsync(...)` ✓
- `DocumentPicker.getDocumentAsync({ type, copyToCacheDirectory: true })` ✓ — and the picker docs explicitly say `copyToCacheDirectory: true` is required for the legacy file-system to read the picked file, which the code already sets.

### Implementation note for the Excel import

`XLSX.read(contentBase64, { type: "base64" })` only works if `contentBase64` is a real base64 string. The current `FileSystem.readAsStringAsync(..., { encoding: FileSystem.EncodingType.Base64 })` does return base64 when the underlying file is a file:// URI (which is the case because `copyToCacheDirectory: true`). After the migration, this will start working.

---

## Acceptance criteria

After the build agent finishes:

1. `App.js` compiles with `npx expo export --platform web --dev` or by parsing the file (we don't have a native build environment, so verify by `node -e "require('fs').readFileSync('App.js', 'utf8');"` + visual inspection of the diff).
2. The 5 fixes are present:
   - [ ] `useFonts` registers `Caveat_400Regular` AND `Caveat_700Bold`.
   - [ ] Early-return splash when `!fontsLoaded`.
   - [ ] `AppleInput` accepts and forwards `autoFocus`.
   - [ ] Goal, Focus Area, Task sheets all pass `autoFocus` to their Name input.
   - [ ] Sheet ScrollView has `keyboardShouldPersistTaps="handled"` and `keyboardDismissMode="on-drag"`.
   - [ ] Dashboard goal-progress rows are `TouchableOpacity` calling `navigate("goalDetail", { goalId: g.id })`.
   - [ ] `import * as FileSystem from "expo-file-system/legacy";` (NOT `expo-file-system`).
3. No other unrelated edits to `App.js`.

---

## Build chunk

**Complexity**: `simple`. All edits are to one file in well-defined locations; no concurrency, no new architecture, no new dependencies. A standard-tier Builder can implement this from the spec alone.

**Scope**:
- Single file: `App.js`.
- 7 surgical edits (A through F above).
- Builder should run `node --check App.js` to confirm syntactic validity, and visually re-read the touched sections in the diff to confirm correctness.
- No tests are added (this project has no test setup). Verification is the diff itself + reading the file.
