export type StoreName = 'scrape_wal' | 'settings';

const DB_NAME = 'wvrdr_wave_i_db';
const DB_VERSION = 1;
const WAL_STORE: StoreName = 'scrape_wal';
const SETTINGS_STORE: StoreName = 'settings';

export interface ScrapeRecord {
  id?: number;
  action?: string;
  localTs: string;
  utcTs: string;
  payload: unknown;
}

const openWaveIDB = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(WAL_STORE)) {
      db.createObjectStore(WAL_STORE, { keyPath: 'id', autoIncrement: true });
    }
    if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
      db.createObjectStore(SETTINGS_STORE);
    }
  };

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
});

export const sydneyStamp = (date = new Date()): string => new Intl.DateTimeFormat('en-AU', {
  timeZone: 'Australia/Sydney',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
}).format(date);

export const utcStamp = (date = new Date()): string => date.toISOString().replace('.000', '');

export const saveScrape = async (payload: unknown, action = 'DATA SCRAPE'): Promise<void> => {
  const db = await openWaveIDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(WAL_STORE, 'readwrite');
    tx.objectStore(WAL_STORE).add({
      action,
      payload,
      localTs: sydneyStamp(),
      utcTs: utcStamp(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('WAL write failed'));
  });
  db.close();
};

export const loadScrapes = async (): Promise<ScrapeRecord[]> => {
  const db = await openWaveIDB();
  const records = await new Promise<ScrapeRecord[]>((resolve, reject) => {
    const tx = db.transaction(WAL_STORE, 'readonly');
    const request = tx.objectStore(WAL_STORE).getAll();
    request.onsuccess = () => resolve((request.result as ScrapeRecord[]).sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0)));
    request.onerror = () => reject(request.error ?? new Error('WAL read failed'));
  });
  db.close();
  return records;
};

export const setSetting = async <T>(key: string, value: T): Promise<void> => {
  const db = await openWaveIDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readwrite');
    tx.objectStore(SETTINGS_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Setting write failed'));
  });
  db.close();
};

export const getSetting = async <T>(key: string, fallback: T): Promise<T> => {
  const db = await openWaveIDB();
  const value = await new Promise<T>((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readonly');
    const request = tx.objectStore(SETTINGS_STORE).get(key);
    request.onsuccess = () => resolve((request.result as T | undefined) ?? fallback);
    request.onerror = () => reject(request.error ?? new Error('Setting read failed'));
  });
  db.close();
  return value;
};
