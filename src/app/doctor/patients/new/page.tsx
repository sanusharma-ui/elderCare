"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/api-client";
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
          className="inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>मरीज सूची पर वापस • Back to Patients</span>
        </Link>
      </div>

      {!createdData ? (
        <div className="bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-smriti space-y-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              नया बुजुर्ग मरीज पंजीकृत करें • Register Patient
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              मरीज का खाता तुरंत तैयार हो जाएगा और लॉगिन हेतु अस्थायी पासवर्ड जारी होगा।
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 bg-brick-soft border border-brick/30 rounded-xl text-brick text-sm font-semibold">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Basic Info */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-forest uppercase tracking-wider block">
                मूल जानकारी • Primary Information
              </span>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1">
                  मरीज का पूरा नाम • Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Suresh Kulkarni"
                  className="w-full min-h-[48px] px-4 bg-paper border border-line rounded-xl text-base text-ink"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1">
                    फ़ोन नंबर • Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9822012345"
                    className="w-full min-h-[48px] px-4 bg-paper border border-line rounded-xl text-base text-ink"
                  />
                  <span className="text-[11px] text-ink-muted mt-1 block">
                    बुजुर्गों के लिए केवल फ़ोन नंबर पर्याप्त है।
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink mb-1">
                    ईमेल पता • Email (वैकल्पिक)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="suresh@example.com"
                    className="w-full min-h-[48px] px-4 bg-paper border border-line rounded-xl text-base text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1">
                  मरीज की पसंदीदा भाषा • Preferred Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full min-h-[48px] px-4 bg-paper border border-line rounded-xl text-base text-ink"
                >
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            {/* Health Info */}
            <div className="pt-4 border-t border-line space-y-4">
              <span className="text-xs font-bold text-forest uppercase tracking-wider block">
                स्वास्थ्य पृष्ठभूमि • Medical Background
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    जन्म तारीख • DOB
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    लिंग • Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
                  >
                    <option value="MALE">पुरुष (Male)</option>
                    <option value="FEMALE">महिला (Female)</option>
                    <option value="OTHER">अन्य (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    ब्लड ग्रुप • Blood Group
                  </label>
                  <input
                    type="text"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    placeholder="e.g. B+"
                    className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  गंभीर बीमारियां • Chronic Conditions
                </label>
                <input
                  type="text"
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder="e.g. Type-2 Diabetes, Hypertension, Arthritis"
                  className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  दवा एलर्जी • Drug Allergies
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa drugs"
                  className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={createPatientMutation.isPending}
              className="w-full min-h-[52px] mt-4 bg-forest hover:bg-forest-hover active:scale-95 text-surface font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
            >
              <UserPlus className="w-5 h-5" />
              <span>
                {createPatientMutation.isPending
                  ? "मरीज पंजीकृत हो रहा है..."
                  : "मरीज पंजीकृत करें • Register Patient"}
              </span>
            </button>
          </form>
        </div>
      ) : (
        /* TEMPORARY PASSWORD REVEAL CARD (SHOWN ONCE) */
        <div className="bg-surface border-2 border-forest rounded-3xl p-6 sm:p-8 shadow-smriti text-center space-y-6">
          <div className="w-16 h-16 bg-forest-soft rounded-2xl flex items-center justify-center text-forest mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-ink">
              मरीज सफलतापूर्वक पंजीकृत हो गया!
            </h2>
            <p className="text-sm text-ink-muted mt-1">
              <strong>{createdData.elder.name}</strong> का खाता सक्रिय है।
            </p>
          </div>

          <div className="p-5 bg-paper-2 border border-line rounded-2xl max-w-md mx-auto text-center space-y-2">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider block">
              अस्थायी पासवर्ड • Temporary Password (Shown Once)
            </span>
            <div className="font-mono text-2xl font-extrabold text-forest select-all py-2">
              {createdData.temporaryPassword}
            </div>
            <p className="text-xs text-brick font-semibold">
              ⚠️ कृपया यह पासवर्ड मरीज या उनके परिवार को दें। पहले लॉगिन पर उन्हें इसे बदलना अनिवार्य होगा।
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleCopyPassword}
              className="px-5 py-2.5 bg-surface border border-line hover:bg-paper rounded-xl font-bold text-sm text-ink flex items-center gap-2 shadow-xs active:scale-95 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-ok" />
                  <span>कॉपी हो गया!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-forest" />
                  <span>पासवर्ड कॉपी करें</span>
                </>
              )}
            </button>

            <Link
              href={`/doctor/patients/${createdData.elder.id}`}
              className="px-6 py-2.5 bg-forest hover:bg-forest-hover active:scale-95 text-surface font-bold text-sm rounded-xl shadow-xs transition-all"
            >
              मरीज प्रोफाइल खोलें • Open Patient
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
