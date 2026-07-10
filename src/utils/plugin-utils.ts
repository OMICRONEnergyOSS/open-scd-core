import { cyrb64 } from '../foundation/cyrb64.js';
import {
  PluginBase,
  PluginEntry,
  PluginGroup,
  SourcedPluginEntry,
} from '../oscd-shell.js';

const pluginTags = new Map<string, string>();

/*
 * Generates a unique tag name for a plugin based on its source URI.
 * This is used to ensure that each plugin has a unique identifier in the CustomElements registry.
 * @param uri - The source URI of the plugin.
 * @returns A unique tag name for the plugin.
 */
function pluginTag(uri: string): string {
  if (!pluginTags.has(uri)) {
    pluginTags.set(uri, `oscd-p${cyrb64(uri)}`);
  }
  return pluginTags.get(uri)!;
}

export type AnyPluginEntry = PluginEntry | SourcedPluginEntry;

/**
 * Helper fn to filter root plugins and grouped plugins, whilst preserving the structure.
 */
export function filterPlugins(
  pluginItems: (PluginEntry | PluginGroup<PluginEntry>)[],
  predicate: (plugin: PluginEntry) => boolean,
): (PluginEntry | PluginGroup<PluginEntry>)[] {
  return pluginItems
    .map(item =>
      isPluginGroup(item)
        ? {
            ...item,
            plugins: item.plugins.filter(predicate),
          }
        : item,
    )
    .filter(item =>
      //remove empty groups or plugins which don't match the predicate
      isPluginGroup(item) ? item.plugins.length > 0 : predicate(item),
    );
}

/**
 * Returns a flattened array of all plugin entries from a given PluginSet, including those nested within PluginGroups.
 */
export function flattenPluginEntries<P extends PluginBase = PluginEntry>(
  pluginSet: (P | PluginGroup<P>)[],
): P[] {
  return pluginSet.flatMap(item =>
    isPluginGroup<P>(item) ? item.plugins : [item],
  );
}

/**
 * Generates a Web Component class that displays an error message when a plugin fails to load.
 * This is used to provide feedback to the Distro developer when a plugin cannot be loaded due to an error.
 * @param plugin - The plugin object that failed to load.
 * @returns A Web Component class that displays the error message.
 */
function generateErrorWcClass(plugin: Partial<PluginEntry>) {
  const title = 'Error: Plugin failed to load.';
  const details = `Plugin: ${JSON.stringify(plugin)}`;
  const classString = `
  return class extends HTMLElement {

    connectedCallback() {
      this.innerHTML = '<h1>${title}</h1><p>${details}</p><emphasis>Check your plugins.json</emphasis>';
    }

    async run() {
      alert('${title}\\n\\n ${details}; \\n\\n Check your plugins.json');
    }
  }`;

  return new Function(classString)();
}

export function isPluginGroup<P extends PluginBase = PluginEntry>(
  item: unknown,
): item is PluginGroup<P> {
  return (
    typeof item === 'object' &&
    item !== null &&
    'plugins' in item &&
    Array.isArray((item as PluginGroup<P>).plugins)
  );
}

/**
 * Checks if the given object is a valid Plugin.
 * @param item - The object to check.
 * @returns true if the object is a Plugin, false otherwise.
 */
export function isPluginEntry(item: unknown): item is PluginEntry {
  return (
    typeof item === 'object' &&
    item !== null &&
    'tagName' in item &&
    typeof item.tagName === 'string'
  );
}

/**
 * Checks if the given object is a SourcedPlugin.
 * @param item - The object to check.
 * @returns true if the object is a SourcedPlugin, false otherwise.
 */
export function isSourcedPlugin(item: unknown): item is SourcedPluginEntry {
  return (
    typeof item === 'object' &&
    item !== null &&
    'src' in item &&
    typeof item.src === 'string'
  );
}

/**
 * Validates a Plugin object, checking for required fields and types.
 * If the plugin is invalid, it logs an error and returns undefined.
 * @param plugin - The plugin object to validate.
 * @returns The validated Plugin object or undefined if invalid.
 */
export function validatePlugin(plugin: unknown): PluginEntry | undefined {
  const missingFields = [];
  if (!isPluginEntry(plugin)) {
    missingFields.push('tagName');
  }

  const _plugin = plugin as PluginEntry;
  missingFields.push(
    ...(['name', 'icon'] as const).filter(
      field => !_plugin[field] || typeof _plugin[field] !== 'string',
    ),
  );
  if (
    typeof _plugin.requireDoc !== 'undefined' &&
    typeof _plugin.requireDoc !== 'boolean'
  ) {
    missingFields.push('requireDoc');
  }
  if (
    typeof _plugin.translations !== 'undefined' &&
    (typeof _plugin.translations !== 'object' ||
      Object.values(_plugin.translations).some(t => typeof t !== 'string'))
  ) {
    missingFields.push('translations');
  }

  if (missingFields.length > 0) {
    console.error(
      `[Invalid Plugin]\n${JSON.stringify(plugin, null, 2)}\nMissing/Invalid fields [${missingFields.join(',')}] - skipping.`,
    );
    return undefined;
  }
  return _plugin;
}

/**
 * Goes through all the plugins in the PluginSet and loads any sourced plugins, replacing the src field with a tagName.
 * If a plugin does not have a tagName, it will be generated based on its src.
 * All plugins returned are validated for required fields.
 * If a sourced plugin fails to load (bad src), it will be replaced with an Error Web Component.
 * @param plugins - Array of plugins to convert.
 * @returns Array of plugins with tagName included.
 */
export function loadSourcedPlugins(
  plugins: Partial<PluginEntry | SourcedPluginEntry>[],
  registry: CustomElementRegistry,
): PluginEntry[] {
  return plugins
    .map(plugin => {
      if (isPluginGroup(plugin)) {
        return {
          ...plugin,
          plugins: loadSourcedPlugins(plugin.plugins, registry),
        };
      }

      if (isPluginEntry(plugin)) {
        return validatePlugin(plugin);
      }
      if (!isSourcedPlugin(plugin)) {
        console.error(
          `[Invalid Plugin] Requires a tagName or src - skipping. ${JSON.stringify(plugin)}`,
        );
        return undefined;
      }
      const { src, ...rest } = plugin as SourcedPluginEntry;
      const hashedTagName = pluginTag(src);
      const validatedPlugin = validatePlugin({
        ...rest,
        tagName: hashedTagName,
      });

      if (!validatedPlugin) {
        return undefined;
      }

      if (registry.get(hashedTagName)) {
        return validatedPlugin;
      }

      const url = new URL(src, window.location.href).toString();
      import(/* @vite-ignore */ url)
        .then(mod => {
          // Because this is async, we need to check (again) if the element is already defined.
          if (!registry?.get(hashedTagName)) {
            registry.define(hashedTagName, mod.default);
          }
        })
        .catch(err => {
          // Log this as a warning because we load an Error WC in place of the plugin.
          console.warn(
            `[Invalid Plugin] Failed to load plugin ${plugin.name} <${hashedTagName}/> from ${url}`,
            err,
          );
          const ErrWc = generateErrorWcClass(plugin);
          registry.define(hashedTagName, ErrWc);
        });
      return validatedPlugin;
    })
    .filter((plugin): plugin is PluginEntry => plugin !== undefined);
}
