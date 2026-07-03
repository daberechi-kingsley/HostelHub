import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SavesState {
  ids: string[];
  toggle: (id: string) => boolean; // returns new "saved" state
  has: (id: string) => boolean;
  clear: () => void;
}

/**
 * Week 1: saves persist to localStorage so anonymous users can heart listings
 * and we can demo the flow without auth yet. Week 2 will sync to Firestore
 * once a user signs in.
 */
export const useSavesStore = create<SavesState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const current = get().ids;
        const isSaved = current.includes(id);
        const next = isSaved ? current.filter((x) => x !== id) : [...current, id];
        set({ ids: next });
        return !isSaved;
      },
      has: (id) => get().ids.includes(id),
      clear: () => set({ ids: [] }),
    }),
    { name: 'hostelhub:saves' },
  ),
);
