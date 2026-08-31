import { LitElement } from 'lit';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import { OscdMenu } from '@omicronenergy/oscd-ui/menu/OscdMenu.js';
import { OscdMenuItem } from '@omicronenergy/oscd-ui/menu/OscdMenuItem.js';
import { LocaleTag } from '../localization.js';
import { PluginEntry, PluginGroup } from '../oscd-shell.js';
import { OscdTree, TreeNode, TreeRenderContext } from '@omicronenergy/oscd-ui/tree/OscdTree.js';
import { OscdTreeItem } from '@omicronenergy/oscd-ui/tree/OscdTreeItem.js';
import { OscdDivider } from '@omicronenergy/oscd-ui/divider/OscdDivider.js';
import { OscdOutlinedSearchField } from '@omicronenergy/oscd-ui/search-field/OscdOutlinedSearchField.js';
type PlaceholderTreeNode = {
    kind: 'placeholder';
    name: string;
    translations?: Record<string, string>;
};
type EditorPluginTreeNode = (PluginGroup | PluginEntry | PlaceholderTreeNode) & TreeNode & {
    children?: EditorPluginTreeNode[];
    plugins?: EditorPluginTreeNode[];
};
declare global {
    interface HTMLElementTagNameMap {
        'editor-plugins-panel': EditorPluginsPanel;
    }
}
export declare function buildTreeNodes(plugins: (PluginEntry | PluginGroup)[]): EditorPluginTreeNode[];
declare const EditorPluginsPanel_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
export declare class EditorPluginsPanel extends EditorPluginsPanel_base {
    static scopedElements: {
        'oscd-icon-button': typeof OscdIconButton;
        'oscd-icon': typeof OscdIcon;
        'oscd-list-item': typeof OscdListItem;
        'oscd-tree': typeof OscdTree;
        'oscd-tree-item': typeof OscdTreeItem;
        'oscd-outlined-search-field': typeof OscdOutlinedSearchField;
        'oscd-divider': typeof OscdDivider;
        'oscd-menu': typeof OscdMenu;
        'oscd-menu-item': typeof OscdMenuItem;
    };
    id: string;
    editors: (PluginEntry | PluginGroup)[];
    selectedEditor?: PluginEntry;
    locale: LocaleTag;
    expanded: boolean;
    /**
     * Transient "search mode": the collapsed rail's search icon opens the full
     * panel to let the user search, WITHOUT persisting the panel as expanded.
     * It is reflected purely so `:host([search-mode])` can drive the open width.
     * Exited on editor selection or Escape (see `exitSearchMode`).
     */
    searchMode: boolean;
    /** True when the panel is visually open (persisted expanded OR transient search). */
    get isOpen(): boolean;
    editorTreeNodes: EditorPluginTreeNode[];
    pinnedTreeNodes: EditorPluginTreeNode[];
    searchValue: string;
    focusedTree: 'pinned' | 'editors' | null;
    expandedIds: string[];
    pinnedPluginIds: string[];
    pinnedExpanded: string[];
    willUpdate(changedProperties: Map<string, unknown>): void;
    togglePin(id: string): void;
    selectEditor(selectedIds: string[]): void;
    /**
     * Dispatches the `editor-select` event and leaves transient search mode, if
     * active. Used by both the expanded trees and the collapsed rail flyouts.
     */
    private dispatchEditorSelect;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private handleKeydown;
    /** Opens the panel transiently for searching (does not persist `expanded`). */
    private enterSearchMode;
    /** Focuses the search field, optionally selecting its current query. */
    focusSearch(selectQuery?: boolean): void;
    /** Returns the panel to the collapsed rail and clears the search query. */
    private exitSearchMode;
    private getTree;
    private focusTree;
    private startTreeNavigation;
    private handleTreeActiveChanged;
    private handleTreeFocus;
    private handleTreeSelection;
    private handleTreeBoundary;
    private activateKeyboardTarget;
    /** Toggles the persisted expanded/collapsed state via the footer control. */
    private toggleExpanded;
    private toggleFlyout;
    renderPluginItem({ node, level, disabled, active, }: TreeRenderContext<EditorPluginTreeNode>): import("lit-html").TemplateResult<1>;
    renderLeafAccessory({ node, id }: TreeRenderContext<EditorPluginTreeNode>): import("lit-html").TemplateResult<1>;
    private renderExpanded;
    private renderRail;
    private renderRailGroup;
    private renderRailLeaf;
    private renderFlyoutItem;
    private renderFooter;
    render(): import("lit-html").TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
export {};
