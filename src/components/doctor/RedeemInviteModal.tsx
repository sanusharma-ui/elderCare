"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient, ApiError } from "@/lib/api-client";
import {
  KeyRound,
  X,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

interface RedeemInviteModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  triggerVariant?: "default" | "primary" | "outline";
  triggerLabel?: string;
  className?: string;
}

interface RedeemResponse {
  message: string;
  elderId: string;
  elderName: string;
  role: string;
  accessId: string;
}

export function RedeemInviteModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onSuccess: controlledOnSuccess,
  triggerVariant = "default",
  triggerLabel,
  className = "",
}: RedeemInviteModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isModalOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const isControlled = controlledIsOpen !== undefined;

  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState<RedeemResponse | null>(null);

  // Auto-format: uppercase, auto-hyphenate standard 8-character codes
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (raw.length > 12) raw = raw.slice(0, 12);

    const plain = raw.replace(/-/g, "");
    if (!raw.includes("-") && plain.length > 4) {
      raw = `${plain.slice(0, 4)}-${plain.slice(4)}`;
    }

    setCode(raw);
    setErrorMessage("");
  };

  const redeemMutation = useMutation({
    mutationFn: (passcode: string) =>
      apiClient<RedeemResponse>("/api/invites/redeem", {
        method: "POST",
        body: JSON.stringify({ code: passcode }),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["doctor-patients"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-elders"] });

      setSuccessData(res);
      controlledOnSuccess?.();
      toast.success(
        res.elderName
          ? `मरीज ${res.elderName} सफलतापूर्वक आपके क्लिनिक से जुड़ गए!`
          : "मरीज सफलतापूर्वक जुड़ गया!"
      );
    },
    onError: (err: any) => {
      if (err instanceof ApiError) {
        if (err.message.includes("requires the role")) {
          setErrorMessage(
            "यह पासकोड डॉक्टर रोल के लिए नहीं है। कृपया मरीज से 'Doctor' हेतु कोड जनरेट करने को कहें।"
          );
        } else if (err.message.includes("already been redeemed")) {
          setErrorMessage("यह कोड पहले ही इस्तेमाल किया जा चुका है।");
        } else if (err.message.includes("expired")) {
          setErrorMessage("यह पासकोड समाप्त (expire) हो चुका है। कृपया नया कोड लें।");
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage("पासकोड अमान्य है या सत्यापन विफल रहा। कृपया पुनः प्रयास करें।");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length < 4) {
      setErrorMessage("कृपया मान्य पासकोड दर्ज करें (उदा. K7QD-9M2X)");
      return;
    }
    redeemMutation.mutate(cleanCode);
  };

  const handleClose = () => {
    if (isControlled) {
      controlledOnClose?.();
    } else {
      setInternalIsOpen(false);
    }
    setCode("");
    setErrorMessage("");
    setSuccessData(null);
  };

  const handleViewPatient = () => {
    if (successData?.elderId) {
      handleClose();
      router.push(`/doctor/patients/${successData.elderId}`);
    }
  };

  return (
    <>
      {/* Trigger Button only in uncontrolled mode */}
      {!isControlled && (
        triggerVariant === "primary" ? (
          <PrimaryButton
            type="button"
            onClick={() => setInternalIsOpen(true)}
            icon={<KeyRound className="w-4 h-4" />}
            className={className}
          >
            {triggerLabel || "पासकोड से जोड़ें • Redeem Code"}
          </PrimaryButton>
        ) : (
          <PrimaryButton
            type="button"
            variant="secondary"
            onClick={() => setInternalIsOpen(true)}
            icon={<KeyRound className="w-4 h-4 text-accent-blue" />}
            className={className}
          >
            {triggerLabel || "पासकोड से मरीज जोड़ें • Redeem Code"}
          </PrimaryButton>
        )
      )}

      {/* Modal Dialog */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-md"
            />

            {/* Dialog Panel (Frosted Glass) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-md glass-panel p-6 sm:p-8 shadow-2xl z-10 overflow-hidden"
              role="dialog"
              aria-modal="true"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-5 right-5 p-2 text-ink-muted hover:text-ink rounded-full hover:bg-white/40 dark:hover:bg-white/10 active:scale-90 transition-all"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {!successData ? (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent-blue/15 text-accent-blue flex items-center justify-center shrink-0 border border-accent-blue/20">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-sans text-xl font-black text-ink leading-tight">
                        मरीज जोड़ें • Redeem Code
                      </h2>
                      <p className="text-xs font-bold text-accent-blue mt-0.5">
                        CareSaathi Passcode Mapping
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-ink-muted leading-relaxed mb-5 font-semibold">
                    बुजुर्ग मरीज अथवा उनके परिवार द्वारा CareSaathi ऐप में जनरेट किया गया 6 से 9-अक्षरों का पासकोड दर्ज करें। मरीज तुरंत आपके क्लिनिकल खाते से मैप हो जाएगा।
                  </p>

                  {/* Error Alert */}
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </motion.div>
                  )}

                  {/* Redeem Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                        इनवाइट कोड दर्ज करें • Enter Passcode
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={code}
                        onChange={handleCodeChange}
                        placeholder="उदा. K7QD-9M2X"
                        maxLength={12}
                        className="w-full min-h-[58px] text-center font-mono text-2xl font-black tracking-widest uppercase bg-white/50 dark:bg-white/10 border-2 border-white/80 dark:border-white/10 focus:border-accent-blue focus:outline-none rounded-2xl text-ink placeholder:text-ink-muted/30 transition-all select-all shadow-inner"
                      />
                    </div>

                    <div className="glass-panel-subtle p-3 text-[11px] font-semibold text-ink-muted leading-normal flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-accent-blue shrink-0 mt-0.5" />
                      <span>
                        सुरक्षित मैपिंग: कोड रिडीम होते ही मरीज की दवाइयां, डोज ट्रैकिंग व स्वास्थ्य इतिहास आपके कंसोल में उपलब्ध होंगे।
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 min-h-[48px] btn-secondary-pill text-xs font-bold"
                      >
                        रद्द करें • Cancel
                      </button>
                      <PrimaryButton
                        type="submit"
                        disabled={redeemMutation.isPending || code.trim().length < 4}
                        loading={redeemMutation.isPending}
                        className="flex-1 min-h-[48px] text-xs font-bold"
                        icon={<UserCheck className="w-4 h-4" />}
                      >
                        जोड़ें • Redeem
                      </PrimaryButton>
                    </div>
                  </form>
                </>
              ) : (
                /* Success Celebration State */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-2 space-y-4"
                >
                  <div className="w-16 h-16 bg-accent-blue/15 text-accent-blue border border-accent-blue/20 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div>
                    <h3 className="font-sans text-2xl font-black text-ink">
                      मरीज जुड़ गए!
                    </h3>
                    <p className="text-sm font-bold text-accent-blue mt-1">
                      {successData.elderName || "Patient"}
                    </p>
                    <p className="text-xs text-ink-muted mt-2 max-w-xs mx-auto leading-relaxed font-semibold">
                      मरीज की प्रोफाइल आपके क्लिनिक से सफलतापूर्वक लिंक हो चुकी है। अब आप उनकी दवाओं की सूची व डोज लॉग देख सकते हैं।
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <PrimaryButton
                      type="button"
                      onClick={handleViewPatient}
                      className="w-full min-h-[48px]"
                      icon={<ArrowRight className="w-4 h-4" />}
                    >
                      मरीज प्रोफाइल देखें • Open Profile
                    </PrimaryButton>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="w-full min-h-[42px] btn-secondary-pill text-xs"
                    >
                      पूर्ण • Done
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
