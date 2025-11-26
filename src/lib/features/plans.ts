/**
 * Feature Flag System - Plan Configurations
 * 
 * This file contains the static configuration for all subscription plans,
 * based on the pricing structure in pricing_and_plans.md
 */

import type { PlanConfig, PlanTier, FeatureId, ScribblerTool } from './types';

// Plan configurations based on pricing_and_plans.md
export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  free: {
    tier: 'free',
    name: 'Free Tier',
    monthlyPrice: 0,
    description: 'Solo Writing + 30-Day Tool Trials',
    features: [
      'solo_writing',
      'export_pdf',
      'export_docx',
      'export_epub',
      'export_markdown',
      'export_html',
      'ai_basic',
      'tool_trial',
    ],
    toolAccess: 'trial',
    collabHoursPerMonth: 0,
    aiCollabIncluded: false,
    aiCollabHoursIncluded: 0,
  },
  medium: {
    tier: 'medium',
    name: 'Collaborate & Create',
    monthlyPrice: 10,
    description: 'Access any TWO Scribbler tools with collaboration features',
    features: [
      'solo_writing',
      'export_pdf',
      'export_docx',
      'export_epub',
      'export_markdown',
      'export_html',
      'ai_basic',
      'ai_enhanced',
      'collab_basic',
      'tool_two',
      'priority_support',
    ],
    toolAccess: 'two',
    collabHoursPerMonth: 5,
    aiCollabIncluded: false,
    aiCollabHoursIncluded: 0,
  },
  high: {
    tier: 'high',
    name: 'Pro Writer',
    monthlyPrice: 15,
    description: 'Access all Scribbler tools with unlimited collaboration',
    features: [
      'solo_writing',
      'export_pdf',
      'export_docx',
      'export_epub',
      'export_markdown',
      'export_html',
      'ai_basic',
      'ai_enhanced',
      'ai_advanced',
      'collab_unlimited',
      'tool_all',
      'priority_support',
      'early_access',
    ],
    toolAccess: 'all',
    collabHoursPerMonth: 'unlimited',
    aiCollabIncluded: false,
    aiCollabHoursIncluded: 0,
  },
  highest: {
    tier: 'highest',
    name: 'Mentor & Monetize',
    monthlyPrice: 20,
    description: 'Full access with mentorship and monetization features',
    features: [
      'solo_writing',
      'export_pdf',
      'export_docx',
      'export_epub',
      'export_markdown',
      'export_html',
      'ai_basic',
      'ai_enhanced',
      'ai_advanced',
      'ai_collaboration',
      'collab_unlimited',
      'tool_all',
      'priority_support',
      'early_access',
      'mentor_eligible',
      'mentor_marketplace',
      'team_workspace',
    ],
    toolAccess: 'all',
    collabHoursPerMonth: 'unlimited',
    aiCollabIncluded: true,
    aiCollabHoursIncluded: -1, // Unlimited with fair use
  },
};

// AI Collaboration add-on pricing
export const AI_COLLAB_ADDON = {
  monthlyPrice: 5,
  hoursIncluded: {
    medium: 5,
    high: 10,
  },
  payAsYouGoRate: 6, // per hour
};

// Trial configuration
export const TRIAL_CONFIG = {
  durationDays: 30,
  cooldownDays: 0, // No cooldown mentioned, user can switch immediately after trial ends
};

// Available Scribbler tools
export const SCRIBBLER_TOOLS: { id: ScribblerTool; name: string; description: string }[] = [
  {
    id: 'ScriptScribbler',
    name: 'Script Scribbler',
    description: 'Scripts, screenplays, stage plays',
  },
  {
    id: 'StoryScribbler',
    name: 'Story Scribbler',
    description: 'Stories, fiction, non-fiction',
  },
  {
    id: 'SonnetScribbler',
    name: 'Sonnet Scribbler',
    description: 'Poetry, structured verse, rhyme tools',
  },
];

// Feature display names for UI
export const FEATURE_DISPLAY_NAMES: Record<FeatureId, string> = {
  solo_writing: 'Solo Writing',
  export_pdf: 'PDF Export',
  export_docx: 'DOCX Export',
  export_epub: 'EPUB Export',
  export_markdown: 'Markdown Export',
  export_html: 'HTML Export',
  ai_basic: 'Basic AI Assistance',
  ai_enhanced: 'Enhanced AI',
  ai_advanced: 'Advanced AI',
  ai_collaboration: 'AI Collaboration',
  collab_basic: 'Basic Collaboration',
  collab_unlimited: 'Unlimited Collaboration',
  mentor_eligible: 'Mentor Eligibility',
  mentor_marketplace: 'Mentor Marketplace',
  tool_trial: 'Tool Trials',
  tool_two: 'Two Tool Access',
  tool_all: 'All Tools Access',
  early_access: 'Early Access',
  team_workspace: 'Team Workspace',
  priority_support: 'Priority Support',
};

/**
 * Get the plan configuration for a specific tier
 */
export function getPlanConfig(tier: PlanTier): PlanConfig {
  return PLAN_CONFIGS[tier];
}

/**
 * Get all plan configurations as an array, ordered by price
 */
export function getAllPlanConfigs(): PlanConfig[] {
  return Object.values(PLAN_CONFIGS);
}

/**
 * Get the next tier upgrade from current tier
 */
export function getNextTier(currentTier: PlanTier): PlanTier | null {
  const tierOrder: PlanTier[] = ['free', 'medium', 'high', 'highest'];
  const currentIndex = tierOrder.indexOf(currentTier);
  if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
    return null;
  }
  return tierOrder[currentIndex + 1];
}

/**
 * Check if a tier includes a specific feature
 */
export function tierHasFeature(tier: PlanTier, feature: FeatureId): boolean {
  return PLAN_CONFIGS[tier].features.includes(feature);
}

/**
 * Get the minimum tier required for a feature
 */
export function getMinimumTierForFeature(feature: FeatureId): PlanTier | null {
  const tierOrder: PlanTier[] = ['free', 'medium', 'high', 'highest'];
  for (const tier of tierOrder) {
    if (tierHasFeature(tier, feature)) {
      return tier;
    }
  }
  return null;
}
