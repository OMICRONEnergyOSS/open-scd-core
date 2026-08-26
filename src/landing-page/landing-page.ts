import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { localized } from '@lit/localize';

import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdTextButton } from '@omicronenergy/oscd-ui/button/OscdTextButton.js';

import { PluginEntry } from '../oscd-shell.js';
import { LocaleTag } from '../localization.js';
import { OscdElevation } from '@omicronenergy/oscd-ui/elevation/OscdElevation.js';

declare global {
  interface HTMLElementTagNameMap {
    'landing-page': LandingPage;
  }
}
@localized()
export class LandingPage extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-icon': OscdIcon,
    'oscd-text-button': OscdTextButton,
    'oscd-elevation': OscdElevation,
  };

  /* Properties */

  @property({ type: String })
  heading: string = '';

  @property({ type: String })
  subHeading: string = '';
  @property({ type: Array })
  menuPlugins: PluginEntry[] = [];

  @property({ type: String, reflect: true })
  locale!: LocaleTag;

  render() {
    return html`
      <h1 class="heading">${this.heading}</h1>
      <h2 class="sub-heading">${this.subHeading}</h2>
      <div class="menu-plugins-grid">
        ${this.menuPlugins.map(
          plugin =>
            html`<oscd-text-button
              class="menu-plugin-item"
              @click=${() => {
                this.dispatchEvent(
                  new CustomEvent('menu-plugin-select', {
                    detail: { plugin },
                    bubbles: true,
                    composed: true,
                  }),
                );
              }}
            >
              <oscd-elevation></oscd-elevation>
              <div class="menu-plugin-item-content">
                <oscd-icon>${plugin.icon}</oscd-icon>
                <span>${plugin.name}</span>
                <div class="menu-plugin-item-corner-wedge"></div>
              </div>
            </oscd-text-button> `,
        )}
      </div>
    `;
  }

  static styles = css`
    :host {
      background-color: var(--landing-background-color);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .heading {
      color: var(--landing-heading-color);
      text-align: center;
      font-family: var(--landing-heading-font-family);
      font-size: var(--landing-heading-size);
      font-style: var(--landing-heading-style);
      font-weight: var(--landing-heading-weight);
      line-height: var(--landing-heading-line-height);

      margin-block-start: 64px;
      margin-block-end: 8px;

      --md-icon-size: 50px;
    }

    .sub-heading {
      color: var(--landing-subheading-color);
      text-align: center;
      font-family: var(--landing-subheading-font-family);
      font-size: var(--landing-subheading-size);
      font-style: var(--landing-subheading-style);
      font-weight: var(--landing-subheading-weight);
      line-height: var(--landing-subheading-line-height);

      margin-block-end: 168px;
    }

    .menu-plugins-grid {
      width: var(--landing-grid-width);
      display: flex;
      flex-wrap: wrap;
      gap: var(--landing-grid-gap);
      justify-content: center;
      margin: 0 auto;
      padding: 16px 0;
    }

    .menu-plugin-item {
      --md-text-button-container-shape: var(--landing-card-radius);
      display: flex;
      flex-direction: row;
      align-items: center;
      text-align: center;
      padding: 8px;
      color: var(--landing-card-text-color);
      background: var(--landing-card-background);
      transition: background-color 0.3s;
      cursor: pointer;
    }

    .menu-plugin-item:hover {
      --md-elevation-level: 2;
    }

    .menu-plugin-item-content {
      color: var(--landing-card-text-color);
      width: var(--landing-card-width);
      height: var(--landing-card-height);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
      font-family: var(--landing-heading-font-family);
    }

    .menu-plugin-item-content oscd-icon {
      --md-icon-size: var(--landing-card-icon-size);
    }

    .menu-plugin-item-content span {
      font-size: 16px;
      font-style: normal;
      font-weight: 500;
      line-height: 22px; /* 135% */
    }

    .menu-plugin-item-corner-wedge {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 50px;
      height: 50px;
      background: linear-gradient(
        to top left,
        var(--landing-card-corner-accent) 50%,
        transparent 50%
      );
    }
  `;
}
