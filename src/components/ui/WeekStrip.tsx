"use client";

import React, { useState } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface WeekStripProps {
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  className?: string;
  title?: string;
}

export function WeekStrip({
  selectedDate = new Date(),
  onSelectDate,
  className = "",
  title = "This week",
}: WeekStripProps) {
  const [activeDate, setActiveDate] = useState<Date>(selectedDate);

  // Compute 7 days of the current week (starting Monday)
  const weekStart = startOfWeek(activeDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = addDays(weekStart, 6);

  const handleSelect = (day: Date) => {
    setActiveDate(day);
    if (onSelectDate) onSelectDate(day);
  };

  const rangeLabel = `${format(weekStart, "MMM d")} - ${format(weekEnd, "d")}`;

  return (
    <div className={cn("w-full select-none", className)}>
      {/* Header strip: Left title, Right range label */}
      <div className="flex items-center justify-between text-xs font-bold text-ink-muted px-1 mb-2">
        <span className="uppercase tracking-wider">{title}</span>
        <span className="font-semibold">{rangeLabel}</span>
      </div>

      {/* Glass Week Days Bar */}
      <div className="glass-panel-subtle p-2 flex items-center justify-between gap-1 shadow-xs">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, activeDate);
          const isToday = isSameDay(day, new Date());
          const dayLetter = format(day, "EEEEE"); // M, T, W, T, F, S, S
          const dayNumber = format(day, "d");

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => handleSelect(day)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 cursor-pointer min-w-[38px] active:scale-95",
                isSelected
                  ? "bg-white text-ink shadow-md border border-white/80 dark:bg-white/90 dark:text-black font-extrabold"
                  : "text-ink-muted hover:text-ink hover:bg-white/40 dark:hover:bg-white/10"
              )}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider mb-0.5">
                {dayLetter}
              </span>
              <span className="text-base font-black leading-tight tabular-nums">
                {dayNumber}
              </span>
              {/* Dot indicator under active day (from reference) */}
              <span
                className={cn(
                  "w-1 h-1 rounded-full mt-1 transition-opacity",
                  isSelected ? "bg-accent-blue opacity-100" : isToday ? "bg-ink-muted/50 opacity-100" : "opacity-0"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
