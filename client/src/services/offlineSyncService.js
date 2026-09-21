// Offline Storage & Background Synchronization Service for Low-Network Environments

const OFFLINE_QUEUE_KEY = 'civicconnect_offline_queue_v1';
const OFFLINE_CACHE_KEY = 'civicconnect_offline_cache_v1';
const API_BASE_URL = 'http://localhost:5000/api';

class OfflineSyncService {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.listeners = new Set();
    this.isSyncing = false;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
      
      // Auto trigger sync on startup if online and queue not empty
      setTimeout(() => {
        if (this.isOnline) {
          this.triggerBackgroundSync();
        }
      }, 1000);
    }
  }

  // Subscribe to sync & network status changes
  subscribe(callback) {
    this.listeners.add(callback);
    callback({
      isOnline: this.isOnline,
      pendingCount: this.getQueueLength(),
      isSyncing: this.isSyncing
    });
    return () => this.listeners.delete(callback);
  }

  notify() {
    const status = {
      isOnline: this.isOnline,
      pendingCount: this.getQueueLength(),
      isSyncing: this.isSyncing
    };
    this.listeners.forEach(cb => {
      try {
        cb(status);
      } catch (err) {
        console.error('Error in offline sync listener:', err);
      }
    });
  }

  handleNetworkChange(online) {
    this.isOnline = online;
    this.notify();
    if (online) {
      console.log('🌐 Network restored. Initiating automatic background synchronization...');
      this.triggerBackgroundSync();
    } else {
      console.warn('⚠️ Network offline. Operating in local-first storage mode.');
    }
  }

  getQueue() {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  getQueueLength() {
    return this.getQueue().length;
  }

  saveQueue(queue) {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      this.notify();
    } catch (e) {
      console.error('Failed to save offline queue:', e);
    }
  }

  // Enqueue an action when offline or low-network
  enqueueAction(actionType, endpoint, method, payload) {
    const queue = this.getQueue();
    const item = {
      id: 'SYNC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      actionType,
      endpoint,
      method: method.toUpperCase(),
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0
    };

    queue.push(item);
    this.saveQueue(queue);
    console.log(`📥 Action enqueued offline [${actionType}]:`, item);
    return item;
  }

  // Cache data locally for offline viewing
  cacheData(key, data) {
    try {
      const cache = this.getCache();
      cache[key] = {
        data,
        cachedAt: new Date().toISOString()
      };
      localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.warn('Cache write failed:', e);
    }
  }

  getCachedData(key) {
    try {
      const cache = this.getCache();
      return cache[key]?.data || null;
    } catch (e) {
      return null;
    }
  }

  getCache() {
    try {
      const raw = localStorage.getItem(OFFLINE_CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  // Background Sync Engine
  async triggerBackgroundSync() {
    if (this.isSyncing) return;
    const queue = this.getQueue();
    if (queue.length === 0) return;

    this.isSyncing = true;
    this.notify();

    console.log(`🔄 Processing ${queue.length} offline actions in background queue...`);
    const remaining = [];

    for (const item of queue) {
      try {
        const url = item.endpoint.startsWith('http') ? item.endpoint : `${API_BASE_URL}${item.endpoint}`;
        const res = await fetch(url, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: item.payload ? JSON.stringify(item.payload) : undefined
        });

        if (res.ok) {
          console.log(`✅ Synced action successfully: ${item.actionType} [${item.id}]`);
        } else {
          item.retryCount += 1;
          if (item.retryCount < 5) {
            remaining.push(item);
          }
        }
      } catch (err) {
        console.warn(`⏳ Network error while syncing [${item.actionType}]. Will retry later.`, err.message);
        item.retryCount += 1;
        remaining.push(item);
        break; // Network still unavailable, pause loop
      }
    }

    this.saveQueue(remaining);
    this.isSyncing = false;
    this.notify();
  }
}

export const offlineSyncService = new OfflineSyncService();
