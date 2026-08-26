import '@webcomponents/scoped-custom-element-registry';
// import '../dist/oscd-shell.js';

import PluginsHub from '@compas-bearingpoint/plugins/dist/apps/plugins-hub/index.js';

import OscdBackgroundPluginConfig from '@omicronenergy/oscd-background-plugin-config';

// Demo plugin set mirroring figma-designs/regular-look.png and
// figma-designs/regular-look-menu-plugin.png so the running shell can be
// compared 1:1 against the designs. The actual editor a leaf opens is
// irrelevant here — every editor leaf points to the source editor and every
// extra menu entry points to oscd-menu-open. Each editor leaf gets a UNIQUE
// tagName because the side-panel tree derives node ids from tagName (shared
// tagNames would collide and break selection/expansion state).
const plugins = {
  menu: [],
  editor: [
    {
      name: 'Plugin Hub',
      translations: { de: 'Plugin Hub' },
      icon: 'edit',
      requireDoc: false,
      tagName: 'plugin-hub',
    },
  ],
  background: [
    {
      name: 'Plugin Config',
      icon: 'none',
      requireDoc: false,
      tagName: 'plugin-config',
    },
  ],
};

const oscdShell = document.querySelector('oscd-shell');
const { registry } = oscdShell;
registry.define('plugin-hub', PluginsHub);
registry.define('plugin-config', OscdBackgroundPluginConfig);

oscdShell.plugins = plugins;

const params = new URL(document.location).searchParams;
for (const [name, value] of params) {
  oscdShell.setAttribute(name, value);
}

const sclDocString = await fetch('sample.scd').then(r => r.text());
// const sclDocString = `<?xml version="1.0" encoding="UTF-8"?>
//   <SCL version="2007" revision="B" xmlns="http://www.iec.ch/61850/2003/SCL">
//   <Substation name="A1" desc="test substation"></Substation>
// </SCL>`;
oscdShell.docs = {
  ['sample.scd']: new DOMParser().parseFromString(
    sclDocString,
    'application/xml',
  ),
};
oscdShell.docName = 'sample.scd';
