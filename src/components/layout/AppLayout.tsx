import { ReactNode, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Key,
  StickyNote,
  CheckSquare,
  FolderLock,
  Wallet,
  TrendingUp,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/passwords', label: 'Passwords', icon: Key },
  { path: '/notes', label: 'Notes', icon: StickyNote },
  { path: '/todos', label: 'Tasks', icon: CheckSquare },
  { path: '/vault', label: 'Digital Vault', icon: FolderLock },
  { path: '/expenses', label: 'Expenses', icon: Wallet },
  { path: '/income', label: 'Income', icon: TrendingUp },
];

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const currentPage = navItems.find(item => location.pathname.startsWith(item.path));

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-spring lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">PM</span>
              </div>
              <span className="font-semibold text-foreground">Personal Manager</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon-sm" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span>{item.label}</span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 ml-auto text-primary" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent/50">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-medium text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon-sm" 
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="h-16 flex items-center gap-4 px-4 border-b border-border lg:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            {currentPage && (
              <>
                <currentPage.icon className="w-5 h-5 text-primary" />
                <span className="font-semibold">{currentPage.label}</span>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
