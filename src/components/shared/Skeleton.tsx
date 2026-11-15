"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-line/60 bg-gradient-to-r from-line/40 via-surface/80 to-line/40",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonCard({
  lines = 2,
  hasIcon = true,
  className,
}: {
  lines?: number;
  hasIcon?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-xs space-y-3",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {hasIcon && <Skeleton className="w-10 h-10 rounded-xl shrink-0" />}
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4 rounded-md" />
          {lines > 1 && <Skeleton className="h-3 w-1/2 rounded-md" />}
        </div>
      </div>
      {lines > 2 && (
        <div className="space-y-2 pt-2 border-t border-line/40">
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-5/6 rounded-md" />
        </div>
      )}
    </div>
  );
}

export function SkeletonSchedule() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero card skeleton */}
      <div className="bg-surface border border-line rounded-3xl p-5 shadow-smriti space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-1/2 rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
          </div>
          <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
      </div>

      {/* Next Dose skeleton */}
      <SkeletonCard lines={3} className="border-saffron/30" />

      {/* Dose list skeletons */}
      <div className="space-y-3 pt-2">
        <Skeleton className="h-5 w-40 rounded-md" />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>
    </div>
  );
}

export function PageLoadingSpinner({
  label,
}: {
  label?: string;
}) {
  const t = useTranslations("common");
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3 text-ink select-none animate-fade-in">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-forest/20 animate-ping absolute" />
        <Loader2 className="w-8 h-8 animate-spin text-forest" />
      </div>
      <span className="text-xs sm:text-sm font-semibold text-ink-muted">
        {label || t("loading")}
      </span>
    </div>
  );
}
