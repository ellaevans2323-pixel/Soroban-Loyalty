"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { api, Campaign } from "@/lib/api";
import { CampaignTable } from "@/components/CampaignTable";
import { CreateCampaignForm } from "@/components/CreateCampaignForm";
import { EmptyState } from "@/components/EmptyState";
import { deactivateCampaign } from "@/lib/soroban";

export default function MerchantPage() {
  const { publicKey } = useWallet();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const r = await api.getCampaigns(100, 0);
      if (publicKey) {
        setCampaigns(r.campaigns.filter((c) => c.merchant === publicKey));
      } else {
        setCampaigns(r.campaigns);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCampaigns().catch(console.error); }, [publicKey]);

  const handleDeactivate = async (id: number) => {
    if (!publicKey) throw new Error("Wallet not connected");
    await deactivateCampaign(id, publicKey);
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, active: false } : c)));
  };

  return (
    <div>
      <h1 className="page-title">Merchant Portal</h1>

      {!publicKey && (
        <div className="alert alert-error">Connect your Freighter wallet to create campaigns.</div>
      )}

      <section style={{ marginBottom: 48 }}>
        <h2 className="section-title">Create Campaign</h2>
        {publicKey ? (
          <CreateCampaignForm publicKey={publicKey} onSuccess={loadCampaigns} />
        ) : null}
      </section>

      <section>
        <h2 className="section-title">My Campaigns</h2>
        {loading ? (
          <div className="skeleton" style={{ height: 120, borderRadius: 8 }} />
        ) : campaigns.length === 0 ? (
          <EmptyState
            illustration="campaigns"
            title="No campaigns yet"
            description="Create your first campaign to start rewarding users with LYT tokens."
            cta={{ label: "Create Campaign", onClick: () => document.querySelector<HTMLElement>(".section-title")?.scrollIntoView({ behavior: "smooth" }) }}
          />
        ) : (
          <CampaignTable campaigns={campaigns} onDeactivate={handleDeactivate} merchantPublicKey={publicKey ?? undefined} />
        )}
      </section>
    </div>
  );
}
