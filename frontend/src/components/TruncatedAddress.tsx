"use client";

import { useState } from "react";
import { Tooltip } from "@/components/Tooltip";

interface TruncatedAddressProps {
  address: string;
  className?: string;
}

export function TruncatedAddress({ address, className }: TruncatedAddressProps) {
  const [copied, setCopied] = useState(false);

  const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  return (
    <Tooltip content={copied ? "Copied!" : "Click to copy full address"}>
      <button
        onClick={handleCopy}
        title={address}
        className={className}
        style={{
          fontFamily: "monospace",
          fontSize: 13,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          color: "inherit",
        }}
        aria-label={`Copy address ${address} to clipboard`}
      >
        {truncated}
      </button>
    </Tooltip>
  );
}
