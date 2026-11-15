"use client";

import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-paper flex items-center justify-center p-6 text-ink">
      <div className="max-w-md w-full bg-surface border border-line rounded-2xl p-8 shadow-smriti text-center">
        <div className="w-16 h-16 bg-forest-soft rounded-full flex items-center justify-center mx-auto mb-6 text-forest">
          <WifiOff className="w-8 h-8" />
        </div>

        <h1 className="font-displayDeva text-2xl font-bold text-ink mb-2">
          इंटरनेट कनेक्ट नहीं है
        </h1>
        <p className="font-display text-lg text-ink font-semibold mb-4">
          You are currently offline
        </p>

        <p className="text-ink-muted text-base leading-relaxed mb-6">
          दवाइयों का नया शेड्यूल देखने और खुराक दर्ज करने के लिए इंटरनेट आवश्यक है। कृपया अपना नेटवर्क चेक करें।
        </p>

        <div className="p-4 bg-paper-2 rounded-xl mb-6 text-sm text-ink-muted text-left border border-line">
          <div className="font-medium text-ink mb-1">मराठी:</div>
          <div>नवीन औषधांचे वेळापत्रक पाहण्यासाठी कृपया इंटरनेट सुरू करा.</div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full min-h-[52px] bg-forest hover:bg-forest-hover text-surface font-semibold rounded-xl flex items-center justify-center gap-2 text-lg shadow-sm active:scale-[0.98] transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          <span>फिर से कोशिश करें • Try Again</span>
        </button>

        <div className="mt-4">
          <Link
            href="/"
            className="text-sm font-medium text-forest hover:underline"
          >
            होम पेज पर जाएं • Go to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
