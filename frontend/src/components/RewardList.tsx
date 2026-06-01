/**
 * RewardList Component
 *
 * Displays a list of rewards claimed by the user. Shows reward amount, claim date,
 * redemption status, and a redeem button for unredeemed rewards.
 *
 * Clicking "Redeem" opens a confirmation modal explaining that the action will
 * permanently burn the LYT tokens and cannot be undone. Only after the user
 * clicks "Confirm & Burn" in the modal is the actual onRedeem callback invoked.
 *
 * @example
 * ```tsx
 * import { RewardList } from '@/components/RewardList';
 *
 * export function RewardsPage({ rewards }) {
 *   const handleRedeem = async (reward: Reward) => { ... };
 *   return <RewardList rewards={rewards} onRedeem={handleRedeem} />;
 * }
 * ```
 *
 * @component
 * @param {RewardListProps} props
 * @returns {JSX.Element} List of rewards or empty state
 */

"use client";

import { useState } from "react";
import { Reward } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ConfirmDialog } from "@/components/ConfirmDialog";

/**
 * Props for RewardList component
 *
 * @typedef {Object} RewardListProps
 * @property {Reward[]} rewards - Array of reward objects to display
 * @property {(reward: Reward) => void} [onRedeem] - Callback invoked after user confirms the redeem action
 * @property {Record<string, 'idle' | 'loading' | 'success' | 'error'>} [redeemStatus] - Per-reward status map
 * @property {Record<string, string>} [redeemMessage] - Per-reward message map for success / error copy
 * @property {string | null} [error] - Error message to display instead of the list
 * @property {() => void} [onRetry] - Callback to retry the failed fetch
 */
interface Props {
  rewards: Reward[];
  onRedeem?: (reward: Reward) => void;
  redeemStatus?: Record<string, "idle" | "loading" | "success" | "error">;
  redeemMessage?: Record<string, string>;
  error?: string | null;
  onRetry?: () => void;
}

export function RewardList({
  rewards,
  onRedeem,
  redeemStatus = {},
  redeemMessage = {},
  error,
  onRetry,
}: Props) {
  const { t } = useI18n();

  /**
   * The reward currently awaiting user confirmation.
   * null means the modal is closed.
   */
  const [pendingReward, setPendingReward] = useState<Reward | null>(null);

  if (error) {
    return <ErrorState message={error} onRetry={onRetry ?? (() => {})} />;
  }

  if (rewards.length === 0) {
    return (
      <EmptyState
        illustration="rewards"
        title={t("rewards.noRewards")}
        description="Complete a campaign to earn LYT tokens."
        cta={{ label: "Claim your first reward", href: "/campaigns" }}
      />
    );
  }

  const handleRedeemClick = (reward: Reward) => {
    setPendingReward(reward);
  };

  const handleConfirm = () => {
    if (pendingReward && onRedeem) {
      onRedeem(pendingReward);
    }
    setPendingReward(null);
  };

  const handleCancel = () => {
    setPendingReward(null);
  };

  const isConfirming = (rewardId: string) =>
    pendingReward?.id === rewardId &&
    (redeemStatus[rewardId] ?? "idle") !== "loading";

  return (
    <>
      <ul className="reward-list">
        {rewards.map((r) => {
          const status = redeemStatus[r.id] ?? "idle";
          const isLoading = status === "loading";
          const isSuccess = status === "success";
          const isError = status === "error";
          const buttonText = isLoading
            ? t("rewards.actions.redeeming")
            : isSuccess
            ? t("rewards.actions.redeemed")
            : isError
            ? redeemMessage[r.id] || t("messages.redeemFailed")
            : t("rewards.actions.redeem");

          return (
            <li key={r.id} className="reward-item">
              <div>
                <strong>
                  {t("campaigns.details.campaign")} #{r.campaign_id}
                </strong>
                <span className="reward-amount">
                  {r.amount.toLocaleString()} LYT
                </span>
              </div>
              <div className="reward-meta">
                <span>
                  {r.redeemed
                    ? t("rewards.redeemed", {
                        amount: r.redeemed_amount.toString(),
                      })
                    : t("rewards.available")}
                </span>
                <span>{new Date(r.claimed_at).toLocaleDateString()}</span>
              </div>
              {onRedeem && !r.redeemed && (
                <button
                  onClick={() => handleRedeemClick(r)}
                  disabled={isLoading || isSuccess || isConfirming(r.id)}
                  className="btn btn-secondary"
                  aria-label={`Redeem ${r.amount} LYT from campaign ${r.campaign_id}`}
                >
                  {isLoading && (
                    <span
                      className="inline-spinner"
                      aria-hidden="true"
                      style={{ marginRight: 8 }}
                    />
                  )}
                  {buttonText}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Confirmation modal – shown when user clicks Redeem on a reward item */}
      <ConfirmDialog
        open={pendingReward !== null}
        title="Burn LYT tokens?"
        description={
          pendingReward
            ? `You are about to permanently burn ${pendingReward.amount.toLocaleString()} LYT from Campaign #${pendingReward.campaign_id}. This action is irreversible and cannot be undone.`
            : ""
        }
        confirmLabel="Confirm & Burn"
        cancelLabel="Cancel"
        loading={
          pendingReward !== null &&
          redeemStatus[pendingReward.id] === "loading"
        }
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
