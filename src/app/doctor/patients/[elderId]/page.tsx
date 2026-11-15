"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { BottomSheet } from "@/components/shared/BottomSheet";
import {
  ArrowLeft,
  Sparkles,
  Activity,
  Pill,
  Camera,
  Calendar,
  FileText,
  Clock,
  ShieldCheck,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Send,
  Trash2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { formatTime24to12 } from "@/lib/utils";

type TabKey =
  | "overview"
  | "medicines"
  | "scan"
  | "appointments"
  | "notes"
  | "doses"
  | "audit";

export default function DoctorPatientDetailPage({
  params,
}: {
  params: Promise<{ elderId: string }>;
}) {
  const { elderId } = use(params);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Fetch Patient Profile
  const { data: elderData, isLoading: elderLoading } = useQuery<any>({
    queryKey: ["doctor-patient", elderId],
    queryFn: () => apiClient<any>(`/api/elders/${elderId}`),
  });

  // Fetch 7-day Adherence Analytics
  const { data: adherenceData } = useQuery<any>({
    queryKey: ["patient-adherence", elderId],
    queryFn: () => apiClient<any>(`/api/elders/${elderId}/adherence?days=7`),
  });

  // Fetch AI Patient Summary
  const { data: summaryData, isFetching: summaryLoading } = useQuery<any>({
    queryKey: ["patient-ai-summary", elderId],
    queryFn: () => apiClient<any>(`/api/doctor/elders/${elderId}/summary`),
  });

  // Fetch Active Prescriptions
  const { data: medicinesData } = useQuery<any>({
    queryKey: ["patient-medicines", elderId],
    queryFn: () => apiClient<any>(`/api/elders/${elderId}/medicines`),
  });

  // Fetch Appointments
  const { data: appointmentsData } = useQuery<any>({
    queryKey: ["patient-appointments", elderId],
    queryFn: () => apiClient<any>(`/api/elders/${elderId}/appointments`),
  });

  // Fetch Caretaker Notes
  const { data: notesData } = useQuery<any>({
    queryKey: ["patient-notes", elderId],
    queryFn: () => apiClient<any>(`/api/elders/${elderId}/notes`),
  });

  // Fetch Dose History Logs
  const { data: dosesData } = useQuery<any>({
    queryKey: ["patient-doses", elderId],
    queryFn: () => apiClient<any>(`/api/elders/${elderId}/doses?limit=25`),
  });

  // Fetch Care Circle & Audit Log
  const { data: auditData } = useQuery<any>({
    queryKey: ["patient-audit", elderId],
    queryFn: () => apiClient<any>(`/api/elders/${elderId}/audit-log?limit=20`),
  });

  // --- MUTATIONS ---

  // 1. Mark Urgent Note as Seen
  const markNoteSeenMutation = useMutation({
    mutationFn: (noteId: string) =>
      apiClient(`/api/notes/${noteId}/seen`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-notes", elderId] });
      queryClient.invalidateQueries({ queryKey: ["doctor-dashboard-metrics"] });
      toast.success("नोट देखा हुआ मार्क किया गया!");
    },
  });

  // 2. Stop/Delete Medicine
  const stopMedicineMutation = useMutation({
    mutationFn: (medicineId: string) =>
      apiClient(`/api/medicines/${medicineId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-medicines", elderId] });
      toast.success("दवा बंद कर दी गई (Medicine stopped)");
    },
  });

  // --- PRESCRIPTION SCAN STATE ---
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [draftMedicines, setDraftMedicines] = useState<any[]>([]);

  const scanMutation = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await fileToBase64(file);
      return apiClient<any>(`/api/doctor/elders/${elderId}/prescription-scan`, {
        method: "POST",
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type || "image/jpeg",
        }),
      });
    },
    onSuccess: (res) => {
      setDraftMedicines(res.drafts || []);
      toast.success("पर्चे से दवाइयों का ड्राफ्ट तैयार हो गया!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Prescription scan failed");
    },
  });

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data:image/...;base64,
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });

  // Add Approved Scanned Medicine
  const addScannedMedicineMutation = useMutation({
    mutationFn: (draft: any) =>
      apiClient(`/api/elders/${elderId}/medicines`, {
        method: "POST",
        body: JSON.stringify({
          ...draft,
          startDate: new Date().toISOString().split("T")[0],
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-medicines", elderId] });
      toast.success("दवा सफलतापूर्वक जोड़ी गई!");
    },
  });

  // --- ADD MEDICINE SHEET STATE ---
  const [addMedOpen, setAddMedOpen] = useState(false);
  const [medName, setMedName] = useState("");
  const [medNameLocal, setMedNameLocal] = useState("");
  const [medDosage, setMedDosage] = useState("500 mg");
  const [medForm, setMedForm] = useState("TABLET");
  const [medFood, setMedFood] = useState("AFTER_FOOD");
  const [medTime, setMedTime] = useState("08:00");
  const [medQuantity, setMedQuantity] = useState("1 tablet");
  const [medInstructions, setMedInstructions] = useState("");
  const [medWarnings, setMedWarnings] = useState("");
  const [medStock, setMedStock] = useState("30");
  const [medRefill, setMedRefill] = useState("5");

  const createMedicineMutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/elders/${elderId}/medicines`, {
        method: "POST",
        body: JSON.stringify({
          name: medName.trim(),
          nameLocal: medNameLocal.trim() || undefined,
          dosage: medDosage.trim(),
          form: medForm,
          foodRelation: medFood,
          instructions: medInstructions.trim() || undefined,
          warnings: medWarnings.trim() || undefined,
          startDate: new Date().toISOString().split("T")[0],
          stockCount: parseInt(medStock, 10) || undefined,
          refillThreshold: parseInt(medRefill, 10) || undefined,
          schedules: [
            {
              timeOfDay: medTime,
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
              doseQuantity: medQuantity,
            },
          ],
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-medicines", elderId] });
      setAddMedOpen(false);
      setMedName("");
      setMedNameLocal("");
      toast.success("नई दवा जोड़ी गई!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add medicine");
    },
  });

  const patient = elderData;
  const medicines = medicinesData?.items || [];
  const appointments = appointmentsData?.items || [];
  const notes = notesData?.items || [];
  const doses = dosesData?.items || [];
  const audits = auditData?.items || [];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Patient Header */}
      <div>
        <Link
          href="/doctor/patients"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:underline mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>मरीज निर्देशिका • Back to Patients Directory</span>
        </Link>

        <div className="bg-surface border border-line rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-forest-soft text-forest font-bold text-2xl flex items-center justify-center shrink-0">
              {patient?.name?.[0] || "म"}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink leading-tight">
                  {patient?.name}
                </h1>
                <span className="text-xs uppercase font-bold text-forest bg-forest-soft px-2.5 py-0.5 rounded-full">
                  {patient?.language}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-ink-muted mt-1">
                फ़ोन: {patient?.phone || "N/A"} • ईमेल: {patient?.email || "N/A"}
              </p>
            </div>
          </div>

          {/* Quick Conditions Chip */}
          {patient?.elderProfile?.medicalConditions && (
            <div className="p-2.5 bg-paper rounded-xl border border-line text-xs max-w-sm">
              <strong className="text-ink">बीमारियां: </strong>
              <span className="text-ink-muted">{patient.elderProfile.medicalConditions}</span>
            </div>
          )}
        </div>
      </div>

      {/* HORIZONTAL LEDGER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-line">
        {[
          { key: "overview", label: "Overview • सारांश", icon: <Activity className="w-4 h-4" /> },
          { key: "medicines", label: `Prescriptions (${medicines.length})`, icon: <Pill className="w-4 h-4" /> },
          { key: "scan", label: "AI पर्चा स्कैनर", icon: <Camera className="w-4 h-4 text-saffron" /> },
          { key: "appointments", label: `Visits (${appointments.length})`, icon: <Calendar className="w-4 h-4" /> },
          { key: "notes", label: `Notes (${notes.length})`, icon: <FileText className="w-4 h-4" /> },
          { key: "doses", label: "Dose Log", icon: <Clock className="w-4 h-4" /> },
          { key: "audit", label: "Circle & Audit", icon: <ShieldCheck className="w-4 h-4" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-forest text-surface shadow-xs"
                  : "bg-surface hover:bg-paper-2 text-ink-muted border border-line"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* AI Patient Summary Card */}
          <div className="bg-surface border-2 border-forest/30 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-forest font-bold text-base">
                <Sparkles className="w-5 h-5 text-saffron" />
                <span>AI 7-दिन क्लिनिकल सारांश • 7-Day Patient Brief</span>
              </div>
              <button
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["patient-ai-summary", elderId],
                  })
                }
                className="p-1.5 rounded-lg border border-line hover:bg-paper text-ink-muted"
                title="Refresh Summary"
              >
                <RefreshCw className={`w-4 h-4 ${summaryLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="p-4 bg-paper rounded-2xl border border-line text-sm text-ink leading-relaxed whitespace-pre-line">
              {summaryData?.content || "लोड हो रहा है..."}
            </div>

            <div className="text-[11px] text-ink-muted italic">
              {summaryData?.disclaimer}
            </div>
          </div>

          {/* Adherence Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface border border-line rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-ink-muted block uppercase">7-दिन अनुपालन दर</span>
              <span className="text-3xl font-extrabold text-forest mt-1 block">
                {adherenceData?.overallPercentage !== null
                  ? `${adherenceData?.overallPercentage}%`
                  : "—"}
              </span>
            </div>

            <div className="bg-surface border border-line rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-ink-muted block uppercase">कुल खुराकें (7 दिन)</span>
              <span className="text-3xl font-extrabold text-ink mt-1 block">
                {adherenceData?.totalClosedDoses ?? "—"}
              </span>
            </div>

            <div className="bg-surface border border-line rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-ink-muted block uppercase">छूटी खुराकें (Missed)</span>
              <span className="text-3xl font-extrabold text-brick mt-1 block">
                {adherenceData?.missedCount ?? 0}
              </span>
            </div>

            <div className="bg-surface border border-line rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-ink-muted block uppercase">लगातार मिस स्ट्रीक</span>
              <span className="text-3xl font-extrabold text-saffron mt-1 block">
                {adherenceData?.currentMissStreak ?? 0} दिन
              </span>
            </div>
          </div>

          {/* Per-Medicine Breakdown */}
          {adherenceData?.perMedicine && adherenceData.perMedicine.length > 0 && (
            <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-base text-ink">दवा अनुसार अनुपालन • Medicine Breakdown</h3>
              <div className="space-y-2">
                {adherenceData.perMedicine.map((med: any) => (
                  <div key={med.medicineId} className="p-3 bg-paper rounded-xl border border-line flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-ink block">{med.medicineName}</span>
                      <span className="text-xs text-ink-muted">कुल: {med.total} • ली गई: {med.taken + med.given} • छूटी: {med.missed}</span>
                    </div>
                    <span className="font-extrabold text-base text-forest">
                      {med.adherencePercentage !== null ? `${med.adherencePercentage}%` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. MEDICINES TAB */}
      {activeTab === "medicines" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-ink">सक्रिय दवाइयां • Prescriptions</h2>
            <button
              onClick={() => setAddMedOpen(true)}
              className="px-4 py-2 bg-forest text-surface font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-forest-hover shadow-xs active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>दवा जोड़ें • Add Medicine</span>
            </button>
          </div>

          <div className="space-y-3">
            {medicines.map((med: any) => (
              <div key={med.id} className="bg-surface border border-line rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-forest-soft text-forest flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-bold text-ink text-lg">{med.name}</h3>
                      {med.nameLocal && <span className="font-semibold text-forest text-sm">({med.nameLocal})</span>}
                    </div>
                    <span className="text-xs text-ink-muted block mt-0.5">
                      {med.dosage} • {med.form} • {med.foodRelation}
                    </span>
                    {med.warnings && (
                      <span className="text-xs font-semibold text-brick mt-1 block">
                        सावधानी: {med.warnings}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <span className="font-bold text-ink block">{med.stockCount ?? "—"} खुराक बाकी</span>
                    <span className="text-ink-muted">सीमा: {med.refillThreshold ?? 5}</span>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Stop prescription for ${med.name}?`)) {
                        stopMedicineMutation.mutate(med.id);
                      }
                    }}
                    className="p-2 text-ink-muted hover:text-brick rounded-lg hover:bg-brick-soft transition-colors"
                    title="Stop Medicine"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {medicines.length === 0 && (
              <EmptyState title="कोई दवा नहीं है" description="इस मरीज के लिए अभी कोई दवा नहीं लिखी गई है।" />
            )}
          </div>
        </div>
      )}

      {/* 3. AI PRESCRIPTION SCANNER TAB */}
      {activeTab === "scan" && (
        <div className="bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-saffron-soft text-saffron flex items-center justify-center shrink-0">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                Google Gemini Vision पर्चा स्कैनर
              </h2>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                हस्तलिखित या प्रिंटेड पर्चे की तस्वीर अपलोड करें। AI दवा का नाम, खुराक और समय निकालकर ड्राफ्ट तैयार करेगा। पुष्टि करने के बाद ही दवा सहेजी जाएगी।
              </p>
            </div>
          </div>

          {/* Upload Zone */}
          <div className="border-2 border-dashed border-line rounded-2xl p-6 text-center space-y-3 bg-paper">
            <input
              type="file"
              accept="image/*"
              id="prescription-file-input"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setScanFile(file);
                  setScanPreview(URL.createObjectURL(file));
                  scanMutation.mutate(file);
                }
              }}
            />
            <label
              htmlFor="prescription-file-input"
              className="cursor-pointer inline-flex items-center gap-2 px-5 py-3 bg-forest text-surface font-bold text-sm rounded-xl hover:bg-forest-hover shadow-xs active:scale-95 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>पर्चे की फोटो अपलोड करें • Upload Prescription</span>
            </label>

            {scanFile && (
              <span className="text-xs text-ink-muted block mt-2">
                चयनित फ़ाइल: <strong>{scanFile.name}</strong>
              </span>
            )}
          </div>

          {scanMutation.isPending && (
            <div className="p-6 bg-paper-2 rounded-2xl text-center space-y-2">
              <div className="w-8 h-8 border-3 border-forest border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-ink">Gemini AI पर्चे का विश्लेषण कर रहा है...</p>
              <p className="text-xs text-ink-muted">हस्तलिखित दवाओं और समय को पहचाना जा रहा है।</p>
            </div>
          )}

          {/* Extracted Drafts Review List */}
          {draftMedicines.length > 0 && (
            <div className="space-y-4 pt-3 border-t border-line">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-ink">
                    निकाली गई दवाइयां • Extracted AI Drafts ({draftMedicines.length})
                  </h3>
                  <span className="text-xs font-semibold text-saffron">
                    ⚠️ AI ड्राफ्ट: कृपया जोड़ने से पहले मात्रा व खुराक की पुष्टि करें।
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {draftMedicines.map((draft, idx) => (
                  <div key={idx} className="p-4 bg-paper rounded-2xl border border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-ink text-base">{draft.name}</h4>
                      {draft.nameLocal && <span className="text-xs font-semibold text-forest block">{draft.nameLocal}</span>}
                      <span className="text-xs text-ink-muted mt-1 block">
                        खुराक: {draft.dosage} • {draft.form} • {draft.foodRelation}
                      </span>
                      {draft.instructions && (
                        <p className="text-xs text-ink-muted mt-1">निर्देश: {draft.instructions}</p>
                      )}
                    </div>

                    <button
                      onClick={() => addApprovedScannedMedicine(draft, idx)}
                      disabled={addScannedMedicineMutation.isPending}
                      className="px-4 py-2 bg-forest text-surface font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-forest-hover shadow-xs active:scale-95 shrink-0"
                    >
                      <Check className="w-4 h-4" />
                      <span>स्वीकृत कर जोड़ें • Approve & Add</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. APPOINTMENTS TAB */}
      {activeTab === "appointments" && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg text-ink">डॉक्टर अपॉइंटमेंट • Visits</h2>
          <div className="space-y-3">
            {appointments.map((apt: any) => (
              <div key={apt.id} className="bg-surface border border-line rounded-2xl p-5 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-ink text-base">{apt.title}</h3>
                  <span className="text-xs text-ink-muted mt-0.5 block">
                    तारीख: {new Date(apt.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                  {apt.location && <span className="text-xs text-forest block mt-1">स्थान: {apt.location}</span>}
                </div>
                <StatusBadge variant={apt.status === "SCHEDULED" ? "ok" : "neutral"} label={apt.status} />
              </div>
            ))}
            {appointments.length === 0 && (
              <EmptyState title="कोई अपॉइंटमेंट नहीं" description="इस मरीज का कोई सक्रिय अपॉइंटमेंट नहीं है।" />
            )}
          </div>
        </div>
      )}

      {/* 5. NOTES TAB */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg text-ink">केयरटेकर नोट्स • Clinical Observations</h2>
          <div className="space-y-3">
            {notes.map((note: any) => (
              <div
                key={note.id}
                className={`p-4 rounded-2xl border shadow-xs ${
                  note.severity === "URGENT"
                    ? "bg-brick-soft/50 border-brick/40"
                    : note.severity === "WARNING"
                    ? "bg-saffron-soft/40 border-saffron/40"
                    : "bg-surface border-line"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <StatusBadge
                    variant={note.severity === "URGENT" ? "urgent" : note.severity === "WARNING" ? "warning" : "neutral"}
                    label={note.severity}
                  />
                  <span className="text-xs text-ink-muted">
                    {new Date(note.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>

                <p className="text-sm text-ink mb-3 leading-relaxed">{note.content}</p>

                <div className="flex items-center justify-between pt-2 border-t border-line/60 text-xs text-ink-muted">
                  <span>दर्जकर्ता: {note.caretakerName || "केयरटेकर"}</span>
                  {note.seenAt ? (
                    <span className="text-ok font-semibold">✓ देखा गया ({new Date(note.seenAt).toLocaleDateString()})</span>
                  ) : (
                    <button
                      onClick={() => markNoteSeenMutation.mutate(note.id)}
                      disabled={markNoteSeenMutation.isPending}
                      className="px-3 py-1 bg-forest text-surface font-bold text-xs rounded-lg active:scale-95"
                    >
                      देखा हुआ मार्क करें • Mark Seen
                    </button>
                  )}
                </div>
              </div>
            ))}
            {notes.length === 0 && (
              <EmptyState title="कोई नोट नहीं है" description="केयरटेकर द्वारा कोई नोट दर्ज नहीं किया गया है।" />
            )}
          </div>
        </div>
      )}

      {/* 6. DOSE HISTORY TAB */}
      {activeTab === "doses" && (
        <div className="bg-surface border border-line rounded-3xl p-5 shadow-xs space-y-4">
          <h2 className="font-bold text-lg text-ink">खुराक इतिहास • Dose Logs Audit</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-line text-ink-muted font-bold uppercase">
                  <th className="py-2.5 px-3">दवा • Medicine</th>
                  <th className="py-2.5 px-3">निर्धारित समय</th>
                  <th className="py-2.5 px-3">स्थिति</th>
                  <th className="py-2.5 px-3">दर्ज समय</th>
                  <th className="py-2.5 px-3">दर्जकर्ता</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {doses.map((d: any) => (
                  <tr key={d.id} className="hover:bg-paper">
                    <td className="py-2.5 px-3 font-semibold text-ink">{d.medicine?.name || "दवा"}</td>
                    <td className="py-2.5 px-3 tabular-nums">
                      {new Date(d.scheduledFor).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge
                        variant={d.status === "TAKEN" || d.status === "GIVEN" ? "ok" : d.status === "MISSED" ? "missed" : "neutral"}
                        label={d.status}
                      />
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">
                      {d.markedAt ? new Date(d.markedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-ink-muted">{d.markedByRole || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {doses.length === 0 && (
              <p className="text-center py-6 text-xs text-ink-muted">कोई खुराक इतिहास नहीं मिला।</p>
            )}
          </div>
        </div>
      )}

      {/* 7. AUDIT & CIRCLE TAB */}
      {activeTab === "audit" && (
        <div className="bg-surface border border-line rounded-3xl p-5 shadow-xs space-y-4">
          <h2 className="font-bold text-lg text-ink">ऑडिट टाइमलाइन • Audit Trail Timeline</h2>
          <div className="space-y-3">
            {audits.map((a: any) => (
              <div key={a.id} className="p-3 bg-paper rounded-xl border border-line text-xs space-y-1">
                <div className="flex items-center justify-between text-ink-muted">
                  <span className="font-bold text-forest uppercase">{a.action}</span>
                  <span className="tabular-nums">
                    {new Date(a.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
                <div className="text-ink font-medium">
                  {a.actor?.name || "सिस्टम"} ({a.actor?.role || "SYSTEM"}) • {a.resourceType}
                </div>
              </div>
            ))}
            {audits.length === 0 && (
              <p className="text-center py-6 text-xs text-ink-muted">कोई ऑडिट रिकॉर्ड उपलब्ध नहीं है।</p>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM SHEET FOR ADDING A MEDICINE */}
      <BottomSheet isOpen={addMedOpen} onClose={() => setAddMedOpen(false)} title="नई दवा लिखें • Prescribe Medicine">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMedicineMutation.mutate();
          }}
          className="space-y-3.5"
        >
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">दवा का नाम • Medicine Name *</label>
            <input
              type="text"
              required
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              placeholder="e.g. Metformin 500mg"
              className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">स्थानीय नाम • Local Name (Hindi/Marathi)</label>
            <input
              type="text"
              value={medNameLocal}
              onChange={(e) => setMedNameLocal(e.target.value)}
              placeholder="e.g. मेटफॉर्मिन (शुगर की गोली)"
              className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">मात्रा • Dosage *</label>
              <input
                type="text"
                required
                value={medDosage}
                onChange={(e) => setMedDosage(e.target.value)}
                placeholder="500 mg"
                className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">प्रकार • Form</label>
              <select
                value={medForm}
                onChange={(e) => setMedForm(e.target.value)}
                className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
              >
                <option value="TABLET">Tablet (गोली)</option>
                <option value="CAPSULE">Capsule</option>
                <option value="SYRUP">Syrup</option>
                <option value="INJECTION">Injection</option>
                <option value="DROPS">Drops</option>
                <option value="INHALER">Inhaler</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">भोजन संबंध • Food Relation</label>
              <select
                value={medFood}
                onChange={(e) => setMedFood(e.target.value)}
                className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
              >
                <option value="AFTER_FOOD">खाने के बाद (After Food)</option>
                <option value="BEFORE_FOOD">खाने से पहले (Before Food)</option>
                <option value="WITH_FOOD">खाने के साथ (With Food)</option>
                <option value="ANYTIME">किसी भी समय (Anytime)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">समय • Time *</label>
              <input
                type="time"
                required
                value={medTime}
                onChange={(e) => setMedTime(e.target.value)}
                className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">चेतावनी • Warning (what NOT to do)</label>
            <input
              type="text"
              value={medWarnings}
              onChange={(e) => setMedWarnings(e.target.value)}
              placeholder="जैसे: खाली पेट न लें।"
              className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">स्टॉक संख्या • Stock Count</label>
              <input
                type="number"
                value={medStock}
                onChange={(e) => setMedStock(e.target.value)}
                className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">अलर्ट सीमा • Refill Threshold</label>
              <input
                type="number"
                value={medRefill}
                onChange={(e) => setMedRefill(e.target.value)}
                className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createMedicineMutation.isPending}
            className="w-full min-h-[48px] bg-forest text-surface font-bold rounded-xl mt-3 hover:bg-forest-hover active:scale-95 transition-all shadow-xs"
          >
            {createMedicineMutation.isPending ? "सहेजा जा रहा है..." : "दवा सहेजें • Save Prescription"}
          </button>
        </form>
      </BottomSheet>
    </div>
  );

  function addApprovedScannedMedicine(draft: any, idx: number) {
    addScannedMedicineMutation.mutate(draft, {
      onSuccess: () => {
        setDraftMedicines((prev) => prev.filter((_, i) => i !== idx));
      },
    });
  }
}
