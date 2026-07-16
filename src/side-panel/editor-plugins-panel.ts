import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { localized, msg, str } from '@lit/localize';

import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';

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

type EditorPluginTreeNode = (PluginGroup | PluginEntry) &
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

@localized()
export class EditorPluginsPanel extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-icon-button': OscdIconButton,
    'oscd-icon': OscdIcon,
    'oscd-tree': OscdTree,
    'oscd-tree-item': OscdTreeItem,
    'oscd-outlined-text-field': OscdOutlinedTextField,
    'oscd-divider': OscdDivider,
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
      this.pinnedTreeNodes = [
        {
          id: 'pinned',
          name: msg('Pinned'),
          icon: 'keep',
          plugins: [],
          children: buildTreeNodes(pinnedPlugins),
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
    this.dispatchEvent(
      new CustomEvent('editor-select', {
        detail: { editor },
        bubbles: true,
        composed: true,
      }),
    );
  }

  renderPluginItem({ node, level }: TreeRenderContext<EditorPluginTreeNode>) {
    const label = node.translations?.[this.locale] ?? node.name;
    return html`<oscd-tree-item>
      ${level === 1
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

  render() {
    return html`
      <div class="tree-container">
        <oscd-outlined-text-field
          label=${msg('Search')}
          .value=${this.searchValue}
          @input=${(event: Event) => {
            const input = event.target as HTMLInputElement;
            this.searchValue = input.value;
          }}
          ><oscd-icon slot="leading-icon"
            >search</oscd-icon
          ></oscd-outlined-text-field
        >
        ${this.searchValue.trim().length === 0
          ? html`<oscd-tree
                .data=${this.pinnedTreeNodes}
                .expandedIds=${this.pinnedExpanded}
                .selectionMode=${'single'}
                .selectedIds=${this.selectedEditor
                  ? [this.selectedEditor.tagName]
                  : []}
                .renderItem=${(
                  context: TreeRenderContext<EditorPluginTreeNode>,
                ) => this.renderPluginItem(context)}
                toggle-position="trailing"
                collapse-icon="arrow_drop_up"
                expand-icon="arrow_drop_down"
                @selected-ids-changed=${(
                  event: CustomEvent<{ selectedIds: string[] }>,
                ) => this.selectEditor(event.detail.selectedIds)}
                @expanded-ids-changed=${(
                  event: CustomEvent<{ expandedIds: string[] }>,
                ) => {
                  this.pinnedExpanded = event.detail.expandedIds;
                }}
              ></oscd-tree>
              <oscd-divider></oscd-divider>`
          : nothing}
        <oscd-tree
          class="editors-tree"
          .data=${this.editorTreeNodes}
          .expandedIds=${this.searchValue.length === 0
            ? this.expandedIds
            : this.editorTreeNodes.map(node => node.id)}
          .selectionMode=${'single'}
          .selectedIds=${this.selectedEditor
            ? [this.selectedEditor.tagName]
            : []}
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
          ) => this.selectEditor(event.detail.selectedIds)}
          @expanded-ids-changed=${(
            event: CustomEvent<{ expandedIds: string[] }>,
          ) => {
            this.expandedIds = event.detail.expandedIds;
          }}
        ></oscd-tree>
      </div>
      <div class="footer">
        <oscd-icon-button
          class="toggle-button"
          aria-label=${this.expanded
            ? msg('Collapse sidebar')
            : msg('Expand sidebar')}
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

    .tree-container {
      margin-inline: 16px;
      min-width: 0;
      display: flex;
      flex-direction: column;
      /* Owns spacing between the panel sections (search, pinned tree, divider,
         editors tree): 12px per the Figma spec. The divider therefore carries
         no margin of its own, avoiding compounding gap + margin. */
      gap: 12px;
    }

    oscd-outlined-text-field {
      border-radius: 5px;
      background: #6dadee66;
      --md-sys-color-on-surface: var(--editor-plugins-panel-item-text-color);
      --md-sys-color-on-surface-variant: var(
        --editor-plugins-panel-item-text-color
      );
      --md-outlined-field-top-space: 6px;
      --md-outlined-field-bottom-space: 6px;
      /* Match the tree rows: 8px inner padding so the 28px search icon lands at
         the same x (24px) as the tree-item icons, and the placeholder aligns
         with the row labels. See .tree-container / oscd-tree geometry. */
      --md-outlined-field-leading-space: 8px;
      --md-outlined-field-trailing-space: 8px;

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
      --md-sys-color-on-surface: var(--editor-plugins-panel-item-text-color);
      --md-sys-color-on-surface-variant: var(
        --editor-plugins-panel-item-text-color
      );
      --md-icon-size: var(--editor-plugins-panel-item-icon-size);
      --md-list-container-color: rgba(0, 0, 0, 0);
      --md-tree-item-label-text-color: var(
        --editor-plugins-panel-item-text-color
      );
      --md-tree-item-leading-icon-color: var(
        --editor-plugins-panel-item-icon-color
      );
      --oscd-tree-row-selected-color: var(
        --editor-plugins-panel-item-active-bg
      );
      --oscd-tree-row-selected-text-color: var(
        --editor-plugins-panel-item-text-color
      );
    }

    oscd-divider {
      --md-divider-color: var(--editor-plugins-panel-divider-color, #d0d5dc40);
      /* No margin: .tree-container's 12px gap owns the spacing on both sides. */
      margin-block: 0;
    }

    .editors-tree oscd-list-item span {
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
