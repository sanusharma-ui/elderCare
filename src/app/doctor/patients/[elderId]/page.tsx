"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { StatGroup } from "@/components/ui/StatGroup";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressRing } from "@/components/ui/ProgressRing";
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
  Upload,
  Trash2,
  Check,
  Phone,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

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
  const adherenceRate = adherenceData?.overallPercentage ?? 0;

  function addApprovedScannedMedicine(draft: any, idx: number) {
    addScannedMedicineMutation.mutate(draft, {
      onSuccess: () => {
        setDraftMedicines((prev) => prev.filter((_, i) => i !== idx));
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/doctor/patients"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/10 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-white/80 dark:hover:bg-white/15 transition-all shadow-xs mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>मरीज निर्देशिका • Back to Patients Directory</span>
        </Link>

        {/* Patient Profile Header Card */}
        <GlassPanel variant="default" className="rounded-[32px] p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                {patient?.name?.[0] || "म"}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                    {patient?.name}
                  </h1>
                  {patient?.language && (
                    <span className="text-xs uppercase font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200/50 dark:border-blue-800/40">
                      {patient.language}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    {patient?.phone || "N/A"}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    {patient?.email || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-200/50 dark:border-white/10">
              {/* Medical Conditions Chip */}
              {patient?.elderProfile?.medicalConditions && (
                <div className="p-3 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/60 dark:border-white/10 text-xs max-w-xs">
                  <strong className="text-slate-900 dark:text-white block font-bold mb-0.5">बीमारियां • Conditions:</strong>
                  <span className="text-slate-600 dark:text-slate-300">{patient.elderProfile.medicalConditions}</span>
                </div>
              )}

              {/* Patient Adherence Progress Ring */}
              <div className="shrink-0 flex items-center gap-3">
                <ProgressRing
                  value={adherenceRate}
                  size={76}
                  strokeWidth={7}
                  label="Adherence"
                  sublabel="7-Day"
                />
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* HORIZONTAL GLASS TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { key: "overview", label: "Overview • सारांश", icon: <Activity className="w-4 h-4" /> },
          { key: "medicines", label: `Prescriptions (${medicines.length})`, icon: <Pill className="w-4 h-4" /> },
          { key: "scan", label: "AI पर्चा स्कैनर", icon: <Camera className="w-4 h-4 text-amber-500" /> },
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10 border border-white/60 dark:border-white/10"
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
          <GlassPanel variant="default" className="rounded-[32px] p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base sm:text-lg">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <span>AI 7-दिन क्लिनिकल सारांश • 7-Day Patient Brief</span>
              </div>
              <button
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["patient-ai-summary", elderId],
                  })
                }
                className="p-2 rounded-full bg-white/60 dark:bg-white/10 border border-white/60 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/15 text-slate-600 dark:text-slate-300 transition-colors"
                title="Refresh Summary"
              >
                <RefreshCw className={`w-4 h-4 ${summaryLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="p-4 sm:p-5 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/60 dark:border-white/10 text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {summaryData?.content || "लोड हो रहा है..."}
            </div>

            {summaryData?.disclaimer && (
              <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                {summaryData.disclaimer}
              </div>
            )}
          </GlassPanel>

          {/* Adherence Stats: STRICTLY NO BOXES */}
          <StatGroup
            items={[
              {
                label: "7-दिन अनुपालन दर • 7d Adherence",
                value:
                  adherenceData?.overallPercentage !== null &&
                  adherenceData?.overallPercentage !== undefined
                    ? `${adherenceData.overallPercentage}%`
                    : "—",
                color: "blue",
              },
              {
                label: "कुल खुराकें • Total Doses",
                value: adherenceData?.totalClosedDoses ?? "—",
              },
              {
                label: "छूटी खुराकें • Missed",
                value: adherenceData?.missedCount ?? 0,
                color: (adherenceData?.missedCount ?? 0) > 0 ? "danger" : "default",
              },
              {
                label: "मिस स्ट्रीक • Streak",
                value: `${adherenceData?.currentMissStreak ?? 0} d`,
                color: (adherenceData?.currentMissStreak ?? 0) > 0 ? "alert" : "default",
              },
            ]}
          />

          {/* Per-Medicine Breakdown */}
          {adherenceData?.perMedicine && adherenceData.perMedicine.length > 0 && (
            <GlassPanel variant="default" className="rounded-[32px] p-6 space-y-4">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                दवा अनुसार अनुपालन • Medicine Breakdown
              </h3>
              <div className="space-y-2.5">
                {adherenceData.perMedicine.map((med: any) => (
                  <div
                    key={med.medicineId}
                    className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/60 dark:border-white/10 flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white block">
                        {med.medicineName}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                        कुल: {med.total} • ली गई: {med.taken + med.given} • छूटी: {med.missed}
                      </span>
                    </div>
                    <span className="font-black text-lg text-blue-600 dark:text-blue-400">
                      {med.adherencePercentage !== null ? `${med.adherencePercentage}%` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </GlassPanel>
          )}
        </div>
      )}

      {/* 2. MEDICINES TAB */}
      {activeTab === "medicines" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">
              सक्रिय दवाइयां • Prescriptions
            </h2>
            <PrimaryButton
              variant="primary"
              size="sm"
              onClick={() => setAddMedOpen(true)}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>दवा जोड़ें • Add Medicine</span>
            </PrimaryButton>
          </div>

          <div className="space-y-3">
            {medicines.map((med: any) => (
              <GlassPanel
                key={med.id}
                variant="default"
                className="rounded-[28px] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Pill className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2.5">
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                        {med.name}
                      </h3>
                      {med.nameLocal && (
                        <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                          ({med.nameLocal})
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                      {med.dosage} • {med.form} • {med.foodRelation}
                    </span>
                    {med.warnings && (
                      <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        सावधानी: {med.warnings}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="text-right text-xs">
                    <span className="font-black text-slate-900 dark:text-white block text-sm">
                      {med.stockCount ?? "—"} खुराक बाकी
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">
                      सीमा: {med.refillThreshold ?? 5}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Stop prescription for ${med.name}?`)) {
                        stopMedicineMutation.mutate(med.id);
                      }
                    }}
                    className="p-2.5 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Stop Medicine"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </GlassPanel>
            ))}

            {medicines.length === 0 && (
              <EmptyState
                title="कोई दवा नहीं है"
                description="इस मरीज के लिए अभी कोई दवा नहीं लिखी गई है।"
              />
            )}
          </div>
        </div>
      )}

      {/* 3. AI PRESCRIPTION SCANNER TAB */}
      {activeTab === "scan" && (
        <GlassPanel variant="default" className="rounded-[32px] p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                Google Gemini Vision पर्चा स्कैनर
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                हस्तलिखित या प्रिंटेड पर्चे की तस्वीर अपलोड करें। AI दवा का नाम, खुराक और समय निकालकर ड्राफ्ट तैयार करेगा। पुष्टि करने के बाद ही दवा सहेजी जाएगी।
              </p>
            </div>
          </div>

          {/* Upload Zone */}
          <div className="border-2 border-dashed border-slate-300 dark:border-white/20 rounded-3xl p-8 text-center space-y-4 bg-white/40 dark:bg-white/5">
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
              className="cursor-pointer inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-sm rounded-full shadow-md hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>पर्चे की फोटो अपलोड करें • Upload Prescription</span>
            </label>

            {scanFile && (
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-2">
                चयनित फ़ाइल: <strong className="text-slate-800 dark:text-slate-200">{scanFile.name}</strong>
              </span>
            )}
          </div>

          {scanMutation.isPending && (
            <div className="p-8 bg-white/40 dark:bg-white/5 rounded-3xl text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Gemini AI पर्चे का विश्लेषण कर रहा है...
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                हस्तलिखित दवाओं और समय को पहचाना जा रहा है।
              </p>
            </div>
          )}

          {/* Extracted Drafts Review List */}
          {draftMedicines.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200/60 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    निकाली गई दवाइयां • Extracted AI Drafts ({draftMedicines.length})
                  </h3>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    ⚠️ AI ड्राफ्ट: कृपया जोड़ने से पहले मात्रा व खुराक की पुष्टि करें।
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {draftMedicines.map((draft, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/60 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {draft.name}
                      </h4>
                      {draft.nameLocal && (
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 block">
                          {draft.nameLocal}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                        खुराक: {draft.dosage} • {draft.form} • {draft.foodRelation}
                      </span>
                      {draft.instructions && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          निर्देश: {draft.instructions}
                        </p>
                      )}
                    </div>

                    <PrimaryButton
                      variant="primary"
                      size="sm"
                      onClick={() => addApprovedScannedMedicine(draft, idx)}
                      disabled={addScannedMedicineMutation.isPending}
                      className="gap-1.5 shrink-0"
                    >
                      <Check className="w-4 h-4" />
                      <span>स्वीकृत कर जोड़ें • Approve</span>
                    </PrimaryButton>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassPanel>
      )}

      {/* 4. APPOINTMENTS TAB */}
      {activeTab === "appointments" && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">
            डॉक्टर अपॉइंटमेंट • Visits
          </h2>
          <div className="space-y-3">
            {appointments.map((apt: any) => (
              <GlassPanel
                key={apt.id}
                variant="default"
                className="rounded-[28px] p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {apt.title}
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                    तारीख: {new Date(apt.scheduledAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  {apt.location && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 block mt-1">
                      स्थान: {apt.location}
                    </span>
                  )}
                </div>
                <StatusBadge
                  variant={apt.status === "SCHEDULED" ? "ok" : "neutral"}
                  label={apt.status}
                />
              </GlassPanel>
            ))}
            {appointments.length === 0 && (
              <EmptyState
                title="कोई अपॉइंटमेंट नहीं"
                description="इस मरीज का कोई सक्रिय अपॉइंटमेंट नहीं है।"
              />
            )}
          </div>
        </div>
      )}

      {/* 5. NOTES TAB */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">
            केयरटेकर नोट्स • Clinical Observations
          </h2>
          <div className="space-y-3">
            {notes.map((note: any) => (
              <GlassPanel
                key={note.id}
                variant="default"
                className="rounded-[28px] p-5 space-y-3"
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
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {note.content}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200/50 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                  <span>दर्जकर्ता: {note.caretakerName || "केयरटेकर"}</span>
                  {note.seenAt ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      ✓ देखा गया ({new Date(note.seenAt).toLocaleDateString()})
                    </span>
                  ) : (
                    <PrimaryButton
                      variant="primary"
                      size="sm"
                      onClick={() => markNoteSeenMutation.mutate(note.id)}
                      disabled={markNoteSeenMutation.isPending}
                    >
                      देखा हुआ मार्क करें • Mark Seen
                    </PrimaryButton>
                  )}
                </div>
              </GlassPanel>
            ))}
            {notes.length === 0 && (
              <EmptyState
                title="कोई नोट नहीं है"
                description="केयरटेकर द्वारा कोई नोट दर्ज नहीं किया गया है।"
              />
            )}
          </div>
        </div>
      )}

      {/* 6. DOSE HISTORY TAB */}
      {activeTab === "doses" && (
        <GlassPanel variant="default" className="rounded-[32px] p-6 space-y-4">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">
            खुराक इतिहास • Dose Logs Audit
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase">
                  <th className="py-3 px-3">दवा • Medicine</th>
                  <th className="py-3 px-3">निर्धारित समय</th>
                  <th className="py-3 px-3">स्थिति</th>
                  <th className="py-3 px-3">दर्ज समय</th>
                  <th className="py-3 px-3">दर्जकर्ता</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-white/5">
                {doses.map((d: any) => (
                  <tr key={d.id} className="hover:bg-white/40 dark:hover:bg-white/5">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {d.medicine?.name || "दवा"}
                    </td>
                    <td className="py-3 px-3 tabular-nums text-slate-600 dark:text-slate-300">
                      {new Date(d.scheduledFor).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge
                        variant={
                          d.status === "TAKEN" || d.status === "GIVEN"
                            ? "ok"
                            : d.status === "MISSED"
                            ? "missed"
                            : "neutral"
                        }
                        label={d.status}
                      />
                    </td>
                    <td className="py-3 px-3 tabular-nums text-slate-600 dark:text-slate-300">
                      {d.markedAt
                        ? new Date(d.markedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      {d.markedByRole || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {doses.length === 0 && (
              <p className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
                कोई खुराक इतिहास नहीं मिला।
              </p>
            )}
          </div>
        </GlassPanel>
      )}

      {/* 7. AUDIT & CIRCLE TAB */}
      {activeTab === "audit" && (
        <GlassPanel variant="default" className="rounded-[32px] p-6 space-y-4">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">
            ऑडिट टाइमलाइन • Audit Trail Timeline
          </h2>
          <div className="space-y-3">
            {audits.map((a: any) => (
              <div
                key={a.id}
                className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/60 dark:border-white/10 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 uppercase">
                    {a.action}
                  </span>
                  <span className="tabular-nums">
                    {new Date(a.createdAt).toLocaleString("en-IN", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <div className="text-slate-900 dark:text-white font-medium">
                  {a.actor?.name || "सिस्टम"} ({a.actor?.role || "SYSTEM"}) • {a.resourceType}
                </div>
              </div>
            ))}
            {audits.length === 0 && (
              <p className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
                कोई ऑडिट रिकॉर्ड उपलब्ध नहीं है।
              </p>
            )}
          </div>
        </GlassPanel>
      )}

      {/* BOTTOM SHEET FOR ADDING A MEDICINE */}
      <BottomSheet
        isOpen={addMedOpen}
        onClose={() => setAddMedOpen(false)}
        title="नई दवा लिखें • Prescribe Medicine"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMedicineMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              दवा का नाम • Medicine Name *
            </label>
            <input
              type="text"
              required
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              placeholder="e.g. Metformin 500mg"
              className="w-full min-h-[44px] px-3.5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              स्थानीय नाम • Local Name (Hindi/Marathi)
            </label>
            <input
              type="text"
              value={medNameLocal}
              onChange={(e) => setMedNameLocal(e.target.value)}
              placeholder="e.g. मेटफॉर्मिन (शुगर की गोली)"
              className="w-full min-h-[44px] px-3.5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                मात्रा • Dosage *
              </label>
              <input
                type="text"
                required
                value={medDosage}
                onChange={(e) => setMedDosage(e.target.value)}
                placeholder="500 mg"
                className="w-full min-h-[44px] px-3.5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                प्रकार • Form
              </label>
              <select
                value={medForm}
                onChange={(e) => setMedForm(e.target.value)}
                className="w-full min-h-[44px] px-3 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="TABLET" className="dark:bg-slate-900">Tablet (गोली)</option>
                <option value="CAPSULE" className="dark:bg-slate-900">Capsule</option>
                <option value="SYRUP" className="dark:bg-slate-900">Syrup</option>
                <option value="INJECTION" className="dark:bg-slate-900">Injection</option>
                <option value="DROPS" className="dark:bg-slate-900">Drops</option>
                <option value="INHALER" className="dark:bg-slate-900">Inhaler</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                भोजन संबंध • Food Relation
              </label>
              <select
                value={medFood}
                onChange={(e) => setMedFood(e.target.value)}
                className="w-full min-h-[44px] px-3 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="AFTER_FOOD" className="dark:bg-slate-900">खाने के बाद (After Food)</option>
                <option value="BEFORE_FOOD" className="dark:bg-slate-900">खाने से पहले (Before Food)</option>
                <option value="WITH_FOOD" className="dark:bg-slate-900">खाने के साथ (With Food)</option>
                <option value="ANYTIME" className="dark:bg-slate-900">किसी भी समय (Anytime)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                समय • Time *
              </label>
              <input
                type="time"
                required
                value={medTime}
                onChange={(e) => setMedTime(e.target.value)}
                className="w-full min-h-[44px] px-3.5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              चेतावनी • Warning (what NOT to do)
            </label>
            <input
              type="text"
              value={medWarnings}
              onChange={(e) => setMedWarnings(e.target.value)}
              placeholder="जैसे: खाली पेट न लें।"
              className="w-full min-h-[44px] px-3.5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                स्टॉक संख्या • Stock Count
              </label>
              <input
                type="number"
                value={medStock}
                onChange={(e) => setMedStock(e.target.value)}
                className="w-full min-h-[44px] px-3.5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                अलर्ट सीमा • Refill Threshold
              </label>
              <input
                type="number"
                value={medRefill}
                onChange={(e) => setMedRefill(e.target.value)}
                className="w-full min-h-[44px] px-3.5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          <PrimaryButton
            type="submit"
            variant="primary"
            disabled={createMedicineMutation.isPending}
            className="w-full mt-2"
          >
            {createMedicineMutation.isPending ? "सहेजा जा रहा है..." : "दवा सहेजें • Save Prescription"}
          </PrimaryButton>
        </form>
      </BottomSheet>
    </div>
  );
}
