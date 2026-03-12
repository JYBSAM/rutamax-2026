
export interface SyncItem {
  id: string;
  type: 'CHECKLIST' | 'ODO' | 'POD' | 'EXPENSE';
  data: any;
  timestamp: number;
}

class SyncService {
  private STORAGE_KEY = 'rutamax_sync_queue';

  getQueue(): SyncItem[] {
    const queue = localStorage.getItem(this.STORAGE_KEY);
    return queue ? JSON.parse(queue) : [];
  }

  addToQueue(type: SyncItem['type'], data: any) {
    const queue = this.getQueue();
    const newItem: SyncItem = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now()
    };
    queue.push(newItem);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
    
    // Intentar sincronizar inmediatamente si hay red
    if (navigator.onLine) {
      this.syncNow();
    }
  }

  async syncNow(): Promise<boolean> {
    const queue = this.getQueue();
    if (queue.length === 0) return true;

    console.log(`[SyncEngine] Sincronizando ${queue.length} registros...`);
    
    // Simulación de delay de red y procesamiento exitoso
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('sync-complete'));
    return true;
  }

  isOnline(): boolean {
    return navigator.onLine;
  }
}

export const syncService = new SyncService();
