import { expect, fixture, fixtureCleanup, waitUntil } from '@open-wc/testing';
import { getFirstTextNodeContent } from '@omicronenergy/oscd-test-utils';

import './oscd-shell.js';

import { OscdTreeItem } from '@omicronenergy/oscd-ui/tree/OscdTreeItem.js';
import Sinon from 'sinon';

import { newEditEventV2, newOpenEvent } from '@openscd/oscd-api/utils.js';
import type { OscdShell, PluginEntry } from './oscd-shell.js';

import { cyrb64 } from './foundation.js';
import { Plugin } from '@openscd/oscd-api';
import { EditorPluginsPanel } from './side-panel/editor-plugins-panel.js';
import { OscdMenuItem } from '@omicronenergy/oscd-ui/menu/OscdMenuItem.js';
import {
  isPluginInstanciated,
  registerPlugin,
  waitForAllPluginsToInstantiate,
} from './utils/testing/plugin-helpers.js';
import {
  testMenuPlugin1,
  testMenuPlugin2,
  testEditorPlugin,
  testEditorPlugin2,
  TestBackgroundPlugin,
  TestMenuPlugin1,
} from './utils/testing/test-plugins.js';
import {
  createSclDocument,
  openDocOnShell,
} from './utils/testing/test-doc-helpers.js';

const getIndexOfSelectedEditor = (editorItems: OscdTreeItem[]) => {
  return editorItems.findIndex(
    item => item.closest('.row')?.getAttribute('data-selected') === 'true',
  );
};

describe('OscdShell', () => {
  let oscdShell: OscdShell;
  beforeEach(async () => {
    oscdShell = await fixture<OscdShell>(`<oscd-shell></oscd-shell>`);
    registerPlugin(oscdShell, 'test-background-plugin', TestBackgroundPlugin);
    registerPlugin(oscdShell, 'test-menu-plugin1', TestMenuPlugin1);
  });

  afterEach(() => {
    oscdShell.remove();
    fixtureCleanup();
  });

  describe('with no documents loaded', async () => {
    beforeEach(async () => {
      oscdShell.plugins = {
        menu: [testMenuPlugin1, testMenuPlugin2],
        editor: [testEditorPlugin, testEditorPlugin2],
        background: [
          {
            name: 'Test Background Plugin',
            tagName: 'test-background-plugin',
            icon: 'none',
          },
        ],
      };
      await oscdShell.updateComplete;

      await waitForAllPluginsToInstantiate(oscdShell);
    });

    it('loads menu plugins', () => {
      expect(oscdShell)
        .property('plugins')
        .property('menu')
        .to.have.lengthOf(2); //ok, they're set on the oscdShell. But that should be it.

      //NOTE: This test relies on the fact that the landing page contains the plugins, so they're searched for in a different way.
      expect(
        oscdShell.shadowRoot?.querySelectorAll('.menu-plugins > *'),
      ).to.have.lengthOf(1); //no document loaded, so no menu items should be shown.
    });

    it('loads menu background plugins', () => {
      expect(oscdShell)
        .property('plugins')
        .property('background')
        .to.have.lengthOf(1);
    });

    it('does not load editor plugins', () => {
      expect(oscdShell)
        .property('plugins')
        .property('editor')
        .to.have.lengthOf(2);

      expect(
        oscdShell.shadowRoot?.querySelector(
          (oscdShell.plugins.editor[0] as PluginEntry).tagName,
        ),
      ).to.not.exist;
    });

    it('does not load the file selector in the app-bar when no document is set', async () => {
      const sclDoc = createSclDocument();
      oscdShell.docs = { 'test.scd': sclDoc };
      oscdShell.docName = '';
      await oscdShell.updateComplete;

      const appBarEnd =
        oscdShell.shadowRoot?.querySelector('[slot="alignEnd"]');
      expect(appBarEnd?.querySelector('files-menu')).not.to.exist;
      expect(appBarEnd?.querySelector('oscd-divider')).not.to.exist;
    });
  });

  describe('with editor plugins loaded', () => {
    let editorPlugin: HTMLElement & Plugin & { editCount: number };
    const sclDoc = createSclDocument();

    beforeEach(async () => {
      oscdShell.dispatchEvent(newOpenEvent(sclDoc, 'test.scd'));

      oscdShell.plugins = {
        menu: [],
        editor: [testEditorPlugin, testEditorPlugin2],
      };
      await oscdShell.updateComplete;

      await waitForAllPluginsToInstantiate(oscdShell);

      await waitUntil(
        () => oscdShell.selectedEditor !== undefined,
        'No editor plugin selected',
      );
      const selectedEditorTagName = oscdShell.selectedEditor!.tagName;
      editorPlugin = oscdShell.shadowRoot?.querySelector(
        selectedEditorTagName,
      ) as HTMLElement & Plugin & { editCount: number };
    });

    it('changes editor plugin when clicking on the editor item', async () => {
      const editorPluginsSidePanel = oscdShell.shadowRoot?.querySelector(
        'editor-plugins-panel',
      ) as EditorPluginsPanel;

      //Pre-checks...
      expect(editorPluginsSidePanel).to.exist;

      const editorsTree = editorPluginsSidePanel.shadowRoot?.querySelector(
        'oscd-tree.editors-tree',
      ) as HTMLElement;
      expect(editorsTree).to.exist;

      const queryEditorItems = () =>
        Array.from(
          editorsTree.shadowRoot?.querySelectorAll('oscd-tree-item') ?? [],
        ) as OscdTreeItem[];

      const editorItems = queryEditorItems();

      //expect there to be two editor entries
      expect(editorItems.length).to.equal(2);

      //expect first item to be selected
      expect(getIndexOfSelectedEditor(editorItems)).to.equal(0);

      expect(
        getFirstTextNodeContent(editorItems[0].querySelector('span')),
      ).to.equal(testEditorPlugin.name);
      expect(
        getFirstTextNodeContent(editorItems[1].querySelector('span')),
      ).to.equal(testEditorPlugin2.name);

      const lastEditorItem = editorItems[editorItems.length - 1];
      expect(lastEditorItem).to.exist;
      lastEditorItem!.click();

      await oscdShell.updateComplete;

      await waitUntil(
        () =>
          isPluginInstanciated(oscdShell.selectedEditor!.tagName, oscdShell),
        'second editor plugin did not load',
      );

      const secondEditorPluginContent = oscdShell.shadowRoot!.querySelector(
        oscdShell!.selectedEditor!.tagName,
      );
      expect(
        secondEditorPluginContent?.querySelector('p')?.textContent?.trim(),
      ).to.equal('Test Editor Plugin2');
      await waitUntil(
        () => getIndexOfSelectedEditor(queryEditorItems()) === 1,
        'selected editor did not move to second item',
      );
      expect(getIndexOfSelectedEditor(queryEditorItems())).to.equal(1);
    });

    it('places the current editor at the start and file selector at the end of the app bar', async () => {
      const currentEditor = oscdShell.shadowRoot?.querySelector(
        '.current-editor[slot="alignStart"]',
      );
      expect(currentEditor?.textContent).to.contain(
        oscdShell.selectedEditor!.name,
      );
      expect(currentEditor?.querySelector('oscd-divider.vertical')).to.exist;

      const appBarEnd =
        oscdShell.shadowRoot?.querySelector('[slot="alignEnd"]');
      expect(appBarEnd?.querySelector('files-menu')).to.exist;
      expect(appBarEnd?.querySelector('oscd-divider.vertical')).to.exist;
      expect(
        appBarEnd?.querySelectorAll('oscd-filled-icon-button'),
      ).to.have.lengthOf(2);
    });

    it('passes attribute locale', () => {
      expect(editorPlugin.locale).to.equal('en');
    });

    it('has its docName property set', () => {
      expect(editorPlugin.docName).to.equal('test.scd');
    });

    it('has its doc property set', () => {
      expect(editorPlugin.doc).to.equal(sclDoc);
    });

    it('has its docs property set', () => {
      expect(editorPlugin.docs).to.be.an('object');
      expect(editorPlugin.docs['test.scd']).to.equal(sclDoc);
    });

    it('passes property docVersion', async () => {
      expect(editorPlugin.docVersion).to.equal(0);
      expect(editorPlugin.editCount).to.equal(0);
    });

    it('updated passed docVersion property on edit events', async () => {
      oscdShell.dispatchEvent(
        newEditEventV2({
          element: sclDoc.querySelector('Substation')!,
          attributes: { name: 'someName' },
          attributesNS: {},
        }),
      );
      await oscdShell.updateComplete;

      expect(editorPlugin.docVersion).to.equal(1);
      expect(editorPlugin.editCount).to.equal(1);
    });
  });

  describe('with menu plugins loaded', () => {
    let menuPlugin: HTMLElement & Plugin;
    beforeEach(async () => {
      oscdShell.plugins = {
        menu: [testMenuPlugin1],
      };
      await oscdShell.updateComplete;
      await waitForAllPluginsToInstantiate(oscdShell);

      menuPlugin = oscdShell.shadowRoot?.querySelector(
        '.off-screen-plugin-container .menu-plugins > *:first-child',
      ) as HTMLElement & Plugin;
    });

    it('passes attribute locale', () => {
      expect(menuPlugin.locale).to.equal('en');
    });

    describe('with no document loaded', () => {
      it('has no docName property set', () => {
        expect(menuPlugin.docName).to.equal('');
      });

      it('has no doc property set', () => {
        expect(menuPlugin.doc).to.equal(undefined);
      });

      it('has no docs property set', () => {
        expect(menuPlugin.docs).to.be.an('object');
        expect(menuPlugin.docs).to.be.empty;
      });
    });

    describe('with a document loaded', async () => {
      let doc: XMLDocument;
      beforeEach(async () => {
        doc = createSclDocument();
        oscdShell.dispatchEvent(newOpenEvent(doc, 'test.scd'));
        await oscdShell.updateComplete;
        menuPlugin = oscdShell.shadowRoot?.querySelector(
          '.off-screen-plugin-container .menu-plugins > *:first-child',
        ) as HTMLElement & Plugin;
      });

      it('has its docName property set', () => {
        expect(menuPlugin.docName).to.equal('test.scd');
      });

      it('has its doc property set', () => {
        expect(menuPlugin.doc).to.equal(doc);
      });

      it('has its docs property set', () => {
        expect(menuPlugin.docs).to.be.an('object');
        expect(menuPlugin.docs['test.scd']).to.equal(doc);
      });

      it('passes property docVersion', () => {
        expect(menuPlugin).to.have.property('docVersion', 0);
        expect(menuPlugin).to.have.property('editCount', 0);
      });

      it('updated passed docVersion property on edit events', async () => {
        // const doc = createSclDocument();
        // oscdShell.dispatchEvent(newOpenEvent(doc, 'test.scd'));
        await oscdShell.updateComplete;

        oscdShell.dispatchEvent(
          newEditEventV2({
            element: doc.querySelector('testdoc')!,
            attributes: { name: 'someName' },
            attributesNS: {},
          }),
        );
        await oscdShell.updateComplete;

        expect(menuPlugin).to.have.property('docVersion', 1);
        expect(menuPlugin).to.have.property('editCount', 1);
      });
    });
  });

  describe('Custom plugins', () => {
    let sclDoc: XMLDocument;
    beforeEach(async () => {
      sclDoc = createSclDocument();
      openDocOnShell(oscdShell, 'test.scd', sclDoc);
      oscdShell.plugins = {
        menu: [testMenuPlugin1],
        editor: [testEditorPlugin],
      };
      await oscdShell.updateComplete;

      await waitUntil(
        () =>
          oscdShell.pluginsMenu.shadowRoot?.querySelectorAll('oscd-menu-item')
            .length === 1,
        `Custom Menu Plugin "${testMenuPlugin1.name}" did not load`,
      );
    });

    it('executes the plugin upon menu item click', async () => {
      const node = oscdShell.doc.querySelector('Substation')!;
      oscdShell.dispatchEvent(newEditEventV2({ node }));
      await oscdShell.updateComplete;
      expect(sclDoc.querySelector('Substation')).to.not.exist;

      oscdShell.pluginsMenu.open();
      await oscdShell.pluginsMenu.updateComplete;

      const pluginMenuItem = oscdShell.pluginsMenu.shadowRoot?.querySelectorAll(
        'oscd-menu-item',
      )[0] as OscdMenuItem;
      expect(pluginMenuItem).to.exist;
      expect(pluginMenuItem).to.have.property('disabled', false);
      pluginMenuItem?.click();
      await oscdShell.updateComplete;
      expect(sclDoc.querySelector('Substation')).to.exist;
    });

    it('does not attempt to call customElements.define if the plugin has already been defined', async () => {
      const customEditorPlugin = {
        name: 'Test 123 Editor Plugin',
        src: 'data:text/javascript;charset=utf-8,export%20default%20class%20TestEditorPlugin%20extends%20HTMLElement%20%7B%0D%0A%20%20constructor%20%28%29%20%7B%20super%28%29%3B%20this.innerHTML%20%3D%20%60%3Cp%3ETest123%20Editor%20Plugin%3C%2Fp%3E%60%3B%20%7D%0D%0A%7D',
        icon: 'edit',
        requireDoc: false,
      };

      const customEditorPluginTagName = `oscd-p${cyrb64(customEditorPlugin.src)}`;

      registerPlugin(
        oscdShell,
        customEditorPluginTagName,
        class extends HTMLElement {},
      );

      expect(oscdShell.registry).not.to.be.undefined;
      const customElementDefineSpy =
        oscdShell.registry?.define && Sinon.spy(oscdShell.registry, 'define');

      oscdShell.plugins = { menu: [], editor: [customEditorPlugin] };
      await oscdShell.updateComplete;

      expect(customElementDefineSpy!.called).to.be.false;
    });
  });

  describe('localization', () => {
    let menuItemStrings: string[] = [];
    let editorTabStrings: string[] = [];

    beforeEach(async () => {
      const sclDoc = createSclDocument();
      openDocOnShell(oscdShell, 'test.scd', sclDoc);
      oscdShell.plugins = {
        menu: [testMenuPlugin1],
        editor: [testEditorPlugin],
      };
      await oscdShell.updateComplete;

      await waitForAllPluginsToInstantiate(oscdShell);

      menuItemStrings = Array.from(
        oscdShell?.pluginsMenu?.shadowRoot?.querySelectorAll(
          "oscd-menu-item > div[slot='headline']",
        ) || [],
      ).map(span => (span as Element).textContent?.trim() || '');

      const editorsTree =
        oscdShell?.editorPluginsPanel?.shadowRoot?.querySelector(
          'oscd-tree.editors-tree',
        );
      await waitUntil(
        () =>
          (editorsTree?.shadowRoot?.querySelectorAll('oscd-tree-item')
            ?.length ?? 0) > 0,
        'editor items did not render',
      );
      editorTabStrings = Array.from(
        editorsTree?.shadowRoot?.querySelectorAll('oscd-tree-item > span') ||
          [],
      ).map(
        tab =>
          Array.from((tab as Element).childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent?.trim() ?? '')[0] || '',
      );

      // we only change the locale after waiting for the plugins to load and getting their default strings
      oscdShell.locale = 'de';
      await waitUntil(
        () => oscdShell.locale === 'de',
        'Locale failed to change',
      );
    });

    afterEach(async () => {
      // reset to en so we can find the loaded plugins by their name
      oscdShell.locale = 'en';
      await oscdShell.updateComplete;
    });

    it('the menu items appear in german', () => {
      const untranslatedStrings = Array.from(
        oscdShell.pluginsMenu.querySelectorAll('oscd-menu-item > div'),
      )
        .map(span => (span as Element).textContent?.trim() || '')
        .filter((text: string) => menuItemStrings.includes(text));

      expect(untranslatedStrings).to.be.empty;
    });

    it('the editor plugin appears in german', () => {
      const editorsTree =
        oscdShell.editorPluginsPanel.shadowRoot?.querySelector(
          'oscd-tree.editors-tree',
        );
      const untranslatedStrings = Array.from(
        editorsTree?.shadowRoot?.querySelectorAll('oscd-tree-item > span') ||
          [],
      )
        .map(span => (span as Element).textContent?.trim() || '')
        .filter((text: string) => editorTabStrings.includes(text));

      expect(untranslatedStrings).to.be.empty;
    });

    it('it remains in english after attempting to load a non-existing locale', async () => {
      oscdShell.locale = 'en';
      // @ts-expect-error we want to test a non-existing locale
      oscdShell.locale = 'xx';
      await waitUntil(
        () => oscdShell.locale === 'en',
        'Locale failed to change',
      );
      expect(oscdShell.locale).to.equal('en');
    });
  });
});
