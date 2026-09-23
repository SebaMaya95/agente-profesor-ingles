// Guardado en el navegador (localStorage). Todo queda en el dispositivo del alumno: nada personal viaja al servidor.
import { newState } from "../src/game.js";

const KEYS = { state: "ingles.estado.v3", profile: "ingles.perfil.v1", settings: "ingles.ajustes.v1" };
export const DEFAULT_SETTINGS = { voice: true, mic: true, accessCode: "" };

// backend: cualquier objeto con getItem/setItem/removeItem (localStorage, o uno falso en las pruebas).
export function createStorage(backend = globalThis.localStorage) {
  const read = (key, fallback) => {
    try {
      const raw = backend?.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback; // almacenamiento bloqueado o dato corrupto: se empieza de cero sin romper la app
    }
  };
  const write = (key, value) => {
    try {
      backend.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };
  return {
    loadState() {
      const saved = read(KEYS.state, null);
      return saved?.version === 3 ? saved : newState();
    },
    saveState: (state) => write(KEYS.state, state),
    resetState() {
      try {
        backend.removeItem(KEYS.state);
      } catch {
        /* nada que borrar */
      }
    },
    loadProfile: (defaults) => ({ ...defaults, ...read(KEYS.profile, {}) }),
    saveProfile: (profile) => write(KEYS.profile, profile),
    loadSettings: () => ({ ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) }),
    saveSettings: (settings) => write(KEYS.settings, settings),
  };
}
