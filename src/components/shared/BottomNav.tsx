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
        return <Calendar className="w-6 h-6" />;
      case "medicines":
        return <Pill className="w-6 h-6" />;
      case "doctor":
        return <Stethoscope className="w-6 h-6" />;
      case "notes":
        return <FileText className="w-6 h-6" />;
      case "link":
        return <PlusCircle className="w-6 h-6" />;
      case "me":
      default:
        return <User className="w-6 h-6" />;
    }
  };

  return (
    <div className="flex items-center justify-around px-2 py-2 select-none">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 min-h-[52px] py-1 px-1 rounded-xl transition-all active:scale-95",
              isActive
                ? "text-forest font-bold"
                : "text-ink-muted hover:text-ink font-medium"
            )}
          >
            <div
              className={cn(
                "p-1 rounded-xl transition-colors",
                isActive ? "bg-forest-soft text-forest" : "text-ink-muted"
              )}
            >
              {getIcon(item.icon)}
            </div>
            <span className="text-[12px] leading-tight mt-0.5 truncate max-w-[80px]">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
