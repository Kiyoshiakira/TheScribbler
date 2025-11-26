/**
 * Feature Flag System - Type Definitions
 * 
 * This file defines all types and interfaces for the feature gating system,
 * based on the pricing structure in pricing_and_plans.md
 */

// Available Scribbler tools/tabs
export type ScribblerTool = 
  | 'ScriptScribbler'
  | 'StoryScribbler'
  | 'SonnetScribbler';

// Plan tier identifiers
export type PlanTier = 'free' | 'medium' | 'high' | 'highest';

// Feature identifiers for gating
export type FeatureId =
  // Core writing features
  | 'solo_writing'
  | 'export_pdf'
  | 'export_docx'
  | 'export_epub'
  | 'export_markdown'
  | 'export_html'
  // AI features
  | 'ai_basic'           // Minimal AI (short suggestions, basic grammar)
  | 'ai_enhanced'        // Longer suggestions, text generation
  | 'ai_advanced'        // Multi-turn, style matching
  | 'ai_collaboration'   // AI collab add-on
  // Collaboration features
  | 'collab_basic'       // 5 hours/month person-to-person
  | 'collab_unlimited'   // Unlimited person-to-person
  // Mentorship features
  | 'mentor_eligible'    // Can become a paid mentor
  | 'mentor_marketplace' // Featured on mentor marketplace
  // Tool access
  | 'tool_trial'         // Can trial premium tools
  | 'tool_two'           // Access to any 2 tools
  | 'tool_all'           // Access to all tools
  // Premium features
  | 'early_access'       // Early access to new features
  | 'team_workspace'     // Advanced team/workspace features
  | 'priority_support';  // Priority support access

// Trial status for a specific tool
export interface ToolTrialStatus {
  toolId: ScribblerTool;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  daysRemaining: number;
}

// User's subscription/plan information
export interface UserPlan {
  tier: PlanTier;
  isActive: boolean;
  startDate: Date | null;
  renewalDate: Date | null;
  // Add-ons
  hasAiCollabAddon: boolean;
  aiCollabHoursRemaining: number;
  // Collaboration hours used (for medium tier)
  collabHoursUsed: number;
  collabHoursLimit: number;
}

// Complete user subscription state
export interface UserSubscription {
  plan: UserPlan;
  toolTrials: ToolTrialStatus[];
  // Active tool selections (for medium tier, max 2)
  activeTools: ScribblerTool[];
}

// Feature access result
export interface FeatureAccessResult {
  hasAccess: boolean;
  reason: FeatureAccessReason;
  upgradeInfo?: UpgradeInfo;
  trialInfo?: TrialInfo;
}

// Why access was granted or denied
export type FeatureAccessReason =
  | 'plan_includes'        // Feature included in current plan
  | 'trial_active'         // Feature available via active trial
  | 'addon_active'         // Feature available via add-on
  | 'plan_required'        // Need to upgrade plan
  | 'trial_expired'        // Trial has expired
  | 'addon_required'       // Need to purchase add-on
  | 'limit_reached'        // Usage limit reached (e.g., collab hours)
  | 'tool_not_selected';   // Tool not in active selection (medium tier)

// Information for upgrade prompts
export interface UpgradeInfo {
  requiredTier: PlanTier;
  monthlyPrice: number;
  features: string[];
  message: string;
}

// Information for trial prompts
export interface TrialInfo {
  toolId: ScribblerTool;
  canStartTrial: boolean;
  trialDays: number;
  message: string;
}

// Plan configuration (static data)
export interface PlanConfig {
  tier: PlanTier;
  name: string;
  monthlyPrice: number;
  description: string;
  features: FeatureId[];
  toolAccess: 'trial' | 'two' | 'all';
  collabHoursPerMonth: number | 'unlimited';
  aiCollabIncluded: boolean;
  aiCollabHoursIncluded: number;
}
