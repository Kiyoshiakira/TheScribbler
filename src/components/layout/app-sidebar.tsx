'use client';
import {
    Sidebar,
      SidebarHeader,
        SidebarMenu,
          SidebarMenuButton,
            SidebarMenuItem,
              SidebarContent,
                useSidebar,
                } from '@/components/ui/sidebar';
                import {
                  BookText,
                    Clapperboard,
                      StickyNote,
                        Users,
                          NotebookPen,
                            LayoutDashboard,
                              User,
                                LayoutGrid,
                                } from 'lucide-react';
                                import { cn } from '@/lib/utils';
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

                                                                                      interface AppSidebarProps {
                                                                                        activeView: View;
                                                                                          setView: (view: View | 'profile-edit') => void;
                                                                                          }

                                                                                          export default function AppSidebar({ activeView, setView }: AppSidebarProps) {
                                                                                            const { currentScriptId } = useCurrentScript();
                                                                                              const { isMobile, setOpenMobile } = useSidebar();
                                                                                                const noScriptLoaded = !currentScriptId;

                                                                                                  const handleViewChange = (view: View | 'profile-edit') => {
                                                                                                      setView(view);
                                                                                                          if (isMobile) {
                                                                                                                setOpenMobile(false);
                                                                                                                    }
                                                                                                                      };

                                                                                                                        const scriptMenuItems = [
                                                                                                                            { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                                                                                                                                { view: 'editor', label: 'Editor', icon: BookText },
                                                                                                                                    { view: 'logline', label: 'Logline', icon: NotebookPen },
                                                                                                                                        { view: 'scenes', label: 'Scenes', icon: Clapperboard },
                                                                                                                                            { view: 'characters', label: 'Characters', icon: Users },
                                                                                                                                                { view: 'notes', label: 'Notes', icon: StickyNote },
                                                                                                                                                      ] as const;

                                                                                                                                                        return (
                                                                                                                                                            <Sidebar collapsible="icon" side="left">
                                                                                                                                                                  <SidebarHeader>
                                                                                                                                                                          <button className="flex items-center gap-2 p-2" onClick={() => handleViewChange('dashboard')}>
                                                                                                                                                                                      <Logo />
                                                                                                                                                                                                  <h1 className="text-xl font-bold font-headline">ScriptScribbler</h1>
                                                                                                                                                                                                          </button>
                                                                                                                                                                                                                </SidebarHeader>
                                                                                                                                                                                                                      <SidebarContent>
                                                                                                                                                                                                                              <SidebarMenu className="flex-1 overflow-y-auto p-2">
                                                                                                                                                                                                                                          {scriptMenuItems.map(item => (
                                                                                                                                                                                                                                                          <SidebarMenuItem key={item.view}>
                                                                                                                                                                                                                                                                              <SidebarMenuButton
                                                                                                                                                                                                                                                                                                      onClick={() => handleViewChange(item.view)}
                                                                                                                                                                                                                                                                                                                              isActive={activeView === item.view}
                                                                                                                                                                                                                                                                                                                                                      tooltip={item.label}
                                                                                                                                                                                                                                                                                                                                                                              aria-disabled={noScriptLoaded && item.view !== 'dashboard'}
                                                                                                                                                                                                                                                                                                                                                                                                      className={cn(noScriptLoaded && item.view !== 'dashboard' && 'opacity-50 cursor-not-allowed')}
                                                                                                                                                                                                                                                                                                                                                                                                                          >
                                                                                                                                                                                                                                                                                                                                                                                                                                                  <item.icon />
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <span>{item.label}</span>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              </SidebarMenuButton>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          </SidebarMenuItem>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ))}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              </SidebarMenu>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    </SidebarContent>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </Sidebar>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          }