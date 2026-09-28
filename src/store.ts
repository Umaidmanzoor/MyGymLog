import { create } from "zustand";
export const useUI = create<{
  unlocked: boolean;
  unlock: () => void;
  lock: () => void;
  restEnd: number;
  startRest: (seconds: number) => void;
  toast: string;
  notify: (text: string) => void;
}>((set) => ({
  unlocked: false,
  unlock: () => set({ unlocked: true }),
  lock: () => set({ unlocked: false }),
  restEnd: 0,
  startRest: (seconds) =>
    set({ restEnd: seconds ? Date.now() + seconds * 1000 : 0 }),
  toast: "",
  notify: (toast) => {
    set({ toast });
    setTimeout(() => set({ toast: "" }), 3500);
  },
}));
