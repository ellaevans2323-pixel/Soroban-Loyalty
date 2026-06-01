/**
 * WalletConnector Component
 * 
 * Displays wallet connection status and balance. Shows a "Connect Freighter" button
 * when disconnected, and displays the user's address and LYT balance when connected.
 * 
 * Requires WalletContext to be available in the component tree.
 * 
 * @example
 * ```tsx
 * import { WalletConnector } from '@/components/WalletConnector';
 * 
 * export function Header() {
 *   return (
 *     <header>
 *       <h1>My App</h1>
 *       <WalletConnector />
 *     </header>
 *   );
 * }
 * ```
 * 
 * @component
 * @returns {JSX.Element} Wallet connection UI or connected wallet display
 */

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { Tooltip } from "@/components/Tooltip";
import { TruncatedAddress } from "@/components/TruncatedAddress";
import { useCountUp } from "@/lib/useCountUp";

/**
 * FreighterModal Component
 * 
 * Modal dialog prompting user to install Freighter wallet extension.
 * Provides download links for Chrome and Firefox.
 * 
 * @param {Object} props
 * @param {() => void} props.onClose - Callback when user closes the modal
 */
function FreighterModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="freighter-modal-title">
      <div className="modal">
        <h2 id="freighter-modal-title">Freighter Wallet Required</h2>
        <p>
          Freighter is a browser extension that lets you sign Stellar transactions securely.
          Install it to connect your wallet and interact with SorobanLoyalty.
        </p>
        <div className="modal-actions">
          <a
            href="https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Install for Chrome
          </a>
          <a
            href="https://addons.mozilla.org/en-US/firefox/addon/freighter/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            Install for Firefox
          </a>
          <button onClick={onClose} className="btn btn-outline">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function WalletConnector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const { publicKey, connecting, lytBalance, balanceLoading, connect, disconnect } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const animatedBalance = useCountUp(lytBalance);

  const handleConnect = async () => {
    // Detect Freighter: the extension injects window.freighter
    const hasFreighter =
      typeof window !== "undefined" &&
      // @ts-expect-error freighter is injected by the extension
      (typeof window.freighter !== "undefined" || typeof window.freighterApi !== "undefined");

    if (!hasFreighter) {
      setShowModal(true);
      return;
    }

    await connect();
    if (redirect) {
      router.replace(redirect.startsWith("/") ? redirect : "/");
    }
  };

  if (publicKey) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          {balanceLoading ? <span className="inline-spinner" aria-hidden="true" /> : null}
          <Tooltip content="Your LYT token balance — earned by claiming campaigns">
            <span aria-live="polite" aria-busy={balanceLoading}>
              {animatedBalance.toLocaleString()} LYT
            </span>
          </Tooltip>
        </span>
        <TruncatedAddress address={publicKey} />
        <button onClick={disconnect} className="btn btn-outline">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button onClick={handleConnect} disabled={connecting} className="btn btn-primary">
        {connecting ? "Connecting…" : "Connect Freighter"}
      </button>
      {showModal && <FreighterModal onClose={() => setShowModal(false)} />}
    </>
  );
}
