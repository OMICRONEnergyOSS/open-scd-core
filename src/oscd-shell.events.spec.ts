import { expect, fixture, waitUntil } from '@open-wc/testing';

import { html } from 'lit';

import './oscd-shell.js';

import type { OscdShell } from './oscd-shell.js';
import type { EditorPluginsPanel } from './side-panel/editor-plugins-panel.js';
import sinon from 'sinon';

import {
  createNonSclDocument,
  createSclDocument,
  openDocOnShell,
} from './utils/testing/test-doc-helpers.js';
import { newEditEventV2, newOpenEvent } from '@openscd/oscd-api/utils.js';
import { simulateKeypressOnElement } from '@omicronenergy/oscd-test-utils';

export function newRenameEvent(oldName: string, newName: string) {
  return new CustomEvent('oscd-rename', {
    bubbles: true,
    composed: true,
    detail: { oldName, newName },
  });
}

describe('OscdShell Event Handling', () => {
  const sclDocName = 'testdoc.scd';
  let oscdShell: OscdShell;
  let sclDoc: XMLDocument;

  beforeEach(async () => {
    sclDoc = createSclDocument();
    oscdShell = await fixture(html`<oscd-shell></oscd-shell>`);
    openDocOnShell(oscdShell, sclDocName, sclDoc);
    await oscdShell.updateComplete;
  });

  afterEach(async () => {
    oscdShell.remove();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  describe('oscd-open event', () => {
    it('catches the oscd-open event for scl files and sets new file as current document', async () => {
      const fileName = 'anotherdoc.scd';
      const file = createSclDocument();
      // Sanity check
      expect(oscdShell.docs).to.not.have.property(fileName);

      const openEvent = newOpenEvent(file, fileName);
      oscdShell.dispatchEvent(openEvent);
      await oscdShell.updateComplete;
      expect(oscdShell.docName).to.equal(fileName);
      expect(oscdShell.doc).to.equal(file);
      expect(oscdShell.docs).to.have.property(fileName);
    });

    it('catches the oscd-open event for non-scl files, but does not set them as current document', async () => {
      const fileName = 'something.exe';
      const file = createNonSclDocument();
      expect(oscdShell.docs).to.not.have.property(fileName);

      const openEvent = newOpenEvent(file, fileName);
      oscdShell.dispatchEvent(openEvent);
      await oscdShell.updateComplete;
      expect(oscdShell.docName).to.not.equal(fileName);
      expect(oscdShell.doc).to.not.equal(file);
      expect(oscdShell.docs).to.have.property(fileName);
    });
  });

  describe('oscd-rename event', () => {
    it('catches the oscd-rename event and renames the appropriate file', async () => {
      // Sanity check
      expect(oscdShell.docs).to.have.property(sclDocName);

      const newName = 'renameddoc.scd';
      const renameEvent = newRenameEvent(sclDocName, newName);
      oscdShell.dispatchEvent(renameEvent);
      await oscdShell.updateComplete;

      expect(oscdShell.docName).to.equal(newName);
      expect(oscdShell.docs).to.not.have.property(sclDocName);
      expect(oscdShell.docs).to.have.property(newName);
    });

    it('does not rename the file if that name matches another opened file', async () => {
      const fileName = 'testdoc2.scd';
      const file = createSclDocument();
      expect(oscdShell.docs).to.not.have.property(fileName);
      openDocOnShell(oscdShell, fileName, file);
      await oscdShell.updateComplete;
      // Sanity check the file was opened and is the currently selected document
      expect(oscdShell.docName).to.equal(fileName);

      // Prove both files exist before renaming one with the name of the other
      expect(oscdShell.docs).to.have.property(fileName);
      expect(oscdShell.docs).to.have.property(sclDocName);
      // Let's try to rename to an existing file name
      const renameEvent = newRenameEvent(fileName, sclDocName);
      oscdShell.dispatchEvent(renameEvent);
      await oscdShell.updateComplete;

      // Test nothing has changed
      expect(oscdShell.docName).to.equal(fileName);
      expect(oscdShell.docs).to.have.property(fileName);
      expect(oscdShell.docs).to.have.property(sclDocName);
    });

    it('does not rename the file if the new name is the same as the old name', async () => {
      // Sanity check the file was opened and is the currently selected document
      expect(oscdShell.docName).to.equal(sclDocName);
      expect(oscdShell.docs).to.have.property(sclDocName);

      const renameEvent = newRenameEvent(sclDocName, sclDocName);
      oscdShell.dispatchEvent(renameEvent);
      await oscdShell.updateComplete;

      // Test nothing has changed
      expect(oscdShell.docName).to.equal(sclDocName);
      expect(oscdShell.docs).to.have.property(sclDocName);
    });

    it('does not rename the file if the old name does not exist', async () => {
      const wrongOldName = 'nonexistingname.scd';
      expect(oscdShell.docs).to.not.have.property(wrongOldName);
      expect(oscdShell.docName).to.equal(sclDocName);
      expect(oscdShell.docs).to.have.property(sclDocName);

      const newName = 'newname.scd';
      const renameEvent = newRenameEvent(wrongOldName, newName);
      oscdShell.dispatchEvent(renameEvent);
      await oscdShell.updateComplete;

      // Test nothing has changed
      expect(oscdShell.docName).to.equal(sclDocName);
      expect(oscdShell.docs).to.have.property(sclDocName);
      expect(oscdShell.docs).to.not.have.property(newName);
    });
  });

  describe('oscd-edit-v2 event', () => {
    it('catches the oscd-edit-v2 event and calls undo on the xml editor', async () => {
      //Sanity check
      expect(sclDoc.querySelector('Substation')).to.exist;

      const node = sclDoc.querySelector('Substation')!;
      // Trigger a delete of the Substation node
      oscdShell.dispatchEvent(newEditEventV2({ node }));
      await oscdShell.updateComplete;

      // Check the Substation node is gone
      expect(sclDoc.querySelector('Substation')).to.not.exist;
    });
  });

  describe('oscd-undo event', () => {
    it('catches the oscd-undo event and calls undo on the xml editor', async () => {
      //Sanity check
      expect(sclDoc.querySelector('Substation')).to.exist;

      const node = sclDoc.querySelector('Substation')!;
      // Trigger a delete of the Substation node
      oscdShell.dispatchEvent(newEditEventV2({ node }));
      await oscdShell.updateComplete;

      // Check the Substation node is gone
      expect(sclDoc.querySelector('Substation')).to.not.exist;

      oscdShell.dispatchEvent(
        new CustomEvent('oscd-undo', {
          bubbles: true,
          composed: true,
        }),
      );

      // Check the Substation node is back
      expect(sclDoc.querySelector('Substation')).to.exist;
    });
  });

  describe('oscd-redo event', () => {
    it('catches the oscd-redo event and calls redo on the xml editor', async () => {
      //Sanity check
      expect(sclDoc.querySelector('Substation')).to.exist;

      const node = sclDoc.querySelector('Substation')!;
      // Trigger a delete of the Substation node
      oscdShell.dispatchEvent(newEditEventV2({ node }));
      await oscdShell.updateComplete;

      // Check the Substation node is gone
      expect(sclDoc.querySelector('Substation')).to.not.exist;
      oscdShell.undo();
      // Check the Substation node is back
      expect(sclDoc.querySelector('Substation')).to.exist;

      oscdShell.dispatchEvent(
        new CustomEvent('oscd-redo', {
          bubbles: true,
          composed: true,
        }),
      );
      await oscdShell.updateComplete;

      // Check the Substation node is gone again
      expect(sclDoc.querySelector('Substation')).to.not.exist;
    });
  });

  describe('oscd-close event', () => {
    it('catches the oscd-close event and closes the specified document', async () => {
      // Sanity check
      expect(oscdShell.docs).to.have.property(sclDocName);
      expect(oscdShell.docName).to.equal(sclDocName);

      oscdShell.dispatchEvent(
        new CustomEvent('oscd-close', {
          bubbles: true,
          composed: true,
          detail: { docName: sclDocName },
        }),
      );
      await oscdShell.updateComplete;
      expect(oscdShell.docs).to.not.have.property(sclDocName);
      expect(oscdShell.docName).to.not.equal(sclDocName);
    });

    it('catches the oscd-close event and only closes the document if it exists', async () => {
      // Sanity check
      expect(oscdShell.docs).to.have.property(sclDocName);
      expect(oscdShell.docName).to.equal(sclDocName);

      oscdShell.dispatchEvent(
        new CustomEvent('oscd-close', {
          bubbles: true,
          composed: true,
          detail: { docName: 'nonexistingdoc.scd' },
        }),
      );
      await oscdShell.updateComplete;
      expect(oscdShell.docs).to.have.property(sclDocName);
      expect(oscdShell.docName).to.equal(sclDocName);
    });
  });

  describe('keypress events (the keyboard shortcuts)', () => {
    it('focuses the expanded editor search with Ctrl+Shift+F', async () => {
      const panel = oscdShell.shadowRoot!.querySelector(
        'editor-plugins-panel',
      ) as EditorPluginsPanel;
      panel.expanded = true;
      const focusSearch = sinon.spy(panel, 'focusSearch');

      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'f',
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );

      expect(focusSearch.calledWith(true)).to.be.true;
      expect(panel.searchMode).to.be.false;
      focusSearch.restore();
    });

    it('temporarily opens the collapsed panel with Meta+Shift+F', async () => {
      const panel = oscdShell.shadowRoot!.querySelector(
        'editor-plugins-panel',
      ) as EditorPluginsPanel;
      panel.expanded = false;
      const focusSearch = sinon.spy(panel, 'focusSearch');

      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'F',
          metaKey: true,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
      await panel.updateComplete;

      expect(panel.searchMode).to.be.true;
      expect(focusSearch.calledWith(true)).to.be.true;
      focusSearch.restore();
    });

    it('displays the menu with Ctrl+m', async () => {
      waitUntil(
        () => oscdShell.pluginsMenu !== undefined,
        'Menu UI is undefined',
      );

      expect(oscdShell.pluginsMenu).property('open').to.not.be.true;

      simulateKeypressOnElement('m', true);
      await oscdShell.updateComplete;
      expect(oscdShell.pluginsMenu).to.exist;
      const oscdMenu =
        oscdShell.pluginsMenu.shadowRoot?.querySelector('oscd-menu');
      expect(oscdMenu).to.exist;
      expect(oscdMenu).to.have.property('open').which.is.true;
    });

    it('undoes the last edit with Ctrl+z', async () => {
      const node = sclDoc.querySelector('Substation')!;
      oscdShell.dispatchEvent(newEditEventV2({ node }));
      await oscdShell.updateComplete;

      expect(sclDoc.querySelector('Substation')).to.not.exist;
      simulateKeypressOnElement('z', true);
      await oscdShell.updateComplete;
      expect(sclDoc.querySelector('Substation')).to.exist;
    });

    it('redoes the last edit with Ctrl+y', async () => {
      const node = sclDoc.querySelector('Substation')!;
      oscdShell.dispatchEvent(newEditEventV2({ node }));
      expect(sclDoc.querySelector('Substation')).to.not.exist;
      oscdShell.undo();
      await oscdShell.updateComplete;
      expect(sclDoc.querySelector('Substation')).to.exist;
      simulateKeypressOnElement('y', true);
      await oscdShell.updateComplete;
      expect(sclDoc.querySelector('Substation')).to.not.exist;
    });

    it('it redoes the last edit with Ctrl+Z', async () => {
      const node = sclDoc.querySelector('Substation')!;
      oscdShell.dispatchEvent(newEditEventV2({ node }));
      expect(sclDoc.querySelector('Substation')).to.not.exist;
      oscdShell.undo();
      await oscdShell.updateComplete;
      expect(sclDoc.querySelector('Substation')).to.exist;
      simulateKeypressOnElement('Z', true);
      await oscdShell.updateComplete;
      expect(sclDoc.querySelector('Substation')).to.not.exist;
    });

    it('does not trigger anything if the Ctrl button was not pressed', async () => {
      simulateKeypressOnElement('m', false);
      await oscdShell.updateComplete;
      expect(oscdShell.pluginsMenu).to.exist;
      const oscdMenu =
        oscdShell.pluginsMenu.shadowRoot?.querySelector('oscd-menu');
      expect(oscdMenu).to.exist;
      expect(oscdMenu).property('open').to.not.be.true;
    });

    it('does not trigger anything if the Ctrl button was pressed but the key was not one of the shortcuts', async () => {
      simulateKeypressOnElement('a', true);
      await oscdShell.updateComplete;
      expect(oscdShell.pluginsMenu).to.exist;
      const oscdMenu =
        oscdShell.pluginsMenu.shadowRoot?.querySelector('oscd-menu');
      expect(oscdMenu).to.exist;
      expect(oscdMenu).property('open').to.not.be.true;
    });

    it('does not change anything if there is nothing to Undo', async () => {
      const before = new XMLSerializer().serializeToString(sclDoc);
      simulateKeypressOnElement('Z', true);
      await oscdShell.updateComplete;
      const after = new XMLSerializer().serializeToString(sclDoc);
      expect(after).to.equal(before);
    });

    it('does not change anything if there is nothing to redo', async () => {
      const before = new XMLSerializer().serializeToString(sclDoc);
      simulateKeypressOnElement('y', true);
      await oscdShell.updateComplete;
      const after = new XMLSerializer().serializeToString(sclDoc);
      expect(after).to.equal(before);
    });
  });
});
