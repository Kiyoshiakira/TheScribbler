/**
 * @fileoverview Manages document synchronization using Yjs CRDT
 */

import * as Y from 'yjs';
import { ScriptDocument, ScriptBlock } from '@/lib/editor-types';

export class DocumentSyncService {
  private ydoc: Y.Doc;
  private yblocks: Y.Array<Y.Map<any>>;
  private updateCallbacks: ((doc: ScriptDocument) => void)[] = [];
  private isLocalUpdate = false;

  constructor(ydoc: Y.Doc) {
    this.ydoc = ydoc;
    this.yblocks = ydoc.getArray('blocks');
    
    this.setupDocumentTracking();
  }

  /**
   * Setup tracking for document changes
   */
  private setupDocumentTracking() {
    this.yblocks.observe(() => {
      if (!this.isLocalUpdate) {
        this.notifyUpdate();
      }
    });
  }

  /**
   * Initialize document with existing content
   */
  initializeDocument(document: ScriptDocument) {
    this.isLocalUpdate = true;
    
    this.ydoc.transact(() => {
      // Clear existing blocks
      this.yblocks.delete(0, this.yblocks.length);
      
      // Add new blocks
      document.blocks.forEach(block => {
        const yblock = new Y.Map();
        yblock.set('id', block.id);
        yblock.set('type', block.type);
        yblock.set('text', block.text);
        this.yblocks.push([yblock]);
      });
    });
    
    this.isLocalUpdate = false;
  }

  /**
   * Get current document state
   */
  getDocument(): ScriptDocument {
    const blocks: ScriptBlock[] = [];
    
    this.yblocks.forEach(yblock => {
      blocks.push({
        id: yblock.get('id'),
        type: yblock.get('type'),
        text: yblock.get('text'),
      });
    });
    
    return { blocks };
  }

  /**
   * Insert a new block at specified index
   */
  insertBlock(index: number, block: ScriptBlock) {
    this.isLocalUpdate = true;
    
    this.ydoc.transact(() => {
      const yblock = new Y.Map();
      yblock.set('id', block.id);
      yblock.set('type', block.type);
      yblock.set('text', block.text);
      this.yblocks.insert(index, [yblock]);
    });
    
    this.isLocalUpdate = false;
  }

  /**
   * Update a block's content
   */
  updateBlock(blockId: string, updates: Partial<ScriptBlock>) {
    this.isLocalUpdate = true;
    
    this.ydoc.transact(() => {
      const index = this.findBlockIndex(blockId);
      if (index !== -1) {
        const yblock = this.yblocks.get(index);
        if (updates.text !== undefined) yblock.set('text', updates.text);
        if (updates.type !== undefined) yblock.set('type', updates.type);
      }
    });
    
    this.isLocalUpdate = false;
  }

  /**
   * Delete a block
   */
  deleteBlock(blockId: string) {
    this.isLocalUpdate = true;
    
    this.ydoc.transact(() => {
      const index = this.findBlockIndex(blockId);
      if (index !== -1) {
        this.yblocks.delete(index, 1);
      }
    });
    
    this.isLocalUpdate = false;
  }

  /**
   * Move a block to a new position
   */
  moveBlock(blockId: string, newIndex: number) {
    this.isLocalUpdate = true;
    
    this.ydoc.transact(() => {
      const currentIndex = this.findBlockIndex(blockId);
      if (currentIndex !== -1 && currentIndex !== newIndex) {
        const yblock = this.yblocks.get(currentIndex);
        this.yblocks.delete(currentIndex, 1);
        this.yblocks.insert(newIndex, [yblock]);
      }
    });
    
    this.isLocalUpdate = false;
  }

  /**
   * Find block index by ID
   */
  private findBlockIndex(blockId: string): number {
    for (let i = 0; i < this.yblocks.length; i++) {
      if (this.yblocks.get(i).get('id') === blockId) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Subscribe to document updates
   */
  onUpdate(callback: (doc: ScriptDocument) => void) {
    this.updateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers of document update
   */
  private notifyUpdate() {
    const doc = this.getDocument();
    this.updateCallbacks.forEach(callback => callback(doc));
  }

  /**
   * Get the Yjs document for provider binding
   */
  getYDoc(): Y.Doc {
    return this.ydoc;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.updateCallbacks = [];
  }
}
