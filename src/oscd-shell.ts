import { css, html, LitElement, nothing } from 'lit';
import {
  customElement,
  property,
  query,
  queryAssignedNodes,
  state,
} from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { localized, msg } from '@lit/localize';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';

import { OscdFilledIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdFilledIconButton.js';
import { XMLEditor } from '@openscd/oscd-editor';
import { EditEventV2, OpenEvent } from '@openscd/oscd-api';

import {
  flattenPluginEntries,
  isPluginGroup,
  loadSourcedPlugins,
} from './utils/plugin-utils.js';
import {
  getLocale,
  LocaleTag,
  setLocale,
  Translations,
} from './localization.js';
import { EditorPluginsPanel } from './side-panel/editor-plugins-panel.js';
import { PluginsMenu } from './menus/plugins-menu.js';
import { LandingPage } from './landing-page/landing-page.js';
import { RenameEvent, CloseEvent } from './foundation/events.js';
import { FilesMenu } from './menus/files-menu.js';
import { oscdShellDesignTokens } from './oscd-shell-design-tokens.js';
import { OscdAppBar } from '@omicronenergy/oscd-ui/app-bar/OscdAppBar.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';

export type PluginEntryOld = {
  name: string;
  translations?: Translations;
  tagName: string;
  icon: string;
  requireDoc?: boolean;
};

export interface PluginBase {
  name: string;
  translations?: Record<string, string>;
  icon: string;
}

export interface SourcedPluginEntry extends PluginBase {
  src: string;
  requireDoc?: boolean;
}

export interface PluginEntry extends PluginBase {
  tagName: string;
  requireDoc?: boolean;
}

export interface PluginGroup<P> extends PluginBase {
  plugins: P[];
}

export interface PluginSet<P = PluginEntry> {
  menu: (P | PluginGroup<P>)[];
  editor: (P | PluginGroup<P>)[];
  background: P[];
}

@localized()
@customElement('oscd-shell')
export class OscdShell extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-app-bar': OscdAppBar,
    'oscd-filled-icon-button': OscdFilledIconButton,
    'oscd-icon': OscdIcon,
    'files-menu': FilesMenu,
    'plugins-menu': PluginsMenu,
    'editor-plugins-panel': EditorPluginsPanel,
    'landing-page': LandingPage,
  };

  /*
   * Properties
   */

  /**
   * Url to the app icon displayed in the app bar
   */
  @property({ type: String })
  appIcon: string = '';

  @property({ type: String })
  appTitle: string = 'OpenSCD';

  @property({ type: String })
  landingPageHeading: string = 'Welcome to OpenSCD';

  @property({ type: String })
  landingPageSubHeading: string =
    'Open Source IEC-61850-6 SCL Editing Platform';

  /** The file endings of editable files */
  @property({ type: Array, reflect: true }) editable = [
    'cid',
    'icd',
    'iid',
    'scd',
    'sed',
    'ssd',
  ];

  @property({ type: String, reflect: true })
  get locale() {
    return getLocale() as LocaleTag;
  }

  set locale(tag: LocaleTag) {
    try {
      if (tag) {
        setLocale(tag);
      }
    } catch {
      // don't change locale if tag is invalid
    }
  }

  _plugins: PluginSet = { menu: [], editor: [], background: [] };

  @property({ type: Object })
  get plugins(): PluginSet {
    return this._plugins;
  }

  set plugins(
    plugins: Partial<PluginSet<Partial<PluginEntry | SourcedPluginEntry>>>,
  ) {
    this._plugins = Object.entries(plugins).reduce(
      (acc, [pluginType, kind]) => {
        const convertedPlugins = loadSourcedPlugins(kind, this.registry!);
        acc[pluginType as keyof PluginSet] = convertedPlugins;
        return acc;
      },
      { menu: [], editor: [], background: [] } as PluginSet,
    );
  }

  /*
   * States
   */
  @state()
  get canRedo(): boolean {
    return this.xmlEditor.future.length >= 1;
  }

  @state()
  get canUndo(): boolean {
    return this.xmlEditor.past.length >= 1;
  }

  @state()
  selectedEditor?: PluginEntry;

  @state()
  /** The `XMLDocument` currently being edited */
  get doc(): XMLDocument {
    return this.docs[this.docName];
  }

  /** The name of the [[`doc`]] currently being edited */
  @property({ type: String, reflect: true })
  docName = '';

  /** The set of `XMLDocument`s currently loaded */
  private _docs: Record<string, XMLDocument> = {};

  @state()
  get docs(): Record<string, XMLDocument> {
    return this._docs;
  }

  set docs(newDocs: Record<string, XMLDocument>) {
    this._docs = newDocs;
    this.docVersion += 1;
  }

  @state()
  docVersion: number = -1;

  @state()
  get editableDocs(): string[] {
    return Object.keys(this.docs).filter(name => this.isEditable(name));
  }

  @state()
  get last(): number {
    return this.xmlEditor.past.length - 1;
  }

  @state()
  xmlEditor: XMLEditor = new XMLEditor();

  /*
   * All Queries
   */

  @query('plugins-menu')
  pluginsMenu!: PluginsMenu;

  @query('editor-plugins-panel')
  editorPluginsPanel!: EditorPluginsPanel;

  @queryAssignedNodes({ slot: 'landing-page' })
  private _landingPageNodes?: NodeListOf<HTMLElement>;

  /*
   * Constructor & life cycle methods
   */
  constructor() {
    super();
    // Catch all edits (from commits AND events) and trigger an update
    this.xmlEditor.subscribe(() => {
      this.docVersion += 1;
    });
  }

  willUpdate(changedProperties: Map<PropertyKey, unknown>) {
    if (changedProperties.has('docName')) {
      if (
        this.docName &&
        this.plugins.editor.length > 0 &&
        !this.selectedEditor
      ) {
        const firstEditorItem = this.plugins.editor[0];
        if (isPluginGroup(firstEditorItem)) {
          this.selectedEditor = firstEditorItem.plugins[0];
        } else {
          this.selectedEditor = firstEditorItem;
        }
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();

    document.addEventListener('keydown', this.handleKeyPress);
    this.addEventListener('oscd-open', this.handleOpenDoc);
    this.addEventListener('oscd-rename', this.handleRenameDoc);
    this.addEventListener('oscd-close', this.handleCloseDoc);
    this.addEventListener('oscd-edit-v2', this.handleEditV2);
    this.addEventListener('oscd-undo', this.handleUndo);
    this.addEventListener('oscd-redo', this.handleRedo);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyPress);
    this.removeEventListener('oscd-open', this.handleOpenDoc);
    this.removeEventListener('oscd-rename', this.handleRenameDoc);
    this.removeEventListener('oscd-edit-v2', this.handleEditV2);
    this.removeEventListener('oscd-undo', this.handleUndo);
    this.removeEventListener('oscd-redo', this.handleRedo);
    this.removeEventListener('oscd-close', this.handleCloseDoc);
  }

  /*
   * Event Handlers
   */

  handleOpenDoc = ({ detail: { docName, doc } }: OpenEvent) => {
    this.docs = {
      ...this.docs,
      [docName]: doc,
    };
    if (this.isEditable(docName)) {
      this.docName = docName;
    }
    this.requestUpdate();
  };

  handleRenameDoc = (customEvent: RenameEvent) => {
    const { oldName, newName } = customEvent.detail;
    if (!this.docs[oldName] || newName === oldName || this.docs[newName]) {
      return;
    }
    const doc = this.docs[oldName];
    delete this.docs[oldName];
    this.docs = {
      ...this.docs,
      [newName]: doc,
    };
    this.docName = newName;
  };

  handleEditV2 = (event: EditEventV2) => {
    const { edit, title, squash } = event.detail;
    this.xmlEditor.commit(edit, { title, squash });
  };

  handleCloseDoc = (event: CloseEvent) => {
    const docName = event.detail.docName as string;
    delete this.docs[docName];
    if (this.docName === docName) {
      this.docName = this.editableDocs[0] || '';
    }
  };

  handleUndo = () => {
    this.undo();
  };

  handleRedo = () => {
    this.redo();
  };

  private handleKeyPress = (e: KeyboardEvent) => {
    if (!e.ctrlKey) {
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(this.hotkeys, e.key)) {
      return;
    }
    this.hotkeys[e.key]!.call(this);
    e.preventDefault();
  };

  handleOpenPluginMenu = () => {
    this.pluginsMenu.open();
  };

  handlePluginMenuSelect(customEvent: CustomEvent) {
    const plugin = customEvent.detail.plugin as PluginEntry;
    if (plugin.tagName) {
      this.shadowRoot!.querySelector<
        HTMLElement & { run: () => Promise<void> }
      >(plugin.tagName)!.run?.();
    }
  }
  /** Undo the last `n` [[Edit]]s committed */
  undo = (n = 1) => {
    if (!this.canUndo || n < 1) {
      return;
    }
    this.xmlEditor.undo();
    if (n > 1) {
      this.undo(n - 1);
    }
    this.requestUpdate();
  };

  /** Redo the last `n` [[Edit]]s that have been undone */
  redo = (n = 1) => {
    if (!this.canRedo || n < 1) {
      return;
    }
    this.xmlEditor.redo();
    if (n > 1) {
      this.redo(n - 1);
    }
    this.requestUpdate();
  };

  private hotkeys: Partial<Record<string, () => void>> = {
    m: this.handleOpenPluginMenu,
    z: this.undo,
    y: this.redo,
    Z: this.redo,
  };

  isEditable(docName: string): boolean {
    return !!this.editable.find(ext =>
      docName.toLowerCase().endsWith(`.${ext}`),
    );
  }

  renderPlugin(plugin: PluginEntry) {
    const tag = unsafeStatic(plugin.tagName);
    return staticHtml`<${tag}
              .locale="${this.locale}"
              .docName="${this.docName}"
              .doc=${this.doc}
              .docs=${this.docs}
              .editCount=${this.docVersion}
              .docVersion=${this.docVersion}
              .editor=${this.xmlEditor}>
            </${tag}>`;
  }

  renderOffScreenPlugins() {
    return html`
      <section class="off-screen-plugin-container" aria-hidden="true">
        <div class="menu-plugins">
          ${flattenPluginEntries(this.plugins.menu)
            .filter(plugin => !plugin.requireDoc || !!this.docName)
            .map(plugin => this.renderPlugin(plugin))}
        </div>
        <div class="background-plugins">
          ${this.plugins.background
            .filter(plugin => !plugin.requireDoc || !!this.docName)
            .map(plugin => this.renderPlugin(plugin))}
        </div>
      </section>
    `;
  }

  renderDefaultLandingPage() {
    return html`
      <landing-page
        heading=${this.landingPageHeading}
        subHeading=${this.landingPageSubHeading}
        .menuPlugins=${flattenPluginEntries(this.plugins.menu).filter(
          plugin => !plugin.requireDoc || !!this.docName,
        )}
        .locale=${this.locale}
        @menu-plugin-select=${(event: CustomEvent) =>
          this.handlePluginMenuSelect(event)}
      >
      </landing-page>
    `;
  }

  render() {
    const hasCustomLandingPage = !!this._landingPageNodes?.length;
    if (this.editableDocs.length === 0) {
      return html` <slot
          name="landing-page"
          @slotchange=${() => this.requestUpdate()}
        ></slot>
        ${!hasCustomLandingPage ? this.renderDefaultLandingPage() : nothing}
        ${this.renderOffScreenPlugins()}`;
    }

    return html` <oscd-app-bar>
        <plugins-menu
          slot="alignStart"
          appTitle=${this.appTitle}
          appIcon=${this.appIcon}
          .editableDocs=${this.editableDocs}
          .menuPlugins=${this.plugins.menu}
          .locale=${this.locale}
          @menu-plugin-select=${(event: CustomEvent) =>
            this.handlePluginMenuSelect(event)}
        ></plugins-menu>

        <files-menu
          slot="alignMiddle"
          .selectedDocName=${this.docName}
          .editableDocs=${this.editableDocs}
          .locale=${this.locale}
          @change=${(event: CustomEvent) => {
            const name = event.detail.name as string;
            this.docName = name;
          }}
        ></files-menu>

        <div slot="alignEnd">
          <oscd-filled-icon-button
            aria-label="${msg('Undo')}"
            ?disabled=${!this.canUndo}
            @click=${async () => {
              this.dispatchEvent(
                new CustomEvent('oscd-undo', {
                  bubbles: true,
                  composed: true,
                }),
              );
            }}
            ><oscd-icon>undo</oscd-icon></oscd-filled-icon-button
          >
          <oscd-filled-icon-button
            aria-label="${msg('Redo')}"
            ?disabled=${!this.canRedo}
            @click=${async () => {
              this.dispatchEvent(
                new CustomEvent('oscd-redo', {
                  bubbles: true,
                  composed: true,
                }),
              );
            }}
            ><oscd-icon>redo</oscd-icon></oscd-filled-icon-button
          >
        </div>
      </oscd-app-bar>

      <main>
        <section class="editors-side-panel-section">
          <editor-plugins-panel
            .editors=${this.plugins.editor}
            .selectedEditor=${this.selectedEditor}
            .locale=${this.locale}
            @editor-select=${(e: CustomEvent) => {
              this.selectedEditor = e.detail.editor;
            }}
          ></editor-plugins-panel>
        </section>

        <section class="editor-container">
          ${this.selectedEditor
            ? this.renderPlugin(this.selectedEditor)
            : nothing}
        </section>

        ${this.renderOffScreenPlugins()}
      </main>`;
  }

  static styles = [
    oscdShellDesignTokens,
    css`
      :host {
        height: 100%;
        display: grid;
        grid-template-rows: min-content 1fr;
        grid-template-columns: 1fr;
        grid-template-areas:
          'header'
          'main';
      }

      oscd-app-bar {
        grid-area: header;
        box-shadow: var(--md-sys-elevation-level-2);
        z-index: 10;
      }

      oscd-app-bar * {
        --md-filled-icon-button-disabled-container-opacity: var(
          --app-bar-action-icon-disabled-container-opacity,
          0
        );
        --md-filled-icon-button-disabled-icon-color: var(
          --app-bar-action-icon-disabled-color,
          var(--md-sys-color-on-primary)
        );
        --md-filled-icon-button-icon-size: var(--app-bar-action-icon-size);
        --md-filled-icon-button-icon-color: var(--app-bar-action-icon-color);
        --md-sys-color-on-primary: var(--app-bar-action-icon-color);
      }

      main {
        grid-area: main;
        display: grid;
        grid-template-columns: var(--side-panel-width) 1fr;
        grid-template-areas: 'sidebar editor';
        overflow: hidden;
      }

      /* Side panel collapsed state */
      main.sidebar-collapsed {
        grid-template-columns: 0 1fr;
      }

      section.editors-side-panel-section {
        grid-area: sidebar;
        overflow-y: auto;
        overflow-x: hidden;
        transition: transform 0.3s ease-in-out;
      }

      /* Hide side panel when collapsed */
      main.sidebar-collapsed section.editors-side-panel-section {
        transform: translateX(-100%);
      }

      section.editor-container {
        grid-area: editor;
        background-color: var(--editor-background-color);
        padding: var(--editor-padding);
        overflow: auto;
        position: relative;
      }

      .off-screen-plugin-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        overflow: hidden;
        margin: 0;
        padding: 0;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'oscd-shell': OscdShell;
  }
}
