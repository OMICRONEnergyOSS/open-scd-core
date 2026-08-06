import { expect, fixture, html } from '@open-wc/testing';
import { OscdMenuItem } from '@omicronenergy/oscd-ui/menu/OscdMenuItem.js';
import type { OscdShell } from '../oscd-shell.js';
import '../oscd-shell.js';
import { PluginsMenu } from './plugins-menu.js';
import { createTestDocs } from '../utils/testing/test-doc-helpers.js';
import { OscdFilledIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdFilledIconButton.js';
import sinon from 'sinon';
import { LitElement } from 'lit';
import { sampleMenuPlugins } from '../utils/testing/plugin-helpers.js';
import { TestMenuPlugin1 } from '../utils/testing/test-plugins.js';

const findMenuOpenButton = (pluginsMenu: PluginsMenu) => {
  const menuOpenButton = pluginsMenu.shadowRoot?.querySelector(
    'oscd-filled-icon-button',
  ) as OscdFilledIconButton;
  expect(menuOpenButton).to.exist;
  return menuOpenButton;
};

describe('plugins-menu', () => {
  let oscdShell: OscdShell;
  let pluginsMenu: PluginsMenu;
  let docs: Record<string, XMLDocument>;

  beforeEach(async () => {
    docs = createTestDocs(1);
    oscdShell = <OscdShell>(
      await fixture(
        html`<oscd-shell
          appIcon="none"
          .docs=${docs}
          docName=${Object.keys(docs)[0]}
        ></oscd-shell>`,
      )
    );
    if (!oscdShell.registry?.get('test-menu-plugin1')) {
      oscdShell.registry?.define('test-menu-plugin1', TestMenuPlugin1);
    }
    oscdShell.plugins = {
      menu: sampleMenuPlugins,
    };
    pluginsMenu = oscdShell.shadowRoot!.querySelector('plugins-menu')!;
    await oscdShell.updateComplete;
    await pluginsMenu.updateComplete;
  });

  it('displays a menu item for each menu plugin', async () => {
    const menuOpenButton = findMenuOpenButton(pluginsMenu);
    menuOpenButton?.click();
    await pluginsMenu.updateComplete;
    expect(pluginsMenu.menu).to.have.property('open', true);
    expect(pluginsMenu.menu.children).to.have.length(
      oscdShell.plugins!.menu.length,
    );
  });

  it('executes the run() function of the associated plugin, when the plugin menu item is clicked', async () => {
    const menuPluginSelectSpy = sinon.spy();
    pluginsMenu.addEventListener('menu-plugin-select', menuPluginSelectSpy);

    const pluginRunSpy = sinon.spy();
    const menuPluginEntry = pluginsMenu.menuPlugins[0];
    const firstMenuPlugin = oscdShell.shadowRoot!.querySelector(
      menuPluginEntry.tagName,
    )! as unknown as LitElement & {
      run: () => void;
    };
    firstMenuPlugin.run = pluginRunSpy;

    const menuOpenButton = findMenuOpenButton(pluginsMenu);
    menuOpenButton?.click();
    await pluginsMenu.updateComplete;

    const firstMenuItem = pluginsMenu.menu.firstElementChild as OscdMenuItem;
    firstMenuItem.click();
    await pluginsMenu.updateComplete;

    expect(pluginRunSpy.calledOnce).to.be.true;
  });

  it('closes when clicking on the menu button, if its currently open', async () => {
    const menuOpenButton = findMenuOpenButton(pluginsMenu);
    menuOpenButton?.click();
    await pluginsMenu.updateComplete;
    expect(pluginsMenu.menu).to.have.property('open', true);

    // Click again to close
    menuOpenButton?.click();
    await pluginsMenu.updateComplete;
    expect(pluginsMenu.menu).to.have.property('open', false);
  });
});
