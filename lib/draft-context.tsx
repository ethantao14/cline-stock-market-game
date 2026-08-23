"use client";

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";

import { draftReducer, initialDraftState, type DraftAction, type DraftState } from "./draft-reducer";

interface DraftContextValue {
  state: DraftState;
  dispatch: Dispatch<DraftAction>;
}

const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(draftReducer, initialDraftState);

  return <DraftContext.Provider value={{ state, dispatch }}>{children}</DraftContext.Provider>;
}

export function useDraft(): DraftContextValue {
  const context = useContext(DraftContext);

  if (!context) {
    throw new Error("useDraft must be used within a DraftProvider");
  }

  return context;
}
