"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, ArrowLeft } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-ink relative">
      <div className="max-w-md w-full">
        <GlassPanel variant="default" className="p-8 text-center rounded-[32px] space-y-6">
          <div className="w-16 h-16 bg-accent-blue/15 text-accent-blue rounded-2xl flex items-center justify-center mx-auto border border-accent-blue/20">
            <WifiOff className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent-blue">
              Offline Mode
            </span>
            <h1 className="text-2xl font-black text-ink mt-1 mb-1">
              इंटरनेट कनेक्ट नहीं है
            </h1>
            <p className="text-sm font-bold text-ink-muted">
              You are currently offline
            </p>
          </div>

          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            दवाइयों का नया शेड्यूल देखने और खुराक दर्ज करने के लिए इंटरनेट आवश्यक है। कृपया अपना नेटवर्क चेक करें।
          </p>

          <GlassPanel variant="subtle" className="p-4 rounded-2xl text-xs text-ink-muted text-left">
            <span className="font-bold text-ink block mb-1">मराठी:</span>
            <span>नवीन औषधांचे वेळापत्रक पाहण्यासाठी कृपया इंटरनेट सुरू करा.</span>
          </GlassPanel>

          <div className="space-y-3 pt-2">
            <PrimaryButton
              size="lg"
              fullWidth
              onClick={() => window.location.reload()}
              icon={<RefreshCw className="w-5 h-5" />}
            >
              फिर से कोशिश करें • Try Again
            </PrimaryButton>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-ink transition-colors pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>होम पेज पर जाएं • Go to Home</span>
            </Link>
          </div>
        </GlassPanel>
      </div>
    </main>
  );
}
