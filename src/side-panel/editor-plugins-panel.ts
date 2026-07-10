import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { localized } from '@lit/localize';

import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';

import { LocaleTag, Translation } from '../localization.js';
import { classMap } from 'lit/directives/class-map.js';
import { PluginEntry } from '../oscd-shell.js';

declare global {
  interface HTMLElementTagNameMap {
    'editor-plugins-panel': EditorPluginsPanel;
  }
}

@localized()
export class EditorPluginsPanel extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-icon-button': OscdIconButton,
    'oscd-icon': OscdIcon,
    'oscd-list': OscdList,
    'oscd-list-item': OscdListItem,
  };

  @property({ type: Array })
  editors: PluginEntry[] = [];

  @property({ type: Number })
  selectedPlugin?: PluginEntry;

  @property({ type: String })
  locale!: LocaleTag;

  // eslint-disable-next-line class-methods-use-this
  @property({ type: Boolean, reflect: true })
  get expanded() {
    const expandedStr = localStorage.getItem('editorsPanel.expanded');
    return expandedStr === 'false' ? false : true;
  }
  // eslint-disable-next-line class-methods-use-this
  set expanded(expanded: boolean) {
    localStorage.setItem('editorsPanel.expanded', String(expanded));
  }

  render() {
    return html`
      <oscd-list class="editors-list" role="tablist">
        ${this.editors.map(
          (editor, index) =>
            html`<oscd-list-item
              class=${classMap({ active: this.selectedPlugin === editor })}
              type="button"
              @click=${() => {
                this.dispatchEvent(
                  new CustomEvent('editor-select', {
                    detail: { editor, index },
                    bubbles: true,
                    composed: true,
                  }),
                );
              }}
            >
              <oscd-icon slot="start">${editor.icon}</oscd-icon>
              ${this.expanded
                ? html`<span
                    >${editor.translations?.[this.locale as Translation] ||
                    editor.name}</span
                  >`
                : nothing}
            </oscd-list-item>`,
        )}
      </oscd-list>
      <div class="footer">
        <oscd-icon-button
          class="toggle-button"
          @click=${() => {
            this.expanded = !this.expanded;
          }}
        >
          <oscd-icon
            >${this.expanded
              ? 'left_panel_close'
              : 'left_panel_open'}</oscd-icon
          ></oscd-icon-button
        >
      </div>
    `;
  }

  static styles = css`
    :host {
      width: var(--editor-plugins-panel-width);
      height: calc(100% - var(--editor-plugins-panel-padding-top));
      display: grid;
      grid-template-rows: 1fr auto;
      min-height: 0;
      padding-top: var(--editor-plugins-panel-padding-top);
      transition: width 0.1s ease-in-out;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .editors-list {
      min-height: 0;
      --md-list-item-leading-space: var(
        --editor-plugins-panel-item-leading-space
      );
      --md-list-item-trailing-space: var(
        --editor-plugins-panel-item-trailing-space
      );
      --md-icon-size: var(--editor-plugins-panel-item-icon-size);
      --md-list-container-color: rgba(0, 0, 0, 0);
      --md-list-item-label-text-color: var(
        --editor-plugins-panel-item-text-color
      );
      --md-list-item-leading-icon-color: var(
        --editor-plugins-panel-item-icon-color
      );
    }

    .editors-list .active {
      background-color: var(--editor-plugins-panel-item-active-bg);
    }

    .editors-list oscd-list-item span {
      /* prevents jitter when collapsing */
      white-space: nowrap;
    }

    .footer {
      /* setting this to display:none until re-design is fixed and its safe to remove */
      display: none;
      /* justify-self: center;
      justify-content: center;
      padding-block: 22px; */
    }

    .toggle-button {
      --md-icon-color: var(--editor-plugins-panel-item-icon-color);
      --md-icon-button-icon-size: var(--editor-plugins-panel-item-icon-size);
      --md-icon-button-hover-state-layer-color: var(
        --editor-plugins-panel-item-icon-color
      );
      --md-icon-button-hover-state-layer-opacity: 0.08;
      --md-icon-button-icon-color: var(--editor-plugins-panel-item-icon-color);
      --md-icon-button-hover-icon-color: var(
        --editor-plugins-panel-item-icon-color
      );
      --md-icon-button-focus-icon-color: var(
        --editor-plugins-panel-item-icon-color
      );
      --md-icon-button-pressed-icon-color: var(
        --editor-plugins-panel-item-icon-color
      );
      --md-icon-button-state-layer-height: 48px;
      --md-icon-button-state-layer-width: 48px;
    }

    :host([expanded]) {
      width: var(--editor-plugins-panel-width);
    }

    /* :host([expanded]) .footer {
      justify-self: flex-end;
      justify-content: flex-end;
      padding-inline: 22px;
    } */
  `;
}
