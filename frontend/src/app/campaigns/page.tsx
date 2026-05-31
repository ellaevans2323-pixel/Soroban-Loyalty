"use client";

import { useEffect, useState } from "react";
import { api, Campaign } from "@/lib/api";
import { CampaignCard } from "@/components/CampaignCard";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCampaigns();
      setCampaigns(res.campaigns);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <div className="container">
      <h1 className="page-title">Campaigns</h1>

      {loading ? (
        <div className="campaign-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={220} borderRadius={12} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCampaigns} />
      ) : campaigns.length === 0 ? (
        <EmptyState
          illustration="campaigns"
          title="No campaigns yet"
          description="Check back later for new loyalty campaigns."
        />
      ) : (
        <div className="campaign-grid">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              isClaimed={false}
              isClaiming={false}
              onClaim={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
