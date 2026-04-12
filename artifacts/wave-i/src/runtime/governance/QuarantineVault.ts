export interface QuarantineEntry {
  subject: string;
  reason: string;
  quarantinedAt: string;
}

export class QuarantineVault {
  private readonly entries = new Map<string, QuarantineEntry>();

  quarantine(subject: string, reason: string): QuarantineEntry {
    const entry = {
      subject,
      reason,
      quarantinedAt: new Date().toISOString(),
    };
    this.entries.set(subject, entry);
    return entry;
  }

  release(subject: string): void {
    this.entries.delete(subject);
  }

  isQuarantined(subject: string): boolean {
    return this.entries.has(subject);
  }

  list(): QuarantineEntry[] {
    return Array.from(this.entries.values());
  }
}

export const quarantineVault = new QuarantineVault();
