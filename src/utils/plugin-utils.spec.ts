import { expect } from '@open-wc/testing';
import {
  isPluginEntry,
  isSourcedPlugin,
  validatePlugin,
} from './plugin-utils.js';

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
