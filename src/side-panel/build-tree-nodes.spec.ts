import { expect } from '@open-wc/testing';
import { buildTreeNodes } from './editor-plugins-panel.js';
import { PluginEntry, PluginGroup } from '../oscd-shell.js';

const leaf = (name: string, tagName: string): PluginEntry => ({
  name,
  tagName,
  icon: 'margin',
});

describe('buildTreeNodes', () => {
  it('converts a leaf plugin into a node with id set to its tagName', () => {
    const [node] = buildTreeNodes([
      leaf('Substation Editor', 'oscd-substation'),
    ]);
    expect(node.id).to.equal('oscd-substation');
    expect(node.name).to.equal('Substation Editor');
    expect(node.children).to.deep.equal([]);
  });

  it('converts a group into a node with a unique positional id and built children', () => {
    const group: PluginGroup = {
      name: 'Communication',
      icon: 'folder',
      plugins: [leaf('GOOSE Editor', 'oscd-goose')],
    };
    const [node] = buildTreeNodes([group]);
    expect(node.id).to.equal('group:0:Communication');
    expect(node.children).to.have.lengthOf(1);
    expect(node.children?.[0].id).to.equal('oscd-goose');
  });

  it('gives same-named groups distinct ids by position', () => {
    const group = (name: string): PluginGroup => ({
      name,
      icon: 'folder',
      plugins: [],
    });
    const nodes = buildTreeNodes([group('Files'), group('Files')]);
    expect(nodes.map(n => n.id)).to.deep.equal([
      'group:0:Files',
      'group:1:Files',
    ]);
  });

  it('builds leaf nodes from a flat list (as used for pinned plugins)', () => {
    // Regression: pinned plugins are flattened entries; each must gain an id so
    // the pinned tree can render and match them.
    const nodes = buildTreeNodes([
      leaf('GOOSE Editor', 'oscd-goose'),
      leaf('Sampled Values', 'oscd-smv'),
    ]);
    expect(nodes.map(n => n.id)).to.deep.equal(['oscd-goose', 'oscd-smv']);
  });
});
