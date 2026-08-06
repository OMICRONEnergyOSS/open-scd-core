import { expect, fixture, waitUntil } from '@open-wc/testing';
import { visualDiff } from '@web/test-runner-visual-regression';

import './oscd-shell.js';

import type { OscdFilledIconButton } from '@omicronenergy/oscd-ui/iconbutton/oscd-filled-icon-button.js';

import { newOpenEvent } from '@openscd/oscd-api/utils.js';

import { allLocales } from './locales.js';
import type { OscdShell } from './oscd-shell.js';
import {
  registerPlugin,
  sampleMenuPlugins,
  waitForAllPluginsToInstantiate,
} from './utils/testing/plugin-helpers.js';
import { TestMenuPlugin1 } from './utils/testing/test-plugins.js';
import { PluginsMenu } from './menus/plugins-menu.js';

const factor = (
  window as Window & {
    process?: { env?: { CI?: string } };
  }
).process?.env?.CI
  ? 4
  : 2;

function timeout(ms: number) {
  return new Promise(res => {
    setTimeout(res, ms * factor);
  });
}

function isMenuFullyOpen(shell: OscdShell) {
  const rect = shell.pluginsMenu?.menu?.shadowRoot
    ?.querySelector('.menu')
    ?.getBoundingClientRect();
  return rect && rect.width >= 350;
}

mocha.timeout(2000 * factor);

const doc = new DOMParser().parseFromString(
  `<testdoc></testdoc>`,
  'application/xml',
);

let oscdShell: OscdShell;

beforeEach(async () => {
  oscdShell = await fixture<OscdShell>(`<oscd-shell></oscd-shell>`);
  registerPlugin(oscdShell, 'test-menu-plugin1', TestMenuPlugin1);
  await oscdShell.updateComplete;
});

afterEach(() => {
  oscdShell.remove();
});

it(`changes locales on attribute change`, async () => {
  oscdShell.setAttribute('locale', 'invalid');
  await oscdShell.updateComplete;

  expect(oscdShell).to.have.property('locale', 'en');

  oscdShell.setAttribute('locale', 'de');
  await oscdShell.updateComplete;

  await timeout(180);
  await oscdShell.updateComplete;
  expect(oscdShell).to.have.property('locale', 'de');
});

allLocales.forEach(lang =>
  describe(`translated to ${lang}`, () => {
    beforeEach(async () => {
      oscdShell.setAttribute('locale', lang);
      await oscdShell.updateComplete;
      registerPlugin(oscdShell, 'test-menu-plugin1', TestMenuPlugin1);
      await waitUntil(
        () => oscdShell.locale === lang,
        `setting locale to ${lang} failed`,
      );
    });

    describe('No document loaded', () => {
      it(`displays the landing page`, async () => {
        oscdShell.plugins = { menu: sampleMenuPlugins };
        await waitForAllPluginsToInstantiate(oscdShell);
        await timeout(20);
        await visualDiff(oscdShell, `landing-page-${lang}`);
      });
    });

    describe('With a document loaded', () => {
      let pluginsMenu!: PluginsMenu;
      let pluginsMenuButton!: OscdFilledIconButton;

      async function openMenuDrawer() {
        pluginsMenuButton.click();
        await oscdShell.pluginsMenu?.updateComplete;
        await waitUntil(
          () => isMenuFullyOpen(oscdShell),
          'menu did not appear',
          {
            timeout: 2000,
          },
        );
        await timeout(200);
      }

      beforeEach(async () => {
        oscdShell.dispatchEvent(newOpenEvent(doc, 'test.scd'));
        await oscdShell.updateComplete;
        await timeout(20);
        pluginsMenu = oscdShell.pluginsMenu;
        pluginsMenuButton = pluginsMenu.shadowRoot?.querySelector(
          '#menu-button',
        ) as OscdFilledIconButton;
        expect(pluginsMenuButton, 'plugins-menu:menu-button not found').to
          .exist;
      });

      it(`displays a top app bar`, async () => {
        await oscdShell.updateComplete;
        await timeout(20);
        await visualDiff(oscdShell, `app-bar-${lang}`);
      });

      it(`displays a menu on button click`, async () => {
        await oscdShell.updateComplete;
        await openMenuDrawer();
        await visualDiff(oscdShell, `menu-drawer-${lang}`);
      });

      it(`displays a current document title`, async () => {
        await visualDiff(oscdShell, `document-name-${lang}`);
      });

      describe('with menu plugins loaded', () => {
        beforeEach(async () => {
          oscdShell.plugins = {
            editor: [],
            menu: [
              {
                name: 'Test Menu Plugin',
                translations: { de: 'Test Menü Erweiterung' },
                src: 'data:text/javascript;charset=utf-8,export%20default%20class%20TestPlugin%20extends%20HTMLElement%20%7B%0D%0A%20%20async%20run%28%29%20%7B%0D%0A%20%20%20%20return%20false%3B%0D%0A%20%20%7D%0D%0A%7D',
                icon: 'android',
                requireDoc: true,
              },
              {
                name: 'Test Menu Plugin 2',
                src: 'data:text/javascript;charset=utf-8,export%20default%20class%20TestPlugin%20extends%20HTMLElement%20%7B%0D%0A%20%20async%20run%28%29%20%7B%0D%0A%20%20%20%20this.dispatchEvent%28new%20CustomEvent%28%27oscd-open%27%2C%20%7Bdetail%3A%20%7BdocName%3A%20%27testDoc.scd%27%2C%20doc%3A%20window.document%7D%2C%20bubbles%3A%20true%2C%20composed%3A%20true%7D%29%29%3B%0D%0A%20%20%7D%0D%0A%7D',
                icon: 'polymer',
                requireDoc: false,
              },
              {
                name: 'Test Menu Plugin 3',
                translations: { de: 'Test Menü Erweiterung 3' },
                src: 'data:text/javascript;charset=utf-8,export%20default%20class%20BrokenTestPlugin%20extends%20HTMLElement%20%7B%0D%0A%20%20%2F%2F%20oh%20NO%21%20There%27s%20no%20run%20method%21%0D%0A%7D',
                icon: 'dry',
                requireDoc: false,
              },
            ],
          };
          await waitForAllPluginsToInstantiate(oscdShell);
        });

        it('displays menu plugins in the menu', async () => {
          await openMenuDrawer();
          await visualDiff(oscdShell, `menu-plugins-${lang}`);
        });

        it('triggers menu plugins on menu entry click', async () => {
          await openMenuDrawer();
          oscdShell.pluginsMenu
            ?.querySelector<OscdFilledIconButton>(
              'oscd-list-item:nth-of-type(2)',
            )
            ?.click();
          oscdShell.pluginsMenu
            ?.querySelector<OscdFilledIconButton>(
              'oscd-list-item:nth-of-type(3)',
            )
            ?.click();

          await oscdShell.updateComplete;
          await timeout(200);
          expect(oscdShell.docName).to.equal('test.scd');
          await oscdShell.updateComplete;
          await visualDiff(oscdShell, `menu-plugins-triggered-${lang}`);
        });
      });

      describe('with editor plugins loaded', () => {
        beforeEach(async () => {
          oscdShell.plugins = {
            menu: [],
            editor: [
              {
                name: 'Test Editor Plugin',
                translations: { de: 'Test Editor Erweiterung' },
                src: 'data:text/javascript;charset=utf-8,export%20default%20class%20TestEditorPlugin%20extends%20HTMLElement%20%7B%0D%0A%20%20constructor%20%28%29%20%7B%20super%28%29%3B%20this.innerHTML%20%3D%20%60%3Cp%3ETest%20Editor%20Plugin%3C%2Fp%3E%60%3B%20%7D%0D%0A%7D',
                icon: 'edit',
                requireDoc: true,
              },
              {
                name: 'Test Editor Plugin 2',
                src: 'data:text/javascript;charset=utf-8,export%20default%20class%20TestEditorPlugin2%20extends%20HTMLElement%20%7B%0D%0A%20%20constructor%20%28%29%20%7B%20super%28%29%3B%20this.innerHTML%20%3D%20%60%3Cp%3ETest%20Editor%20Plugin%202%3C%2Fp%3E%60%3B%20%7D%0D%0A%7D',
                icon: 'android',
                requireDoc: false,
              },
              {
                name: 'Test Editor Plugin 3',
                translations: { de: 'Test Editor Erweiterung 3' },
                src: 'data:text/javascript;charset=utf-8,export%20default%20class%20TestEditorPlugin3%20extends%20HTMLElement%20%7B%0D%0A%20%20constructor%20%28%29%20%7B%20super%28%29%3B%20this.innerHTML%20%3D%20%60%3Cp%3ETest%20Editor%20Plugin%203%3C%2Fp%3E%60%3B%20%7D%0D%0A%7D',
                icon: 'polymer',
                requireDoc: false,
              },
            ],
          };
          await waitForAllPluginsToInstantiate(oscdShell);
        });

        it('displays editor plugins', async () => {
          await visualDiff(oscdShell, `editor-plugins-${lang}`);
        });

        it('changes active editor plugin on tab click', async () => {
          const rows = oscdShell.editorPluginsPanel?.shadowRoot
            ?.querySelector('.tree-container oscd-tree.editors-tree')
            ?.shadowRoot?.querySelectorAll<HTMLElement>('[role="treeitem"]');
          (rows?.[rows.length - 1] as HTMLElement).click();

          await oscdShell.updateComplete;
          await timeout(120);
          await visualDiff(oscdShell, `editor-plugins-selected-${lang}`);
        });
      });
    });
  }),
);
