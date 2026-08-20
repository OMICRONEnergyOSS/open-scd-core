import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { localized, msg, str } from '@lit/localize';

import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import { OscdMenu } from '@omicronenergy/oscd-ui/menu/OscdMenu.js';
import { OscdMenuItem } from '@omicronenergy/oscd-ui/menu/OscdMenuItem.js';

import { LocaleTag } from '../localization.js';
import { PluginEntry, PluginGroup } from '../oscd-shell.js';
import {
  OscdTree,
  TreeNode,
  TreeRenderContext,
} from '@omicronenergy/oscd-ui/tree/OscdTree.js';
import {
  filterBySearchTerm,
  filterByPinned,
  isPluginGroup,
  flattenPluginEntries,
} from '../utils/plugin-utils.js';
import { OscdTreeItem } from '@omicronenergy/oscd-ui/tree/OscdTreeItem.js';
import { OscdOutlinedTextField } from '@omicronenergy/oscd-ui/textfield/OscdOutlinedTextField.js';
import { OscdDivider } from '@omicronenergy/oscd-ui/divider/OscdDivider.js';
import { localstorage } from '@omicronenergy/oscd-ui/decorators/localstorage.js';

type PlaceholderTreeNode = {
  kind: 'placeholder';
  name: string;
  translations?: Record<string, string>;
};

type EditorPluginTreeNode = (PluginGroup | PluginEntry | PlaceholderTreeNode) &
  TreeNode & {
    children?: EditorPluginTreeNode[];
    plugins?: EditorPluginTreeNode[];
  };

declare global {
  interface HTMLElementTagNameMap {
    'editor-plugins-panel': EditorPluginsPanel;
  }
}

const unpinnedIcon = html`<svg
  xmlns="http://www.w3.org/2000/svg"
  width="28"
  height="28"
  viewBox="0 0 28 28"
  fill="none"
>
  <path
    d="M16.391 14.4188L16.8773 16.2406L16.2096 17.3947L13.3244 15.7253L11.3211 19.1876L10.4102 19.4307L10.1671 18.5198L12.1703 15.0576L9.28512 13.3882L9.95287 12.2341L11.7747 11.7478L14.1118 7.70854L13.5348 7.37467L14.2025 6.22059L19.9729 9.55934L19.3052 10.7134L18.7281 10.3795L16.391 14.4188ZM11.5974 13.1857L15.2328 15.2891L14.9531 14.2415L17.574 9.71179L15.2659 8.37629L12.645 12.906L11.5974 13.1857Z"
    fill="currentColor"
  />
</svg>`;

const pinnedIcon = html`<svg
  xmlns="http://www.w3.org/2000/svg"
  width="28"
  height="28"
  viewBox="0 0 28 28"
  fill="none"
>
  <path
    d="M16.4379 14.5274L16.9273 16.3484L16.2615 17.5036L13.3735 15.8391L11.3761 19.3047L10.4656 19.5494L10.2209 18.6389L12.2183 15.1733L9.33034 13.5088L9.99614 12.3536L11.8171 11.8642L14.1475 7.821L13.5699 7.4881L14.2357 6.3329L20.0117 9.66194L19.3459 10.8171L18.7683 10.4842L16.4379 14.5274Z"
    fill="currentColor"
  />
</svg>`;

export function buildTreeNodes(
  plugins: (PluginEntry | PluginGroup)[],
): EditorPluginTreeNode[] {
  function pluginEntryToTreeNode(
    pluginEntry: PluginEntry,
  ): EditorPluginTreeNode {
    return {
      ...pluginEntry,
      id: pluginEntry.tagName,
      children: [], //explicitly set children to an empty array for leaf nodes
    };
  }

  return plugins.map((editor, index) => {
    const isGroup = isPluginGroup(editor);
    if (isGroup) {
      const children = (editor as PluginGroup).plugins.map(
        pluginEntryToTreeNode,
      );
      return {
        ...editor,
        id: `group:${index}:${editor.name}`,
        children,
      };
    }
    return pluginEntryToTreeNode(editor as PluginEntry);
  });
}

function renderFlyoutPlaceholder() {
  return html`<oscd-menu-item disabled>
    <div slot="headline">${msg('Items you pin will appear here')}</div>
  </oscd-menu-item>`;
}

@localized()
export class EditorPluginsPanel extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-icon-button': OscdIconButton,
    'oscd-icon': OscdIcon,
    'oscd-list-item': OscdListItem,
    'oscd-tree': OscdTree,
    'oscd-tree-item': OscdTreeItem,
    'oscd-outlined-text-field': OscdOutlinedTextField,
    'oscd-divider': OscdDivider,
    'oscd-menu': OscdMenu,
    'oscd-menu-item': OscdMenuItem,
  };

  id = 'editor-plugins-panel';

  @property({ type: Array })
  editors: (PluginEntry | PluginGroup)[] = [];

  @property({ type: Number })
  selectedEditor?: PluginEntry;

  @property({ type: String })
  locale!: LocaleTag;

  @localstorage({ default: true })
  @property({ type: Boolean, reflect: true })
  expanded!: boolean;

  /**
   * Transient "search mode": the collapsed rail's search icon opens the full
   * panel to let the user search, WITHOUT persisting the panel as expanded.
   * It is reflected purely so `:host([search-mode])` can drive the open width.
   * Exited on editor selection or Escape (see `exitSearchMode`).
   */
  @property({ type: Boolean, reflect: true, attribute: 'search-mode' })
  searchMode = false;

  /** True when the panel is visually open (persisted expanded OR transient search). */
  get isOpen(): boolean {
    return this.expanded || this.searchMode;
  }

  editorTreeNodes: EditorPluginTreeNode[] = [];

  pinnedTreeNodes: EditorPluginTreeNode[] = [
    {
      id: 'pinned',
      name: 'Pinned',
      icon: 'keep',
      plugins: [],
      children: [],
    },
  ];

  @state()
  searchValue = '';

  @state()
  focusedTree: 'pinned' | 'editors' | null = null;

  @localstorage({ default: [] })
  @state()
  expandedIds!: string[];

  @localstorage({ default: [] })
  @state()
  pinnedPluginIds!: string[];

  @localstorage({ default: [] })
  @state()
  pinnedExpanded!: string[];

  willUpdate(changedProperties: Map<string, unknown>) {
    if (
      changedProperties.has('editors') ||
      changedProperties.has('searchValue') ||
      changedProperties.has('locale')
    ) {
      const searchResults = filterBySearchTerm(
        this.editors,
        this.searchValue,
        this.locale,
      );
      this.editorTreeNodes = buildTreeNodes(searchResults);
    }

    if (
      changedProperties.has('editors') ||
      changedProperties.has('pinnedPluginIds') ||
      changedProperties.has('locale')
    ) {
      const pinnedPlugins = filterByPinned(this.editors, this.pinnedPluginIds);
      const pinnedChildren: EditorPluginTreeNode[] = pinnedPlugins.length
        ? buildTreeNodes(pinnedPlugins)
        : [
            {
              kind: 'placeholder',
              name: msg('Items you pin will appear here'),
              id: 'pinned-placeholder',
              children: [],
            },
          ];
      this.pinnedTreeNodes = [
        {
          id: 'pinned',
          name: msg('Pinned'),
          icon: 'keep',
          plugins: [],
          children: pinnedChildren,
        },
      ];
    }
  }

  togglePin(id: string) {
    if (this.pinnedPluginIds.includes(id)) {
      this.pinnedPluginIds = this.pinnedPluginIds.filter(
        pinnedId => pinnedId !== id,
      );
    } else {
      this.pinnedPluginIds = [...this.pinnedPluginIds, id];
      this.pinnedExpanded = ['pinned']; // Expand the pinned section when a new plugin is pinned
    }
  }

  selectEditor(selectedIds: string[]) {
    const [selectedId] = selectedIds;
    if (!selectedId) {
      return;
    }
    const editor = flattenPluginEntries(this.editors).find(
      editor => editor.tagName === selectedId,
    );
    if (!editor) {
      return;
    }
    this.dispatchEditorSelect(editor);
  }

  /**
   * Dispatches the `editor-select` event and leaves transient search mode, if
   * active. Used by both the expanded trees and the collapsed rail flyouts.
   */
  private dispatchEditorSelect(editor?: PluginEntry) {
    this.dispatchEvent(
      new CustomEvent('editor-select', {
        detail: { editor },
        bubbles: true,
        composed: true,
      }),
    );
    if (this.searchMode) {
      this.exitSearchMode();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', this.handleKeydown);
  }

  disconnectedCallback() {
    this.removeEventListener('keydown', this.handleKeydown);
    super.disconnectedCallback();
  }

  private handleKeydown = (event: KeyboardEvent) => {
    const fromSearchField =
      (event.currentTarget as Element | null)?.localName ===
        'oscd-outlined-text-field' ||
      event
        .composedPath()
        .some(
          target =>
            (target as Element).localName === 'oscd-outlined-text-field',
        );
    if (event.key === 'Escape' && this.searchMode) {
      event.stopPropagation();
      this.exitSearchMode();
      return;
    }

    if (
      fromSearchField &&
      (event.key === 'ArrowDown' || event.key === 'ArrowUp')
    ) {
      event.preventDefault();
      event.stopPropagation();
      this.startTreeNavigation(event.key === 'ArrowDown' ? 'down' : 'up');
      return;
    }

    if (fromSearchField && event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      this.activateKeyboardTarget();
    }
  };

  /** Opens the panel transiently for searching (does not persist `expanded`). */
  private enterSearchMode() {
    this.searchMode = true;
    this.focusSearch(true);
  }

  /** Focuses the search field, optionally selecting its current query. */
  focusSearch(selectQuery = false) {
    const focusField = () => {
      const searchField = this.shadowRoot?.querySelector<OscdOutlinedTextField>(
        'oscd-outlined-text-field',
      );
      searchField?.focus();
      if (selectQuery) {
        searchField?.select();
      }
    };

    this.updateComplete.then(() => {
      focusField();
      requestAnimationFrame(() => requestAnimationFrame(focusField));
    });
  }

  /** Returns the panel to the collapsed rail and clears the search query. */
  private exitSearchMode() {
    this.searchMode = false;
    this.searchValue = '';
    this.focusedTree = null;
  }

  private getTree(kind: 'pinned' | 'editors'): OscdTree | null {
    return (
      this.shadowRoot?.querySelector<OscdTree>(`oscd-tree.${kind}-tree`) ?? null
    );
  }

  private focusTree(
    kind: 'pinned' | 'editors',
    activeId: string | null,
  ): boolean {
    const tree = this.getTree(kind);
    if (!tree || !activeId) {
      return false;
    }
    tree.activeId = activeId;
    this.focusedTree = kind;
    tree.focus();
    return true;
  }

  private startTreeNavigation(direction: 'up' | 'down') {
    const first = direction === 'down';
    const pinnedTree = this.getTree('pinned');
    if (this.searchValue.trim().length === 0 && pinnedTree) {
      const activeId = this.focusTree(
        'pinned',
        first ? pinnedTree.getFirstNodeId() : pinnedTree.getLastNodeId(),
      );
      if (activeId) {
        return;
      }
    }
    const editorsTree = this.getTree('editors');
    this.focusTree(
      'editors',
      editorsTree
        ? first
          ? editorsTree.getFirstNodeId()
          : editorsTree.getLastNodeId()
        : null,
    );
  }

  private handleTreeActiveChanged(kind: 'pinned' | 'editors') {
    this.focusedTree = kind;
  }

  private handleTreeFocus(kind: 'pinned' | 'editors') {
    this.focusedTree = kind;
  }

  private handleTreeSelection(
    kind: 'pinned' | 'editors',
    selectedIds: string[],
  ) {
    const tree = this.getTree(kind);
    const selectedId = selectedIds[0];
    const selectedNode = tree?.data.find(node => node.id === selectedId);
    if (tree && selectedNode?.children?.length && selectedId) {
      tree.toggle(selectedId);
      return;
    }
    this.selectEditor(selectedIds);
  }

  private handleTreeBoundary(
    kind: 'pinned' | 'editors',
    direction: 'first' | 'last',
  ) {
    if (kind === 'pinned' && direction === 'last') {
      this.focusTree(
        'editors',
        this.getTree('editors')?.getFirstNodeId() ?? null,
      );
    } else if (
      kind === 'editors' &&
      direction === 'first' &&
      this.searchValue.trim().length === 0
    ) {
      this.focusTree('pinned', this.getTree('pinned')?.getLastNodeId() ?? null);
    }
  }

  private activateKeyboardTarget() {
    if (!this.focusedTree) {
      if (
        this.shadowRoot?.activeElement?.localName ===
          'oscd-outlined-text-field' &&
        flattenPluginEntries(
          filterBySearchTerm(this.editors, this.searchValue, this.locale),
        ).length === 1
      ) {
        this.dispatchEditorSelect(
          flattenPluginEntries(
            filterBySearchTerm(this.editors, this.searchValue, this.locale),
          )[0],
        );
      }
      return;
    }
  }

  /** Toggles the persisted expanded/collapsed state via the footer control. */
  private toggleExpanded() {
    if (this.isOpen) {
      this.expanded = false;
      this.exitSearchMode();
    } else {
      this.expanded = true;
    }
  }

  private toggleFlyout(anchorId: string) {
    const menu = this.shadowRoot?.querySelector<OscdMenu>(
      `oscd-menu[data-flyout="${anchorId}"]`,
    );
    if (!menu) {
      return;
    }
    if (menu.open) {
      menu.close();
    } else {
      menu.show();
    }
  }

  renderPluginItem({
    node,
    level,
    disabled,
    active,
  }: TreeRenderContext<EditorPluginTreeNode>) {
    const label = node.translations?.[this.locale] ?? node.name;
    return html`<oscd-tree-item ?disabled=${disabled} ?active=${active}>
      ${level === 1 && !('kind' in node)
        ? html`<oscd-icon slot="start">${node.icon}</oscd-icon>`
        : nothing}
      <span slot="headline" title=${label}>${label}</span>
    </oscd-tree-item>`;
  }

  renderLeafAccessory({ node, id }: TreeRenderContext<EditorPluginTreeNode>) {
    const pinned = this.pinnedPluginIds.includes(id);
    return html`<button
      aria-label=${pinned
        ? msg(str`Unpin ${node.name}`)
        : msg(str`Pin ${node.name}`)}
      aria-pressed=${pinned}
      @click=${() => this.togglePin(id)}
    >
      <oscd-icon>${pinned ? pinnedIcon : unpinnedIcon}</oscd-icon>
    </button>`;
  }

  private renderExpanded() {
    return html`
      <div class="tree-container">
        <oscd-outlined-text-field
          label=${msg('Search')}
          .value=${this.searchValue}
          @keydown=${this.handleKeydown}
          @input=${(event: Event) => {
            const input = event.target as HTMLInputElement;
            this.searchValue = input.value;
          }}
          ><oscd-icon slot="leading-icon"
            >search</oscd-icon
          ></oscd-outlined-text-field
        >
        <div class="tree-scroll">
          ${this.searchValue.trim().length === 0
            ? html`<oscd-tree
                  .data=${this.pinnedTreeNodes}
                  .expandedIds=${this.pinnedExpanded}
                  .selectionMode=${'single'}
                  .selectedIds=${this.selectedEditor
                    ? [this.selectedEditor.tagName]
                    : []}
                  .isDisabled=${(node: EditorPluginTreeNode) =>
                    'kind' in node && node.kind === 'placeholder'}
                  .isSelectable=${(node: EditorPluginTreeNode) =>
                    !('kind' in node && node.kind === 'placeholder')}
                  class="pinned-tree"
                  ?keyboard-active=${this.focusedTree === 'pinned'}
                  @focusin=${() => this.handleTreeFocus('pinned')}
                  .renderItem=${(
                    context: TreeRenderContext<EditorPluginTreeNode>,
                  ) => this.renderPluginItem(context)}
                  toggle-position="trailing"
                  collapse-icon="arrow_drop_up"
                  expand-icon="arrow_drop_down"
                  @selected-ids-changed=${(
                    event: CustomEvent<{ selectedIds: string[] }>,
                  ) =>
                    this.handleTreeSelection(
                      'pinned',
                      event.detail.selectedIds,
                    )}
                  @expanded-ids-changed=${(
                    event: CustomEvent<{ expandedIds: string[] }>,
                  ) => {
                    this.pinnedExpanded = event.detail.expandedIds;
                  }}
                  @active-changed=${() =>
                    this.handleTreeActiveChanged('pinned')}
                  @navigation-boundary=${(
                    event: CustomEvent<{ direction: 'first' | 'last' }>,
                  ) =>
                    this.handleTreeBoundary('pinned', event.detail.direction)}
                ></oscd-tree>
                <oscd-divider></oscd-divider>`
            : nothing}
          <oscd-tree
            class="editors-tree"
            ?keyboard-active=${this.focusedTree === 'editors'}
            @focusin=${() => this.handleTreeFocus('editors')}
            .data=${this.editorTreeNodes}
            .expandedIds=${this.searchValue.length === 0
              ? this.expandedIds
              : this.editorTreeNodes.map(node => node.id)}
            .selectionMode=${'single'}
            .selectedIds=${this.selectedEditor
              ? [this.selectedEditor.tagName]
              : []}
            .isDisabled=${(node: EditorPluginTreeNode) =>
              'kind' in node && node.kind === 'placeholder'}
            .isSelectable=${(node: EditorPluginTreeNode) =>
              !('kind' in node && node.kind === 'placeholder')}
            .renderItem=${(context: TreeRenderContext<EditorPluginTreeNode>) =>
              this.renderPluginItem(context)}
            .renderLeafAccessory=${(
              context: TreeRenderContext<EditorPluginTreeNode>,
            ) => this.renderLeafAccessory(context)}
            toggle-position="trailing"
            collapse-icon="arrow_drop_down"
            expand-icon="arrow_drop_up"
            @selected-ids-changed=${(
              event: CustomEvent<{ selectedIds: string[] }>,
            ) => this.handleTreeSelection('editors', event.detail.selectedIds)}
            @expanded-ids-changed=${(
              event: CustomEvent<{ expandedIds: string[] }>,
            ) => {
              this.expandedIds = event.detail.expandedIds;
            }}
            @active-changed=${() => this.handleTreeActiveChanged('editors')}
            @navigation-boundary=${(
              event: CustomEvent<{ direction: 'first' | 'last' }>,
            ) => this.handleTreeBoundary('editors', event.detail.direction)}
          ></oscd-tree>
        </div>
      </div>
    `;
  }

  private renderRail() {
    const pinnedPlugins = flattenPluginEntries(
      filterByPinned(this.editors, this.pinnedPluginIds),
    );
    return html`
      <div class="rail">
        <oscd-icon-button
          class="rail-item"
          aria-label=${msg('Search')}
          @click=${() => this.enterSearchMode()}
        >
          <oscd-icon>search</oscd-icon>
        </oscd-icon-button>
        ${this.renderRailGroup(
          { name: msg('Pinned'), icon: 'keep', plugins: pinnedPlugins },
          'pinned',
          true,
        )}
        <oscd-divider></oscd-divider>
        ${this.editors.map((entry, index) =>
          isPluginGroup(entry)
            ? this.renderRailGroup(entry, `group-${index}`)
            : this.renderRailLeaf(entry as PluginEntry),
        )}
      </div>
    `;
  }

  private renderRailGroup(
    group: PluginGroup,
    anchorId: string,
    showEmptyPlaceholder = false,
  ) {
    const label = group.translations?.[this.locale] ?? group.name;
    const active = group.plugins.some(
      plugin => plugin.tagName === this.selectedEditor?.tagName,
    );
    const anchor = `rail-${anchorId}`;
    return html`
      <oscd-icon-button
        id=${anchor}
        class=${classMap({ 'rail-item': true, active })}
        aria-haspopup="menu"
        aria-label=${label}
        @click=${() => this.toggleFlyout(anchorId)}
      >
        <oscd-icon>${group.icon}</oscd-icon>
      </oscd-icon-button>
      <oscd-menu
        class="rail-flyout"
        data-flyout=${anchorId}
        anchor=${anchor}
        anchor-corner="start-end"
        menu-corner="start-start"
        positioning="popover"
        quick
      >
        <div class="flyout-header" role="presentation">${label}</div>
        <oscd-divider class="flyout-divider"></oscd-divider>
        ${group.plugins.length > 0
          ? group.plugins.map(plugin => this.renderFlyoutItem(plugin))
          : showEmptyPlaceholder
            ? renderFlyoutPlaceholder()
            : nothing}
      </oscd-menu>
    `;
  }

  private renderRailLeaf(plugin: PluginEntry) {
    const label = plugin.translations?.[this.locale] ?? plugin.name;
    const active = plugin.tagName === this.selectedEditor?.tagName;
    return html`
      <oscd-icon-button
        class=${classMap({ 'rail-item': true, active })}
        aria-label=${label}
        @click=${() => this.dispatchEditorSelect(plugin)}
      >
        <oscd-icon>${plugin.icon}</oscd-icon>
      </oscd-icon-button>
    `;
  }

  private renderFlyoutItem(plugin: PluginEntry) {
    const label = plugin.translations?.[this.locale] ?? plugin.name;
    const selected = plugin.tagName === this.selectedEditor?.tagName;
    return html`
      <oscd-menu-item
        .selected=${selected}
        @click=${() => this.dispatchEditorSelect(plugin)}
      >
        <div slot="headline">${label}</div>
      </oscd-menu-item>
    `;
  }

  private renderFooter() {
    const open = this.isOpen;
    const label = open ? msg('Collapse sidebar') : msg('Expand sidebar');
    const icon = open ? 'left_panel_close' : 'left_panel_open';
    return html`
      <div class="footer">
        ${open
          ? html`<oscd-list-item
              class="toggle-button"
              type="button"
              aria-label=${label}
              @click=${() => this.toggleExpanded()}
            >
              <oscd-icon slot="start">${icon}</oscd-icon>
              <span slot="headline">${label}</span>
            </oscd-list-item>`
          : html`<oscd-icon-button
              class="toggle-button"
              aria-label=${label}
              @click=${() => this.toggleExpanded()}
            >
              <oscd-icon>${icon}</oscd-icon>
            </oscd-icon-button>`}
      </div>
    `;
  }

  render() {
    return html`
      ${this.isOpen ? this.renderExpanded() : this.renderRail()}
      <oscd-divider class="footer-divider"></oscd-divider>
      ${this.renderFooter()}
    `;
  }

  static styles = css`
    :host {
      /* Collapsed rail is the default width; the panel widens to its full width
         when persistently expanded OR while in transient search mode. The shell
         grid column follows this intrinsic width (grid-template-columns: auto). */
      width: var(--editor-plugins-panel-collapsed-width);
      height: calc(100% - var(--editor-plugins-panel-padding-top));
      display: grid;
      /* Row 1 (tree-container/rail) is the only scrollable region; the divider
         and footer rows are sized to content so they stay pinned and always
         visible below it, however tall the tree content grows. */
      grid-template-rows: 1fr auto auto;
      min-height: 0;
      padding-top: var(--editor-plugins-panel-padding-top);
      transition: width 0.1s ease-in-out;
      /* Clip transient horizontal overflow while the width animates on
         expand/collapse: the content swaps to its full width before the host
         finishes resizing, and this stops that from forcing horizontal reflow /
         scrollbar churn every animation frame. Steady-state label overrun is
         handled by the tree row ellipsis, not by this. */
      overflow-x: hidden;
    }

    /* Material colour scheme for the panel's content. The panel is transparent
       over the shell's dark-blue background, so its content is light ("white")
       on a dark surface. We set the *system* colours once here — not each
       component's final colour — so resting text/icons AND every derived
       hover/pressed state layer resolve to the light content colour from one
       place. (The flyout menus are a light surface and reset these back to the
       shell defaults; see .rail-flyout.)

       NB: these are set on the content containers rather than :host on purpose —
       the shell sets a universal rule (* { --md-sys-color-on-surface: ... }),
       which targets the panel host from the outer tree and beats a :host
       declaration. That universal rule cannot cross into this shadow tree, so
       declaring on the containers reliably wins for all descendants. (See the
       "transparent panel" tech-debt item; a proper panel surface will make this
       cleaner.) */
    .rail,
    .tree-container,
    .footer {
      --md-sys-color-on-surface: var(--editor-plugins-panel-item-text-color);
      --md-sys-color-on-surface-variant: var(
        --editor-plugins-panel-item-icon-color
      );

      --md-sys-color-surface: var(
        --editor-plugins-panel-item-background-color,
        gray
      );
    }

    :host([expanded]),
    :host([search-mode]) {
      width: var(--editor-plugins-panel-width);
    }

    /* Collapsed icon rail: a flat column of 44px icon buttons (28px glyph + 8px
       padding), inset 16px so the glyphs land at the same x (24px) as both the
       search icon and the tree-item icons in the expanded panel. */
    .rail {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding-inline: 16px;
      min-width: 0;
      min-height: 0;
      overflow-y: auto;
    }

    .rail-item {
      --md-icon-button-icon-size: 28px;
      --md-icon-button-state-layer-height: 44px;
      --md-icon-button-state-layer-width: 44px;
      border-radius: 5px;
    }

    /* Active group/editor: dark rounded square behind the glyph. */
    .rail-item.active {
      background: var(--editor-plugins-panel-item-active-bg);
    }

    .rail oscd-divider {
      /* 44px wide (aligned with the icon column), 12px clearance above and
         below, per the Figma collapsed spec. */
      width: 44px;
      margin-block: 12px;
      --md-divider-color: var(--editor-plugins-panel-divider-color);
    }

    /* Flyout menu opened from a collapsed group icon. Figma "Links container":
       padding 8px, gap 4px, 1px border, 5px radius, light surface + shadow.
       Unlike the rest of the panel this is a LIGHT surface, so it resets the
       system colours back to the shell defaults (dark content on a light
       surface); everything inside then derives correctly. */
    .rail-flyout {
      --md-sys-color-surface: var(--plugins-menu-container-color);
      --md-sys-color-surface-container: var(--plugins-menu-container-color);
      --md-sys-color-on-surface: var(--plugins-menu-item-label-color);
      --md-sys-color-on-surface-variant: var(
        --plugins-menu-item-leading-icon-color
      );
      --md-menu-container-color: var(--plugins-menu-container-color);
      min-width: 200px;
    }

    .flyout-header {
      /* Group name heading: Material label-large, in the secondary blue, per the
         Figma "Links container" header. */
      padding: 8px 12px;
      font-family: var(--oscd-text-font, Roboto), sans-serif;
      font-size: 14px;
      font-weight: 500;
      line-height: 20px;
      letter-spacing: 0.1px;
      color: var(--editor-plugins-panel-flyout-header-text-color);
    }

    .rail-flyout .flyout-divider {
      /* Separates the group heading from its editor items. */
      --md-divider-color: var(--editor-plugins-panel-divider-color);
      margin-block: 4px;
      width: 80%;
      margin: auto;
    }

    .rail-flyout oscd-menu-item {
      width: 100%;
      --md-menu-item-selected-container-color: var(
        --plugins-menu-item-selected-container-color
      );
      --md-menu-item-selected-label-text-color: var(
        --plugins-menu-item-selected-label-color
      );
    }

    .tree-container {
      margin-inline: 16px;
      min-width: 0;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .tree-scroll {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 0;
      overflow-y: auto;
    }

    oscd-tree {
      --oscd-tree-row-active-border-width: 0px;
      --oscd-tree-row-active-border-color: var(--oscd-base3, #fff);
      --oscd-tree-row-active-text-color: var(--oscd-base3, #fff);
      --oscd-tree-row-focus-ring-color: var(--oscd-base3, #fff);
    }

    oscd-tree.keyboard-active {
      --oscd-tree-row-active-border-width: 1px;
    }

    oscd-outlined-text-field {
      border-radius: 5px;
      background: #6dadee66;
      --md-outlined-field-top-space: 6px;
      --md-outlined-field-bottom-space: 6px;
      /* Match the tree rows: 8px inner padding so the 28px search icon lands at
         the same x (24px) as the tree-item icons, and the placeholder aligns
         with the row labels. See .tree-container / oscd-tree geometry. */
      --md-outlined-field-leading-space: 8px;
      --md-outlined-field-trailing-space: 8px;
      --md-outlined-field-with-leading-content-leading-space: 10px;
      --md-outlined-field-content-space: 10px;

      /* keep the outline light in every state */
      --md-outlined-text-field-focus-outline-color: var(
        --editor-plugins-panel-item-text-color
      );
      --md-outlined-text-field-hover-outline-color: var(
        --editor-plugins-panel-item-text-color
      );
      --md-outlined-text-field-outline-color: var(
        --editor-plugins-panel-item-text-color
      );
      --md-outlined-text-field-focus-outline-width: 1px;

      /* keep the floating label light in every state */
      --md-outlined-text-field-label-text-color: var(
        --editor-plugins-panel-item-text-color
      );
      --md-outlined-text-field-hover-label-text-color: var(
        --editor-plugins-panel-item-text-color
      );
      --md-outlined-text-field-focus-label-text-color: var(
        --editor-plugins-panel-item-text-color
      );
      /* caret follows the light text instead of the primary accent */
      --md-outlined-text-field-caret-color: var(
        --editor-plugins-panel-item-text-color
      );
      --md-outlined-text-field-focus-caret-color: var(
        --editor-plugins-panel-item-text-color
      );
    }

    oscd-outlined-text-field oscd-icon[slot='leading-icon'] {
      /* Every icon in the side panel is 28px (matches the tree icons). */
      --md-icon-size: 28px;
    }

    oscd-tree {
      /*
       * Side-panel geometry, driven entirely through oscd-tree's public custom
       * properties so spacing lives in one place (see the Figma side-panel spec):
       *   - margin-inline (0): the .tree-container already insets content by
       *     16px (aligning the search box and the selection band with the
       *     panel edge), so the tree adds no further inline margin.
       *   - --oscd-tree-row-padding-start/end (8px): padding inside the band
       *     before the content, matching the 8px inner padding in the design.
       *   - --oscd-tree-indent-step (36px): one indent step = leading icon
       *     (28px) + 8px gap; because a leading icon occupies exactly one step,
       *     icon-less leaves align their text under their group's label.
       *   - --oscd-tree-row-gap (4px): vertical gap between rows.
       *   - --oscd-tree-row-height / --oscd-tree-item-min-height (36px): band
       *     height; with the 4px row gap this yields a 40px row pitch.
       *     --oscd-tree-item-min-height overrides the tree-item's Material
       *     default (--md-list-item-one-line-container-height, 56px); without
       *     it rows would be 56px tall.
       *   - --oscd-tree-row-shape (5px): selection-band corner radius.
       *   - --oscd-tree-toggle-icon-size (28px) / --oscd-tree-trailing-toggle-gap
       *     (8px): chevron glyph size and its gap from the label. Every icon in
       *     the design is 28px; the pin accessory inherits this size.
       */
      margin-inline: 0;
      min-height: 0;
      --oscd-tree-row-height: 36px;
      --oscd-tree-item-min-height: 36px;
      --oscd-tree-row-gap: 4px;
      --oscd-tree-row-padding-start: 8px;
      --oscd-tree-row-padding-end: 8px;
      --oscd-tree-indent-step: 36px;
      --oscd-tree-row-shape: 5px;
      --oscd-tree-toggle-icon-size: 28px;
      --oscd-tree-trailing-toggle-gap: 8px;
      /* Pin accessory hidden at rest, revealed on row hover / keyboard focus
         (see Figma side-panel spec); its icon size inherits the 28px toggle. */
      --oscd-tree-accessory-rest-opacity: 0;
      --md-icon-size: var(--editor-plugins-panel-item-icon-size);
      --oscd-tree-row-selected-color: var(
        --editor-plugins-panel-item-active-bg
      );
      --oscd-tree-row-selected-text-color: var(
        --editor-plugins-panel-item-text-color
      );
    }

    oscd-tree.pinned-tree {
      --oscd-tree-leaf-toggle-size: 0px;
      --oscd-tree-leaf-toggle-gap: 0px;
    }

    oscd-divider {
      --md-divider-color: var(--editor-plugins-panel-divider-color);
      /* No margin: .tree-container's 12px gap owns the spacing on both sides. */
      margin-block: 0;
    }

    .footer-divider {
      padding-inline: 16px;
      margin-block: 12px 0;
    }

    .footer {
      /* Persistent collapse/expand control, bottom-left in both modes. The 16px
         inline inset matches the tree-container (so the expanded list-item spans
         the same width as the rows) and the rail items; 16px below is the Figma
         bottom margin. */
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding-inline: 16px;
      padding-block: 0 16px;
    }

    /* Expanded: an interactive list item so it reads as "one more row" — full
       width with a full-width hover/ripple state layer, left-aligned, no
       container fill at rest. 8px leading space lands the 28px glyph at x24,
       exactly like the search field and tree rows above it. */
    oscd-list-item.toggle-button {
      width: 100%;
      border-radius: 5px;
      --md-list-item-leading-space: 8px;
      --md-list-item-trailing-space: 8px;
      --md-list-item-one-line-container-height: 40px;
      --md-list-item-top-space: 8px;
      --md-list-item-bottom-space: 8px;
      --md-list-item-label-text-size: 16px;
    }

    oscd-list-item.toggle-button oscd-icon[slot='start'] {
      /* Every icon in the side panel is 28px (matches the tree icons). */
      --md-icon-size: 28px;
    }

    /* Collapsed rail: icon-only toggle, matching the rail items (44px target,
       28px glyph, glyph lands at x24 like the other rail icons). */
    oscd-icon-button.toggle-button {
      --md-icon-button-icon-size: 28px;
      --md-icon-button-state-layer-height: 44px;
      --md-icon-button-state-layer-width: 44px;
    }
  `;
}
