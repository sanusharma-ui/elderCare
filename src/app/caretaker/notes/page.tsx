"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCaretaker } from "@/components/caretaker/CaretakerContext";
import { ElderSwitcher } from "@/components/caretaker/ElderSwitcher";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiClient } from "@/lib/api-client";
import { FileText, Send, AlertTriangle, Info, ShieldAlert, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface NoteItem {
  id: string;
  elderId: string;
  caretakerId: string;
  caretakerName?: string;
  severity: "INFO" | "WARNING" | "URGENT";
  content: string;
  seenAt: string | null;
  createdAt: string;
}

export default function CaretakerNotesPage() {
  const { selectedElderId } = useCaretaker();
  const t = useTranslations("caretaker");
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [severity, setSeverity] = useState<"INFO" | "WARNING" | "URGENT">("INFO");

  // Fetch Notes
  const { data, isLoading } = useQuery<{ items: NoteItem[] }>({
    queryKey: ["caretaker-notes", selectedElderId],
    queryFn: () => apiClient<{ items: NoteItem[] }>(`/api/elders/${selectedElderId}/notes`),
    enabled: !!selectedElderId,
  });

  // Create Note Mutation
  const createNoteMutation = useMutation({
    mutationFn: (newNote: { content: string; severity: "INFO" | "WARNING" | "URGENT" }) =>
      apiClient(`/api/elders/${selectedElderId}/notes`, {
        method: "POST",
        body: JSON.stringify(newNote),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caretaker-notes"] });
      setContent("");
      setSeverity("INFO");
      toast.success(
        severity === "URGENT"
          ? t("urgentNoteSaved")
          : t("noteSaved")
      );
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create note");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createNoteMutation.mutate({ content: content.trim(), severity });
  };

  const notes = data?.items || [];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      <ElderSwitcher />

      {/* Quick Composer */}
      <GlassPanel variant="default" className="rounded-[32px] p-6 space-y-4">
        <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>{t("newNote")}</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("notePlaceholder")}
            className="w-full p-4 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />

          {/* Severity Radio Tiles */}
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
              {t("severity")}:
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSeverity("INFO")}
                className={`py-2.5 px-3 rounded-full border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  severity === "INFO"
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-white/60 dark:bg-white/5 border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-300"
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>{t("info")}</span>
              </button>

              <button
                type="button"
                onClick={() => setSeverity("WARNING")}
                className={`py-2.5 px-3 rounded-full border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  severity === "WARNING"
                    ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                    : "bg-white/60 dark:bg-white/5 border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-300"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{t("warning")}</span>
              </button>

              <button
                type="button"
                onClick={() => setSeverity("URGENT")}
                className={`py-2.5 px-3 rounded-full border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  severity === "URGENT"
                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                    : "bg-white/60 dark:bg-white/5 border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-300"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{t("urgent")}</span>
              </button>
            </div>
          </div>

          {severity === "URGENT" && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-2xl text-xs text-rose-600 dark:text-rose-400 font-bold">
              ⚠️ {t("urgentWarning")}
            </div>
          )}

          <PrimaryButton
            type="submit"
            variant="primary"
            disabled={createNoteMutation.isPending || !content.trim()}
            className="w-full gap-2"
          >
            {createNoteMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("submitting")}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{t("submitNote")}</span>
              </>
            )}
          </PrimaryButton>
        </form>
      </GlassPanel>

      {/* Recent Notes Feed */}
      <div className="space-y-4 pt-1">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white px-1">
          {t("recentNotes")} ({notes.length})
        </h3>

        {notes.map((note) => (
          <GlassPanel
            key={note.id}
            variant="default"
            className={`rounded-[28px] p-5 space-y-3 ${
              note.severity === "URGENT"
                ? "border-rose-300 dark:border-rose-900/40 bg-rose-50/20"
                : note.severity === "WARNING"
                ? "border-amber-300 dark:border-amber-900/40 bg-amber-50/20"
                : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <StatusBadge
                variant={
                  note.severity === "URGENT"
                    ? "urgent"
                    : note.severity === "WARNING"
                    ? "warning"
                    : "neutral"
                }
                label={note.severity}
              />
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {new Date(note.createdAt).toLocaleString("en-IN", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              {note.content}
            </p>

            <div className="pt-2.5 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{t("recordedBy", { name: note.caretakerName || "Caretaker" })}</span>
              {note.seenAt ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>{t("seenByDoctor")}</span>
                </span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">{t("unseen")}</span>
              )}
            </div>
          </GlassPanel>
        ))}

        {notes.length === 0 && !isLoading && (
          <EmptyState
            title={t("noNotes")}
            description={t("noNotesDescription")}
          />
        )}
      </div>
    </div>
  );
}
