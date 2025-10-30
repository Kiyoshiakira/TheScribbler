'use client';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarContent,
  SidebarFooter
} from '@/components/ui/sidebar';
import {
  BookText,
  Clapperboard,
  StickyNote,
  Users,
  NotebookPen,
  LayoutDashboard,
  FileText,
  Clock,
  User as UserIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScript } from '@/context/script-context';
import { Skeleton } from '../ui/skeleton';
import type { View } from './AppLayout';
import { useCurrentScript } from '@/context/current-script-context';

export const Logo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-8 w-8 text-primary"
  >
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
    <path d="M12 4v16" />
  </svg>
);

interface ScriptStats {
  pageCount: number;
  characterCount: number;
  estimatedMinutes: number;
}

const StatDisplay = ({ icon, value, label, isLoading }: { icon: React.ReactNode, value: string | number, label: string, isLoading: boolean }) => (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-sidebar-foreground/80">
        {icon}
        <span>{label}</span>
      </div>
      {isLoading ? <Skeleton className="h-4 w-8" /> : <span className="font-semibold">{value}</span>}
    </div>
);


const ScriptStatsPanel = ({ stats, isLoading }: { stats: ScriptStats, isLoading: boolean }) => {
    return (
        <div className="space-y-2 rounded-lg bg-sidebar-accent p-3">
             <StatDisplay icon={<FileText />} label="Pages" value={stats.pageCount} isLoading={isLoading} />
             <StatDisplay icon={<Users />} label="Characters" value={stats.characterCount} isLoading={isLoading} />
             <StatDisplay icon={<Clock />} label="Time" value={`${stats.estimatedMinutes} min`} isLoading={isLoading} />
        </div>
    )
}

export default function AppSidebar({
  activeView,
  setView,
  stats,
  isLoadingStats
}: {
  activeView: View;
  setView: (view: View | 'settings' | 'profile-edit') => void;
  stats: ScriptStats;
  isLoadingStats: boolean;
}) {
  const { isScriptLoading } = useScript();
  const { currentScriptId } = useCurrentScript();
  
  const noScriptLoaded = !currentScriptId;

  const scriptMenuItems = [
    { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'editor', label: 'Editor', icon: BookText },
    { view: 'logline', label: 'Logline', icon: NotebookPen },
    { view: 'scenes', label: 'Scenes', icon: Clapperboard },
    { view: 'characters', label: 'Characters', icon: Users },
    { view: 'notes', label: 'Notes', icon: StickyNote },
  ] as const;

  return (
    <Sidebar variant="sidebar" collapsible="icon" side="left">
      <SidebarHeader>
        <button className="flex items-center gap-2 p-2" onClick={() => noScriptLoaded ? setView('profile') : setView('dashboard')}>
            <Logo />
            <h1 className="text-xl font-bold font-headline">ScriptScribbler</h1>
        </button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="flex-1 overflow-y-auto p-2">
            {scriptMenuItems.map(item => (
                <SidebarMenuItem key={item.view}>
                    <SidebarMenuButton
                        onClick={() => setView(item.view)}
                        isActive={activeView === item.view}
                        tooltip={item.label}
                        aria-disabled={noScriptLoaded && item.view !== 'dashboard' && item.view !== 'profile'}
                        className={cn(noScriptLoaded && item.view !== 'dashboard' && item.view !== 'profile' && "cursor-not-allowed opacity-50")}
                        disabled={noScriptLoaded && item.view !== 'dashboard' && item.view !== 'profile'}
                    >
                        <item.icon />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
          {currentScriptId && <ScriptStatsPanel stats={stats} isLoading={isLoadingStats || isScriptLoading} />}
      </SidebarFooter>
    </Sidebar>
  );
}
