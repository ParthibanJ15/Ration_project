import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Basket, Household } from "./simulator";
import { STRINGS, type StringKey } from "./strings";

export type Lang = "ta" | "en";
export type Mode = "household" | "worker";

export type MonthEntry = {
  month: string;
  cost: number;
  rice: number;
  millet: number;
  pulses: number;
};

export type AppState = {
  lang: Lang;
  mode: Mode;
  consent: boolean;
  household: Household;
  current: Basket;
  plan: Basket;
  budget: number | null;
  availability: "yes" | "no" | "sometimes" | null;
  altSource: string | null;
  history: MonthEntry[];
  workerName: string;
  workerOrg: string;
};

const DEFAULT_STATE: AppState = {
  lang: "ta",
  mode: "household",
  consent: false,
  household: {
    district: "Tiruvallur",
    cardType: "priority",
    adults: 2,
    children: 2,
    diabetes: "unsure",
  },
  current: {},
  plan: {},
  budget: null,
  availability: null,
  altSource: null,
  history: [],
  workerName: "",
  workerOrg: "",
};

const KEY = "rationrebalance.state.v1";

type Ctx = {
  state: AppState;
  loaded: boolean;
  update: (patch: Partial<AppState>) => void;
  t: (key: StringKey) => string;
  other: (key: StringKey) => string;
};

const AppStateContext = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<AppState>) });
    } catch {
      /* ignore corrupt drafts */
    }
    setLoaded(true);
  }, []);

  const update = useCallback((patch: Partial<AppState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage full or blocked */
      }
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      loaded,
      update,
      t: (key) => STRINGS[key][state.lang],
      other: (key) => STRINGS[key][state.lang === "ta" ? "en" : "ta"],
    }),
    [state, loaded, update],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useApp must be used inside AppStateProvider");
  return ctx;
}

/** Speak a sentence aloud for people who cannot read easily. */
export function speak(text: string, lang: Lang) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang === "ta" ? "ta-IN" : "en-IN";
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}
