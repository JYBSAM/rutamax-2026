
import { RealtimeMessage } from '../types';

class RealtimeService {
  private channel: BroadcastChannel;
  private listeners: ((msg: RealtimeMessage) => void)[] = [];

  constructor() {
    // Usamos BroadcastChannel para simular WebSockets entre pestañas en la demo
    // En producción aquí se inicializaría Ably o Socket.io
    this.channel = new BroadcastChannel('rutamax_realtime');
    this.channel.onmessage = (event) => {
      this.notifyListeners(event.data);
    };
  }

  subscribe(callback: (msg: RealtimeMessage) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  publish(type: RealtimeMessage['type'], payload: any, senderId: string = 'system') {
    const message: RealtimeMessage = {
      type,
      payload,
      senderId,
      timestamp: Date.now()
    };
    this.channel.postMessage(message);
    // También notificar a los listeners locales en la misma pestaña
    this.notifyListeners(message);
  }

  private notifyListeners(msg: RealtimeMessage) {
    this.listeners.forEach(listener => listener(msg));
  }

  // Helper para notificaciones rápidas
  sendNotification(title: string, body: string, severity: 'info' | 'warning' | 'error' = 'info') {
    this.publish('NOTIFICATION', { title, body, severity });
  }
}

export const realtimeService = new RealtimeService();
