'use client';

import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * AdminBadge Component
 *
 * Displays a visual indicator when an admin user is logged in.
 * This helps with clarity and testing purposes to confirm admin mode is active.
 *
 * The badge shows a shield icon with "Admin Mode" text and provides
 * additional context via a tooltip explaining the admin privileges.
 */
export function AdminBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20 cursor-default flex items-center gap-1"
          >
            <Shield className="h-3 w-3" />
            <span className="text-xs font-medium">Admin Mode</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm">
            You have admin privileges with unlimited access to all features, tools, and tiers.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
