"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
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
  const tCommon = useTranslations("common");
  const tLanding = useTranslations("landing");
  const tRoles = useTranslations("roles");
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<RoleType>("ELDER");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState<"en" | "hi" | "mr">("en");

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
      title: tRoles("ELDER"),
      desc: tLanding("elderCardDesc"),
      icon: <User className="w-7 h-7 text-blue-600 dark:text-blue-400" />,
    },
    {
      type: "CARETAKER",
      title: tRoles("CARETAKER"),
      desc: tLanding("caretakerCardDesc"),
      icon: <HeartHandshake className="w-7 h-7 text-blue-600 dark:text-blue-400" />,
    },
    {
      type: "FAMILY",
      title: tRoles("FAMILY"),
      desc: tLanding("familyCardDesc"),
      icon: <ShieldAlert className="w-7 h-7 text-blue-600 dark:text-blue-400" />,
    },
    {
      type: "DOCTOR",
      title: tRoles("DOCTOR"),
      desc: tLanding("doctorCardDesc"),
      icon: <Stethoscope className="w-7 h-7 text-blue-600 dark:text-blue-400" />,
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
        setErrorMessage(t("registrationFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center items-center p-4 sm:p-6">
      {/* Top Header */}
      <div className="w-full max-w-xl flex items-center justify-between mb-6">
        <BrandLogo size="md" href="/" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher compact />
        </div>
      </div>

      <GlassPanel variant="default" className="w-full max-w-xl rounded-[32px] p-7 sm:p-9 shadow-2xl">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/50 dark:border-white/10">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {t("register")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {step === 1 ? t("stepRole") : t("stepDetails")}
            </p>
          </div>
          <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/60 px-3.5 py-1 rounded-full border border-blue-200/50 dark:border-blue-800/40">
            {step} / 2
          </span>
        </div>

        {errorMessage && (
          <div className="mb-5 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-bold">
            {errorMessage}
          </div>
        )}

        {/* STEP 1: PICK ROLE */}
        {step === 1 && (
          <div className="space-y-6">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              {t("chooseRolePrompt")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {roleCards.map((rc) => {
                const selected = role === rc.type;
                return (
                  <button
                    key={rc.type}
                    type="button"
                    onClick={() => setRole(rc.type)}
                    className={`p-5 rounded-3xl border text-left transition-all relative flex flex-col justify-between ${
                      selected
                        ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 shadow-sm ring-1 ring-blue-600"
                        : "border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10"
                    }`}
                  >
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-3">
                        {rc.icon}
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                        {rc.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {rc.desc}
                      </p>
                    </div>

                    {selected && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 absolute top-4 right-4" />
                    )}
                  </button>
                );
              })}
            </div>

            <PrimaryButton
              type="button"
              variant="primary"
              size="lg"
              onClick={() => setStep(2)}
              className="w-full gap-2"
            >
              <span>{t("continue")}</span>
              <ArrowRight className="w-5 h-5" />
            </PrimaryButton>
          </div>
        )}

        {/* STEP 2: PROFILE FIELDS */}
        {step === 2 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                {tCommon("name")} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Sharma"
                className="w-full min-h-[48px] px-4 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                {tCommon("phone")} / {tCommon("email")} *
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 9811122332 or name@example.com"
                className="w-full min-h-[48px] px-4 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                {t("elderPhoneHint")}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                {t("passwordLabel")} (min. 8 characters) *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="w-full min-h-[48px] px-4 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Language preference */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                {tCommon("language")}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full min-h-[48px] px-4 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-base text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="hi" className="dark:bg-slate-900">Hindi</option>
                <option value="mr" className="dark:bg-slate-900">Marathi</option>
                <option value="en" className="dark:bg-slate-900">English</option>
              </select>
            </div>

            {/* Doctor specific */}
            {role === "DOCTOR" && (
              <div className="pt-3 border-t border-slate-200/50 dark:border-white/10 space-y-3">
                <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Doctor Profile Information
                </span>
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Specialization *
                  </label>
                  <input
                    type="text"
                    required
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Geriatric Medicine / General Physician"
                    className="w-full min-h-[44px] px-3.5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      Registration No. *
                    </label>
                    <input
                      type="text"
                      required
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="MCI-12345"
                      className="w-full min-h-[44px] px-3.5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      Clinic / Hospital *
                    </label>
                    <input
                      type="text"
                      required
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="Apollo Clinic"
                      className="w-full min-h-[44px] px-3.5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Elder specific */}
            {role === "ELDER" && (
              <div className="pt-3 border-t border-slate-200/50 dark:border-white/10 space-y-3">
                <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  {t("elderHealthOptional")}
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      {t("dateOfBirth")}
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
                      {t("gender")}
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <option value="MALE" className="dark:bg-slate-900">{t("male")}</option>
                      <option value="FEMALE" className="dark:bg-slate-900">{t("female")}</option>
                      <option value="OTHER" className="dark:bg-slate-900">{t("other")}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    {t("conditions")}
                  </label>
                  <input
                    type="text"
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    placeholder={t("conditionsPlaceholder")}
                    className="w-full min-h-[44px] px-4 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-4">
              <PrimaryButton
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setStep(1)}
                className="gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t("back")}</span>
              </PrimaryButton>

              <PrimaryButton
                type="submit"
                variant="primary"
                size="md"
                disabled={loading}
                className="flex-1"
              >
                {loading ? t("registerLoading") : t("completeRegistration")}
              </PrimaryButton>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          <span>{t("alreadyHaveAccount")} </span>
          <Link href="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
            {t("login")}
          </Link>
        </div>
      </GlassPanel>
    </div>
  );
}
