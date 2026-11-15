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
      <div className="flex items-center gap-2 p-2.5 bg-surface border border-line rounded-2xl shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-forest-soft text-forest flex items-center justify-center font-bold text-sm">
          {selectedElder?.name?.[0] || "P"}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-ink-muted uppercase tracking-wider block font-semibold">
            {t("switchElder")}
          </span>
          <span className="text-sm font-bold text-ink truncate block">
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
        className="w-full flex items-center justify-between p-2.5 bg-surface border border-line rounded-2xl shadow-xs hover:bg-paper-2 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-forest-soft text-forest flex items-center justify-center font-bold text-sm shrink-0">
            {selectedElder?.name?.[0] || "P"}
          </div>
          <div className="text-left min-w-0">
            <span className="text-[10px] text-ink-muted uppercase tracking-wider block font-semibold">
              {t("switchElder")} ({elders.length})
            </span>
            <span className="text-sm font-bold text-ink truncate block">
              {selectedElder?.name}
            </span>
          </div>
        </div>

        <ChevronDown className="w-4 h-4 text-ink-muted shrink-0 mr-1" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-2 bg-surface border border-line rounded-2xl shadow-smriti-float z-50 p-1.5 space-y-1">
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
                      ? "bg-forest-soft text-forest font-bold"
                      : "text-ink hover:bg-paper"
                  }`}
                >
                  <span className="text-sm">{elder.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-forest" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
