'use client';

import { usePlan } from '@/context/plan-context';
import type {
  FeatureId,
  ScribblerTool,
  FeatureAccessResult,
} from '@/lib/features/types';

/**
 * Hook for checking access to a specific feature
 * 
 * @param featureId - The feature to check access for
 * @returns Feature access result with access status and upgrade info
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { hasAccess, reason, upgradeInfo } = useFeatureAccess('ai_advanced');
 *   
 *   if (!hasAccess) {
 *     return <UpgradePrompt upgradeInfo={upgradeInfo} />;
 *   }
 *   
 *   return <AdvancedAIFeature />;
 * }
 * ```
 */
export function useFeatureAccess(featureId: FeatureId): FeatureAccessResult {
  const { hasFeatureAccess } = usePlan();
  return hasFeatureAccess(featureId);
}

/**
 * Hook for checking access to a specific Scribbler tool
 * 
 * @param toolId - The tool to check access for
 * @returns Feature access result with access status, trial info, and upgrade info
 * 
 * @example
 * ```tsx
 * function ToolTab({ toolId }: { toolId: ScribblerTool }) {
 *   const { hasAccess, trialInfo, upgradeInfo } = useToolAccess(toolId);
 *   
 *   if (!hasAccess && trialInfo?.canStartTrial) {
 *     return <TrialPrompt trialInfo={trialInfo} />;
 *   }
 *   
 *   if (!hasAccess) {
 *     return <UpgradePrompt upgradeInfo={upgradeInfo} />;
 *   }
 *   
 *   return <ToolContent />;
 * }
 * ```
 */
export function useToolAccess(toolId: ScribblerTool): FeatureAccessResult {
  const { hasToolAccess } = usePlan();
  return hasToolAccess(toolId);
}

/**
 * Hook for trial management
 * 
 * @returns Trial management functions and state
 * 
 * @example
 * ```tsx
 * function TrialManager() {
 *   const { 
 *     availableTools, 
 *     canStart, 
 *     startTrial, 
 *     getDaysRemaining 
 *   } = useTrialManagement();
 *   
 *   return (
 *     <div>
 *       {availableTools.map(tool => (
 *         <button 
 *           key={tool} 
 *           onClick={() => startTrial(tool)}
 *           disabled={!canStart(tool)}
 *         >
 *           Try {tool}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTrialManagement() {
  const {
    canStartTrialFor,
    startTrial,
    getTrialDaysRemaining,
    availableTrialTools,
    subscription,
  } = usePlan();

  return {
    availableTools: availableTrialTools,
    canStart: canStartTrialFor,
    startTrial,
    getDaysRemaining: getTrialDaysRemaining,
    activeTrials: subscription.toolTrials.filter((t) => t.isActive),
    expiredTrials: subscription.toolTrials.filter((t) => !t.isActive),
  };
}

/**
 * Hook for subscription information
 * 
 * @returns Current subscription state and plan info
 * 
 * @example
 * ```tsx
 * function AccountInfo() {
 *   const { tier, isActive, renewalDate, isAdmin } = useSubscriptionInfo();
 *   
 *   return (
 *     <div>
 *       <p>Plan: {tier}</p>
 *       <p>Status: {isActive ? 'Active' : 'Inactive'}</p>
 *       {isAdmin && <p>Admin privileges active</p>}
 *       {renewalDate && <p>Renews: {renewalDate.toLocaleDateString()}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSubscriptionInfo() {
  const { subscription, isLoading, error, upgradeToPlan, refreshSubscription, isAdmin } = usePlan();

  return {
    tier: subscription.plan.tier,
    isActive: subscription.plan.isActive,
    startDate: subscription.plan.startDate,
    renewalDate: subscription.plan.renewalDate,
    hasAiCollabAddon: subscription.plan.hasAiCollabAddon,
    aiCollabHoursRemaining: subscription.plan.aiCollabHoursRemaining,
    collabHoursUsed: subscription.plan.collabHoursUsed,
    collabHoursLimit: subscription.plan.collabHoursLimit,
    activeTools: subscription.activeTools,
    isLoading,
    error,
    upgradeToPlan,
    refreshSubscription,
    isAdmin,
  };
}
