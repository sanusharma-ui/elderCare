"use client";

import React, { useState } from "react";
import { useCaretaker } from "./CaretakerContext";
import { Users, ChevronDown, Check } from "lucide-react";
import { useTranslations } from "next-intl";

export function ElderSwitcher() {
  const { elders, selectedElder, setSelectedElderId } = useCaretaker();
  const t = useTranslations("caretaker");
  const [open, setOpen] = useState(false);

  if (elders.length <= 1) {
    return (
      <div className="flex items-center gap-3 p-2.5 px-3.5 bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
          {selectedElder?.name?.[0] || "P"}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider block font-extrabold">
            {t("switchElder")}
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white truncate block">
            {selectedElder?.name || t("switchElder")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-2.5 px-3.5 bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl shadow-xs hover:bg-white/90 dark:hover:bg-white/10 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
            {selectedElder?.name?.[0] || "P"}
          </div>
          <div className="text-left min-w-0">
            <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider block font-extrabold">
              {t("switchElder")} ({elders.length})
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate block">
              {selectedElder?.name}
            </span>
          </div>
        </div>

        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/70 dark:border-white/10 rounded-2xl shadow-xl z-50 p-2 space-y-1">
            {elders.map((elder) => {
              const isSelected = elder.id === selectedElder?.id;
              return (
                <button
                  key={elder.id}
                  onClick={() => {
                    setSelectedElderId(elder.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold"
                      : "text-slate-800 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="text-sm font-bold">{elder.name}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
