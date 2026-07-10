/* eslint-disable import-x/no-extraneous-dependencies */
import { waitUntil } from '@open-wc/testing';
import { OscdShell, PluginEntry, PluginGroup } from '../../oscd-shell.js';
import { flattenPluginEntries } from '../plugin-utils.js';

export const sampleMenuPlugins: (Omit<PluginEntry, 'tagName'> & {
  tagName?: string;
  src?: string;
})[] = [
  {
    name: 'Test Menu Plugin',
    translations: { de: 'Test Menu Erweiterung' },
    tagName: 'test-menu-plugin1',
    icon: 'margin',
    requireDoc: false,
  },
  {
    name: 'Test Menu Plugin 2',
    src: 'data:text/javascript;charset=utf-8,export%20default%20class%20TestStrMenuPlugin2%20extends%20HTMLElement%20%7B%0D%0A%20%20async%20run%28%29%20%7B%0D%0A%20%20%20%20return%20true%3B%0D%0A%20%20%7D%0D%0A%7D',
    icon: 'margin',
    requireDoc: false,
  },
  {
    name: 'Test Menu Plugin 3',
    src: 'data:text/javascript;charset=utf-8,export%20default%20class%20TestStrMenuPlugin3%20extends%20HTMLElement%20%7B%0D%0A%20%20async%20run%28%29%20%7B%0D%0A%20%20%20%20return%20true%3B%0D%0A%20%20%7D%0D%0A%7D',
    icon: 'margin',
    requireDoc: false,
  },
];

export const sampleEditorPlugins: (Omit<PluginEntry, 'tagName'> & {
  tagName?: string;
  src?: string;
})[] = [
  {
    name: 'Test Editor Plugin',
    translations: { de: 'Test Editor Erweiterung' },
    src: 'data:text/javascript;charset=utf-8,export%20default%20class%20TestEditorPlugin%20extends%20HTMLElement%20%7B%0D%0A%20%20constructor%20%28%29%20%7B%20super%28%29%3B%20this.innerHTML%20%3D%20%60%3Cp%3ETest%20Editor%20Plugin%3C%2Fp%3E%60%3B%20%7D%0D%0A%7D',
    icon: 'coronavirus',
  },
  {
    name: 'Test Editor Plugin 2',
    src: 'data:text/javascript;charset=utf-8,export%20default%20class%20TestEditorPlugin%20extends%20HTMLElement%20%7B%0D%0A%20%20constructor%20%28%29%20%7B%20super%28%29%3B%20this.innerHTML%20%3D%20%60%3Cp%3ETest%20Editor%20Plugin%3C%2Fp%3E%60%3B%20%7D%0D%0A%7D',
    icon: 'coronavirus',
  },
];

export function findPluginByTagName(
  pluginSet: (PluginEntry | PluginGroup<PluginEntry>)[],
  tagName: string,
): PluginEntry | undefined {
  return flattenPluginEntries(pluginSet).find(
    plugin => plugin.tagName === tagName,
  );
}

export const isPluginInstanciated = (
  pluginTagName: string,
  shell: OscdShell,
): boolean =>
  !!shell.registry?.get(pluginTagName) &&
  !!shell.shadowRoot?.querySelector(pluginTagName);

export const waitForPluginInstanciation = async (
  plugin: PluginEntry,
  shell: OscdShell,
): Promise<void> =>
  waitUntil(
    () => isPluginInstanciated(plugin.tagName, shell),
    `Plugin: "${plugin.name}" <${plugin.tagName}> failed to load.
      CustomElements Registered: ${shell.registry?.get(plugin.tagName) ? 'Yes' : 'No (at least not in the OscdShell registry)'},
      Found in DOM: ${shell.shadowRoot?.querySelector(plugin.tagName) ? 'Yes' : 'No'},
      requiresDoc?: ${plugin.requireDoc}
      loadedDocName?: ${shell.docName}`,
  );

export const waitForPluginsToInstantiate = async (
  plugins: PluginEntry[],
  shell: OscdShell,
) =>
  await Promise.all(
    plugins.map(plugin => waitForPluginInstanciation(plugin, shell)),
  );

/**
 * Convienience function to wait for all applicable plugins to instantiate.
 * If a document is loaded, all plugins are waited for. If no document is loaded,
 * only plugins that do not require a document are waited for.
 * If no document is loaded, only menu and background plugins are considered, as
 * the landing page does not have an editor.
 *
 * @param shell - The instance of the OscdShell to check for plugin instantiation.
 * @returns Empty Promise that resolves when all applicable plugins have been instantiated.
 */
export const waitForAllPluginsToInstantiate = async (shell: OscdShell) => {
  const docLoaded = !!shell.docName;

  const editorPlugin =
    docLoaded && shell.selectedEditor
      ? findPluginByTagName(shell.plugins.editor, shell.selectedEditor.tagName)
      : undefined;

  const menuPlugins = flattenPluginEntries(shell.plugins.menu).filter(
    plugin => !plugin.requireDoc || docLoaded,
  );
  const backgroundPlugins = shell.plugins.background.filter(
    plugin => !plugin.requireDoc || docLoaded,
  );

  const allPlugins: PluginEntry[] = [
    ...menuPlugins,
    ...backgroundPlugins,
    ...(editorPlugin ? [editorPlugin] : []),
  ];

  return allPlugins.length > 0
    ? waitForPluginsToInstantiate(allPlugins, shell)
    : Promise.resolve();
};

export const registerPlugin = (
  shell: OscdShell,
  tagName: string,
  pluginClass: CustomElementConstructor,
) => {
  if (!shell.registry?.get(tagName)) {
    shell.registry?.define(tagName, pluginClass);
  }
};
