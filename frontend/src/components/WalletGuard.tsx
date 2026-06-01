"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { useToast } from "@/context/ToastContext";

interface WalletGuardProps {
  redirectTo: string;
  children: React.ReactNode;
}

export function WalletGuard({ redirectTo, children }: WalletGuardProps) {
  const { publicKey, mounted } = useWallet();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!mounted || publicKey) return;

    toast("Connect your wallet to continue.", "warning");
    router.replace(`/?redirect=${encodeURIComponent(redirectTo)}`);
  }, [mounted, publicKey, toast, router, redirectTo]);

  if (!mounted || !publicKey) {
    return null;
  }

  return <>{children}</>;
}
