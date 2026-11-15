"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { apiClient, ApiError } from "@/lib/api-client";
import { getRoleHome } from "@/lib/routes";
import {
  User,
  HeartHandshake,
  ShieldAlert,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

type RoleType = "ELDER" | "CARETAKER" | "FAMILY" | "DOCTOR";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tLanding = useTranslations("landing");
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<RoleType>("ELDER");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState<"en" | "hi" | "mr">("hi");

  // Role specific
  const [specialization, setSpecialization] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("MALE");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const roleCards: {
    type: RoleType;
    title: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      type: "ELDER",
      title: "बुजुर्ग • Elder (Senior)",
      desc: tLanding("elderCardDesc"),
      icon: <User className="w-8 h-8 text-forest" />,
    },
    {
      type: "CARETAKER",
      title: "केयरटेकर • Caretaker",
      desc: tLanding("caretakerCardDesc"),
      icon: <HeartHandshake className="w-8 h-8 text-forest" />,
    },
    {
      type: "FAMILY",
      title: "परिवार • Family Member",
      desc: tLanding("familyCardDesc"),
      icon: <ShieldAlert className="w-8 h-8 text-forest" />,
    },
    {
      type: "DOCTOR",
      title: "डॉक्टर • Doctor / Physician",
      desc: tLanding("doctorCardDesc"),
      icon: <Stethoscope className="w-8 h-8 text-forest" />,
    },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const isEmail = identifier.includes("@");
    const payload: any = {
      name: name.trim(),
      password,
      role,
      language,
      ...(isEmail ? { email: identifier.trim() } : { phone: identifier.trim() }),
    };

    if (role === "DOCTOR") {
      payload.specialization = specialization || "General Medicine";
      payload.registrationNumber = registrationNumber || "REG-TMP-01";
      payload.clinicName = clinicName || "City Clinic";
    } else if (role === "ELDER") {
      if (dateOfBirth) payload.dateOfBirth = dateOfBirth;
      if (gender) payload.gender = gender;
      if (medicalConditions) payload.medicalConditions = medicalConditions;
      if (allergies) payload.allergies = allergies;
      if (emergencyPhone) payload.emergencyContactPhone = emergencyPhone;
    }

    try {
      const result = await apiClient<{
        user: { role: RoleType; mustChangePassword: boolean };
      }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("Account created successfully!");
      router.push(getRoleHome(result.user.role));
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Registration failed. Please check the entered fields.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-forest-soft">
      {/* Top Header */}
      <div className="w-full max-w-xl flex items-center justify-between mb-6">
        <BrandLogo size="md" href="/" />
        <LanguageSwitcher compact />
      </div>

      <div className="w-full max-w-xl bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-smriti">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-line">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">
              {t("register")}
            </h1>
            <p className="text-xs text-ink-muted mt-0.5">
              {step === 1 ? "चरण 1: अपनी भूमिका चुनें" : "चरण 2: खाता जानकारी"}
            </p>
          </div>
          <span className="text-xs font-bold text-forest bg-forest-soft px-3 py-1 rounded-full">
            {step} / 2
          </span>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 bg-brick-soft border border-brick/30 rounded-xl text-brick text-sm font-medium">
            {errorMessage}
          </div>
        )}

        {/* STEP 1: PICK ROLE */}
        {step === 1 && (
          <div>
            <p className="text-sm text-ink-muted mb-4 font-medium">
              स्मृति में आप किस रूप में जुड़ना चाहते हैं?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
              {roleCards.map((rc) => {
                const selected = role === rc.type;
                return (
                  <button
                    key={rc.type}
                    type="button"
                    onClick={() => setRole(rc.type)}
                    className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                      selected
                        ? "border-forest bg-forest-soft/30 shadow-xs ring-1 ring-forest"
                        : "border-line bg-paper-2 hover:bg-surface"
                    }`}
                  >
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-surface border border-line flex items-center justify-center mb-3">
                        {rc.icon}
                      </div>
                      <h3 className="font-bold text-ink text-base">
                        {rc.title}
                      </h3>
                      <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                        {rc.desc}
                      </p>
                    </div>

                    {selected && (
                      <CheckCircle2 className="w-5 h-5 text-forest absolute top-4 right-4" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full min-h-[52px] bg-forest hover:bg-forest-hover active:scale-95 text-surface font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <span>अगला चरण • Continue</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 2: PROFILE FIELDS */}
        {step === 2 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">
                पूरा नाम • Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="जैसे: Ramesh Sharma"
                className="w-full min-h-[48px] px-4 bg-paper border border-line rounded-xl text-base text-ink"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink mb-1">
                फ़ोन नंबर या ईमेल • Phone or Email *
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="जैसे: 9811122332 या name@example.com"
                className="w-full min-h-[48px] px-4 bg-paper border border-line rounded-xl text-base text-ink"
              />
              <span className="text-[11px] text-ink-muted mt-1 block">
                बुजुर्गों के लिए केवल फ़ोन नंबर पर्याप्त है।
              </span>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink mb-1">
                पासवर्ड • Password (कम से कम 8 अक्षर) *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="सुरक्षित पासवर्ड चुनें"
                className="w-full min-h-[48px] px-4 bg-paper border border-line rounded-xl text-base text-ink"
              />
            </div>

            {/* Language preference */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">
                पसंदीदा भाषा • App Language
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

            {/* Doctor specific */}
            {role === "DOCTOR" && (
              <div className="pt-3 border-t border-line space-y-3">
                <span className="text-xs font-bold text-forest uppercase tracking-wider block">
                  Doctor Profile Information
                </span>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Specialization *
                  </label>
                  <input
                    type="text"
                    required
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Geriatric Medicine / General Physician"
                    className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Registration No. *
                    </label>
                    <input
                      type="text"
                      required
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="MCI-12345"
                      className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Clinic / Hospital *
                    </label>
                    <input
                      type="text"
                      required
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="Apollo Clinic"
                      className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Elder specific */}
            {role === "ELDER" && (
              <div className="pt-3 border-t border-line space-y-3">
                <span className="text-xs font-bold text-forest uppercase tracking-wider block">
                  बुजुर्ग स्वास्थ्य जानकारी (वैकल्पिक)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      जन्म तारीख • Date of Birth
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
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    वर्तमान बीमारियां • Conditions (e.g. Diabetes, BP)
                  </label>
                  <input
                    type="text"
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    placeholder="जैसे: उच्च रक्तचाप, मधुमेह"
                    className="w-full min-h-[44px] px-3 bg-paper border border-line rounded-xl text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 min-h-[50px] bg-paper border border-line rounded-xl text-ink font-semibold text-sm flex items-center gap-1.5 hover:bg-paper-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>वापस</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 min-h-[50px] bg-forest hover:bg-forest-hover active:scale-95 text-surface font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-60"
              >
                {loading ? "पंजीकरण हो रहा है..." : "खाता बनाएं • Complete Registration"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-ink-muted">
          <span>{t("alreadyHaveAccount")} </span>
          <Link href="/login" className="font-bold text-forest hover:underline">
            {t("login")}
          </Link>
        </div>
      </div>
    </div>
  );
}
