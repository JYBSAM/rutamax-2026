
export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  severity: 'info' | 'warning' | 'danger';
}

class AuditService {
  private STORAGE_KEY = 'rutamax_audit_log';

  log(user: string, action: string, details: string, severity: AuditEntry['severity'] = 'info') {
    const logs = this.getLogs();
    const newEntry: AuditEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      user,
      action,
      details,
      severity
    };
    logs.unshift(newEntry);
    // Mantenemos solo los últimos 100 registros para demo
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
  }

  getLogs(): AuditEntry[] {
    const logs = localStorage.getItem(this.STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
  }
}

export const auditService = new AuditService();
