"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/api-client";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import {
  UserPlus,
  ArrowLeft,
  KeyRound,
  Copy,
  Check,
  Share2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function DoctorNewPatientPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState<"hi" | "mr" | "en">("hi");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("MALE");
  const [bloodGroup, setBloodGroup] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [createdData, setCreatedData] = useState<{
    elder: { id: string; name: string };
    temporaryPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const createPatientMutation = useMutation({
    mutationFn: (payload: any) =>
      apiClient<any>("/api/doctor/elders", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["doctor-patients"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-dashboard-metrics"] });
      setCreatedData(res);
      toast.success("मरीज खाता सफलतापूर्वक बनाया गया!");
    },
    onError: (err: any) => {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to create patient account.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!phone && !email) {
      setErrorMessage("At least one of Phone Number or Email is required.");
      return;
    }

    setErrorMessage("");
    const payload: any = {
      name: name.trim(),
      language,
      ...(phone ? { phone: phone.trim() } : {}),
      ...(email ? { email: email.trim() } : {}),
      ...(dateOfBirth ? { dateOfBirth } : {}),
      ...(gender ? { gender } : {}),
      ...(bloodGroup ? { bloodGroup } : {}),
      ...(medicalConditions ? { medicalConditions: medicalConditions.trim() } : {}),
      ...(allergies ? { allergies: allergies.trim() } : {}),
      ...(emergencyName ? { emergencyContactName: emergencyName.trim() } : {}),
      ...(emergencyPhone ? { emergencyContactPhone: emergencyPhone.trim() } : {}),
    };

    createPatientMutation.mutate(payload);
  };

  const handleCopyPassword = () => {
    if (!createdData?.temporaryPassword) return;
    navigator.clipboard.writeText(createdData.temporaryPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/doctor/patients"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/10 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-white/80 dark:hover:bg-white/15 transition-all shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>मरीज सूची पर वापस • Back to Patients</span>
        </Link>
      </div>

      {!createdData ? (
        <GlassPanel variant="default" className="rounded-[32px] p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
              New Registration
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              नया बुजुर्ग मरीज पंजीकृत करें • Register Patient
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              मरीज का खाता तुरंत तैयार हो जाएगा और लॉगिन हेतु अस्थायी पासवर्ड जारी होगा।
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-semibold">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                मूल जानकारी • Primary Information
              </span>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  मरीज का पूरा नाम • Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Suresh Kulkarni"
                  className="w-full min-h-[48px] px-4 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    फ़ोन नंबर • Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9822012345"
                    className="w-full min-h-[48px] px-4 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                    बुजुर्गों के लिए केवल फ़ोन नंबर पर्याप्त है।
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    ईमेल पता • Email (वैकल्पिक)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="suresh@example.com"
                    className="w-full min-h-[48px] px-4 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  मरीज की पसंदीदा भाषा • Preferred Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full min-h-[48px] px-4 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-base text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="hi" className="dark:bg-slate-900">हिन्दी (Hindi)</option>
                  <option value="mr" className="dark:bg-slate-900">मराठी (Marathi)</option>
                  <option value="en" className="dark:bg-slate-900">English</option>
                </select>
              </div>
            </div>

            {/* Health Info */}
            <div className="pt-4 border-t border-slate-200/50 dark:border-white/10 space-y-4">
              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                स्वास्थ्य पृष्ठभूमि • Medical Background
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    जन्म तारीख • DOB
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    लिंग • Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full min-h-[44px] px-3 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="MALE" className="dark:bg-slate-900">पुरुष (Male)</option>
                    <option value="FEMALE" className="dark:bg-slate-900">महिला (Female)</option>
                    <option value="OTHER" className="dark:bg-slate-900">अन्य (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    ब्लड ग्रुप • Blood Group
                  </label>
                  <input
                    type="text"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    placeholder="e.g. B+"
                    className="w-full min-h-[44px] px-3.5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  गंभीर बीमारियां • Chronic Conditions
                </label>
                <input
                  type="text"
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder="e.g. Type-2 Diabetes, Hypertension, Arthritis"
                  className="w-full min-h-[44px] px-4 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  दवा एलर्जी • Drug Allergies
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa drugs"
                  className="w-full min-h-[44px] px-4 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>

            <PrimaryButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={createPatientMutation.isPending}
              className="w-full mt-4"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              <span>
                {createPatientMutation.isPending
                  ? "मरीज पंजीकृत हो रहा है..."
                  : "मरीज पंजीकृत करें • Register Patient"}
              </span>
            </PrimaryButton>
          </form>
        </GlassPanel>
      ) : (
        /* TEMPORARY PASSWORD REVEAL CARD */
        <GlassPanel variant="default" className="rounded-[32px] p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              मरीज सफलतापूर्वक पंजीकृत हो गया!
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              <strong>{createdData.elder.name}</strong> का खाता सक्रिय है।
            </p>
          </div>

          <div className="p-6 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-3xl max-w-md mx-auto text-center space-y-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              अस्थायी पासवर्ड • Temporary Password (Shown Once)
            </span>
            <div className="font-mono text-3xl font-black text-blue-600 dark:text-blue-400 select-all py-2 tracking-wider">
              {createdData.temporaryPassword}
            </div>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
              ⚠️ कृपया यह पासवर्ड मरीज या उनके परिवार को दें। पहले लॉगिन पर उन्हें इसे बदलना अनिवार्य होगा।
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <PrimaryButton
              variant="secondary"
              onClick={handleCopyPassword}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>कॉपी हो गया!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>पासवर्ड कॉपी करें</span>
                </>
              )}
            </PrimaryButton>

            <Link href={`/doctor/patients/${createdData.elder.id}`}>
              <PrimaryButton variant="primary">
                मरीज प्रोफाइल खोलें • Open Patient
              </PrimaryButton>
            </Link>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
