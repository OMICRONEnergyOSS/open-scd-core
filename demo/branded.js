// import '@webcomponents/scoped-custom-element-registry';
// import '../dist/oscd-shell.js';
import OscdMenuOpen from '@omicronenergy/oscd-menu-open';
import OscdMenuSave from '@omicronenergy/oscd-menu-save';
import {
  OscdMenuFileClose,
  OscdMenuFileRename,
  OscdMenuNew,
} from '@omicronenergy/oscd-menu-commons';
import OscdBackgroundEditV1 from '@omicronenergy/oscd-background-editv1';
import OscdEditorSource from '@omicronenergy/oscd-editor-source';

// Demo plugin set mirroring figma-designs/regular-look.png and
// figma-designs/regular-look-menu-plugin.png so the running shell can be
// compared 1:1 against the designs. The actual editor a leaf opens is
// irrelevant here — every editor leaf points to the source editor and every
// extra menu entry points to oscd-menu-open. Each editor leaf gets a UNIQUE
// tagName because the side-panel tree derives node ids from tagName (shared
// tagNames would collide and break selection/expansion state).
const plugins = {
  menu: [
    {
      name: 'File',
      translations: { de: 'Datei' },
      icon: 'folder',
      plugins: [
        {
          name: 'Open',
          translations: { de: 'Öffnen' },
          icon: 'description',
          tagName: 'oscd-menu-open',
        },
        {
          name: 'New File',
          translations: { de: 'Neue Datei' },
          icon: 'note_add',
          tagName: 'oscd-menu-new',
        },
        {
          name: 'Save File',
          translations: { de: 'Datei speichern' },
          icon: 'save',
          requireDoc: true,
          tagName: 'oscd-menu-save',
        },
        {
          name: 'Close File',
          translations: { de: 'Datei schließen' },
          icon: 'close',
          requireDoc: true,
          tagName: 'oscd-menu-open',
        },
      ],
    },
    {
      name: 'Generate SubStation',
      translations: { de: 'Unterstation erzeugen' },
      icon: 'grid_on',
      tagName: 'oscd-menu-open',
    },
    {
      name: 'Import IED',
      translations: { de: 'IED importieren' },
      icon: 'note_add',
      tagName: 'oscd-menu-open',
    },
    {
      name: 'Generate IED',
      translations: { de: 'IED erzeugen' },
      icon: 'grid_view',
      tagName: 'oscd-menu-open',
    },
    {
      name: 'Generator Data Type',
      translations: { de: 'Datentyp erzeugen' },
      icon: 'dvr',
      tagName: 'oscd-menu-open',
    },
    {
      name: 'Help',
      translations: { de: 'Hilfe' },
      icon: 'help',
      tagName: 'oscd-menu-open',
    },
  ],
  editor: [
    {
      name: 'SLD',
      icon: 'add_box',
      plugins: [
        {
          name: 'Design SLD',
          translations: { de: 'SLD entwerfen' },
          icon: 'add_box',
          requireDoc: true,
          tagName: 'oscd-editor-sld-design',
        },
        {
          name: 'Edit Substation',
          translations: { de: 'Unterstation bearbeiten' },
          icon: 'add_box',
          requireDoc: true,
          tagName: 'oscd-editor-sld-edit',
        },
        {
          name: 'Sub category',
          translations: { de: 'Unterkategorie' },
          icon: 'add_box',
          requireDoc: true,
          tagName: 'oscd-editor-sld-sub',
        },
      ],
    },
    {
      name: 'View GOOSE/SMV',
      translations: { de: 'GOOSE/SMV ansehen' },
      icon: 'settings_ethernet',
      plugins: [
        {
          name: 'GOOSE Messages',
          translations: { de: 'GOOSE-Nachrichten' },
          icon: 'sync_alt',
          requireDoc: true,
          tagName: 'oscd-editor-goose-messages',
        },
        {
          name: 'Sampled Values',
          translations: { de: 'Abtastwerte' },
          icon: 'sync_alt',
          requireDoc: true,
          tagName: 'oscd-editor-sampled-values',
        },
      ],
    },
    {
      name: 'Subscriptions',
      translations: { de: 'Abonnements' },
      icon: 'copy_all',
      plugins: [
        {
          name: 'Subscriber View',
          translations: { de: 'Abonnentenansicht' },
          icon: 'dvr',
          requireDoc: true,
          tagName: 'oscd-editor-subscriber-view',
        },
        {
          name: 'Subscriber Later Binding',
          translations: { de: 'Späte Bindung' },
          icon: 'dvr',
          requireDoc: true,
          tagName: 'oscd-editor-later-binding',
        },
      ],
    },
    {
      name: 'Publish and Address',
      translations: { de: 'Veröffentlichen und Adressieren' },
      icon: 'difference',
      requireDoc: true,
      tagName: 'oscd-editor-publish-address',
    },
    {
      name: 'Compare',
      translations: { de: 'Vergleichen' },
      icon: 'settings_ethernet',
      requireDoc: true,
      tagName: 'oscd-editor-compare',
    },
    {
      name: 'Stencil',
      translations: { de: 'Schablone' },
      icon: 'difference',
      requireDoc: true,
      tagName: 'oscd-editor-stencil',
    },
  ],
  background: [
    {
      name: 'EditV1 Events Listener',
      icon: 'none',
      requireDoc: true,
      tagName: 'oscd-background-editv1',
    },
  ],
};

const oscdShell = document.querySelector('oscd-shell');
const { registry } = oscdShell;
registry.define('oscd-menu-open', OscdMenuOpen);
registry.define('oscd-menu-save', OscdMenuSave);
registry.define('oscd-menu-new', OscdMenuNew);
registry.define('oscd-menu-file-rename', OscdMenuFileRename);
registry.define('oscd-menu-file-close', OscdMenuFileClose);
registry.define('oscd-background-editv1', OscdBackgroundEditV1);

// Every editor leaf in the demo config resolves to the source editor. Each is
// registered under its own tagName (via a distinct subclass) so the tree can
// give every leaf a unique, collision-free node id.
const editorTagNames = [
  'oscd-editor-sld-design',
  'oscd-editor-sld-edit',
  'oscd-editor-sld-sub',
  'oscd-editor-goose-messages',
  'oscd-editor-sampled-values',
  'oscd-editor-subscriber-view',
  'oscd-editor-later-binding',
  'oscd-editor-publish-address',
  'oscd-editor-compare',
  'oscd-editor-stencil',
];
for (const tagName of editorTagNames) {
  if (!registry.get(tagName)) {
    registry.define(tagName, class extends OscdEditorSource {});
  }
}

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
