"use client";

import { createContext, useContext } from "react";

export type EditModeContextValue = {
  isEditMode: boolean;
  showToast: (message: string, tone?: "success" | "error") => void;
};

const defaultValue: EditModeContextValue = {
  isEditMode: false,
  showToast: () => {},
};

export const EditModeContext = createContext<EditModeContextValue>(defaultValue);

export function useEditMode() {
  return useContext(EditModeContext);
}
