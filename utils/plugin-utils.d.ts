import { PluginBase, PluginEntry, PluginGroup, SourcedPluginEntry } from '../oscd-shell.js';
export type AnyPluginEntry = PluginEntry | SourcedPluginEntry;
/**
 * Helper fn to filter root plugins and grouped plugins, whilst preserving the structure.
 */
export declare function filterPlugins(pluginItems: (PluginEntry | PluginGroup<PluginEntry>)[], predicate: (plugin: PluginEntry) => boolean): (PluginEntry | PluginGroup<PluginEntry>)[];
/**
 * Returns a flattened array of all plugin entries from a given PluginSet, including those nested within PluginGroups.
 */
export declare function flattenPluginEntries<P extends PluginBase = PluginEntry>(pluginSet: (P | PluginGroup<P>)[]): P[];
/**
 * Filters plugins by a search term, matching (case-insensitively) against the
 * leaf plugin names only - group names are intentionally not matched. When a
 * `locale` is given, the plugin's localized label (`translations[locale]`) is
 * also matched, so users can search by the label they see. The group structure
 * is preserved and empty groups are dropped. An empty or whitespace-only term
 * returns the plugins unchanged.
 */
export declare function filterBySearchTerm(editors: (PluginEntry | PluginGroup<PluginEntry>)[], searchTerm: string, locale?: string): (PluginEntry | PluginGroup<PluginEntry>)[];
/**
 * Flattens plugins (including those nested within groups) and returns the leaf
 * entries whose tagName is included in the given pinnedIds.
 */
export declare function filterByPinned(editors: (PluginEntry | PluginGroup<PluginEntry>)[], pinnedIds: string[]): PluginEntry[];
export declare function isPluginGroup<P extends PluginBase = PluginEntry>(item: unknown): item is PluginGroup<P>;
/**
 * Checks if the given object is a valid Plugin.
 * @param item - The object to check.
 * @returns true if the object is a Plugin, false otherwise.
 */
export declare function isPluginEntry(item: unknown): item is PluginEntry;
/**
 * Checks if the given object is a SourcedPlugin.
 * @param item - The object to check.
 * @returns true if the object is a SourcedPlugin, false otherwise.
 */
export declare function isSourcedPlugin(item: unknown): item is SourcedPluginEntry;
/**
 * Validates a Plugin object, checking for required fields and types.
 * If the plugin is invalid, it logs an error and returns undefined.
 * @param plugin - The plugin object to validate.
 * @returns The validated Plugin object or undefined if invalid.
 */
export declare function validatePlugin(plugin: unknown): PluginEntry | undefined;
/**
 * Goes through all the plugins in the PluginSet and loads any sourced plugins, replacing the src field with a tagName.
 * If a plugin does not have a tagName, it will be generated based on its src.
 * All plugins returned are validated for required fields.
 * If a sourced plugin fails to load (bad src), it will be replaced with an Error Web Component.
 * @param plugins - Array of plugins to convert.
 * @returns Array of plugins with tagName included.
 */
export declare function loadSourcedPlugins(plugins: Partial<PluginEntry | SourcedPluginEntry>[], registry: CustomElementRegistry): PluginEntry[];
