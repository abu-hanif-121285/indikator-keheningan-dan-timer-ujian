// ============================================================
// Penyimpanan Lokal — localStorage (pengaturan) & IndexedDB (background)
// Semua data diproses dan disimpan 100% di perangkat pengguna.
// ============================================================

import { AppSettings, DEFAULT_SETTINGS, MAX_BG_SIZE, TARGET_RATIO } from "../types";

const SETTINGS_KEY = "wah-silent-exam-monitor:v1";
const DB_NAME = "wah-exam-monitor";
const DB_STORE = "kv";
const BG_KEY = "background";

// ----------------------------- localStorage -----------------------------

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      thresholds: { ...DEFAULT_SETTINGS.thresholds, ...(parsed.thresholds ?? {}) },
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* penyimpanan penuh / tidak tersedia — abaikan */
  }
}

export function clearSettings(): void {
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch {
    /* abaikan */
  }
}

// ------------------------------ IndexedDB -------------------------------

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB tidak tersedia di browser ini."));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(DB_STORE)) {
        req.result.createObjectStore(DB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Gagal membuka IndexedDB."));
  });
}

export async function saveBackgroundBlob(blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(blob, BG_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Gagal menyimpan background."));
    };
  });
}

export async function loadBackgroundBlob(): Promise<Blob | null> {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const req = tx.objectStore(DB_STORE).get(BG_KEY);
      req.onsuccess = () => {
        db.close();
        resolve(req.result instanceof Blob ? req.result : null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

export async function clearBackgroundBlob(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).delete(BG_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    /* abaikan */
  }
}

// ------------------------- Validasi File Background ----------------------

export interface ValidatedBg {
  blob: Blob;
  width: number;
  height: number;
  is169: boolean;
}

export function validateBackgroundFile(file: File): Promise<ValidatedBg> {
  return new Promise((resolve, reject) => {
    const isPng =
      file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
    if (!isPng) {
      reject(
        new Error(
          "Format file tidak didukung. Silakan unggah gambar berformat PNG."
        )
      );
      return;
    }
    if (file.size > MAX_BG_SIZE) {
      reject(
        new Error(
          `Ukuran file ${(file.size / 1024 / 1024).toFixed(1)} MB melebihi batas 5 MB. ` +
            "Kompres gambar terlebih dahulu agar performa browser tetap ringan."
        )
      );
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      const is169 = Math.abs(ratio - TARGET_RATIO) <= 0.04;
      URL.revokeObjectURL(url);
      resolve({
        blob: file,
        width: img.naturalWidth,
        height: img.naturalHeight,
        is169,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("File PNG tidak dapat dibaca. Gambar mungkin rusak."));
    };
    img.src = url;
  });
}
