# oscd-shell Theming Variables

This document lists all the Design Tokens developers can use to customize the `oscd-shell`.

## How to Override

In your distro theme.css file, you can define values for any of the variables documented below to override the default values. For example:

```css
:root {
  --oscd-shell-app-bar-background-color: #123456;
  --oscd-shell-app-bar-color: #654321;
}
```

## Foundation Theme Tokens

Defaults are the [Solarized](https://ethanschoonover.com/solarized/) light
palette used by the legacy OpenSCD shell, so `oscd-shell` is brand-neutral out
of the box. Distro-specific branding (e.g. a product's own colors) should
override these `--oscd-theme-*` variables from outside; nothing brand-specific
ships as a default here.

| Variable                      | Default                       | Affects                                           |
| ----------------------------- | ----------------------------- | ------------------------------------------------- |
| `--oscd-theme-primary`        | `#2aa198`                     | Used in the header, and primary buttons           |
| `--oscd-theme-secondary`      | `#6c71c4`                     |                                                   |
| `--oscd-theme-base03`         | `#002b36`                     |                                                   |
| `--oscd-theme-base02`         | `#073642`                     | Used in some md/mdc defaults                      |
| `--oscd-theme-base01`         | `#586e75`                     | Used in some md/mdc defaults                      |
| `--oscd-theme-base00`         | `#657b83`                     | --md-sys-color-on-surface                         |
| `--oscd-theme-base0`          | `#839496`                     |                                                   |
| `--oscd-theme-base1`          | `#93a1a1`                     | Used in some md/mdc defaults                      |
| `--oscd-theme-base2`          | `#eee8d5`                     | --md-sys-color-secondary-container                |
| `--oscd-theme-base3`          | `#fdf6e3`                     | --md-sys-color-on-primary, --md-sys-color-surface |
| `--oscd-theme-error`          | `#dc322f`                     | Error color                                       |
| `--oscd-theme-warning`        | `#b58900`                     | Warning color                                     |
| `--oscd-theme-text-font`      | `'Roboto'`                    | Main font family                                  |
| `--oscd-theme-text-font-mono` | `'Roboto Mono'`               | Monospace font family                             |
| `--oscd-theme-icon-font`      | `'Material Symbols Outlined'` | Icon font family                                  |

## Design Token Layering

Every color/font token in `oscd-shell` flows through the same four layers,
each of which should only ever reference the layer directly above it:

`--oscd-theme-*` (public brand override)
→ `--oscd-*` (internal Solarized palette + fonts)
→ `--md-sys-color-*` / `--md-ref-typeface-*` (MD3 semantic layer)
→ shell-specific tokens (`--oscd-shell-*`, e.g. `--oscd-shell-app-bar-color`)

All token tables below this section document their defaults in terms of the
MD3 semantic layer (`--md-sys-color-*` / `--md-ref-typeface-*`), not the raw
`--oscd-*` palette. The mapping between the two is fixed (not brand-specific)
and documented once here:

| MD3 Token                                          | Mapped from        |
| -------------------------------------------------- | ------------------ |
| `--md-sys-color-primary`                           | `--oscd-primary`   |
| `--md-sys-color-on-primary`                        | `--oscd-base3`     |
| `--md-sys-color-secondary`                         | `--oscd-secondary` |
| `--md-sys-color-on-secondary`                      | `--oscd-base3`     |
| `--md-sys-color-secondary-container`               | `--oscd-base2`     |
| `--md-sys-color-surface`                           | `--oscd-base3`     |
| `--md-sys-color-on-surface`                        | `--oscd-base00`    |
| `--md-sys-color-surface-variant`                   | `--oscd-base3`     |
| `--md-sys-color-on-surface-variant`                | `--oscd-base00`    |
| `--md-sys-color-surface-bright`                    | `--oscd-base2`     |
| `--md-sys-color-surface-container(-high/-highest)` | `--oscd-base3`     |
| `--md-sys-color-outline-variant`                   | `--oscd-primary`   |
| `--md-sys-color-error`                             | `--oscd-error`     |
| `--md-sys-color-on-error`                          | `--oscd-base3`     |
| `--md-ref-typeface-plain`                          | `--oscd-text-font` |

**Exceptions**: MD3 does not standardize icon fonts or monospace fonts, so
there is no `--md-*` equivalent for those. `--oscd-icon-font` and
`--oscd-text-font-mono` are referenced directly (unmapped) wherever a shell
token needs them.

### The mapping block is declared on `:host` only

`oscd-shell-design-tokens.ts` declares every token **once, on `:host`**, and
lets normal CSS inheritance carry it down. It must never be widened to
`:host, *`: a universal selector *re-declares* each token on every element in
the shell's shadow root, and that is what makes a local override a
self-reference (see below).

### Re-theming a component: set the system colour, not every component token

Because MD3 component tokens all fall back to the `--md-sys-color-*` layer, the
concise way to re-theme a component or a subtree is to set the system colour on
it. Resting colours *and* every derived hover/focus/pressed state layer then
follow from one declaration:

```css
/* Preferred: one declaration re-themes the whole button, state layers included */
[slot='alignEnd'] oscd-filled-icon-button {
  --md-sys-color-on-primary: var(--app-bar-action-icon-color);
}
```

Enumerating `--md-filled-icon-button-{icon,hover-icon,focus-icon,pressed-icon}-color`
by hand achieves the same thing far more verbosely, and silently drops any
state layer you forget.

**The one rule that makes this safe:** never assign a system token on the *same
element* that also declares the shell token you are reading from. Shell tokens
are derived from the MD3 layer, so with both declarations on one element the two
reference each other:

```css
/* WRONG, if this element also carries the mapping block.
   --app-bar-action-icon-color is defined as
   var(--oscd-shell-app-bar-action-icon-color, var(--md-sys-color-on-primary)) */
:host {
  --md-sys-color-on-primary: var(--app-bar-action-icon-color);
}
```

Per CSS Custom Properties a cycle resolves to the guaranteed-invalid value:
both tokens go empty on that element *and everything below it*, and the
downstream `var(--md-sys-color-primary, #6750a4)` fallbacks inside Material
components resurface as stock Material purple.

In practice this means: apply the override to the elements you are styling
(`[slot='alignEnd'] oscd-filled-icon-button`, `.rail`, `.tree-container`), not
to the `:host` that carries the token mappings. Keeping the selector tight also
avoids collateral damage — a broad `oscd-app-bar *` applies the declaration to
every element in the subtree.

### Every token is declared once, in the token file

Internal tokens must be declared in `oscd-shell-design-tokens.ts` as
`--internal: var(--oscd-shell-public, <default>)` and documented in the tables
below. Do not invent a token inline in a component with an ad-hoc fallback
(`var(--app-bar-separator-color, currentColor)`): the fallback becomes an
undocumented second source of truth that no distro can discover or override.

## Shell Root

| Variable                        | Default                  | Affects                                                          |
| ------------------------------- | ------------------------ | ---------------------------------------------------------------- |
| `--oscd-shell-background-color` | `--md-sys-color-surface` | Shell root background (behind app bar/main content and any gaps) |

## App Bar Design Tokens

| Variable                                          | Default                                           | Affects                    |
| ------------------------------------------------- | ------------------------------------------------- | -------------------------- |
| `--oscd-shell-app-bar-color`                      | `--md-sys-color-on-primary`                       | text color in app bar      |
| `--oscd-shell-app-bar-background-color`           | `--md-sys-color-primary`                          | App bar background         |
| `--oscd-shell-app-bar-height`                     | `54px` (oscd-ui default)                          | App bar height             |
| `--oscd-shell-app-bar-small-height`               | `48px`                                            | Mobile app bar height      |
| `--oscd-shell-app-bar-elevation`                  | `--md-sys-elevation-level-2`                      | App bar elevation          |
| `--oscd-shell-app-bar-icon-height`                | `34.4px`                                          | App logo height            |
| `--oscd-shell-app-bar-icon-width`                 | `auto`                                            | App logo width             |
| `--oscd-shell-app-bar-logo-gap`                   | `16px`                                            | Space between app logo and title |
| `--oscd-shell-app-bar-title-menu-gap`             | `4px`                                             | Space between title and plugins menu button |
| `--oscd-shell-app-bar-title-font-family`          | `--md-ref-typeface-plain`                         | App title font family      |
| `--oscd-shell-app-bar-title-color`                | `--app-bar-color` (→ `--md-sys-color-on-primary`) | App title color            |
| `--oscd-shell-app-bar-title-font-size`            | `22.114px`                                        | App title size             |
| `--oscd-shell-app-bar-title-font-weight`          | `400`                                             | App title weight           |
| `--oscd-shell-app-bar-title-font-style`           | `normal`                                          | App title font-style       |
| `--oscd-shell-app-bar-title-line-height`          | `normal`                                          | App title line-height      |
| `--oscd-shell-app-bar-title-letter-spacing`       | `inherit`                                         | App title letter spacing   |
| `--oscd-shell-app-bar-current-editor-font-family` | `--md-ref-typeface-plain`                         | Current editor font family |
| `--oscd-shell-app-bar-current-editor-font-size`   | `16px`                                            | Current editor font size   |
| `--oscd-shell-app-bar-current-editor-font-weight` | `500`                                             | Current editor font weight |
| `--oscd-shell-app-bar-current-editor-font-style`  | `normal`                                          | Current editor font style  |
| `--oscd-shell-app-bar-current-editor-line-height` | `normal`                                          | Current editor line height |
| `--oscd-shell-app-bar-current-editor-color`       | `--app-bar-color` (→ `--md-sys-color-on-primary`) | Current editor text color  |
| `--oscd-shell-app-bar-action-icon-size`           | `24px`                                            | Undo/redo icon size        |
| `--oscd-shell-app-bar-action-icon-color`          | `--md-sys-color-on-primary`                       | Undo/redo icon color       |
| `--oscd-shell-app-bar-action-icon-disabled-color` | `--md-sys-color-on-primary`                       | Disabled undo/redo icon color |
| `--oscd-shell-app-bar-action-icon-disabled-container-opacity` | `0`                                   | Disabled undo/redo container opacity |
| `--oscd-shell-app-bar-separator-color`            | `currentColor`                                    | App bar vertical separator color |
| `--oscd-shell-app-bar-separator-opacity`          | `0.38`                                            | App bar vertical separator opacity |

## File Selection Menu

| Design Token                              | Default                     | Affects                    |
| ----------------------------------------- | --------------------------- | -------------------------- |
| `--oscd-shell-file-menu-text-font-family` | `--md-ref-typeface-plain`   | File-menu label font       |
| `--oscd-shell-file-menu-text-size`        | `16px`                      | File-menu label size       |
| `--oscd-shell-file-menu-text-weight`      | `500`                       | File-menu label weight     |
| `--oscd-shell-file-menu-text-color`       | `--md-sys-color-on-primary` | File-menu label/icon color |

## Plugins Drop-down Menu

| Design Token                                              | Default                              | Affects                      |
| --------------------------------------------------------- | ------------------------------------ | ---------------------------- |
| `--oscd-shell-plugins-menu-button-color`                  | `--md-sys-color-on-primary`          | Menu button Icon color       |
| `--oscd-shell-plugins-menu-button-size`                   | `24px`                               | Menu button Icon size        |
| `--oscd-shell-plugins-menu-min-width`                     | `350px`                              | Dropdown width               |
| `--oscd-shell-plugins-menu-padding`                       | `12px`                               | Menu inner spacing           |
| `--oscd-shell-plugins-menu-container-color`               | `--md-sys-color-surface`             | Menu surface                 |
| `--oscd-shell-plugins-menu-item-label-color`              | `--md-sys-color-on-surface`          | Menu item text color         |
| `--oscd-shell-plugins-menu-item-leading-icon-color`       | `--md-sys-color-on-surface`          | Menu item leading icon color |
| `--oscd-shell-plugins-menu-item-selected-container-color` | `--md-sys-color-secondary-container` | Selected row background      |
| `--oscd-shell-plugins-menu-item-selected-label-color`     | `--md-sys-color-on-surface`          | Selected row label color     |

## Editor Plugins Side Panel

| Design Token                                            | Default                     | Affects                                                                                                                     |
| ------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--oscd-shell-editor-plugins-panel-width`               | `280px`                     | Width of the Editor Plugins Side Panel                                                                                      |
| `--oscd-shell-editor-plugins-panel-padding-top`         | `20px`                      | Top spacing                                                                                                                 |
| `--oscd-shell-editor-plugins-panel-item-leading-space`  | `22px`                      | Left inset in each item                                                                                                     |
| `--oscd-shell-editor-plugins-panel-item-trailing-space` | `10px`                      | Right inset in each item                                                                                                    |
| `--oscd-shell-editor-plugins-panel-item-icon-size`      | `28px`                      | Icon size in list items                                                                                                     |
| `--oscd-shell-editor-plugins-panel-background-color`    | `--md-sys-color-surface`              | Panel surface background. Set to `transparent` for a distro that paints its own background (e.g. behind the shell) instead. |
| `--oscd-shell-editor-plugins-panel-item-text-color`     | `--md-sys-color-on-surface` | Resting list text color                                                                                                     |
| `--oscd-shell-editor-plugins-panel-item-icon-color`     | `--md-sys-color-on-surface` | Resting list icon color                                                                                                     |
| `--oscd-shell-editor-plugins-panel-item-active-bg`      | `--md-sys-color-primary`            | Active/selected editor background                                                                                           |
| `--oscd-shell-editor-plugins-panel-item-active-color`   | `--md-sys-color-on-primary` | Active/selected + keyboard-focus text, icon, and highlight border color                                                     |

## Main Editor Container

| Design Token                           | Default        | Affects                     |
| -------------------------------------- | -------------- | --------------------------- |
| `--oscd-shell-editor-background-color` | `--md-sys-color-surface` | Main editor area background |
| `--oscd-shell-editor-padding`          | `8px`          | Main editor inner spacing   |

## Landing Page

| Design Token                                  | Default                       | Affects                                                           |
| --------------------------------------------- | ----------------------------- | ----------------------------------------------------------------- |
| `--oscd-shell-landing-background-color`       | `--md-sys-color-surface`                | Landing page background                                           |
| `--oscd-shell-landing-heading-color`          | `--md-sys-color-on-surface`   | Heading text color                                                |
| `--oscd-shell-landing-heading-font-family`    | `--md-ref-typeface-plain`     | Heading font family                                               |
| `--oscd-shell-landing-heading-size`           | `50px`                        | Heading size                                                      |
| `--oscd-shell-landing-heading-style`          | `normal`                      | heading font style                                                |
| `--oscd-shell-landing-heading-weight`         | `600`                         | heading font-weight                                               |
| `--oscd-shell-landing-heading-line-height`    | `normal`                      | heading line-height                                               |
| `--oscd-shell-landing-subheading-color`       | `--md-sys-color-on-surface`   | Sub-heading text color                                            |
| `--oscd-shell-landing-subheading-font-family` | `--md-ref-typeface-plain`     | Sub-heading font family                                           |
| `--oscd-shell-landing-subheading-size`        | `16.909px`                    | Sub-heading font size                                             |
| `--oscd-shell-landing-subheading-style`       | `normal`                      | Sub-heading font style                                            |
| `--oscd-shell-landing-subheading-weight`      | `400`                         | Sub-heading font-weight                                           |
| `--oscd-shell-landing-subheading-line-height` | `65.194px`                    | Sub-heading line-height                                           |
| `--oscd-shell-landing-grid-width`             | `60%`                         | Card grid width                                                   |
| `--oscd-shell-landing-grid-gap`               | `95px`                        | Gap between plugin cards                                          |
| `--oscd-shell-landing-card-width`             | `240px`                       | Card width                                                        |
| `--oscd-shell-landing-card-height`            | `180px`                       | Card height                                                       |
| `--oscd-shell-landing-card-background`        | `--md-sys-color-secondary`            | Card background                                                   |
| `--oscd-shell-landing-card-text-color`        | `--md-sys-color-on-secondary` | Card label and icon color                                         |
| `--oscd-shell-landing-card-radius`            | `2px`                         | Card corner shape                                                 |
| `--oscd-shell-landing-card-icon-size`         | `54px`                        | Card icon size                                                    |
| `--oscd-shell-landing-card-corner-accent`     | `transparent`                 | Decorative corner wedge color; unset by default, opt-in per brand |
