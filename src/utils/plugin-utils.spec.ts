import { expect } from '@open-wc/testing';
import {
  isPluginEntry,
  isSourcedPlugin,
  validatePlugin,
  filterBySearchTerm,
  filterByPinned,
} from './plugin-utils.js';
import { PluginEntry, PluginGroup } from '../oscd-shell.js';

describe('Plugin Utils', () => {
  describe('isPlugin', () => {
    it('should return true for a valid Plugin object', () => {
      const plugin = {
        tagName: 'test-plugin',
        name: 'Test Plugin',
        icon: 'test-icon',
        requireDoc: false,
      };
      expect(plugin).satisfies(isPluginEntry);
    });

    it('should return false for an object without tagName', () => {
      const plugin = {
        name: 'Test Plugin',
        icon: 'test-icon',
        requireDoc: false,
      };
      expect(plugin).to.not.satisfy(isPluginEntry);
    });

    it('should return false for a SourcePlugin', () => {
      const plugin = {
        name: 'Test Plugin',
        icon: 'test-icon',
        src: 'data:text/javascript;charset=utf-8,import%20%7B%20default%20as%20TestPlugin%20%7D%20from%20"./test-plugin.js";',
      };
      expect(plugin).to.not.satisfy(isPluginEntry);
    });
  });

  describe('isSourcePlugin', () => {
    it('should return true for a valid SourcePlugin object', () => {
      const plugin = {
        name: 'Test Plugin',
        src: 'data:text/javascript;charset=utf-8,import%20%7B%20default%20as%20TestPlugin%20%7D%20from%20"./test-plugin.js";',
        icon: 'test-icon',
      };
      expect(plugin).satisfies(isSourcedPlugin);
    });

    it('should return false for an object without a src field', () => {
      const plugin = {
        name: 'Test Plugin',
        icon: 'test-icon',
      };
      expect(plugin).not.to.satisfy(isSourcedPlugin);
    });

    it('should return false for an Plugin object (has tagName, but no src)', () => {
      const plugin = {
        name: 'Test Plugin',
        icon: 'test-icon',
        tagName: 'test-plugin',
      };
      expect(plugin).not.to.satisfy(isSourcedPlugin);
    });
  });
});

describe('validatePlugin', () => {
  it('returns a Plugin object, for a valid plugin', async () => {
    const plugin = {
      name: 'Tagless, Sourceless, Hopeless Plugin',
      icon: 'coronavirus',
      tagName: 'test-tagless-plugin',
    };

    expect(plugin).satisfies(validatePlugin);
  });

  it('returns undefined, for a plugin definition missing its "tagName" field', async () => {
    const plugin = {
      icon: 'coronavirus',
      name: 'Tagless, Sourceless, Hopeless Plugin',
    };

    expect(plugin).not.to.satisfy(validatePlugin);
  });

  it('returns undefined, for a plugin definition missing its "name" field', async () => {
    const plugin = {
      icon: 'coronavirus',
      tagName: 'test-tagless-plugin',
    };

    expect(plugin).not.to.satisfy(validatePlugin);
  });

  it('returns undefined, for a plugin definition missing its "icon" field', async () => {
    const plugin = {
      name: 'Tagless, Sourceless, Hopeless Plugin',
      tagName: 'test-tagless-plugin',
    };

    expect(plugin).not.to.satisfy(validatePlugin);
  });

  it('returns undefined, for a plugin definition with invalid requireDoc field', async () => {
    const plugin = {
      name: 'Tagless, Sourceless, Hopeless Plugin',
      tagName: 'test-tagless-plugin',
      requireDoc: 'not-a-boolean',
    };

    expect(plugin).not.to.satisfy(validatePlugin);
  });

  it('returns undefined, for a plugin definition with invalid translations field', async () => {
    const plugin = {
      name: 'Tagless, Sourceless, Hopeless Plugin',
      tagName: 'test-tagless-plugin',
      translations: 'ops',
    };

    expect(plugin).not.to.satisfy(validatePlugin);
  });

  it('returns undefined, for a plugin definition with invalid translations', async () => {
    const plugin = {
      name: 'Tagless, Sourceless, Hopeless Plugin',
      tagName: 'test-tagless-plugin',
      translations: {
        en: 'Tagless, Sourceless, Hopeless Plugin',
        fr: 123, // Invalid translation (not a string)
      },
    };

    expect(plugin).not.to.satisfy(validatePlugin);
  });
});

describe('filterBySearchTerm', () => {
  const leaf = (name: string, tagName: string): PluginEntry => ({
    name,
    tagName,
    icon: 'margin',
  });
  const group = (name: string, plugins: PluginEntry[]): PluginGroup => ({
    name,
    icon: 'folder',
    plugins,
  });

  const editors: (PluginEntry | PluginGroup)[] = [
    leaf('Substation Editor', 'oscd-substation'),
    leaf('Single Line Diagram', 'oscd-sld'),
    group('Communication', [
      leaf('GOOSE Editor', 'oscd-goose'),
      leaf('Sampled Values', 'oscd-smv'),
    ]),
  ];

  it('returns the plugins unchanged for an empty term', () => {
    expect(filterBySearchTerm(editors, '')).to.equal(editors);
  });

  it('returns the plugins unchanged for a whitespace-only term', () => {
    expect(filterBySearchTerm(editors, '   ')).to.equal(editors);
  });

  it('matches leaf plugin names case-insensitively', () => {
    const result = filterBySearchTerm(editors, 'EDITOR');
    const names = result.flatMap(item =>
      'plugins' in item ? item.plugins.map(p => p.name) : [item.name],
    );
    expect(names).to.have.members(['Substation Editor', 'GOOSE Editor']);
  });

  it('matches anywhere within a plugin name, not just the start', () => {
    const result = filterBySearchTerm(editors, 'line');
    expect(result).to.have.lengthOf(1);
    expect((result[0] as PluginEntry).name).to.equal('Single Line Diagram');
  });

  it('preserves group structure and keeps only matching children', () => {
    const result = filterBySearchTerm(editors, 'goose');
    expect(result).to.have.lengthOf(1);
    const communication = result[0] as PluginGroup;
    expect(communication.name).to.equal('Communication');
    expect(communication.plugins.map(p => p.name)).to.deep.equal([
      'GOOSE Editor',
    ]);
  });

  it('drops groups whose children do not match', () => {
    const result = filterBySearchTerm(editors, 'substation');
    expect(
      result.some(item => 'plugins' in item && item.name === 'Communication'),
    ).to.be.false;
  });

  it('does not match against group names', () => {
    expect(filterBySearchTerm(editors, 'Communication')).to.be.empty;
  });

  it('matches the localized label when a locale is given', () => {
    const localized: (PluginEntry | PluginGroup)[] = [
      {
        ...leaf('Substation Editor', 'oscd-substation'),
        translations: { de: 'Unterstation' },
      },
      leaf('Single Line Diagram', 'oscd-sld'),
    ];
    const result = filterBySearchTerm(localized, 'unterstation', 'de');
    expect(result).to.have.lengthOf(1);
    expect((result[0] as PluginEntry).tagName).to.equal('oscd-substation');
  });

  it('does not match the localized label when no locale is given', () => {
    const localized: (PluginEntry | PluginGroup)[] = [
      {
        ...leaf('Substation Editor', 'oscd-substation'),
        translations: { de: 'Unterstation' },
      },
    ];
    expect(filterBySearchTerm(localized, 'unterstation')).to.be.empty;
  });
});

describe('filterByPinned', () => {
  const leaf = (name: string, tagName: string): PluginEntry => ({
    name,
    tagName,
    icon: 'margin',
  });
  const editors: (PluginEntry | PluginGroup)[] = [
    leaf('Substation Editor', 'oscd-substation'),
    {
      name: 'Communication',
      icon: 'folder',
      plugins: [
        leaf('GOOSE Editor', 'oscd-goose'),
        leaf('Sampled Values', 'oscd-smv'),
      ],
    },
  ];

  it('returns flattened leaf entries whose tagName is pinned', () => {
    const result = filterByPinned(editors, ['oscd-substation', 'oscd-smv']);
    expect(result.map(p => p.tagName)).to.deep.equal([
      'oscd-substation',
      'oscd-smv',
    ]);
  });

  it('finds pinned plugins nested within groups', () => {
    const result = filterByPinned(editors, ['oscd-goose']);
    expect(result).to.have.lengthOf(1);
    expect(result[0].name).to.equal('GOOSE Editor');
  });

  it('returns an empty array when nothing is pinned', () => {
    expect(filterByPinned(editors, [])).to.be.empty;
  });

  it('ignores pinned ids that do not match any plugin', () => {
    expect(filterByPinned(editors, ['does-not-exist'])).to.be.empty;
  });
});
