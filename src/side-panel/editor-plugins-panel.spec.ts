import { expect, fixture, html } from '@open-wc/testing';
import type { OscdShell } from '../oscd-shell.js';
import '../oscd-shell.js';
import { EditorPluginsPanel } from './editor-plugins-panel.js';
import type { PluginEntry } from '../oscd-shell.js';
import { createTestDocs } from '../utils/testing/test-doc-helpers.js';
import { OscdFilledIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdFilledIconButton.js';
import { sampleEditorPlugins } from '../utils/testing/plugin-helpers.js';
import { TestMenuPlugin1 } from '../utils/testing/test-plugins.js';

const findPanelToggleButton = (pluginsMenu: EditorPluginsPanel) => {
  const toggleButton = pluginsMenu.shadowRoot?.querySelector(
    'oscd-icon-button.toggle-button',
  ) as OscdFilledIconButton;
  expect(toggleButton).to.exist;
  return toggleButton;
};

const isPanelExpanded = (pluginsMenu: EditorPluginsPanel) => {
  return pluginsMenu.hasAttribute('expanded') && pluginsMenu.expanded;
};

describe('editor-plugins-panel', () => {
  let oscdShell: OscdShell;
  let editorPluginsPanel: EditorPluginsPanel;
  let docs: Record<string, XMLDocument>;
  const extraShells: OscdShell[] = [];

  const LS_KEYS = {
    expanded: 'editor-plugins-panel:expanded',
    expandedIds: 'editor-plugins-panel:expandedIds',
    pinnedPluginIds: 'editor-plugins-panel:pinnedPluginIds',
    pinnedExpanded: 'editor-plugins-panel:pinnedExpanded',
  };

  // Mounts a brand-new shell + panel, simulating a page reload. Any pre-seeded
  // localStorage is therefore read by a freshly constructed panel.
  const mountFreshPanel = async (): Promise<EditorPluginsPanel> => {
    const shell = <OscdShell>(
      await fixture(
        html`<oscd-shell
          .docs=${docs}
          docName=${Object.keys(docs)[0]}
        ></oscd-shell>`,
      )
    );
    shell.plugins = { editor: sampleEditorPlugins };
    const panel = shell.shadowRoot!.querySelector('editor-plugins-panel')!;
    await shell.updateComplete;
    await panel.updateComplete;
    extraShells.push(shell);
    return panel;
  };

  beforeEach(async () => {
    docs = createTestDocs(1);
    oscdShell = <OscdShell>(
      await fixture(
        html`<oscd-shell
          .docs=${docs}
          docName=${Object.keys(docs)[0]}
        ></oscd-shell>`,
      )
    );
    if (!oscdShell.registry?.get('test-menu-plugin1')) {
      oscdShell.registry?.define('test-menu-plugin1', TestMenuPlugin1);
    }
    oscdShell.plugins = {
      editor: sampleEditorPlugins,
    };
    editorPluginsPanel = oscdShell.shadowRoot!.querySelector(
      'editor-plugins-panel',
    )!;
    await oscdShell.updateComplete;
    await editorPluginsPanel.updateComplete;
  });

  afterEach(() => {
    oscdShell.remove();
    while (extraShells.length) {
      extraShells.pop()!.remove();
    }
    Object.values(LS_KEYS).forEach(key => localStorage.removeItem(key));
  });

  it('collapses on toggle button click when already expanded ', async () => {
    const toggleButton = findPanelToggleButton(editorPluginsPanel);
    expect(isPanelExpanded(editorPluginsPanel)).to.be.true;
    toggleButton.click();
    await editorPluginsPanel.updateComplete;
    expect(isPanelExpanded(editorPluginsPanel)).to.be.false;
  });

  it('expands on toggle button click when already collapsed', async () => {
    const toggleButton = findPanelToggleButton(editorPluginsPanel);
    expect(isPanelExpanded(editorPluginsPanel)).to.be.true;
    toggleButton.click();
    await editorPluginsPanel.updateComplete;
    expect(isPanelExpanded(editorPluginsPanel)).to.be.false;
    toggleButton.click();
    await editorPluginsPanel.updateComplete;
    expect(isPanelExpanded(editorPluginsPanel)).to.be.true;
  });

  it('initially appears expanded if no value found in localStorage', async () => {
    expect(isPanelExpanded(editorPluginsPanel)).to.be.true;
  });

  it('uses value stored in localstorage initially', async () => {
    localStorage.setItem(LS_KEYS.expanded, JSON.stringify(false));
    const editorPluginsPanel2 = await mountFreshPanel();
    expect(isPanelExpanded(editorPluginsPanel2)).to.be.false;
  });

  it('saves expanded/collapsed state (when toggled) in localStorage', async () => {
    const toggleButton = findPanelToggleButton(editorPluginsPanel);
    expect(isPanelExpanded(editorPluginsPanel)).to.be.true;

    toggleButton.click();
    await editorPluginsPanel.updateComplete;
    expect(isPanelExpanded(editorPluginsPanel)).to.be.false;
    expect(localStorage.getItem(LS_KEYS.expanded)).to.equal(
      JSON.stringify(false),
    );

    toggleButton.click();
    await editorPluginsPanel.updateComplete;
    expect(isPanelExpanded(editorPluginsPanel)).to.be.true;
    expect(localStorage.getItem(LS_KEYS.expanded)).to.equal(
      JSON.stringify(true),
    );
  });

  describe('restores persisted state on reload (fresh mount)', () => {
    it('hydrates expandedIds from localStorage and does not clobber it', async () => {
      const seeded = ['group:0:Communication', 'group:1:Advanced'];
      localStorage.setItem(LS_KEYS.expandedIds, JSON.stringify(seeded));

      const panel = await mountFreshPanel();

      expect(panel.expandedIds).to.deep.equal(seeded);
      expect(localStorage.getItem(LS_KEYS.expandedIds)).to.equal(
        JSON.stringify(seeded),
      );
    });

    it('hydrates pinnedPluginIds from localStorage and does not clobber it', async () => {
      const seeded = ['oscd-example-editor', 'oscd-other-editor'];
      localStorage.setItem(LS_KEYS.pinnedPluginIds, JSON.stringify(seeded));

      const panel = await mountFreshPanel();

      expect(panel.pinnedPluginIds).to.deep.equal(seeded);
      expect(localStorage.getItem(LS_KEYS.pinnedPluginIds)).to.equal(
        JSON.stringify(seeded),
      );
    });

    it('hydrates pinnedExpanded from localStorage and does not clobber it', async () => {
      const seeded = ['pinned'];
      localStorage.setItem(LS_KEYS.pinnedExpanded, JSON.stringify(seeded));

      const panel = await mountFreshPanel();

      expect(panel.pinnedExpanded).to.deep.equal(seeded);
      expect(localStorage.getItem(LS_KEYS.pinnedExpanded)).to.equal(
        JSON.stringify(seeded),
      );
    });

    it('hydrates expanded (collapsed) state from localStorage and does not clobber it', async () => {
      localStorage.setItem(LS_KEYS.expanded, JSON.stringify(false));

      const panel = await mountFreshPanel();

      expect(panel.expanded).to.be.false;
      expect(localStorage.getItem(LS_KEYS.expanded)).to.equal(
        JSON.stringify(false),
      );
    });
  });

  const setSearch = async (value: string) => {
    const field = editorPluginsPanel.shadowRoot!.querySelector(
      'oscd-outlined-text-field',
    ) as unknown as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    await editorPluginsPanel.updateComplete;
  };

  it('filters editors by their (source) name when searching', async () => {
    await setSearch('Plugin 2');
    expect(editorPluginsPanel.editorTreeNodes).to.have.lengthOf(1);
    expect(editorPluginsPanel.editorTreeNodes[0].name).to.equal(
      'Test Editor Plugin 2',
    );
  });

  it('filters editors by their localized label when a locale is set', async () => {
    editorPluginsPanel.locale = 'de';
    await editorPluginsPanel.updateComplete;
    await setSearch('Erweiterung');
    // Both sample editors share the German label "…Erweiterung" only on the
    // first entry; searching the German term must still match it.
    const names = editorPluginsPanel.editorTreeNodes.map(n => n.name);
    expect(names).to.include('Test Editor Plugin');
  });

  it('pins and unpins an editor, persisting the ids to localStorage', async () => {
    const tagName = (oscdShell.plugins.editor[0] as PluginEntry).tagName;

    editorPluginsPanel.togglePin(tagName);
    await editorPluginsPanel.updateComplete;
    expect(editorPluginsPanel.pinnedPluginIds).to.include(tagName);
    expect(
      localStorage.getItem('editor-plugins-panel:pinnedPluginIds'),
    ).to.contain(tagName);

    editorPluginsPanel.togglePin(tagName);
    await editorPluginsPanel.updateComplete;
    expect(editorPluginsPanel.pinnedPluginIds).to.not.include(tagName);
  });

  it('ignores an editor selection with no id', async () => {
    let dispatched = false;
    editorPluginsPanel.addEventListener('editor-select', () => {
      dispatched = true;
    });
    editorPluginsPanel.selectEditor([]);
    expect(dispatched).to.be.false;
  });
});
