"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-6 text-neutral-100">
      <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-neutral-900/90 p-6 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-4 text-red-400">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <h2 className="text-base font-semibold">Server Runtime Error</h2>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs text-neutral-300 font-mono break-all bg-neutral-950 p-3 rounded-lg border border-neutral-800">
            {error?.message || "An unexpected error occurred during server rendering."}
          </p>
          {error?.digest && (
            <p className="text-[11px] text-neutral-500 font-mono">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" onClick={() => reset()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
