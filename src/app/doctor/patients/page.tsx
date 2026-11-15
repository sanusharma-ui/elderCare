"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { RedeemInviteModal } from "@/components/doctor/RedeemInviteModal";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import {
  Users,
  Search,
  UserPlus,
  Calendar,
  Pill,
  ChevronRight,
  Phone,
  Clock,
  KeyRound,
} from "lucide-react";

interface DoctorPatientItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  language: string;
  activeMedicineCount: number;
  nextAppointment?: { scheduledAt: string; title: string; id: string } | null;
  nextAppointmentAt?: string | null;
  linkedAt: string;
  elderProfile?: {
    gender?: string | null;
    medicalConditions?: string | null;
    timezone?: string;
  } | null;
}

export default function DoctorPatientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [redeemOpen, setRedeemOpen] = useState(false);

  const { data, isLoading } = useQuery<{
    items: DoctorPatientItem[];
    meta: { total: number; totalPages: number; page: number };
  }>({
    queryKey: ["doctor-patients", page, searchTerm],
    queryFn: async () => {
      const res = await apiClient<any>(
        `/api/doctor/elders?page=${page}&limit=12${
          searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ""
        }`
      );
      return {
        items: res,
        meta: { total: res.length, totalPages: 1, page },
      };
    },
  });

  const patients = data?.items || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
            Directory
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            मरीज निर्देशिका • Patients Directory
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            आपके क्लिनिक से जुड़े समस्त बुजुर्ग मरीजों की सूची व स्वास्थ्य प्रोफाइल
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PrimaryButton
            variant="secondary"
            size="md"
            onClick={() => setRedeemOpen(true)}
            className="gap-2"
          >
            <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>पासकोड रिडीम करें</span>
          </PrimaryButton>

          <Link href="/doctor/patients/new">
            <PrimaryButton variant="primary" size="md" className="gap-2">
              <UserPlus className="w-4 h-4" />
              <span>नया मरीज पंजीकृत करें</span>
            </PrimaryButton>
          </Link>
        </div>
      </div>

      {/* Glass Search Pill */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 absolute left-4 top-3.5 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          placeholder="नाम, फ़ोन या ईमेल से खोजें..."
          className="w-full min-h-[48px] pl-12 pr-4 bg-white/70 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-full text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-xs"
        />
      </div>

      {/* Grid of Patient Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <>
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
          </>
        ) : (
          patients.map((patient) => (
            <Link
              key={patient.id}
              href={`/doctor/patients/${patient.id}`}
              className="block group"
            >
              <GlassPanel
                variant="interactive"
                className="rounded-[28px] p-6 flex flex-col justify-between h-full space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                        {patient.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                          {patient.name}
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span>{patient.phone || patient.email || "No direct phone"}</span>
                        </span>
                      </div>
                    </div>

                    <span className="text-xs uppercase font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200/50 dark:border-blue-800/40">
                      {patient.language}
                    </span>
                  </div>

                  {/* Conditions */}
                  {patient.elderProfile?.medicalConditions && (
                    <div className="mt-3.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-1 bg-white/50 dark:bg-white/5 p-2.5 rounded-xl border border-white/60 dark:border-white/10">
                      <strong className="text-slate-900 dark:text-white">स्थितियां: </strong>
                      <span>{patient.elderProfile.medicalConditions}</span>
                    </div>
                  )}

                  {patient.nextAppointment && (
                    <div className="mt-2.5 text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5 bg-blue-50/80 dark:bg-blue-950/50 px-3 py-1.5 rounded-xl border border-blue-200/40 dark:border-blue-800/30">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>अगली भेंट: {new Date(patient.nextAppointment.scheduledAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Stat Strip */}
                <div className="pt-3 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <Pill className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{patient.activeMedicineCount} सक्रिय दवाएं</span>
                  </span>

                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-extrabold group-hover:translate-x-0.5 transition-transform">
                    <span>प्रोफाइल देखें</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </GlassPanel>
            </Link>
          ))
        )}
      </div>

      {patients.length === 0 && !isLoading && (
        <EmptyState
          title="कोई मरीज नहीं मिला • No Patients Found"
          description="खोज शब्द बदलें, नया मरीज पंजीकृत करें अथवा मरीज का पासकोड रिडीम करें।"
          action={
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <PrimaryButton
                variant="primary"
                onClick={() => setRedeemOpen(true)}
              >
                पासकोड रिडीम करें
              </PrimaryButton>
              <Link href="/doctor/patients/new">
                <PrimaryButton variant="secondary">
                  नया मरीज जोड़ें
                </PrimaryButton>
              </Link>
            </div>
          }
        />
      )}

      {/* Redeem Invite Modal */}
      <RedeemInviteModal
        isOpen={redeemOpen}
        onClose={() => setRedeemOpen(false)}
      />
    </div>
  );
}
