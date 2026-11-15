"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { BottomSheet } from "@/components/shared/BottomSheet";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">
            अपॉइंटमेंट कैलेंडर • Appointments
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            मरीजों के साथ निर्धारित क्लिनिकल विजिट्स एवं फॉलो-अप्स
          </p>
        </div>

        <button
          onClick={() => {
            if (patients.length > 0 && !selectedElderId) {
              setSelectedElderId(patients[0].id);
            }
            setCreateOpen(true);
          }}
          className="px-4 py-2.5 bg-forest hover:bg-forest-hover active:scale-95 text-surface font-bold text-sm rounded-xl flex items-center gap-2 shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>नया अपॉइंटमेंट तय करें • Schedule</span>
        </button>
      </div>

      <div className="bg-surface border border-line rounded-3xl p-6 shadow-xs space-y-4">
        <h2 className="font-bold text-lg text-ink">आगामी अपॉइंटमेंट्स • Upcoming Visits</h2>

        <div className="space-y-3">
          {patients.flatMap((p) => (p.nextAppointment ? [{ ...p.nextAppointment, elderName: p.name }] : [])).map((apt: any) => (
            <div
              key={apt.id}
              className="p-4 bg-paper rounded-2xl border border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest-soft text-forest flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-base">{apt.title}</h3>
                  <span className="text-xs font-semibold text-forest block">
                    मरीज: {apt.elderName}
                  </span>
                  <div className="flex items-center gap-2 mt-1 text-xs text-ink-muted tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-forest" />
                    <span>
                      {new Date(apt.scheduledAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <StatusBadge variant="ok" label="SCHEDULED" />
            </div>
          ))}

          {patients.every((p) => !p.nextAppointment) && (
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
          className="space-y-3.5"
        >
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">मरीज चुनें • Patient *</label>
            <select
              value={selectedElderId}
              onChange={(e) => setSelectedElderId(e.target.value)}
              className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm text-ink"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">शीर्षक / उद्देश्य • Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monthly Geriatric Review"
              className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">तारीख व समय • Date & Time *</label>
            <input
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">स्थान / क्लिनिक • Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">अतिरिक्त नोट्स • Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="रक्त परीक्षण रिपोर्ट साथ लाएं..."
              className="w-full p-2.5 bg-paper border border-line rounded-xl text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={createAppointmentMutation.isPending || !scheduledAt}
            className="w-full min-h-[48px] bg-forest text-surface font-bold rounded-xl mt-3 hover:bg-forest-hover active:scale-95 transition-all shadow-xs"
          >
            {createAppointmentMutation.isPending ? "सहेजा जा रहा है..." : "अपॉइंटमेंट तय करें"}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
