'use client';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  BookText,
  Clapperboard,
  StickyNote,
  Users,
  NotebookPen,
  LayoutDashboard,
  ChevronDown,
  ListTree,
  FileText,
  MapPin,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { View } from './AppLayout';
import { useCurrentScript } from '@/context/current-script-context';
import { useTool, type ToolType } from '@/context/tool-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

/**
 * Logo component that displays the appropriate transparent PNG logo based on the current tool.
 * Uses transparent background RGBA PNG images from /public/images/
 * - ScriptScribbler: scriptscribbler.png
 * - StoryScribbler: storyscribbler.png
 * - Default: logo.png
 */
export const Logo = ({ variant = 'default' }: { variant?: 'default' | ToolType }) => {
  const logoSrc = 
    variant === 'ScriptScribbler' ? '/images/scriptscribbler.png' :
    variant === 'StoryScribbler' ? '/images/storyscribbler.png' :
    '/images/logo.png';
  
  return (
    <Image 
      src={logoSrc} 
      alt="The Scribbler Logo" 
      width={120} 
      height={120} 
      className="object-contain w-full h-auto max-w-[120px]"
      priority
    />
  );
};

interface AppSidebarProps {
  activeView: View;
  setView: (view: View | 'profile-edit') => void;
}

export default function AppSidebar({ activeView, setView }: AppSidebarProps) {
  const { currentScriptId } = useCurrentScript();
  const { isMobile, setOpenMobile } = useSidebar();
  const { currentTool, setCurrentTool } = useTool();
  const noScriptLoaded = !currentScriptId;

  const handleViewChange = (view: View | 'profile-edit') => {
    setView(view);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Separate dashboard from tool-specific items
  const dashboardItem = { view: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard };

  const scriptToolItems = [
    { view: 'editor' as const, label: 'Editor', icon: BookText },
    { view: 'logline' as const, label: 'Logline', icon: NotebookPen },
    { view: 'scenes' as const, label: 'Scenes', icon: Clapperboard },
    { view: 'characters' as const, label: 'Characters', icon: Users },
    { view: 'notes' as const, label: 'Notes', icon: StickyNote },
  ];

  const storyToolItems = [
    { view: 'outline' as const, label: 'Outline', icon: ListTree },
    { view: 'chapters' as const, label: 'Chapters', icon: FileText },
    { view: 'characters' as const, label: 'Characters', icon: Users },
    { view: 'world' as const, label: 'World', icon: MapPin },
    { view: 'timeline' as const, label: 'Timeline', icon: Clock },
    { view: 'story-notes' as const, label: 'Notes', icon: StickyNote },
  ];

  const toolItems = currentTool === 'StoryScribbler' ? storyToolItems : scriptToolItems;

  return (
    <Sidebar collapsible="icon" side="left">
      <SidebarHeader>
        <div className="flex flex-col items-center justify-center gap-1 p-2 w-full">
          <button onClick={() => handleViewChange('dashboard')} aria-label="Go to dashboard">
            <Logo variant={currentTool} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent transition-colors" aria-label="Switch between ScriptScribbler and StoryScribbler">
              <ChevronDown className="h-4 w-4 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={() => setCurrentTool('ScriptScribbler')}>
                <span className={cn('font-medium', currentTool === 'ScriptScribbler' && 'text-primary')}>
                  ScriptScribbler
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrentTool('StoryScribbler')}>
                <span className={cn('font-medium', currentTool === 'StoryScribbler' && 'text-primary')}>
                  StoryScribbler
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Project / Dashboard Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
            Project
          </SidebarGroupLabel>
          <SidebarMenu className="p-2">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleViewChange(dashboardItem.view)}
                isActive={activeView === dashboardItem.view}
                tooltip={dashboardItem.label}
              >
                <dashboardItem.icon />
                <span>{dashboardItem.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Visual Separator */}
        <div className="px-4 py-2">
          <Separator className="bg-border/60 h-[2px]" />
        </div>

        {/* Tool-specific Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
            {currentTool === 'StoryScribbler' ? 'Story Tools' : 'Script Tools'}
          </SidebarGroupLabel>
          <SidebarMenu className="flex-1 overflow-y-auto p-2">
            {toolItems.map(item => (
              <SidebarMenuItem key={item.view}>
                <SidebarMenuButton
                  onClick={() => handleViewChange(item.view)}
                  isActive={activeView === item.view}
                  tooltip={item.label}
                  aria-disabled={noScriptLoaded}
                  className={cn(noScriptLoaded && 'opacity-50 cursor-not-allowed')}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
