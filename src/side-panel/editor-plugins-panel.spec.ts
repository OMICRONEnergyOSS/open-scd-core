import { expect, fixture, html } from '@open-wc/testing';
import type { OscdShell } from '../oscd-shell.js';
import '../oscd-shell.js';
import { EditorPluginsPanel } from './editor-plugins-panel.js';
import type { PluginEntry, PluginGroup } from '../oscd-shell.js';
import { createTestDocs } from '../utils/testing/test-doc-helpers.js';
import { sampleEditorPlugins } from '../utils/testing/plugin-helpers.js';
import { TestMenuPlugin1 } from '../utils/testing/test-plugins.js';
import type { OscdMenu } from '@omicronenergy/oscd-ui/menu/OscdMenu.js';
import { OscdOutlinedTextField } from '@omicronenergy/oscd-ui/textfield/OscdOutlinedTextField.js';
import sinon from 'sinon';

// A grouped editor fixture, used to exercise the collapsed rail's group
// flyout (rendered only when `editors` contains a `PluginGroup`).
const groupedEditorPlugins: (PluginEntry | PluginGroup)[] = [
  {
    name: 'Grouped Editors',
    icon: 'folder',
    plugins: [
      {
        name: 'Grouped Editor 1',
        tagName: 'test-grouped-editor-1',
        icon: 'coronavirus',
      },
      {
        name: 'Grouped Editor 2',
        tagName: 'test-grouped-editor-2',
        icon: 'coronavirus',
      },
    ],
  },
];

const findPanelToggleButton = (pluginsMenu: EditorPluginsPanel) => {
  const toggleButton = pluginsMenu.shadowRoot?.querySelector(
    '.toggle-button',
  ) as HTMLElement;
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
    findPanelToggleButton(editorPluginsPanel).click();
    await editorPluginsPanel.updateComplete;
    expect(isPanelExpanded(editorPluginsPanel)).to.be.false;
    // The control is a different element in the collapsed rail, so re-query it.
    findPanelToggleButton(editorPluginsPanel).click();
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
    expect(isPanelExpanded(editorPluginsPanel)).to.be.true;

    findPanelToggleButton(editorPluginsPanel).click();
    await editorPluginsPanel.updateComplete;
    expect(isPanelExpanded(editorPluginsPanel)).to.be.false;
    expect(localStorage.getItem(LS_KEYS.expanded)).to.equal(
      JSON.stringify(false),
    );

    // Re-query: the collapsed rail renders a different toggle element.
    findPanelToggleButton(editorPluginsPanel).click();
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

  it('reflects the selected editor into the pinned tree selectedIds', async () => {
    const editor = oscdShell.plugins.editor[0] as PluginEntry;

    editorPluginsPanel.togglePin(editor.tagName);
    editorPluginsPanel.selectedEditor = editor;
    await editorPluginsPanel.updateComplete;

    const pinnedTree = editorPluginsPanel.shadowRoot!.querySelector(
      '.tree-container oscd-tree:not(.editors-tree)',
    ) as unknown as { selectedIds: string[] };
    expect(pinnedTree.selectedIds).to.deep.equal([editor.tagName]);
  });

  it('selects an editor chosen from the pinned tree', async () => {
    const editor = oscdShell.plugins.editor[0] as PluginEntry;
    editorPluginsPanel.togglePin(editor.tagName);
    await editorPluginsPanel.updateComplete;

    let selected: PluginEntry | undefined;
    editorPluginsPanel.addEventListener('editor-select', (event: Event) => {
      selected = (event as CustomEvent).detail.editor;
    });

    const pinnedTree = editorPluginsPanel.shadowRoot!.querySelector(
      '.tree-container oscd-tree:not(.editors-tree)',
    )!;
    pinnedTree.dispatchEvent(
      new CustomEvent('selected-ids-changed', {
        detail: { selectedIds: [editor.tagName] },
      }),
    );
    await editorPluginsPanel.updateComplete;

    expect(selected?.tagName).to.equal(editor.tagName);
  });

  it('ignores an editor selection with no id', async () => {
    let dispatched = false;
    editorPluginsPanel.addEventListener('editor-select', () => {
      dispatched = true;
    });
    editorPluginsPanel.selectEditor([]);
    expect(dispatched).to.be.false;
  });

  describe('transient search mode (collapsed rail)', () => {
    const collapse = async (panel: EditorPluginsPanel) => {
      findPanelToggleButton(panel).click();
      await panel.updateComplete;
      expect(isPanelExpanded(panel)).to.be.false;
    };

    const findRailSearchButton = (panel: EditorPluginsPanel) =>
      panel.shadowRoot!.querySelector(
        '.rail oscd-icon-button.rail-item',
      ) as HTMLElement;

    it('opens the panel without persisting `expanded` when the rail search icon is clicked', async () => {
      await collapse(editorPluginsPanel);
      expect(localStorage.getItem('editor-plugins-panel:expanded')).to.equal(
        JSON.stringify(false),
      );

      findRailSearchButton(editorPluginsPanel).click();
      await editorPluginsPanel.updateComplete;

      expect(editorPluginsPanel.hasAttribute('search-mode')).to.be.true;
      expect(editorPluginsPanel.shadowRoot!.querySelector('.tree-container')).to
        .exist;
      // Still collapsed as far as persisted state is concerned.
      expect(editorPluginsPanel.expanded).to.be.false;
      expect(localStorage.getItem('editor-plugins-panel:expanded')).to.equal(
        JSON.stringify(false),
      );
    });

    it('focuses the search field on entering search mode', async () => {
      await collapse(editorPluginsPanel);
      const focusSpy = sinon.spy(OscdOutlinedTextField.prototype, 'focus');

      findRailSearchButton(editorPluginsPanel).click();
      await editorPluginsPanel.updateComplete;
      // The focus() call is chained off `updateComplete.then(...)`; await it
      // again so that microtask has a chance to run.
      await editorPluginsPanel.updateComplete;

      expect(focusSpy.called).to.be.true;
      focusSpy.restore();
    });

    it('exits search mode (and clears the query) on Escape', async () => {
      await collapse(editorPluginsPanel);
      findRailSearchButton(editorPluginsPanel).click();
      await editorPluginsPanel.updateComplete;
      await setSearch('Plugin 2');
      expect(editorPluginsPanel.searchValue).to.equal('Plugin 2');

      editorPluginsPanel.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
      await editorPluginsPanel.updateComplete;

      expect(editorPluginsPanel.hasAttribute('search-mode')).to.be.false;
      expect(editorPluginsPanel.searchValue).to.equal('');
    });

    it('ignores Escape when not in search mode', async () => {
      await collapse(editorPluginsPanel);
      editorPluginsPanel.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
      await editorPluginsPanel.updateComplete;
      expect(isPanelExpanded(editorPluginsPanel)).to.be.false;
    });

    it('exits search mode on selecting an editor, without persisting expanded', async () => {
      await collapse(editorPluginsPanel);
      findRailSearchButton(editorPluginsPanel).click();
      await editorPluginsPanel.updateComplete;

      let selected: PluginEntry | undefined;
      editorPluginsPanel.addEventListener('editor-select', (event: Event) => {
        selected = (event as CustomEvent).detail.editor;
      });
      const tagName = (oscdShell.plugins.editor[0] as PluginEntry).tagName;
      editorPluginsPanel.selectEditor([tagName]);
      await editorPluginsPanel.updateComplete;

      expect(selected?.tagName).to.equal(tagName);
      expect(editorPluginsPanel.hasAttribute('search-mode')).to.be.false;
      expect(editorPluginsPanel.expanded).to.be.false;
    });
  });

  describe('pinned/editors tree expand-state persistence', () => {
    it('persists the pinned tree expanded ids on `expanded-ids-changed`', async () => {
      const tagName = (oscdShell.plugins.editor[0] as PluginEntry).tagName;
      editorPluginsPanel.togglePin(tagName);
      await editorPluginsPanel.updateComplete;

      const pinnedTree = editorPluginsPanel.shadowRoot!.querySelector(
        '.tree-container oscd-tree:not(.editors-tree)',
      )!;
      pinnedTree.dispatchEvent(
        new CustomEvent('expanded-ids-changed', {
          detail: { expandedIds: ['pinned'] },
        }),
      );
      await editorPluginsPanel.updateComplete;

      expect(editorPluginsPanel.pinnedExpanded).to.deep.equal(['pinned']);
    });

    it('persists the editors tree expanded ids on `expanded-ids-changed`', async () => {
      const editorsTree = editorPluginsPanel.shadowRoot!.querySelector(
        '.tree-container oscd-tree.editors-tree',
      )!;
      editorsTree.dispatchEvent(
        new CustomEvent('expanded-ids-changed', {
          detail: { expandedIds: ['group:0:Communication'] },
        }),
      );
      await editorPluginsPanel.updateComplete;

      expect(editorPluginsPanel.expandedIds).to.deep.equal([
        'group:0:Communication',
      ]);
    });
  });

  describe('collapsed rail group flyout', () => {
    let groupedShell: OscdShell;
    let groupedPanel: EditorPluginsPanel;

    beforeEach(async () => {
      groupedShell = <OscdShell>(
        await fixture(
          html`<oscd-shell
            .docs=${docs}
            docName=${Object.keys(docs)[0]}
          ></oscd-shell>`,
        )
      );
      groupedShell.plugins = { editor: groupedEditorPlugins };
      groupedPanel = groupedShell.shadowRoot!.querySelector(
        'editor-plugins-panel',
      )!;
      await groupedShell.updateComplete;
      await groupedPanel.updateComplete;
      // Start from the collapsed rail, where the group flyout lives.
      findPanelToggleButton(groupedPanel).click();
      await groupedPanel.updateComplete;
      extraShells.push(groupedShell);
    });

    const findGroupRailButton = () =>
      groupedPanel.shadowRoot!.querySelector('#rail-group-0') as HTMLElement;

    const findGroupFlyoutMenu = () =>
      groupedPanel.shadowRoot!.querySelector(
        'oscd-menu.rail-flyout[data-flyout="group-0"]',
      ) as OscdMenu;

    it('opens the group flyout menu on rail icon click', async () => {
      const menu = findGroupFlyoutMenu();
      expect(menu.open).to.be.false;

      findGroupRailButton().click();
      await groupedPanel.updateComplete;

      expect(menu.open).to.be.true;
    });

    it('closes the group flyout menu on a second rail icon click', async () => {
      findGroupRailButton().click();
      await groupedPanel.updateComplete;
      expect(findGroupFlyoutMenu().open).to.be.true;

      findGroupRailButton().click();
      await groupedPanel.updateComplete;

      expect(findGroupFlyoutMenu().open).to.be.false;
    });

    it('does nothing when toggling a flyout with no matching anchor', () => {
      expect(() =>
        // @ts-expect-error toggleFlyout is private; exercised directly to
        // cover the defensive "no matching anchor" guard.
        groupedPanel.toggleFlyout('unknown-group'),
      ).to.not.throw();
    });

    it('dispatches editor-select when a flyout item is clicked', async () => {
      findGroupRailButton().click();
      await groupedPanel.updateComplete;

      let selected: PluginEntry | undefined;
      groupedPanel.addEventListener('editor-select', (event: Event) => {
        selected = (event as CustomEvent).detail.editor;
      });

      const flyoutItem = findGroupFlyoutMenu().querySelector('oscd-menu-item');
      flyoutItem!.dispatchEvent(new Event('click', { bubbles: true }));
      await groupedPanel.updateComplete;

      expect(selected?.tagName).to.equal('test-grouped-editor-1');
    });

    it('marks the rail group icon active when one of its plugins is selected', async () => {
      groupedPanel.selectedEditor = {
        name: 'Grouped Editor 1',
        tagName: 'test-grouped-editor-1',
        icon: 'coronavirus',
      };
      await groupedPanel.updateComplete;

      expect(findGroupRailButton().classList.contains('active')).to.be.true;
    });
  });
});
