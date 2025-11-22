/**
 * Unit tests for SaveManager
 * Tests local storage, sync queue, and online/offline detection
 */

import { get, set, del, entries } from 'idb-keyval'

// Mock idb-keyval
jest.mock('idb-keyval', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  entries: jest.fn(),
  createStore: jest.fn(() => ({})),
}))

describe('SaveManager', () => {
  let SaveManager: any
  let saveManager: any

  beforeEach(async () => {
    jest.clearAllMocks()
    
    // Reset modules to get fresh instance
    jest.resetModules()
    
    // Import SaveManager after mocks are set up
    const module = await import('../saveManager')
    SaveManager = module.default
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })
  })

  afterEach(() => {
    if (saveManager) {
      saveManager = null
    }
  })

  describe('Draft Management', () => {
    it('should save a draft to IndexedDB', async () => {
      const { default: SaveManagerClass } = await import('../saveManager')
      saveManager = new SaveManagerClass()

      await saveManager.saveDraft('test-draft-1', 'Test content', { title: 'Test' })

      expect(set).toHaveBeenCalled()
    })

    it('should retrieve a draft from IndexedDB', async () => {
      const { default: SaveManagerClass } = await import('../saveManager')
      saveManager = new SaveManagerClass()

      const mockDraft = {
        id: 'test-draft-1',
        content: 'Test content',
        timestamp: Date.now(),
        synced: true,
      }

      ;(get as jest.Mock).mockResolvedValue(mockDraft)

      const result = await saveManager.getDraft('test-draft-1')

      expect(get).toHaveBeenCalled()
      expect(result).toEqual(mockDraft)
    })

    it('should delete a draft from IndexedDB', async () => {
      const { default: SaveManagerClass } = await import('../saveManager')
      saveManager = new SaveManagerClass()

      await saveManager.deleteDraft('test-draft-1')

      expect(del).toHaveBeenCalled()
    })

    it('should get all drafts', async () => {
      const { default: SaveManagerClass } = await import('../saveManager')
      saveManager = new SaveManagerClass()

      const mockDrafts = [
        ['draft-1', { id: 'draft-1', content: 'Content 1', timestamp: 1000, synced: true }],
        ['draft-2', { id: 'draft-2', content: 'Content 2', timestamp: 2000, synced: false }],
      ]

      ;(entries as jest.Mock).mockResolvedValue(mockDrafts)

      const result = await saveManager.getAllDrafts()

      expect(entries).toHaveBeenCalled()
      expect(result).toHaveLength(2)
    })
  })

  describe('Online/Offline Detection', () => {
    it('should detect online status', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })

      const { default: SaveManagerClass } = await import('../saveManager')
      saveManager = new SaveManagerClass()

      expect(saveManager.isOnline()).toBe(true)
    })

    it('should detect offline status', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      const { default: SaveManagerClass } = await import('../saveManager')
      saveManager = new SaveManagerClass()

      expect(saveManager.isOnline()).toBe(false)
    })

    it('should call onOnline callback when going online', async () => {
      const onOnline = jest.fn()
      const { default: SaveManagerClass } = await import('../saveManager')
      saveManager = new SaveManagerClass({ onOnline })

      // Simulate online event
      window.dispatchEvent(new Event('online'))

      // Allow event to process
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(onOnline).toHaveBeenCalled()
    })

    it('should call onOffline callback when going offline', async () => {
      const onOffline = jest.fn()
      const { default: SaveManagerClass } = await import('../saveManager')
      saveManager = new SaveManagerClass({ onOffline })

      // Simulate offline event
      window.dispatchEvent(new Event('offline'))

      // Allow event to process
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(onOffline).toHaveBeenCalled()
    })
  })

  describe('Sync Queue', () => {
    it('should track unsynced drafts', async () => {
      const { default: SaveManagerClass } = await import('../saveManager')
      saveManager = new SaveManagerClass()

      const mockDrafts = [
        ['draft-1', { id: 'draft-1', content: 'Content 1', timestamp: 1000, synced: true }],
        ['draft-2', { id: 'draft-2', content: 'Content 2', timestamp: 2000, synced: false }],
        ['draft-3', { id: 'draft-3', content: 'Content 3', timestamp: 3000, synced: false }],
      ]

      ;(entries as jest.Mock).mockResolvedValue(mockDrafts)

      const unsynced = await saveManager.getUnsyncedDrafts()

      expect(unsynced).toHaveLength(2)
      expect(unsynced.every((d: any) => !d.synced)).toBe(true)
    })

    it('should check if there are unsynced drafts', async () => {
      const { default: SaveManagerClass } = await import('../saveManager')
      saveManager = new SaveManagerClass()

      const mockDrafts = [
        ['draft-1', { id: 'draft-1', content: 'Content 1', timestamp: 1000, synced: false }],
      ]

      ;(entries as jest.Mock).mockResolvedValue(mockDrafts)

      const hasUnsynced = await saveManager.hasUnsyncedDrafts()

      expect(hasUnsynced).toBe(true)
    })

    it('should mark a draft as synced', async () => {
      const { default: SaveManagerClass } = await import('../saveManager')
      saveManager = new SaveManagerClass()

      const mockDraft = {
        id: 'test-draft-1',
        content: 'Test content',
        timestamp: Date.now(),
        synced: false,
      }

      ;(get as jest.Mock).mockResolvedValue(mockDraft)

      await saveManager.markAsSynced('test-draft-1')

      expect(set).toHaveBeenCalled()
      expect(get).toHaveBeenCalled()
    })
  })
})
