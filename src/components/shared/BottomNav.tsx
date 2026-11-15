"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Pill, User, Stethoscope, FileText, Home, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  key: string;
  href: string;
  label: string;
  icon: "today" | "medicines" | "doctor" | "notes" | "me" | "home" | "link";
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  const getIcon = (iconName: NavItem["icon"]) => {
    switch (iconName) {
      case "today":
      case "home":
        return <Calendar className="w-5 h-5" />;
      case "medicines":
        return <Pill className="w-5 h-5" />;
      case "doctor":
        return <Stethoscope className="w-5 h-5" />;
      case "notes":
        return <FileText className="w-5 h-5" />;
      case "link":
        return <PlusCircle className="w-5 h-5" />;
      case "me":
      default:
        return <User className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex items-center justify-around px-2 py-1.5 select-none">
      {items.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 min-h-[56px] py-1 px-1 rounded-2xl transition-all duration-150 active:scale-95 cursor-pointer",
              isActive
                ? "text-ink font-black"
                : "text-ink-muted hover:text-ink font-semibold"
            )}
          >
            <div
              className={cn(
                "p-1.5 rounded-full transition-all duration-200",
                isActive
                  ? "bg-slate-900 text-white shadow-md scale-105"
                  : "text-ink-muted hover:bg-slate-100"
              )}
            >
              {getIcon(item.icon)}
            </div>
            <span
              className={cn(
                "text-[11px] sm:text-xs leading-tight mt-1 truncate max-w-[80px]",
                isActive ? "font-extrabold text-accent-blue" : "font-bold"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
