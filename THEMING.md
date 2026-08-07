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

| Variable                      | Default                       | Affects                                           |
| ----------------------------- | ----------------------------- | ------------------------------------------------- |
| `--oscd-theme-primary`        | `#0b335b`                     | Used in the header, and primary buttons           |
| `--oscd-theme-secondary`      | `#2485e5`                     |                                                   |
| `--oscd-theme-base03`         | `#121417`                     |                                                   |
| `--oscd-theme-base02`         | `#1a1e23`                     | Used in some md/mdc defaults                      |
| `--oscd-theme-base01`         | `#3d4651`                     | Used in some md/mdc defaults                      |
| `--oscd-theme-base00`         | `#46505d`                     | --md-sys-color-on-surface                         |
| `--oscd-theme-base0`          | `#8b97a7`                     |                                                   |
| `--oscd-theme-base1`          | `#96a1b0`                     | Used in some md/mdc defaults                      |
| `--oscd-theme-base2`          | `#f3f5f6`                     | --md-sys-color-secondary-container                |
| `--oscd-theme-base3`          | `white`                       | --md-sys-color-on-primary, --md-sys-color-surface |
| `--oscd-theme-error`          | `#dc322f`                     | Error color                                       |
| `--oscd-theme-warning`        | `#b58900`                     | Warning color                                     |
| `--oscd-theme-text-font`      | `'Roboto'`                    | Main font family                                  |
| `--oscd-theme-text-font-mono` | `'Roboto Mono'`               | Monospace font family                             |
| `--oscd-theme-icon-font`      | `'Material Symbols Outlined'` | Icon font family                                  |

## App Bar Design Tokens

| Variable                                    | Default                      | Affects                  |
| ------------------------------------------- | ---------------------------- | ------------------------ |
| `--oscd-shell-app-bar-color`                | `--oscd-base3`               | text color in app bar    |
| `--oscd-shell-app-bar-background-color`     | `--oscd-theme-primary`       | App bar background       |
| `--oscd-shell-app-bar-height`               | `54px` (oscd-ui default)     | App bar height           |
| `--oscd-shell-app-bar-small-height`         | `48px`                       | Mobile app bar height    |
| `--oscd-shell-app-bar-elevation`            | `--md-sys-elevation-level-2` | App bar elevation        |
| `--oscd-shell-app-bar-icon-height`          | `34.4px`                     | App logo height          |
| `--oscd-shell-app-bar-icon-width`           | `auto`                       | App logo width           |
| `--oscd-shell-app-bar-title-font-family`    | `--oscd-theme-text-font`     | App title font family    |
| `--oscd-shell-app-bar-title-color`          | `--oscd-theme-base3`         | App title color          |
| `--oscd-shell-app-bar-title-font-size`      | `22.114px`                   | App title size           |
| `--oscd-shell-app-bar-title-font-weight`    | `400`                        | App title weight         |
| `--oscd-shell-app-bar-title-font-style`     | `normal`                     | App title font-style     |
| `--oscd-shell-app-bar-title-line-height`    | `normal`                     | App title line-height    |
| `--oscd-shell-app-bar-title-letter-spacing` | `inherit`                    | App title letter spacing |
| `--oscd-shell-app-bar-current-editor-font-family` | `--oscd-theme-text-font` | Current editor font family |
| `--oscd-shell-app-bar-current-editor-font-size`   | `16px`                   | Current editor font size   |
| `--oscd-shell-app-bar-current-editor-font-weight` | `500`                    | Current editor font weight |
| `--oscd-shell-app-bar-current-editor-font-style`  | `normal`                 | Current editor font style  |
| `--oscd-shell-app-bar-current-editor-line-height` | `normal`                 | Current editor line height |
| `--oscd-shell-app-bar-current-editor-color`       | `--oscd-base3`           | Current editor text color  |
| `--oscd-shell-app-bar-action-icon-size`     | `24px`                       | Undo/redo icon size      |
| `--oscd-shell-app-bar-action-icon-color`    | `--oscd-base3`               | Undo/redo icon color     |

## File Selection Menu

| Design Token                              | Default                  | Affects                    |
| ----------------------------------------- | ------------------------ | -------------------------- |
| `--oscd-shell-file-menu-text-font-family` | `--oscd-theme-text-font` | File-menu label font       |
| `--oscd-shell-file-menu-text-size`        | `16px`                   | File-menu label size       |
| `--oscd-shell-file-menu-text-weight`      | `500`                    | File-menu label weight     |
| `--oscd-shell-file-menu-text-color`       | `--oscd-base3`           | File-menu label/icon color |

## Plugins Drop-down Menu

| Design Token                                              | Default         | Affects                      |
| --------------------------------------------------------- | --------------- | ---------------------------- |
| `--oscd-shell-plugins-menu-button-color`                  | `--oscd-base3`  | Menu button Icon color       |
| `--oscd-shell-plugins-menu-button-size`                   | `24px`          | Menu button Icon size        |
| `--oscd-shell-plugins-menu-min-width`                     | `350px`         | Dropdown width               |
| `--oscd-shell-plugins-menu-padding`                       | `12px`          | Menu inner spacing           |
| `--oscd-shell-plugins-menu-container-color`               | `--oscd-base3`  | Menu surface                 |
| `--oscd-shell-plugins-menu-item-label-color`              | `--oscd-base00` | Menu item text color         |
| `--oscd-shell-plugins-menu-item-leading-icon-color`       | `--oscd-base00` | Menu item leading icon color |
| `--oscd-shell-plugins-menu-item-selected-container-color` | `--oscd-base2`  | Selected row background      |
| `--oscd-shell-plugins-menu-item-selected-label-color`     | `--oscd-base00` | Selected row label color     |

### Editor Plugins Side Panel

| Design Token                                            | Default          | Affects                                |
| ------------------------------------------------------- | ---------------- | -------------------------------------- |
| `--oscd-shell-editor-plugins-panel-width`               | `280px`          | Width of the Editor Plugins Side Panel |
| `--oscd-shell-editor-plugins-panel-padding-top`         | `20px`           | Top spacing                            |
| `--oscd-shell-editor-plugins-panel-item-leading-space`  | `22px`           | Left inset in each item                |
| `--oscd-shell-editor-plugins-panel-item-trailing-space` | `10px`           | Right inset in each item               |
| `--oscd-shell-editor-plugins-panel-item-icon-size`      | `28px`           | Icon size in list items                |
| `--oscd-shell-editor-plugins-panel-item-text-color`     | `--oscd-base3`   | List text color                        |
| `--oscd-shell-editor-plugins-panel-item-icon-color`     | `--oscd-base3`   | List icon color                        |
| `--oscd-shell-editor-plugins-panel-item-active-bg`      | `--oscd-primary` | Active editor background               |

### Main Editor Container

| Design Token                           | Default        | Affects                     |
| -------------------------------------- | -------------- | --------------------------- |
| `--oscd-shell-editor-background-color` | `--oscd-base3` | Main editor area background |
| `--oscd-shell-editor-padding`          | `8px`          | Main editor inner spacing   |

### Landing Page

| Design Token                                  | Default            | Affects                       |
| --------------------------------------------- | ------------------ | ----------------------------- |
| `--oscd-shell-landing-heading-color`          | `--oscd-base3`     | Heading text color            |
| `--oscd-shell-landing-heading-font-family`    | `--oscd-text-font` | Heading font family           |
| `--oscd-shell-landing-heading-size`           | `50px`             | Heading size                  |
| `--oscd-shell-landing-heading-style`          | `normal`           | heading font style            |
| `--oscd-shell-landing-heading-weight`         | `600`              | heading font-weight           |
| `--oscd-shell-landing-heading-line-height`    | `normal`           | heading line-height           |
| `--oscd-shell-landing-subheading-color`       | `--oscd-base3`     | Sub-heading text color        |
| `--oscd-shell-landing-subheading-font-family` | `--oscd-text-font` | Sub-heading font family       |
| `--oscd-shell-landing-subheading-size`        | `16.909px`         | Sub-heading font size         |
| `--oscd-shell-landing-subheading-style`       | `normal`           | Sub-heading font style        |
| `--oscd-shell-landing-subheading-weight`      | `400`              | Sub-heading font-weight       |
| `--oscd-shell-landing-subheading-line-height` | `65.194px`         | Sub-heading line-height       |
| `--oscd-shell-landing-grid-width`             | `60%`              | Card grid width               |
| `--oscd-shell-landing-grid-gap`               | `95px`             | Gap between plugin cards      |
| `--oscd-shell-landing-card-width`             | `240px`            | Card width                    |
| `--oscd-shell-landing-card-height`            | `180px`            | Card height                   |
| `--oscd-shell-landing-card-background`        | `--oscd-primary`   | Card background               |
| `--oscd-shell-landing-card-text-color`        | `--oscd-base3`     | Card label and icon color     |
| `--oscd-shell-landing-card-radius`            | `2px`              | Card corner shape             |
| `--oscd-shell-landing-card-icon-size`         | `54px`             | Card icon size                |
| `--oscd-shell-landing-card-corner-accent`     | `#f5e214`          | Decorative corner wedge color |
