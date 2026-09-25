"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { EditModeContext } from "./EditModeContext";

type Toast = {
  id: number;
  message: string;
  tone: "success" | "error";
};

/**
 * Marks the wrapped tree as editable. Only mounted on /admin — the public
 * site never renders this, so `useEditMode()` there always falls back to
 * `isEditMode: false` and shows no edit affordances.
 */
export function EditModeProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const nextId = useRef(0);

  const showToast = useCallback(
    (message: string, tone: "success" | "error" = "success") => {
      const id = ++nextId.current;
      setToast({ id, message, tone });
      setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
      }, 2800);
    },
    []
  );

  return (
    <EditModeContext.Provider value={{ isEditMode: true, showToast }}>
      {children}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-100 -translate-x-1/2 px-4 py-2.5 text-sm text-white shadow-lg ${
            toast.tone === "success" ? "bg-stone-900" : "bg-red-700"
          }`}
        >
          {toast.message}
        </div>
      )}
    </EditModeContext.Provider>
  );
}
