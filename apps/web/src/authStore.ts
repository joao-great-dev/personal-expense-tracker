import { create } from "zustand";

type AuthState = {
  accessToken: string | null;
  email: string | null;
  userId: string | null;
  setSession: (_s: { accessToken: string; email: string; userId: string }) => void;
  clear: () => void;
};

const storageKey = "pet.session.v1";

const load = (): Pick<AuthState, "accessToken" | "email" | "userId"> => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { accessToken: null, email: null, userId: null };
    const parsed = JSON.parse(raw) as { accessToken?: string; email?: string; userId?: string };
    return {
      accessToken: parsed.accessToken ?? null,
      email: parsed.email ?? null,
      userId: parsed.userId ?? null,
    };
  } catch {
    return { accessToken: null, email: null, userId: null };
  }
};

const persist = (s: { accessToken: string; email: string; userId: string } | null) => {
  if (!s) {
    localStorage.removeItem(storageKey);
    return;
  }
  localStorage.setItem(storageKey, JSON.stringify(s));
};

export const useAuthStore = create<AuthState>((set) => {
  const initial = typeof window === "undefined" ? { accessToken: null, email: null, userId: null } : load();
  return {
    ...initial,
    setSession: (s) => {
      persist(s);
      set({ accessToken: s.accessToken, email: s.email, userId: s.userId });
    },
    clear: () => {
      persist(null);
      set({ accessToken: null, email: null, userId: null });
    },
  };
});

