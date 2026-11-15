"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCaretaker } from "@/components/caretaker/CaretakerContext";
import { ElderSwitcher } from "@/components/caretaker/ElderSwitcher";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
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
    <div className="p-4 sm:p-5 space-y-5">
      <ElderSwitcher />

      {/* Quick Composer */}
      <div className="bg-surface border border-line rounded-3xl p-5 shadow-xs space-y-4">
        <h2 className="font-bold text-base text-ink flex items-center gap-2">
          <FileText className="w-5 h-5 text-forest" />
          <span>{t("newNote")}</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("notePlaceholder")}
            className="w-full p-3.5 bg-paper border border-line rounded-2xl text-sm text-ink placeholder:text-ink-muted/70 focus:bg-surface focus:border-forest"
          />

          {/* Severity Radio Tiles */}
          <div>
            <span className="text-xs font-semibold text-ink-muted block mb-1.5">
              {t("severity")}:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSeverity("INFO")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  severity === "INFO"
                    ? "bg-forest-soft text-forest border-forest ring-1 ring-forest"
                    : "bg-paper-2 border-line text-ink"
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>{t("info")}</span>
              </button>

              <button
                type="button"
                onClick={() => setSeverity("WARNING")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  severity === "WARNING"
                    ? "bg-saffron-soft text-ink border-saffron ring-1 ring-saffron"
                    : "bg-paper-2 border-line text-ink"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-saffron" />
                <span>{t("warning")}</span>
              </button>

              <button
                type="button"
                onClick={() => setSeverity("URGENT")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  severity === "URGENT"
                    ? "bg-brick text-surface border-brick ring-1 ring-brick"
                    : "bg-paper-2 border-line text-brick"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{t("urgent")}</span>
              </button>
            </div>
          </div>

          {severity === "URGENT" && (
            <div className="p-3 bg-brick-soft border border-brick/30 rounded-xl text-xs text-brick font-semibold">
              ⚠️ {t("urgentWarning")}
            </div>
          )}

          <button
            type="submit"
            disabled={createNoteMutation.isPending || !content.trim()}
            className="w-full min-h-[48px] bg-forest hover:bg-forest-hover active:scale-95 text-surface font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
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
          </button>
        </form>
      </div>

      {/* Recent Notes Feed */}
      <div className="space-y-3 pt-2">
        <h3 className="font-bold text-base text-ink px-1">
          {t("recentNotes")} ({notes.length})
        </h3>

        {notes.map((note) => (
          <div
            key={note.id}
            className={`p-4 rounded-2xl border transition-all shadow-xs ${
              note.severity === "URGENT"
                ? "bg-brick-soft/50 border-brick/40"
                : note.severity === "WARNING"
                ? "bg-saffron-soft/40 border-saffron/40"
                : "bg-surface border-line"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
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
              <span className="text-[11px] text-ink-muted">
                {new Date(note.createdAt).toLocaleString("en-IN", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <p className="text-sm text-ink leading-relaxed font-normal">
              {note.content}
            </p>

            <div className="mt-3 pt-2.5 border-t border-line/60 flex items-center justify-between text-xs text-ink-muted">
              <span>{t("recordedBy", { name: note.caretakerName || "Caretaker" })}</span>
              {note.seenAt ? (
                <span className="flex items-center gap-1 text-ok font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  <span>{t("seenByDoctor")}</span>
                </span>
              ) : (
                <span className="text-ink-muted">{t("unseen")}</span>
              )}
            </div>
          </div>
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
