import { css, html, LitElement, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { localized, msg } from '@lit/localize';

import { OscdFilledIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdFilledIconButton.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdMenu } from '@omicronenergy/oscd-ui/menu/OscdMenu.js';
import { OscdSubMenu } from '@omicronenergy/oscd-ui/menu/OscdSubMenu.js';
import { OscdMenuItem } from '@omicronenergy/oscd-ui/menu/OscdMenuItem.js';

import { LocaleTag, Translation } from '../localization.js';
import { PluginEntry, PluginGroup } from '../oscd-shell.js';
import { isPluginGroup } from '../utils/plugin-utils.js';

declare global {
  interface HTMLElementTagNameMap {
    'plugins-menu': PluginsMenu;
  }
}

@localized()
export class PluginsMenu extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-filled-icon-button': OscdFilledIconButton,
    'oscd-icon': OscdIcon,
    'oscd-menu': OscdMenu,
    'oscd-sub-menu': OscdSubMenu,
    'oscd-menu-item': OscdMenuItem,
  };

  /* Properties */
  @property({ type: Array })
  editableDocs: string[] = [];

  @property({ type: Array })
  menuPlugins: PluginEntry[] = [];

  @property({ type: String })
  appIcon!: string;

  @property({ type: String })
  appTitle!: string;

  @property({ type: String, reflect: true })
  locale!: LocaleTag;

  @property({ type: String, reflect: true })
  open = () => {
    this.menu.show();
  };

  /* Queries */
  @query('oscd-menu')
  menu!: OscdMenu;

  renderMenuGroup(plugin: PluginGroup<PluginEntry>, hasDoc: boolean) {
    return html`
      <oscd-sub-menu>
        <oscd-menu-item slot="item">
          <oscd-icon slot="start">${plugin.icon}</oscd-icon>
          <div slot="headline">
            ${plugin.translations?.[this.locale as Translation] || plugin.name}
          </div>
          <oscd-icon slot="end">arrow_right</oscd-icon>
        </oscd-menu-item>
        <oscd-menu slot="menu">
          ${plugin.plugins.map(plugin => {
            return this.renderMenuItem(plugin, hasDoc);
          })}
        </oscd-menu>
      </oscd-sub-menu>
    `;
  }

  renderMenuItem(plugin: PluginEntry, hasDoc: boolean) {
    return html`
      <oscd-menu-item
        .disabled=${!!plugin.requireDoc && !hasDoc}
        @click=${() => {
          this.dispatchEvent(
            new CustomEvent('menu-plugin-select', {
              detail: { plugin },
              bubbles: true,
              composed: true,
            }),
          );
          this.menu.close();
        }}
      >
        <oscd-icon slot="start">${plugin.icon}</oscd-icon>
        <div slot="headline">
          ${plugin.translations?.[this.locale as Translation] || plugin.name}
        </div>
      </oscd-menu-item>
    `;
  }

  render() {
    return html`
      ${this.appIcon ? html`<img src=${this.appIcon} alt="logo" />` : nothing}
      <h1 class="app-title">${this.appTitle}</h1>
      <oscd-filled-icon-button
        id="menu-button"
        aria-label="${msg('Menu')}"
        @click=${async () => {
          if (this.menu.open) {
            this.menu.close();
          } else {
            this.menu.show();
          }
        }}
        ><oscd-icon>arrow_drop_down</oscd-icon></oscd-filled-icon-button
      >
      <oscd-menu
        has-overflow
        quick
        anchor="menu-button"
        menuCorner="START_END"
        anchorCorner="START_END"
      >
        ${this.menuPlugins.map(plugin => {
          const hasDoc = (this.editableDocs ?? []).length > 0;

          if (isPluginGroup(plugin)) {
            return this.renderMenuGroup(plugin, hasDoc);
          }
          return this.renderMenuItem(plugin, hasDoc);
        })}
      </oscd-menu>
    `;
  }

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    img {
      height: var(--app-bar-app-icon-height);
      width: var(--app-bar-app-icon-width);
    }

    :host h1.app-title {
      font-family: var(--app-bar-title-text-font-family);
      font-size: var(--app-bar-title-text-font-size);
      font-style: var(--app-bar-title-text-font-style);
      font-weight: var(--app-bar-title-text-font-weight);
      line-height: var(--app-bar-title-text-line-height);
      letter-spacing: var(--app-bar-title-text-letter-spacing);
      color: var(--app-bar-title-text-color);
      display: inline;
    }

    oscd-filled-icon-button {
      --md-sys-color-on-primary: var(--plugins-menu-button-color);
      --md-filled-icon-button-icon-color: var(--plugins-menu-button-color);
      --md-filled-icon-button-icon-size: var(--plugins-menu-button-size);
    }

    oscd-menu {
      min-width: var(--plugins-menu-min-width);
      padding: var(--plugins-menu-padding);
      --md-menu-container-color: var(--plugins-menu-container-color);
    }

    oscd-menu-item {
      width: 100%;
      --md-menu-item-label-text-color: var(--plugins-menu-item-label-color);
      --md-menu-item-leading-icon-color: var(
        --plugins-menu-item-leading-icon-color
      );
      --md-menu-item-selected-container-color: var(
        --plugins-menu-item-selected-container-color
      );
      --md-menu-item-selected-label-text-color: var(
        --plugins-menu-item-selected-label-color
      );
    }
  `;
}
