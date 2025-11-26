/**
 * Feature Flag System - Feature Access Service
 * 
 * This file contains the core logic for determining feature access
 * based on user's subscription plan, trials, and add-ons.
 */

import type {
  FeatureId,
  FeatureAccessResult,
  UserSubscription,
  ScribblerTool,
  ToolTrialStatus,
  UpgradeInfo,
  PlanTier,
} from './types';
import {
  PLAN_CONFIGS,
  TRIAL_CONFIG,
  getMinimumTierForFeature,
  tierHasFeature,
  getNextTier,
} from './plans';

/**
 * Check if a user has access to a specific feature
 */
export function checkFeatureAccess(
  subscription: UserSubscription,
  featureId: FeatureId
): FeatureAccessResult {
  const { plan } = subscription;
  const planConfig = PLAN_CONFIGS[plan.tier];

  // Check if plan includes this feature
  if (planConfig.features.includes(featureId)) {
    return {
      hasAccess: true,
      reason: 'plan_includes',
    };
  }

  // Check for AI collaboration add-on
  if (featureId === 'ai_collaboration' && plan.hasAiCollabAddon) {
    if (plan.aiCollabHoursRemaining > 0 || plan.aiCollabHoursRemaining === -1) {
      return {
        hasAccess: true,
        reason: 'addon_active',
      };
    }
    return {
      hasAccess: false,
      reason: 'limit_reached',
      upgradeInfo: createUpgradeInfo(featureId, plan.tier),
    };
  }

  // Check collaboration limits
  if (featureId === 'collab_basic' && plan.tier === 'medium') {
    if (plan.collabHoursUsed < plan.collabHoursLimit) {
      return {
        hasAccess: true,
        reason: 'plan_includes',
      };
    }
    return {
      hasAccess: false,
      reason: 'limit_reached',
      upgradeInfo: createUpgradeInfo('collab_unlimited', plan.tier),
    };
  }

  // Feature not available - provide upgrade info
  return {
    hasAccess: false,
    reason: 'plan_required',
    upgradeInfo: createUpgradeInfo(featureId, plan.tier),
  };
}

/**
 * Check if a user has access to a specific Scribbler tool
 */
export function checkToolAccess(
  subscription: UserSubscription,
  toolId: ScribblerTool
): FeatureAccessResult {
  const { plan, toolTrials, activeTools } = subscription;
  const planConfig = PLAN_CONFIGS[plan.tier];

  // All tools access (high and highest tiers)
  if (planConfig.toolAccess === 'all') {
    return {
      hasAccess: true,
      reason: 'plan_includes',
    };
  }

  // Two tools access (medium tier) - check if tool is selected
  if (planConfig.toolAccess === 'two') {
    if (activeTools.includes(toolId)) {
      return {
        hasAccess: true,
        reason: 'plan_includes',
      };
    }
    // Tool not selected, but user could switch
    return {
      hasAccess: false,
      reason: 'tool_not_selected',
      upgradeInfo: createUpgradeInfo('tool_all', plan.tier),
    };
  }

  // Free tier - check for active trial
  const trial = toolTrials.find((t) => t.toolId === toolId);
  if (trial?.isActive && trial.daysRemaining > 0) {
    return {
      hasAccess: true,
      reason: 'trial_active',
      trialInfo: {
        toolId,
        canStartTrial: false,
        trialDays: trial.daysRemaining,
        message: `Trial ends in ${trial.daysRemaining} days`,
      },
    };
  }

  // Check if trial has expired
  if (trial && !trial.isActive) {
    return {
      hasAccess: false,
      reason: 'trial_expired',
      trialInfo: {
        toolId,
        canStartTrial: false,
        trialDays: 0,
        message: 'Your trial has ended. Upgrade for continued access!',
      },
      upgradeInfo: createUpgradeInfo('tool_two', plan.tier),
    };
  }

  // No trial - can start one
  return {
    hasAccess: false,
    reason: 'plan_required',
    trialInfo: {
      toolId,
      canStartTrial: true,
      trialDays: TRIAL_CONFIG.durationDays,
      message: `Start your free ${TRIAL_CONFIG.durationDays}-day trial!`,
    },
    upgradeInfo: createUpgradeInfo('tool_two', plan.tier),
  };
}

/**
 * Create upgrade information for a feature
 */
function createUpgradeInfo(featureId: FeatureId, currentTier: PlanTier): UpgradeInfo {
  const requiredTier = getMinimumTierForFeature(featureId);
  
  if (!requiredTier || currentTier === requiredTier) {
    // Feature might require an add-on instead
    const nextTier = getNextTier(currentTier);
    if (!nextTier) {
      return {
        requiredTier: 'highest',
        monthlyPrice: PLAN_CONFIGS.highest.monthlyPrice,
        features: [],
        message: 'This feature requires an add-on or is not yet available.',
      };
    }
    const nextConfig = PLAN_CONFIGS[nextTier];
    return {
      requiredTier: nextTier,
      monthlyPrice: nextConfig.monthlyPrice,
      features: nextConfig.features.filter((f) => !tierHasFeature(currentTier, f)),
      message: `Upgrade to ${nextConfig.name} for $${nextConfig.monthlyPrice}/month`,
    };
  }

  const config = PLAN_CONFIGS[requiredTier];
  return {
    requiredTier,
    monthlyPrice: config.monthlyPrice,
    features: config.features.filter((f) => !tierHasFeature(currentTier, f)),
    message: `Upgrade to ${config.name} for $${config.monthlyPrice}/month`,
  };
}

/**
 * Calculate trial status for a tool
 */
export function calculateTrialStatus(
  toolId: ScribblerTool,
  trialStartDate: Date | null
): ToolTrialStatus {
  if (!trialStartDate) {
    return {
      toolId,
      isActive: false,
      startDate: null,
      endDate: null,
      daysRemaining: 0,
    };
  }

  const endDate = new Date(trialStartDate);
  endDate.setDate(endDate.getDate() + TRIAL_CONFIG.durationDays);

  const now = new Date();
  const isActive = now < endDate;
  const daysRemaining = isActive
    ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    toolId,
    isActive,
    startDate: trialStartDate,
    endDate,
    daysRemaining,
  };
}

/**
 * Create a default subscription for a new/free user
 */
export function createDefaultSubscription(): UserSubscription {
  return {
    plan: {
      tier: 'free',
      isActive: true,
      startDate: null,
      renewalDate: null,
      hasAiCollabAddon: false,
      aiCollabHoursRemaining: 0,
      collabHoursUsed: 0,
      collabHoursLimit: 0,
    },
    toolTrials: [],
    activeTools: [],
  };
}

/**
 * Check if user can start a trial for a tool
 */
export function canStartTrial(
  subscription: UserSubscription,
  toolId: ScribblerTool
): boolean {
  // Only free tier users can use trials
  if (subscription.plan.tier !== 'free') {
    return false;
  }

  // Check if there's already an active trial for any tool
  const hasActiveTrial = subscription.toolTrials.some((t) => t.isActive);
  
  // Check if this specific tool was already trialed
  const existingTrial = subscription.toolTrials.find((t) => t.toolId === toolId);
  if (existingTrial) {
    // Already trialed this tool
    return false;
  }

  // Can start a new trial if no active trial exists
  return !hasActiveTrial;
}

/**
 * Get a list of tools available for trial
 */
export function getAvailableTrialTools(
  subscription: UserSubscription
): ScribblerTool[] {
  if (subscription.plan.tier !== 'free') {
    return [];
  }

  const trialedTools = subscription.toolTrials.map((t) => t.toolId);
  const allTools: ScribblerTool[] = ['ScriptScribbler', 'StoryScribbler', 'SonnetScribbler'];
  
  return allTools.filter((tool) => !trialedTools.includes(tool));
}
