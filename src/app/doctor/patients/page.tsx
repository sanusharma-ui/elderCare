"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Users,
  Search,
  UserPlus,
  Calendar,
  Pill,
  ChevronRight,
  Phone,
  Clock,
} from "lucide-react";

interface DoctorPatientItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  language: string;
  activeMedicineCount: number;
  nextAppointmentAt: string | null;
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
      // Backend returns data directly, and meta in envelope
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">
            मरीज निर्देशिका • Patients Directory
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            आपके क्लिनिक से जुड़े समस्त बुजुर्ग मरीजों की सूची व स्वास्थ्य प्रोफाइल
          </p>
        </div>

        <Link
          href="/doctor/patients/new"
          className="px-4 py-2.5 bg-forest hover:bg-forest-hover active:scale-95 text-surface font-bold text-sm rounded-xl flex items-center gap-2 shadow-xs transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>नया मरीज पंजीकृत करें • Add Patient</span>
        </Link>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 text-forest absolute left-3.5 top-3.5 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          placeholder="नाम, फ़ोन या ईमेल से खोजें..."
          className="w-full min-h-[48px] pl-11 pr-4 bg-surface border border-line rounded-2xl text-sm text-ink focus:border-forest shadow-xs"
        />
      </div>

      {/* Ledger Table / Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((patient) => (
          <Link
            key={patient.id}
            href={`/doctor/patients/${patient.id}`}
            className="block group"
          >
            <div className="bg-surface border border-line hover:border-forest/40 rounded-2xl p-5 shadow-xs transition-all group-hover:shadow-sm flex flex-col justify-between h-full">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-forest-soft text-forest font-bold text-lg flex items-center justify-center shrink-0">
                      {patient.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-ink text-base group-hover:text-forest transition-colors leading-tight">
                        {patient.name}
                      </h3>
                      <span className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{patient.phone || patient.email || "No direct phone"}</span>
                      </span>
                    </div>
                  </div>

                  <span className="text-xs uppercase font-bold text-forest bg-forest-soft px-2 py-0.5 rounded-md">
                    {patient.language}
                  </span>
                </div>

                {/* Medical Conditions */}
                {patient.elderProfile?.medicalConditions && (
                  <div className="mt-3 text-xs text-ink-muted line-clamp-1 bg-paper p-2 rounded-lg">
                    <strong className="text-ink">स्थितियां: </strong>
                    <span>{patient.elderProfile.medicalConditions}</span>
                  </div>
                )}
              </div>

              {/* Bottom Stat Strip */}
              <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs text-ink-muted">
                <span className="flex items-center gap-1 font-semibold text-ink">
                  <Pill className="w-3.5 h-3.5 text-forest" />
                  <span>{patient.activeMedicineCount} सक्रिय दवाएं</span>
                </span>

                <span className="flex items-center gap-1 text-forest font-bold group-hover:translate-x-0.5 transition-transform">
                  <span>प्रोफाइल देखें</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {patients.length === 0 && !isLoading && (
        <EmptyState
          title="कोई मरीज नहीं मिला"
          description="खोज शब्द बदलें या नया मरीज पंजीकृत करें।"
        />
      )}
    </div>
  );
}
