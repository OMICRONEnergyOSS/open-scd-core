import { expect, fixture } from '@open-wc/testing';

import { html } from 'lit';

import './oscd-shell.js';
import sinon from 'sinon';
import type { OscdShell, PluginEntry } from './oscd-shell.js';
import {
  TestBackgroundPlugin,
  TestMenuPlugin1,
} from './utils/testing/test-plugins.js';
import {
  sampleEditorPlugins,
  sampleMenuPlugins,
  waitForAllPluginsToInstantiate,
} from './utils/testing/plugin-helpers.js';
import { createSclDocument } from './utils/testing/test-doc-helpers.js';

describe('OscdShell Plugin Handling', () => {
  let oscdShell: OscdShell;

  beforeEach(async () => {
    oscdShell = await fixture(html`<oscd-shell></oscd-shell>`);
    const registry = oscdShell.registry!;
    if (!registry.get('test-background-plugin')) {
      registry?.define('test-background-plugin', TestBackgroundPlugin);
    }
    if (!registry.get('test-menu-plugin1')) {
      registry?.define('test-menu-plugin1', TestMenuPlugin1);
    }

    oscdShell.docs = {
      ['sample.scd']: createSclDocument(),
    };
    oscdShell.docName = 'sample.scd';

    oscdShell.plugins = {
      menu: sampleMenuPlugins,
      background: [
        {
          name: 'Background Plugin',
          tagName: 'test-background-plugin',
          icon: 'none',
        },
      ],
    };
    await oscdShell.updateComplete;
    await waitForAllPluginsToInstantiate(oscdShell);
  });

  afterEach(() => {
    oscdShell.remove();
  });

  describe('with sample plugins loaded', () => {
    it('loads menu plugins', () => {
      expect(oscdShell)
        .property('plugins')
        .property('menu')
        .to.have.lengthOf(3);
    });

    it('loads background plugins', () => {
      expect(oscdShell)
        .property('plugins')
        .property('background')
        .to.have.lengthOf(1);
    });

    it('background plugins do something', async () => {
      // Use a real event listener and a Promise to avoid timing issues
      const eventPromise = new Promise<CustomEvent>(resolve => {
        document.addEventListener(
          'test-rx',
          (e: Event) => resolve(e as CustomEvent),
          { once: true },
        );
      });
      const testValue = crypto.randomUUID();
      document.dispatchEvent(new CustomEvent('test-tx', { detail: testValue }));

      const event = await eventPromise;
      expect(event.detail).to.equal(testValue);
    });

    it('loading the same plugins twice does not result in duplicates', () => {
      oscdShell.plugins = {
        menu: sampleMenuPlugins,
      };
      expect(oscdShell)
        .property('plugins')
        .property('menu')
        .to.have.lengthOf(3);
      oscdShell.plugins = {
        menu: sampleMenuPlugins,
      };
      expect(oscdShell)
        .property('plugins')
        .property('menu')
        .to.have.lengthOf(3);
    });

    it('loads editor plugins', async () => {
      oscdShell.plugins = {
        editor: sampleEditorPlugins,
      };
      await oscdShell.updateComplete;
      expect(oscdShell)
        .property('plugins')
        .property('editor')
        .to.have.lengthOf(2);
    });

    it('ignores plugins with no tagName or src', async () => {
      oscdShell.plugins = {
        editor: [
          {
            name: 'Tagless, Sourceless, Hopeless Plugin',
            icon: 'coronavirus',
          },
        ],
      };
      await oscdShell.updateComplete;
      expect(oscdShell)
        .property('plugins')
        .property('editor')
        .to.have.lengthOf(0);
    });

    it('ignores invalid SourcePlugins', async () => {
      oscdShell.plugins = {
        background: [
          {
            src: 'test-background-plugin',
          },
        ],
      };
      await oscdShell.updateComplete;
      expect(oscdShell)
        .property('plugins')
        .property('background')
        .to.have.lengthOf(0);
    });

    it('ignores plugins missing a few fields', async () => {
      oscdShell.plugins = {
        background: [
          {
            tagName: 'test-background-plugin',
          },
        ],
      };
      await oscdShell.updateComplete;
      expect(oscdShell)
        .property('plugins')
        .property('background')
        .to.have.lengthOf(0);
    });
  });

  describe('shows an error plugin inplace of corrupted src plugins', () => {
    let alertStub: sinon.SinonStub;

    beforeEach(async () => {
      alertStub = sinon.stub(window, 'alert');
      oscdShell.plugins = {
        menu: [
          {
            name: 'malformed menu plugin',
            icon: 'none',
            src: 'data:text/javascript;charset=utf-8,export bad menu',
          },
        ],
        editor: [
          {
            name: 'malformed editor plugin',
            icon: 'none',
            src: 'data:text/javascript;charset=utf-8,export bad editor',
          },
        ],
      };
      await waitForAllPluginsToInstantiate(oscdShell);
    });

    afterEach(() => {
      alertStub.restore();
    });

    it('should replace the corrupted menu plugins wc with the Error WC', async () => {
      const { menu } = oscdShell.plugins;
      expect(menu).to.have.lengthOf(1);
      const menuPluginElement = oscdShell.shadowRoot?.querySelector(
        (menu[0] as PluginEntry).tagName,
      ) as HTMLElement & {
        run: () => Promise<void>;
      };
      expect(menuPluginElement, 'Menu Plugin Element').to.exist;
      // lets trigger the menu plugin to verfiy it triggers a native window.alert
      await menuPluginElement.run();
      await oscdShell.updateComplete;

      expect(alertStub.called).to.be.true;
      const alertCalls = alertStub.getCalls().map(call => call.args[0]);
      expect(alertCalls.some(msg => msg.includes('Error'))).to.be.true;
    });

    it('should replace the corrupted editor plugins wc with the Error WC', () => {
      const { editor } = oscdShell.plugins;
      expect(editor).to.have.lengthOf(1);
      const editorPluginElement = oscdShell.shadowRoot?.querySelector(
        (editor[0] as PluginEntry).tagName,
      );
      expect(editorPluginElement, 'Editor Plugin Element').to.exist;
      expect(editorPluginElement?.querySelector('h1')?.textContent).to.contain(
        'Error',
      );
    });
  });
});
