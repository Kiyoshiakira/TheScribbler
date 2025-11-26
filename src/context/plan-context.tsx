'use client';

import * as React from 'react';
import { useUser } from '@/firebase';
import type {
  UserSubscription,
  ScribblerTool,
  FeatureId,
  FeatureAccessResult,
  PlanTier,
} from '@/lib/features/types';
import {
  createDefaultSubscription,
  checkFeatureAccess,
  checkToolAccess,
  calculateTrialStatus,
  canStartTrial,
  getAvailableTrialTools,
} from '@/lib/features/feature-flags';
import { isAdmin as checkIsAdmin } from '@/lib/admin';

interface PlanContextType {
  // Subscription state
  subscription: UserSubscription;
  isLoading: boolean;
  error: Error | null;

  // Admin status - admins have unlimited access to all features
  isAdmin: boolean;
  
  // Feature access checks
  hasFeatureAccess: (featureId: FeatureId) => FeatureAccessResult;
  hasToolAccess: (toolId: ScribblerTool) => FeatureAccessResult;
  
  // Trial management
  canStartTrialFor: (toolId: ScribblerTool) => boolean;
  startTrial: (toolId: ScribblerTool) => Promise<void>;
  getTrialDaysRemaining: (toolId: ScribblerTool) => number;
  availableTrialTools: ScribblerTool[];
  
  // Tool selection (for medium tier)
  selectTools: (tools: ScribblerTool[]) => Promise<void>;
  
  // Plan upgrade (placeholder for future implementation)
  upgradeToPlan: (tier: PlanTier) => Promise<void>;
  
  // Refresh subscription data
  refreshSubscription: () => Promise<void>;
}

const PlanContext = React.createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  
  const [subscription, setSubscription] = React.useState<UserSubscription>(
    createDefaultSubscription()
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // Check if user is an admin - admins get unlimited access to all features
  const isAdmin = React.useMemo(() => checkIsAdmin(user?.email), [user?.email]);

  // Load subscription data when user changes
  React.useEffect(() => {
    async function loadSubscription() {
      if (isUserLoading) return;
      
      setIsLoading(true);
      setError(null);

      try {
        if (!user) {
          // No user logged in - use default free subscription
          setSubscription(createDefaultSubscription());
          return;
        }

        // Admin users get the highest tier with unlimited access
        if (checkIsAdmin(user.email)) {
          setSubscription(createAdminSubscription());
          return;
        }

        // TODO: Load subscription from Firestore
        // For now, use mock data based on user
        // This will be replaced with actual Firestore queries
        const mockSubscription = await loadMockSubscription(user.uid);
        setSubscription(mockSubscription);
      } catch (err) {
        console.error('Failed to load subscription:', err);
        setError(err instanceof Error ? err : new Error('Failed to load subscription'));
        setSubscription(createDefaultSubscription());
      } finally {
        setIsLoading(false);
      }
    }

    loadSubscription();
  }, [user, isUserLoading]);

  // Feature access check
  const hasFeatureAccess = React.useCallback(
    (featureId: FeatureId): FeatureAccessResult => {
      return checkFeatureAccess(subscription, featureId);
    },
    [subscription]
  );

  // Tool access check
  const hasToolAccess = React.useCallback(
    (toolId: ScribblerTool): FeatureAccessResult => {
      return checkToolAccess(subscription, toolId);
    },
    [subscription]
  );

  // Trial management
  const canStartTrialFor = React.useCallback(
    (toolId: ScribblerTool): boolean => {
      return canStartTrial(subscription, toolId);
    },
    [subscription]
  );

  const startTrial = React.useCallback(
    async (toolId: ScribblerTool): Promise<void> => {
      if (!user) {
        throw new Error('Must be logged in to start a trial');
      }

      if (!canStartTrial(subscription, toolId)) {
        throw new Error('Cannot start trial for this tool');
      }

      // TODO: Save trial start to Firestore
      // For now, update local state
      const trialStatus = calculateTrialStatus(toolId, new Date());
      
      setSubscription((prev) => ({
        ...prev,
        toolTrials: [...prev.toolTrials, trialStatus],
      }));

      console.log(`Started trial for ${toolId}`);
    },
    [user, subscription]
  );

  const getTrialDaysRemaining = React.useCallback(
    (toolId: ScribblerTool): number => {
      const trial = subscription.toolTrials.find((t) => t.toolId === toolId);
      return trial?.daysRemaining ?? 0;
    },
    [subscription]
  );

  const availableTrialTools = React.useMemo(
    () => getAvailableTrialTools(subscription),
    [subscription]
  );

  // Tool selection for medium tier
  const selectTools = React.useCallback(
    async (tools: ScribblerTool[]): Promise<void> => {
      if (!user) {
        throw new Error('Must be logged in to select tools');
      }

      if (subscription.plan.tier !== 'medium') {
        throw new Error('Tool selection only available for Medium tier');
      }

      if (tools.length > 2) {
        throw new Error('Medium tier allows only 2 tools');
      }

      // TODO: Save tool selection to Firestore
      setSubscription((prev) => ({
        ...prev,
        activeTools: tools,
      }));

      console.log(`Selected tools: ${tools.join(', ')}`);
    },
    [user, subscription.plan.tier]
  );

  // Plan upgrade placeholder
  const upgradeToPlan = React.useCallback(
    async (tier: PlanTier): Promise<void> => {
      if (!user) {
        throw new Error('Must be logged in to upgrade');
      }

      // TODO: Implement actual payment/upgrade flow
      // This is a placeholder that will redirect to payment
      console.log(`Upgrading to ${tier} tier`);
      
      // For development, simulate the upgrade
      setSubscription((prev) => ({
        ...prev,
        plan: {
          ...prev.plan,
          tier,
          isActive: true,
          startDate: new Date(),
          collabHoursLimit: tier === 'medium' ? 5 : 0,
        },
        // Clear trials if upgrading from free
        toolTrials: tier === 'free' ? prev.toolTrials : [],
        // Set active tools for medium tier
        activeTools: tier === 'medium' ? ['ScriptScribbler', 'StoryScribbler'] : [],
      }));
    },
    [user]
  );

  // Refresh subscription data
  const refreshSubscription = React.useCallback(async (): Promise<void> => {
    if (!user) return;

    setIsLoading(true);
    try {
      const mockSubscription = await loadMockSubscription(user.uid);
      setSubscription(mockSubscription);
    } catch (err) {
      console.error('Failed to refresh subscription:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh subscription'));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const value: PlanContextType = {
    subscription,
    isLoading: isLoading || isUserLoading,
    error,
    isAdmin,
    hasFeatureAccess,
    hasToolAccess,
    canStartTrialFor,
    startTrial,
    getTrialDaysRemaining,
    availableTrialTools,
    selectTools,
    upgradeToPlan,
    refreshSubscription,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const context = React.useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}

/**
 * Mock function to load subscription data
 * TODO: Replace with actual Firestore queries using the userId parameter
 */
async function loadMockSubscription(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId: string
): Promise<UserSubscription> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Return default free subscription for now
  // In production, this would query Firestore for the user's subscription data
  return createDefaultSubscription();
}

/**
 * Creates a subscription with unlimited access for admin users.
 * Admins receive the highest tier with all features enabled and no limits.
 */
function createAdminSubscription(): UserSubscription {
  return {
    plan: {
      tier: 'highest',
      isActive: true,
      startDate: new Date(),
      renewalDate: null, // Admins don't need renewal
      hasAiCollabAddon: true,
      aiCollabHoursRemaining: -1, // -1 indicates unlimited
      collabHoursUsed: 0,
      collabHoursLimit: -1, // -1 indicates unlimited
    },
    toolTrials: [], // No trials needed - admin has full access
    activeTools: ['ScriptScribbler', 'StoryScribbler', 'SonnetScribbler'], // All tools active
  };
}
