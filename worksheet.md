# Feature

- Add support for plugin groups
- Add support for grouped plugin menus
- Add support for groups in the Editor side panel
- Add support for pinned Editor
- Add support for searching Editors (should we support Ctrl+f??)
  - nice to have: when only one search result, hitting enter launches that editor (listener in search field)
  - should we consider extracting the search field out into its own oscd-ui component (or put it together so it could be moved out to oscd-ui later)?
- App Bar improvements:
  - Display current editor to the left of the App bar (with separator between it and logo/menu button)
  - Change file selector dropdown to appear on right side (with separator between it and undo/redo actions)
- Collapsible Side panel
  - should collapse to show only group icons or root editor plugin icons
  - state should be persisted in local storage so browser refresh does not change appearance/preference
  - Any groups should show pop-out menu (to the right) when user hovers over group icon

# General Requirements

- copilot-instructions.md and SKILLs should be used to guide development
- Unless it is technically more costly, agents should make use of the already running npm processes for WDS (dev server) and WTR (unit tests)
- All relevant figma designs have been exported as png and are currently stored in ./figma-designs/ directory
- Keep this document up to date without wordy prose, but enough detail that a developer and agent can pick this up at any point and continue,
- We want to keep unit test code coverage at 100% if possible, if not, it needs to be justified
- As instructions should already mandate, favor a structured approach to each task by:
  - Start by reviewing remaining tasks and assessing if our priorities are still correct and jointly decide on next steps (adjusting priorities in this document as needed)
  - Carry out a technical analysis of what needs to be done, what are our options (pros/cons if they are justified), where complexity justifies it, options are documented (to the point without wordy prose)
  - Jointly decide on the implementation details - we should be clear on how and what we're going to do,
  - Implement according to agreed plan,
  - Task Exit criteria:
    - New code is sufficiently covered by unit tests (100% coverage if possible), existing tests adjusted based on changes to existing code,
    - Implementation aligns with Figma designs,
    - Task details & status documented - plus any follow ups or discovered findings,
- The developer stages and commits code, not the Agents

# Action Items List

Below is an ordered (numbered) list of action items. Fully completed action items are suffixed with "✅". Action items that are in progress are suffixed with "🟡".

1. Add support for plugin groups (data model) ✅
2. Grouped plugin menus (app bar) ✅
3. Grouped editors in side panel ✅
4. Pinned editor ✅
5. Search editors 🟡
6. Localization pass (static UI strings + unique group ids) ✅
7. App bar improvements (current editor left, file selector right) ✅
8. Collapsible side panel (icon rail + group popout) 🟡
   8a. Search on collapsed, temporarily opens flyout and closes after selection

# Action Item Details

Each action item can be detailed here. Titles are suffixed with "✅", when completed, and the details should be updated as progress is made.

## 1. Add support for plugin groups (data model) ✅

- `PluginGroup<P>` type in `oscd-shell.ts` (`name`, `icon`, `translations?`, `plugins[]`).
- `isPluginGroup`, `flattenPluginEntries`, `filterPlugins` in `plugin-utils.ts`.
- `loadSourcedPlugins` recurses into groups; `willUpdate` selects first leaf of first group.

## 2. Grouped plugin menus (app bar) ✅

- `plugins-menu.ts` renders `oscd-sub-menu` per group; group + item names localized via `translations[locale]`.

## 3. Grouped editors in side panel ✅

- `editor-plugins-panel.ts` renders `oscd-tree`; `buildTreeNodes` maps groups→branches, plugins→leaves.
- Group names localized via `translations[locale] ?? name`.

## 4. Pinned editor ✅

- Pin/unpin via leaf accessory; `pinnedPluginIds`/`pinnedExpanded` persisted (`@localstorage()`).
- Gaps: "Pinned" label + aria-labels hardcoded English (see item 6).

## 5. Search editors 🟡

- `filterBySearchTerm` matches leaf `name` only (group names intentionally excluded).
- Open: search matches untranslated `name` (DE labels won't match); Ctrl+F and enter-to-launch not done (nice-to-have).

## 6. Localization pass (static UI strings + unique group ids) ✅

Done:

- Wrapped static strings in `editor-plugins-panel.ts` with `msg()`/`str`: "Search", "Pinned", "Pin {name}"/"Unpin {name}", "Collapse sidebar", "Expand sidebar". DE targets added to `src/localization/de.xlf`, built via `npm run localize`.
- Group `name` localization already worked (via `translations[locale]`) — confirmed.
- `filterBySearchTerm(editors, term, locale?)` now matches source `name` OR `translations[locale]` (leaf plugins only; group names still excluded). Panel passes `this.locale`.
- Unique group tree-ids: `buildTreeNodes` sets group `id = group:{index}:{name}` (positional). Duplicate group names now render as independent groups — no merge/normalization needed.
- Tests: added merge→dropped; added `filterBySearchTerm` locale cases, `buildTreeNodes` positional-id cases, panel search/localized-search/pin/unpin/empty-select. 124 unit tests pass.

Decision history:

- Initially chose merge-by-name; revisited and **dropped it**. The only impact of duplicate group names was tree-node id collision (`oscd-tree` expansion/localStorage state). Fixed at the source by decoupling id from name via positional ids, rather than defensively normalizing config.

Remaining (not required for this item):

- ⚠️ DE **visual** baselines (`editor-plugins-*-de.png`) will change (English→German). Run `npm run test:update` when ready.
- Panel interaction coverage still has pre-existing gaps (tree expand/collapse event handlers).

## 7. App bar improvements

- Show current editor name left of logo/menu with separator (design: "OpenSCD ⌄ | Edit Substation") ✅
- Move file selector to right side with separator before undo/redo (previously `alignMiddle`) ✅
- Corrected order to logo/menu → vertical `oscd-divider` → current editor.
- Current editor and file selector separators are rendered only when their corresponding value exists.
- Current editor selection now uses the flattened editor list when the document and plugins become available.
- Uses the existing app-bar typography variables for the current editor label.
- Added structural unit coverage for app-bar slot placement and divider/action presence.
- Ref: `figma-designs/regular-look.png`, `regular-look-file-switching.png`.

## 8. Collapsible side panel 🟡 (largely done — 2026-07-17)

- Collapse to icon rail (group / root-editor icons); persist state in localStorage.
- Group icons show pop-out menu to the right on hover.
- Ref: `figma-designs/collapsed-side-bar.png`, `collapsed-side-bar_active-plugin.png`.

Done this session:

- ✅ Icon rail (76px) with group/root-editor icons; expand/collapse persisted via `@localstorage()` (supersedes I4).
- ✅ Footer toggle now visible: expanded → `oscd-list-item type="button"` (full-width, left-aligned, icon at x24 matching rows); collapsed → `oscd-icon-button` in the rail (44px state layer matching rail items).
- ✅ Group flyout menus: open to the right as a top-layer popover (`anchor-corner="start-end"` / `menu-corner="start-start"` / `positioning="popover"`). Fixes earlier bug where camelCase corner attrs were silently ignored → menu opened downward and was clipped by `overflow-x: hidden`.
- ✅ Flyout header styled (secondary-blue Material label-large) + `oscd-divider` between header and items.
- ✅ Colour scheme consolidated: `--md-sys-color-on-surface` / `-on-surface-variant` set once on the content containers (`.rail, .tree-container, .footer`) from `--editor-plugins-panel-item-*` tokens, so resting **and** derived hover/pressed state layers resolve correctly (was gray-on-hover before). Flyout scope resets these to the shell defaults (dark-on-light). Removed scattered per-component `--md-*-color` patches. New tokens: `--editor-plugins-panel-divider-color`, `--editor-plugins-panel-flyout-header-text-color`.

Open (obvious/minor — deferred):

- Active-highlight colour not yet tuned to Figma (French-blue-15 `#0B335B`); currently `--oscd-primary`.
- Footer/flyout density + spacing fine-tuning vs Figma still pending.
- A11y: `oscd-list-item type="button"` hardcodes `role="listitem"` (announces as list item, not button); mitigated with `aria-label`. Revisit if strict button semantics are wanted (e.g. upstream `role` override or use a real button with row styling).
- Visual-regression `*.test.ts` baselines need regenerating for the new footer/flyout/rail; the stale `oscd-list` tab-click test is still failing (pre-existing, unrelated).
- Proper fix for the transparent-panel default surface is tracked separately (see Tech Debt + `panel-default-surface` todo) — not required for item 8.

Done 2026-08-06:

- ✅ Backfilled unit tests for the search-mode + rail-flyout surface that item 8/5 had left uncovered: rail search icon → transient `search-mode` (no `expanded` persistence), search-field focus, Escape exit (+ no-op when not in search mode), `editor-select` exiting search mode, pinned/editors tree `expanded-ids-changed` persistence, pinned-tree `selected-ids-changed` → `editor-select`, and the group rail flyout (open/close toggle, no-op on unknown anchor, item click → `editor-select`, active-highlight on selected plugin). Added a grouped-editor test fixture (`groupedEditorPlugins`) since the existing `sampleEditorPlugins` had no `PluginGroup`. `src/side-panel/editor-plugins-panel.ts` is now 100% line-covered (was 94.6%); overall coverage 99.31% (was 91.34%). 139 unit tests pass.

# Open Issues (from manual testing — 2026-07-17)

## I1. Side-panel localStorage state resets on reload 🔴 HIGH ✅ FIXED

- Symptom: expand/collapse + pin/unpin update localStorage during a session, but a reload wipes it → persisted panel state does nothing for the user.
- Root cause: `@localstorage() @state()` props (`expandedIds`, `pinnedPluginIds`, `pinnedExpanded`) use `= []` field initializers. With `experimentalDecorators` + `useDefineForClassFields:false`, the initializer assigns via the reactive setter in the constructor → `requestUpdate` → the decorator's persist wrapper writes `[]` to localStorage **before** `connectedCallback` hydration runs, clobbering the stored value every reload.
- Fix (done by @stee-re): dropped the `= []` initializers; now `@localstorage({ default: [] }) @state() expandedIds!: string[];` (same for the other two). `expanded` moved to `@localstorage({ default: true })` (key changed `editorsPanel.expanded` → `editor-plugins-panel:expanded`). Consider upstream oscd-ui fix: persist wrapper should not run before hydration.
- Pre-existing (introduced with the pinned/tree persistence in the earlier grouping commits), not caused by the item-6 localization work.

## I2. Missing reload/hydration test coverage 🔴 HIGH ✅ DONE

- No test simulated a reload: seed localStorage → mount panel → assert hydrated state survives construction and reaches the tree.
- The only persistence test covered the separate hand-rolled `expanded` getter/setter (key `editorsPanel.expanded`), NOT the `@localstorage()` decorator props — which is why I1 went undetected.
- Added (`editor-plugins-panel.spec.ts`): `mountFreshPanel()` helper simulates a reload; nested describe "restores persisted state on reload (fresh mount)" seeds `expandedIds`/`pinnedPluginIds`/`pinnedExpanded`/`expanded`, asserts each is applied on mount AND that construction does not overwrite it (regression guard for I1). Updated the two `expanded` tests to the new decorator key (JSON-encoded); centralised keys in `LS_KEYS`. Verified the guard bites by temporarily reintroducing the field-initializer bug (test failed as expected). 125 tests pass, coverage 91.6%.

## I3. Side-panel spacing/density mismatch vs Figma 🟠 MED (partially addressed)

- Rows taller/sparser than `regular-look.png`. Suspects: tree row height/vertical padding, `--oscd-tree-indent-step` (currently 40px), oversized selected-leaf row block, search field + group-header typography/size, pinned row trailing chevron when empty.
- Action: derive exact spacings from Figma, map to `editor-plugins-panel` design tokens.

### I3a. Trailing chevrons/pins clipped + long labels not truncating ✅ FIXED

- Symptom (exposed by the long German label `Veröffentlichen und Adressieren`): every group looked like a non-expandable flat row — no collapse chevrons, even on short labels like `SLD`. Long labels were clipped mid-word.
- Root cause: the per-row ellipsis in `oscd-tree`/`oscd-tree-item` only engages if a width limit propagates down the flex/grid chain. The panel host has a definite 280px width, but two items in the chain lacked `min-width: 0`, so the longest label's intrinsic (max-content) width leaked up and sized **every** row to 325px (measured via Playwright). Trailing toggles landed at x≈343, past the panel's `overflow-x: hidden` edge at 280 → invisible.
  1. `.tree-container` — grid item in the panel (oscd-shell).
  2. `oscd-tree` `:host` — flex item in `.tree-container` (oscd-ui). Everything _inside_ `oscd-tree` already had `min-width: 0`.
- Fix (split, both repos):
  - **oscd-ui** `tree/internal/Tree.ts`: added `min-width: 0` to `oscd-tree`'s `:host` so the tree is a well-behaved flex/grid child by default for every consumer - fixed in oscd-ui 0.0.15.
  - **oscd-shell** `editor-plugins-panel.ts`: added `min-width: 0` to `.tree-container`; added Option-A accessible tooltip via `title=${label}` on the headline span (full name on hover/focus when truncated).
- Verified (Playwright): tree width 325px → **228px**, trailing controls right-edge 343 → **246** (inside the 280 panel); all group chevrons + leaf pins visible; long label truncates with `…`. oscd-shell 125 tests pass; oscd-ui tree spec 9 pass.
- Remaining under I3: actual row-height/spacing density tuning vs Figma (row height, indent-step, selected-leaf block, empty-Pinned trailing chevron).
- Fixed ✅
  1. Corrections applied to oscd-ui
  2. added min-width:0; and set panel default width to the figma design width of 308px.

## I4. Duplicate/dead collapse+persist mechanism 🟡 LOW ✅ DONE (item 8)

- Was: `expanded` getter/setter persisted width state but the footer toggle was `display:none` → no visible effect.
- Resolved in item 8: consolidated onto `@localstorage({ default: true })` (key `editor-plugins-panel:expanded`) and the footer toggle is now visible (list-item expanded / icon-button collapsed), so persistence has a visible effect.

# Findings / Tech Debt

- **Editor-plugins-panel has no default surface — transparent by default (design debt, high-impact UX).** The panel renders light ("white") foreground text/icons on a _transparent_ background; the visible blue only comes from a background image/colour set by the host page (e.g. the demo's `background.svg`). Anyone embedding the shell without setting a background on `html`/`body` gets white-on-transparent content, so the plugin items are effectively invisible — the classic "why does only the first editor item show?" trap (they all show, you just can't see them). Fix: give the panel a sensible **default surface colour aligned with the Material palette + main colour palette**, with matching sensible **foreground** colours, and expose design tokens so the current transparent look can still be opted into (set the surface token to `transparent` for @stee-re's own theme/background image). This also removes the current `--md-sys-color-*` override fight: the shell's `* { --md-sys-color-on-surface: base00 }` beats the panel's `:host` override, which only "works" today because the foreground is separately forced white — a proper panel surface + on-surface scheme fixes both.
- `selectedEditor` uses `@property({ type: Number })` in `editor-plugins-panel.ts` (should be object).
- Global tag decl `'plugin-menu'` vs registered `'plugins-menu'` mismatch.
- `expanded` uses `@localstorage({ default: true })` (was a hand-rolled getter/setter on raw `localStorage`); as of item 8 the footer toggle is visible, so persistence now has a visible effect.
- Clicking on pinned displays an empty editor. Consider behavior of empty pinned section. Disabled?
