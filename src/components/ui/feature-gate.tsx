'use client';

import * as React from 'react';
import { useFeatureAccess, useToolAccess } from '@/hooks/use-feature-access';
import { usePlan } from '@/context/plan-context';
import type { FeatureId, ScribblerTool, UpgradeInfo, TrialInfo } from '@/lib/features/types';
import { FEATURE_DISPLAY_NAMES, SCRIBBLER_TOOLS, PLAN_CONFIGS } from '@/lib/features/plans';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Lock, Sparkles, Clock, ArrowRight } from 'lucide-react';

interface FeatureGateProps {
  /** The feature to gate */
  featureId: FeatureId;
  /** Content to show when access is granted */
  children: React.ReactNode;
  /** Optional custom locked state UI */
  lockedFallback?: React.ReactNode;
  /** Whether to show inline upgrade prompt instead of dialog */
  inline?: boolean;
}

/**
 * Component that gates content based on feature access
 * 
 * @example
 * ```tsx
 * <FeatureGate featureId="ai_advanced">
 *   <AdvancedAIPanel />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  featureId,
  children,
  lockedFallback,
  inline = false,
}: FeatureGateProps) {
  const accessResult = useFeatureAccess(featureId);

  if (accessResult.hasAccess) {
    return <>{children}</>;
  }

  if (lockedFallback) {
    return <>{lockedFallback}</>;
  }

  if (inline) {
    return (
      <InlineUpgradePrompt
        featureId={featureId}
        upgradeInfo={accessResult.upgradeInfo}
      />
    );
  }

  return (
    <LockedFeatureCard
      featureId={featureId}
      upgradeInfo={accessResult.upgradeInfo}
    />
  );
}

interface ToolGateProps {
  /** The tool to gate */
  toolId: ScribblerTool;
  /** Content to show when access is granted */
  children: React.ReactNode;
  /** Optional custom locked state UI */
  lockedFallback?: React.ReactNode;
}

/**
 * Component that gates content based on tool access
 * 
 * @example
 * ```tsx
 * <ToolGate toolId="SonnetScribbler">
 *   <SonnetEditor />
 * </ToolGate>
 * ```
 */
export function ToolGate({
  toolId,
  children,
  lockedFallback,
}: ToolGateProps) {
  const accessResult = useToolAccess(toolId);
  const { startTrial } = usePlan();
  const [showDialog, setShowDialog] = React.useState(false);

  if (accessResult.hasAccess) {
    // Show trial badge if access is via trial
    if (accessResult.reason === 'trial_active' && accessResult.trialInfo) {
      return (
        <div className="relative">
          <TrialBadge trialInfo={accessResult.trialInfo} />
          {children}
        </div>
      );
    }
    return <>{children}</>;
  }

  if (lockedFallback) {
    return <>{lockedFallback}</>;
  }

  const tool = SCRIBBLER_TOOLS.find((t) => t.id === toolId);

  return (
    <>
      <LockedToolCard
        toolId={toolId}
        trialInfo={accessResult.trialInfo}
        upgradeInfo={accessResult.upgradeInfo}
        onStartTrial={() => setShowDialog(true)}
      />
      
      {accessResult.trialInfo?.canStartTrial && (
        <TrialStartDialog
          toolName={tool?.name ?? toolId}
          trialInfo={accessResult.trialInfo}
          open={showDialog}
          onOpenChange={setShowDialog}
          onConfirm={async () => {
            await startTrial(toolId);
            setShowDialog(false);
          }}
        />
      )}
    </>
  );
}

// --- Sub-components ---

interface LockedFeatureCardProps {
  featureId: FeatureId;
  upgradeInfo?: UpgradeInfo;
}

function LockedFeatureCard({ featureId, upgradeInfo }: LockedFeatureCardProps) {
  const featureName = FEATURE_DISPLAY_NAMES[featureId];

  return (
    <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-lg bg-muted/30">
      <Lock className="w-8 h-8 text-muted-foreground mb-3" />
      <h3 className="text-lg font-medium mb-1">{featureName}</h3>
      <p className="text-sm text-muted-foreground text-center mb-4">
        {upgradeInfo?.message ?? 'This feature requires an upgrade.'}
      </p>
      {upgradeInfo && (
        <Button size="sm">
          Upgrade to {PLAN_CONFIGS[upgradeInfo.requiredTier].name}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
}

interface InlineUpgradePromptProps {
  featureId: FeatureId;
  upgradeInfo?: UpgradeInfo;
}

function InlineUpgradePrompt({ featureId, upgradeInfo }: InlineUpgradePromptProps) {
  const featureName = FEATURE_DISPLAY_NAMES[featureId];

  return (
    <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
      <Lock className="w-4 h-4 flex-shrink-0" />
      <span>
        <strong>{featureName}</strong> requires{' '}
        {upgradeInfo ? (
          <button className="underline hover:no-underline">
            {PLAN_CONFIGS[upgradeInfo.requiredTier].name}
          </button>
        ) : (
          'an upgrade'
        )}
      </span>
    </div>
  );
}

interface LockedToolCardProps {
  toolId: ScribblerTool;
  trialInfo?: TrialInfo;
  upgradeInfo?: UpgradeInfo;
  onStartTrial: () => void;
}

function LockedToolCard({
  toolId,
  trialInfo,
  upgradeInfo,
  onStartTrial,
}: LockedToolCardProps) {
  const tool = SCRIBBLER_TOOLS.find((t) => t.id === toolId);

  return (
    <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/30">
      <Lock className="w-10 h-10 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">{tool?.name ?? toolId}</h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
        {tool?.description}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        {trialInfo?.canStartTrial && (
          <Button onClick={onStartTrial} variant="default">
            <Sparkles className="w-4 h-4 mr-2" />
            Start Free {trialInfo.trialDays}-Day Trial
          </Button>
        )}
        
        {upgradeInfo && (
          <Button variant={trialInfo?.canStartTrial ? 'outline' : 'default'}>
            Upgrade to {PLAN_CONFIGS[upgradeInfo.requiredTier].name}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {trialInfo && !trialInfo.canStartTrial && trialInfo.trialDays === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          {trialInfo.message}
        </p>
      )}
    </div>
  );
}

interface TrialBadgeProps {
  trialInfo: TrialInfo;
}

function TrialBadge({ trialInfo }: TrialBadgeProps) {
  return (
    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium">
      <Clock className="w-3 h-3" />
      <span>{trialInfo.trialDays} days left in trial</span>
    </div>
  );
}

interface TrialStartDialogProps {
  toolName: string;
  trialInfo: TrialInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

function TrialStartDialog({
  toolName,
  trialInfo,
  open,
  onOpenChange,
  onConfirm,
}: TrialStartDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Start Your Free Trial
          </DialogTitle>
          <DialogDescription>
            You&apos;re about to start a {trialInfo.trialDays}-day free trial of{' '}
            <strong>{toolName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 flex-shrink-0">
              ✓
            </div>
            <div>
              <p className="font-medium">Full access for {trialInfo.trialDays} days</p>
              <p className="text-sm text-muted-foreground">
                Experience all features of {toolName}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 flex-shrink-0">
              ✓
            </div>
            <div>
              <p className="font-medium">No credit card required</p>
              <p className="text-sm text-muted-foreground">
                Trial starts immediately, no payment info needed
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 flex-shrink-0">
              ✓
            </div>
            <div>
              <p className="font-medium">Switch tools after trial</p>
              <p className="text-sm text-muted-foreground">
                Try another Scribbler tool or upgrade for continued access
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Starting...' : 'Start Trial'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Simple hook to check if a feature is available (boolean only)
 * Useful for conditional rendering without full access info
 */
export function useIsFeatureAvailable(featureId: FeatureId): boolean {
  const accessResult = useFeatureAccess(featureId);
  return accessResult.hasAccess;
}

/**
 * Simple hook to check if a tool is available (boolean only)
 */
export function useIsToolAvailable(toolId: ScribblerTool): boolean {
  const accessResult = useToolAccess(toolId);
  return accessResult.hasAccess;
}
