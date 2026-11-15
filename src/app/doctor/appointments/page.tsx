"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { WeekStrip } from "@/components/ui/WeekStrip";
import { Calendar, Clock, MapPin, Plus, User, Stethoscope } from "lucide-react";
import { toast } from "sonner";

interface AppointmentItem {
  id: string;
  elderId: string;
  elderName?: string;
  title: string;
  scheduledAt: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  location?: string | null;
  notes?: string | null;
}

export default function DoctorAppointmentsPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch patients to select in appointment modal
  const { data: patientsData } = useQuery<any[]>({
    queryKey: ["doctor-patients-simple"],
    queryFn: () => apiClient<any[]>("/api/doctor/elders?limit=100"),
  });

  const patients = patientsData || [];

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedElderId, setSelectedElderId] = useState("");
  const [title, setTitle] = useState("Routine Checkup & Prescription Review");
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState("Apollo Clinic, Pune");
  const [notes, setNotes] = useState("");

  const createAppointmentMutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/elders/${selectedElderId}/appointments`, {
        method: "POST",
        body: JSON.stringify({
          title,
          scheduledAt: new Date(scheduledAt).toISOString(),
          location: location || undefined,
          notes: notes || undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-dashboard-metrics"] });
      setCreateOpen(false);
      toast.success("अपॉइंटमेंट तय हो गया! (Appointment scheduled)");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to schedule appointment");
    },
  });

  const allAppointments = patients.flatMap((p) =>
    p.nextAppointment ? [{ ...p.nextAppointment, elderName: p.name }] : []
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
            Clinical Calendar
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            अपॉइंटमेंट कैलेंडर • Appointments
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            मरीजों के साथ निर्धारित क्लिनिकल विजिट्स एवं फॉलो-अप्स
          </p>
        </div>

        <PrimaryButton
          variant="primary"
          onClick={() => {
            if (patients.length > 0 && !selectedElderId) {
              setSelectedElderId(patients[0].id);
            }
            setCreateOpen(true);
          }}
          className="gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>नया अपॉइंटमेंट तय करें • Schedule</span>
        </PrimaryButton>
      </div>

      {/* Week Selector Strip */}
      <div>
        <WeekStrip
          selectedDate={selectedDate}
          onSelectDate={(d) => setSelectedDate(d)}
        />
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">
            आगामी अपॉइंटमेंट्स • Upcoming Visits ({allAppointments.length})
          </h2>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            {selectedDate.toLocaleDateString("en-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        <div className="space-y-3">
          {allAppointments.map((apt: any) => (
            <GlassPanel
              key={apt.id}
              variant="default"
              className="rounded-[28px] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                    {apt.title}
                  </h3>
                  <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 block mt-0.5">
                    मरीज: {apt.elderName}
                  </span>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      {new Date(apt.scheduledAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                    {apt.location && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          {apt.location}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="self-end sm:self-auto">
                <StatusBadge variant="ok" label="SCHEDULED" />
              </div>
            </GlassPanel>
          ))}

          {allAppointments.length === 0 && (
            <EmptyState
              title="कोई आगामी अपॉइंटमेंट नहीं"
              description="ऊपर 'Schedule' बटन दबाकर नया अपॉइंटमेंट तय करें।"
            />
          )}
        </div>
      </div>

      {/* CREATE APPOINTMENT SHEET */}
      <BottomSheet
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="नया अपॉइंटमेंट तय करें • Schedule Visit"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createAppointmentMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              मरीज चुनें • Patient *
            </label>
            <select
              value={selectedElderId}
              onChange={(e) => setSelectedElderId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id} className="dark:bg-slate-900">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              शीर्षक / उद्देश्य • Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monthly Geriatric Review"
              className="w-full min-h-[44px] px-3.5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              तारीख व समय • Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full min-h-[44px] px-3.5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              स्थान / क्लिनिक • Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full min-h-[44px] px-3.5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              अतिरिक्त नोट्स • Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="रक्त परीक्षण रिपोर्ट साथ लाएं..."
              className="w-full p-3 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <PrimaryButton
            type="submit"
            variant="primary"
            disabled={createAppointmentMutation.isPending || !scheduledAt}
            className="w-full mt-2"
          >
            {createAppointmentMutation.isPending ? "सहेजा जा रहा है..." : "अपॉइंटमेंट तय करें"}
          </PrimaryButton>
        </form>
      </BottomSheet>
    </div>
  );
}
