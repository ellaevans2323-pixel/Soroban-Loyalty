/**
 * RewardList Component
 * 
 * Displays a list of rewards claimed by the user. Shows reward amount, claim date,
 * redemption status, and a redeem button for unredeemed rewards.
 * 
 * @example
 * ```tsx
 * import { RewardList } from '@/components/RewardList';
 * 
 * export function RewardsPage({ rewards }) {
 *   const [redeemStatus, setRedeemStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});
 *   const [redeemMessage, setRedeemMessage] = useState<Record<string, string>>({});
 *   
 *   const handleRedeem = async (reward: Reward) => {
 *     setRedeemStatus((prev) => ({ ...prev, [reward.id]: 'loading' }));
 *     try {
 *       await redeemReward(reward.id);
 *       setRedeemStatus((prev) => ({ ...prev, [reward.id]: 'success' }));
 *     } catch (err) {
 *       setRedeemStatus((prev) => ({ ...prev, [reward.id]: 'error' }));
 *       setRedeemMessage((prev) => ({ ...prev, [reward.id]: err.message }));
 *     }
 *   };
 *   
 *   return (
 *     <RewardList
 *       rewards={rewards}
 *       onRedeem={handleRedeem}
 *       redeemStatus={redeemStatus}
 *       redeemMessage={redeemMessage}
 *     />
 *   );
 * }
 * ```
 * 
 * @component
 * @param {RewardListProps} props
 * @returns {JSX.Element} List of rewards or empty state
 */

"use client";

import { Reward } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";

/**
 * Props for RewardList component
 * 
 * @typedef {Object} RewardListProps
 * @property {Reward[]} rewards - Array of reward objects to display
 * @property {(reward: Reward) => void} [onRedeem] - Callback when user clicks redeem button
 * @property {string | null} [redeeming] - ID of reward currently being redeemed (disables button)
 * @property {string | null} [error] - Error message to display instead of the list
 * @property {() => void} [onRetry] - Callback to retry the failed fetch
 */
interface Props {
  rewards: Reward[];
  onRedeem?: (reward: Reward) => void;
  redeemStatus?: Record<string, 'idle' | 'loading' | 'success' | 'error'>;
  redeemMessage?: Record<string, string>;
  error?: string | null;
  onRetry?: () => void;
}

export function RewardList({ rewards, onRedeem, redeemStatus = {}, redeemMessage = {}, error, onRetry }: Props) {
  const { t } = useI18n();

  if (error) {
    return <ErrorState message={error} onRetry={onRetry ?? (() => {})} />;
  }

  if (rewards.length === 0) {
    return (
      <EmptyState
        illustration="rewards"
        title={t('rewards.noRewards')}
        description="Complete a campaign to earn LYT tokens."
        cta={{ label: "Claim your first reward", href: "/campaigns" }}
      />
    );
  }

  return (
    <ul className="reward-list">
      {rewards.map((r) => (
        <li key={r.id} className="reward-item">
          <div>
            <strong>{t('campaigns.details.campaign')} #{r.campaign_id}</strong>
            <span className="reward-amount">{r.amount.toLocaleString()} LYT</span>
          </div>
          <div className="reward-meta">
            <span>{r.redeemed ? t('rewards.redeemed', { amount: r.redeemed_amount.toString() }) : t('rewards.available')}</span>
            <span>{new Date(r.claimed_at).toLocaleDateString()}</span>
          </div>
          {onRedeem && !r.redeemed && (() => {
            const status = redeemStatus[r.id] ?? 'idle';
            const isLoading = status === 'loading';
            const isSuccess = status === 'success';
            const isError = status === 'error';
            const buttonText = isLoading
              ? t('rewards.actions.redeeming')
              : isSuccess
              ? t('rewards.actions.redeemed')
              : isError
              ? redeemMessage[r.id] || t('messages.redeemFailed')
              : t('rewards.actions.redeem');

            return (
              <button
                onClick={() => onRedeem(r)}
                disabled={isLoading || isSuccess}
                className="btn btn-secondary"
                aria-label={`Redeem ${r.amount} LYT from campaign ${r.campaign_id}`}
              >
                {isLoading && <span className="inline-spinner" aria-hidden="true" style={{ marginRight: 8 }} />}
                {buttonText}
              </button>
            );
          })()}
        </li>
      ))}
    </ul>
  );
}
