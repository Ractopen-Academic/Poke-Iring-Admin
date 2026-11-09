"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const establishSession = async (idToken: string) => {
    const res = await fetch("/api/admin/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        data.error || "Authentication failed. Admin role verification required."
      );
    }

    router.push(from);
    router.refresh();
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const token = await cred.user.getIdToken();
      await establishSession(token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in.";
      setErrorMessage(
        msg.includes("auth/invalid-credential")
          ? "Invalid email or password."
          : msg
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const cred = await signInWithPopup(auth, provider);
      const token = await cred.user.getIdToken();
      await establishSession(token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign in failed.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-2xl backdrop-blur">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF8C1A] text-white shadow-lg">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-neutral-100">
            Poke: Iring Admin Console
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Authorized administrative access for @iring.ph and admin@pokeiring.app
          </p>
        </div>

        {errorMessage && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <div className="leading-snug">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleEmailPasswordLogin} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs text-neutral-300">
              Admin Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
              <Input
                id="email"
                type="email"
                placeholder="operator@iring.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9 bg-neutral-950/80 border-neutral-800 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs text-neutral-300">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-9 bg-neutral-950/80 border-neutral-800 text-xs"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full gap-2 bg-[#FF8C1A] hover:bg-[#E06D00] text-white font-semibold text-xs py-2.5"
          >
            {isLoading ? "Verifying Credentials..." : "Sign In with Email"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-neutral-900 px-2 text-neutral-500">or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full gap-2 border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/60 text-xs text-neutral-200"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Sign In with Google Workspace
        </Button>

        <p className="mt-6 text-center text-[11px] text-neutral-500">
          Protected by Firebase ID tokens &amp; HTTP-only session cookies.
        </p>
      </div>
    </div>
  );
}
