export type MdkProbeStatus = 'PASS' | 'WARN' | 'FAIL';

export type MdkProbe = {
  id: string;
  label: string;
  status: MdkProbeStatus;
  message: string;
};

const probeIndexedDB = async (): Promise<MdkProbe> => {
  if (!('indexedDB' in globalThis)) {
    return {
      id: 'indexeddb',
      label: 'IndexedDB',
      status: 'FAIL',
      message: 'IndexedDB API unavailable in this browser/context.',
    };
  }

  try {
    const request = indexedDB.open('wvrdr_wave_i_mdk_probe', 1);
    await new Promise<void>((resolve, reject) => {
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('probe')) db.createObjectStore('probe');
      };
      request.onsuccess = () => {
        request.result.close();
        resolve();
      };
      request.onerror = () => reject(request.error ?? new Error('IndexedDB probe failed'));
    });
    return { id: 'indexeddb', label: 'IndexedDB', status: 'PASS', message: 'IndexedDB writable.' };
  } catch (error) {
    return {
      id: 'indexeddb',
      label: 'IndexedDB',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'IndexedDB blocked.',
    };
  }
};

export async function runMdkSelfTest(apiBaseUrl: string): Promise<MdkProbe[]> {
  const probes: MdkProbe[] = [];

  probes.push({
    id: 'viewport',
    label: 'S22 viewport',
    status: window.innerWidth <= 520 && window.innerHeight >= 600 ? 'PASS' : 'WARN',
    message: `Viewport measured: ${window.innerWidth}x${window.innerHeight}`,
  });

  probes.push({
    id: 'service-worker',
    label: 'Service worker',
    status: 'serviceWorker' in navigator ? 'PASS' : 'WARN',
    message: 'serviceWorker' in navigator
      ? 'Service worker API available.'
      : 'Service worker API unavailable in this browser/context.',
  });

  probes.push(await probeIndexedDB());

  probes.push({
    id: 'connector',
    label: 'Thin Spine connector',
    status: apiBaseUrl.trim() ? 'PASS' : 'WARN',
    message: apiBaseUrl.trim()
      ? 'API_BASE_URL is set.'
      : 'No API_BASE_URL set. Refresh should return NO CONNECTOR.',
  });

  probes.push({
    id: 'pwa-display',
    label: 'Standalone display',
    status: window.matchMedia('(display-mode: standalone)').matches ? 'PASS' : 'WARN',
    message: window.matchMedia('(display-mode: standalone)').matches
      ? 'Running as installed standalone PWA.'
      : 'Running in browser tab; install test still required.',
  });

  return probes;
}
