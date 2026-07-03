import { create } from 'zustand';

const MAX_COMPARE = 4;

interface CompareState {
  ids: string[];
  drawerOpen: boolean;
  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  isFull: () => boolean;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useCompareStore = create<CompareState>()((set, get) => ({
  ids: [],
  drawerOpen: false,

  add: (id) => {
    const { ids } = get();
    if (ids.length >= MAX_COMPARE || ids.includes(id)) return;
    set({ ids: [...ids, id] });
  },
  remove: (id) => set({ ids: get().ids.filter((x) => x !== id) }),
  toggle: (id) => (get().has(id) ? get().remove(id) : get().add(id)),
  has: (id) => get().ids.includes(id),
  isFull: () => get().ids.length >= MAX_COMPARE,
  clear: () => set({ ids: [], drawerOpen: false }),

  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
}));
