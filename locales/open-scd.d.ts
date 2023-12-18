import { LitElement, TemplateResult } from 'lit';
import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-drawer';
import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-list';
import '@material/mwc-tab-bar';
import '@material/mwc-top-app-bar-fixed';
import type { Dialog } from '@material/mwc-dialog';
import type { Drawer } from '@material/mwc-drawer';
import { allLocales, targetLocales } from './locales.js';
import { Edit, EditEvent, OpenEvent } from './foundation.js';
export declare type LogEntry = {
    undo: Edit;
    redo: Edit;
};
export declare type Plugin = {
    name: string;
    translations?: Record<typeof targetLocales[number], string>;
    src: string;
    icon: string;
    requireDoc?: boolean;
    active?: boolean;
};
export declare type PluginSet = {
    menu: Plugin[];
    editor: Plugin[];
};
declare type Control = {
    icon: string;
    getName: () => string;
    isDisabled: () => boolean;
    action?: () => unknown;
};
declare type RenderedPlugin = Control & {
    tagName: string;
};
declare type LocaleTag = typeof allLocales[number];
export declare class OpenSCD extends LitElement {
    #private;
    get doc(): XMLDocument;
    history: LogEntry[];
    editCount: number;
    get last(): number;
    get canUndo(): boolean;
    get canRedo(): boolean;
    /** The set of `XMLDocument`s currently loaded */
    docs: Record<string, XMLDocument>;
    /** The name of the [[`doc`]] currently being edited */
    docName: string;
    get loadedPlugins(): Map<string, Plugin>;
    get plugins(): PluginSet;
    set plugins(plugins: Partial<PluginSet>);
    handleOpenDoc({ detail: { docName, doc } }: OpenEvent): void;
    handleEditEvent(event: EditEvent): void;
    /** Undo the last `n` [[Edit]]s committed */
    undo(n?: number): void;
    /** Redo the last `n` [[Edit]]s that have been undone */
    redo(n?: number): void;
    logUI: Dialog;
    menuUI: Drawer;
    get locale(): LocaleTag;
    set locale(tag: LocaleTag);
    private editorIndex;
    get editor(): string;
    private controls;
    get menu(): Required<Control>[];
    get editors(): RenderedPlugin[];
    private hotkeys;
    private handleKeyPress;
    constructor();
    private renderLogEntry;
    private renderHistory;
    render(): TemplateResult<1>;
    firstUpdated(): void;
    static styles: import("lit").CSSResult;
}
declare global {
    interface HTMLElementTagNameMap {
        'open-scd': OpenSCD;
    }
}
export {};