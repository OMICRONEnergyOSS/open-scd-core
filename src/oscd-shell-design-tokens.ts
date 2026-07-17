import { css } from 'lit';

/**
 * Single source of truth for oscd-shell design tokens.
 *
 * This block contains:
 * 1) Internal base tokens and fallbacks
 * 2) Public token -> internal token mappings
 *
 * Keep this as an all-or-nothing layer so mappings can safely reference
 * internal base tokens (e.g. --oscd-base*).
 */
export const oscdShellDesignTokens = css`
  /* Internal base theme tokens and defaults */
  * {
    --oscd-primary: var(--oscd-theme-primary, #0b335b);
    --oscd-secondary: var(--oscd-theme-secondary, #2485e5);
    --oscd-base03: var(--oscd-theme-base03, #121417);
    --oscd-base02: var(--oscd-theme-base02, #1a1e23);
    --oscd-base01: var(--oscd-theme-base01, #3d4651);
    --oscd-base00: var(--oscd-theme-base00, #46505d);
    --oscd-base0: var(--oscd-theme-base0, #8b97a7);
    --oscd-base1: var(--oscd-theme-base1, #96a1b0);
    --oscd-base2: var(--oscd-theme-base2, #f3f5f6);
    --oscd-base3: var(--oscd-theme-base3, white);
    --oscd-error: var(--oscd-theme-error, #dc322f);
    --oscd-warning: var(--oscd-theme-warning, #b58900);
    --oscd-text-font: var(--oscd-theme-text-font, 'Roboto');
    --oscd-text-font-mono: var(--oscd-theme-text-font-mono, 'Roboto Mono');
    --oscd-icon-font: var(--oscd-theme-icon-font, 'Material Symbols Outlined');

    /* Fallbacks for Material Design variables */
    --md-sys-color-primary: var(--oscd-primary);
    --md-sys-color-on-primary: var(--oscd-base3);
    --md-sys-color-secondary: var(--oscd-secondary);
    --md-sys-color-on-secondary: var(--oscd-base3);
    --md-sys-color-secondary-container: var(--oscd-base2);
    --md-sys-color-surface: var(--oscd-base3);
    --md-sys-color-on-surface: var(--oscd-base00);
    --md-sys-color-surface-variant: var(--oscd-base3);
    --md-sys-color-on-surface-variant: var(--oscd-base00);
    --md-sys-color-surface-bright: var(--oscd-base2);
    --md-sys-color-surface-container: var(--oscd-base3);
    --md-sys-color-surface-container-high: var(--oscd-base3);
    --md-sys-color-surface-container-highest: var(--oscd-base3);
    --md-sys-color-outline-variant: var(--oscd-primary);
    --md-sys-color-scrim: #000000;
    --md-sys-color-error: var(--oscd-error);
    --md-sys-color-on-error: var(--oscd-base3);
    --md-icon-button-disabled-icon-color: var(--oscd-base3);
    /* --md-menu-item-selected-label-text-color: var(--oscd-base01); */
    --md-icon-button-disabled-icon-color: var(--oscd-base3);

    /* MDC Theme Colors
     * Needed for supporting any pluggins still using the depricated MWC Components
     */
    --mdc-theme-primary: var(--oscd-primary);
    --mdc-theme-secondary: var(--oscd-secondary);
    --mdc-theme-background: var(--oscd-base3);
    --mdc-theme-surface: var(--oscd-base3);
    --mdc-theme-on-primary: var(--oscd-base2);
    --mdc-theme-on-secondary: var(--oscd-base2);
    --mdc-theme-on-background: var(--oscd-base00);
    --mdc-theme-on-surface: var(--oscd-base00);
    --mdc-theme-text-primary-on-background: var(--oscd-base01);
    --mdc-theme-text-secondary-on-background: var(--oscd-base00);
    --mdc-theme-text-icon-on-background: var(--oscd-base00);
    --mdc-theme-error: var(--oscd-error);
    --mdc-button-disabled-ink-color: var(--oscd-base1);
    --mdc-drawer-heading-ink-color: var(--oscd-base00);
    --mdc-dialog-heading-ink-color: var(--oscd-base00);
    --mdc-text-field-fill-color: var(--oscd-base2);
    --mdc-text-field-disabled-fill-color: var(--oscd-base3);
    --mdc-text-field-ink-color: var(--oscd-base00);
    --mdc-text-field-label-ink-color: var(--oscd-base00);
    --mdc-text-field-idle-line-color: var(--oscd-base00);
    --mdc-text-field-hover-line-color: var(--oscd-base02);
    --mdc-select-fill-color: var(--oscd-base2);
    --mdc-select-disabled-fill-color: var(--oscd-base3);
    --mdc-select-ink-color: var(--oscd-base00);
    --mdc-select-label-ink-color: var(--oscd-base00);
    --mdc-select-idle-line-color: var(--oscd-base00);
    --mdc-select-hover-line-color: var(--oscd-base02);
    --mdc-select-dropdown-icon-color: var(--oscd-base01);
    --mdc-typography-font-family: var(--oscd-text-font);
    --mdc-icon-font: var(--oscd-icon-font);
    --mdc-theme-text-disabled-on-light: rgba(255, 255, 255, 0.38);
  }

  * {
    --app-bar-height: 54px;

    --md-sys-color-primary: var(--oscd-primary);
    --md-sys-color-on-primary: var(--oscd-base3);

    --md-sys-color-secondary-container: var(--oscd-base2);

    --md-sys-color-surface: var(--oscd-base3);
    --md-sys-color-on-surface: var(--oscd-base00);
  }

  /*
   * Public token -> internal token mappings
   *
   * Example pattern:
   * --internal-variable-name: var(--oscd-shell-public-token, <default>);
   */
  * {
    /* App bar */
    --app-bar-color: var(--oscd-shell-app-bar-color, var(--oscd-base3));
    --app-bar-background-color: var(
      --oscd-shell-app-bar-background-color,
      var(--oscd-primary)
    );
    --app-bar-height: var(--oscd-shell-app-bar-height, 54px);
    --app-bar-small-height: var(--oscd-shell-app-bar-small-height, 48px);
    --app-bar-elevation: var(
      --oscd-shell-app-bar-elevation,
      var(--md-sys-elevation-level-2)
    );
    --app-bar-app-icon-height: var(--oscd-shell-app-bar-icon-height, 34.4px);
    --app-bar-app-icon-width: var(--oscd-shell-app-bar-icon-width, auto);
    --app-bar-title-text-font-family: var(
      --oscd-shell-app-bar-title-font-family,
      var(--oscd-text-font)
    );
    --app-bar-title-text-color: var(
      --oscd-shell-app-bar-title-color,
      var(--app-bar-color)
    );
    --app-bar-title-text-font-size: var(
      --oscd-shell-app-bar-title-font-size,
      22.114px
    );
    --app-bar-title-text-font-weight: var(
      --oscd-shell-app-bar-title-font-weight,
      400
    );
    --app-bar-title-text-font-style: var(
      --oscd-shell-app-bar-title-font-style,
      normal
    );
    --app-bar-title-text-line-height: var(
      --oscd-shell-app-bar-title-line-height,
      normal
    );
    --app-bar-title-text-letter-spacing: var(
      --oscd-shell-app-bar-title-letter-spacing,
      inherit
    );
    --app-bar-action-icon-size: var(
      --oscd-shell-app-bar-action-icon-size,
      24px
    );
    --app-bar-action-icon-color: var(
      --oscd-shell-app-bar-action-icon-color,
      var(--oscd-base3)
    );

    /* Bridge to oscd-ui app bar tokens */
    --oscd-app-bar-color: var(--app-bar-color);
    --oscd-app-bar-background-color: var(--app-bar-background-color);
    --oscd-app-bar-elevation: var(--app-bar-elevation);
    --oscd-app-bar-title-font-family: var(--app-bar-title-text-font-family);
    --oscd-app-bar-title-font-size: var(--app-bar-title-text-font-size);
    --oscd-app-bar-title-font-weight: var(--app-bar-title-text-font-weight);
    --oscd-app-bar-title-line-height: var(--app-bar-title-text-line-height);

    /* Files menu */
    --file-menu-text-font-family: var(
      --oscd-shell-file-menu-text-font-family,
      var(--oscd-text-font)
    );
    --file-menu-text-size: var(--oscd-shell-file-menu-text-size, 18px);
    --file-menu-text-weight: var(--oscd-shell-file-menu-text-weight, 500);
    --file-menu-text-color: var(
      --oscd-shell-file-menu-text-color,
      var(--oscd-base3)
    );

    /* Plugins menu */
    --plugins-menu-button-size: var(
      --oscd-shell-plugins-menu-button-size,
      24px
    );
    --plugins-menu-button-color: var(
      --oscd-shell-plugins-menu-button-color,
      var(--oscd-base3)
    );
    --plugins-menu-min-width: var(--oscd-shell-plugins-menu-min-width, 350px);
    --plugins-menu-padding: var(--oscd-shell-plugins-menu-padding, 12px);
    --plugins-menu-container-color: var(
      --oscd-shell-plugins-menu-container-color,
      var(--oscd-base3)
    );
    --plugins-menu-item-label-color: var(
      --oscd-shell-plugins-menu-item-label-color,
      var(--oscd-base00)
    );
    --plugins-menu-item-leading-icon-color: var(
      --oscd-shell-plugins-menu-item-leading-icon-color,
      var(--oscd-base00)
    );
    --plugins-menu-item-selected-container-color: var(
      --oscd-shell-plugins-menu-item-selected-container-color,
      var(--oscd-base2)
    );
    --plugins-menu-item-selected-label-color: var(
      --oscd-shell-plugins-menu-item-selected-label-color,
      var(--oscd-base00)
    );

    /* Editor plugins panel */
    --editor-plugins-panel-width: var(
      --oscd-shell-editor-plugins-panel-width,
      308px
    );
    --editor-plugins-panel-collapsed-width: var(
      --oscd-shell-editor-plugins-panel-collapsed-width,
      76px
    );
    --editor-plugins-panel-padding-top: var(
      --oscd-shell-editor-plugins-panel-padding-top,
      20px
    );
    --editor-plugins-panel-item-icon-size: var(
      --oscd-shell-editor-plugins-panel-item-icon-size,
      28px
    );
    --editor-plugins-panel-item-text-color: var(
      --oscd-shell-editor-plugins-panel-item-text-color,
      var(--oscd-base3)
    );
    --editor-plugins-panel-item-icon-color: var(
      --oscd-shell-editor-plugins-panel-item-icon-color,
      var(--oscd-base3)
    );
    --editor-plugins-panel-item-active-bg: var(
      --oscd-shell-editor-plugins-panel-item-active-bg,
      var(--oscd-primary)
    );
    --editor-plugins-panel-divider-color: var(
      --oscd-shell-editor-plugins-panel-divider-color,
      #d0d5dc40
    );
    --editor-plugins-panel-flyout-header-text-color: var(
      --oscd-shell-editor-plugins-panel-flyout-header-text-color,
      var(--oscd-secondary)
    );

    /* Main editor container */
    --editor-background-color: var(
      --oscd-shell-editor-background-color,
      var(--oscd-base3)
    );
    --editor-padding: var(--oscd-shell-editor-padding, 8px);

    /* Landing page */
    --landing-heading-color: var(
      --oscd-shell-landing-heading-color,
      var(--oscd-base3)
    );
    --landing-heading-font-family: var(
      --oscd-shell-landing-heading-font-family,
      var(--oscd-text-font)
    );
    --landing-heading-size: var(--oscd-shell-landing-heading-size, 50px);
    --landing-heading-style: var(--oscd-shell-landing-heading-style, normal);
    --landing-heading-weight: var(--oscd-shell-landing-heading-weight, 600);
    --landing-heading-line-height: var(
      --oscd-shell-landing-heading-line-height,
      normal
    );

    --landing-subheading-color: var(
      --oscd-shell-landing-subheading-color,
      var(--oscd-base3)
    );
    --landing-subheading-font-family: var(
      --oscd-shell-landing-subheading-font-family,
      var(--oscd-text-font)
    );
    --landing-subheading-size: var(
      --oscd-shell-landing-subheading-size,
      16.909px
    );
    --landing-subheading-style: var(
      --oscd-shell-landing-subheading-style,
      normal
    );
    --landing-subheading-weight: var(
      --oscd-shell-landing-subheading-weight,
      400
    );
    --landing-subheading-line-height: var(
      --oscd-shell-landing-subheading-line-height,
      65.194px
    );
    --landing-grid-width: var(--oscd-shell-landing-grid-width, 60%);
    --landing-grid-gap: var(--oscd-shell-landing-grid-gap, 95px);
    --landing-card-width: var(--oscd-shell-landing-card-width, 240px);
    --landing-card-height: var(--oscd-shell-landing-card-height, 180px);
    --landing-card-background: var(
      --oscd-shell-landing-card-background,
      var(--oscd-primary)
    );
    --landing-card-text-color: var(
      --oscd-shell-landing-card-text-color,
      var(--oscd-base3)
    );
    --landing-card-radius: var(--oscd-shell-landing-card-radius, 2px);
    --landing-card-icon-size: var(--oscd-shell-landing-card-icon-size, 54px);
    --landing-card-corner-accent: var(
      --oscd-shell-landing-card-corner-accent,
      var(--omicron-yellow)
    );
  }
`;
