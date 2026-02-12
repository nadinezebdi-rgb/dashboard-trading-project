'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  TrendingUp, 
  BarChart3, 
  BookOpen, 
  Brain, 
  Target,
  Settings,
  LogOut,
  Sparkles,
  User,
  Mail,
  Shield,
  Menu,
  X,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/journal', label: 'Journal', icon: BookOpen },
    { href: '/analysis', label: 'Analyse IA', icon: Brain },
    { href: '/coaching', label: 'Coaching', icon: Target },
    { href: '/subscription', label: 'Abonnement', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          <span className="font-heading font-bold tracking-tight uppercase">Trading AI</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-zinc-950 border-r border-zinc-800 z-40 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            <span className="font-heading font-bold text-lg tracking-tight uppercase">Trading AI</span>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-sm transition-all text-muted-foreground hover:text-white hover:bg-zinc-900"
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="font-bold text-primary">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.subscription || 'Free'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/settings" className="btn-primary flex-1 flex items-center justify-center gap-2 py-2">
              <Settings className="w-4 h-4" />
            </Link>
            <button onClick={handleLogout} className="btn-secondary flex-1 flex items-center justify-center gap-2 py-2">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">
              Paramètres
            </h1>
            <p className="text-muted-foreground">Gère ton compte et tes préférences</p>
          </div>

          <div className="max-w-2xl space-y-6">
            {/* Profile */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                <User className="w-5 h-5 text-primary" />
                <h2 className="font-heading font-bold uppercase tracking-tight">Profil</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={user?.name || ''}
                    disabled
                    data-testid="settings-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    className="input w-full"
                    value={user?.email || ''}
                    disabled
                    data-testid="settings-email"
                  />
                </div>
              </div>
            </div>

            {/* Trading Profile */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="font-heading font-bold uppercase tracking-tight">Profil Trading</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground uppercase">Style</span>
                  <p className="font-medium capitalize">{user?.trading_style?.replace('_', ' ') || 'Non défini'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase">Niveau</span>
                  <p className="font-medium capitalize">{user?.experience_level || 'Non défini'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-muted-foreground uppercase">Marchés</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {user?.preferred_markets?.length > 0 ? (
                      user.preferred_markets.map((market, i) => (
                        <span key={i} className="px-2 py-1 text-xs bg-zinc-900 rounded-sm capitalize">
                          {market}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">Non définis</span>
                    )}
                  </div>
                </div>
              </div>

              <Link 
                href="/onboarding" 
                className="btn-secondary mt-6 w-full text-center"
                data-testid="redo-onboarding"
              >
                Refaire le questionnaire
              </Link>
            </div>

            {/* Subscription */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="font-heading font-bold uppercase tracking-tight">Abonnement</h2>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize">{user?.subscription || 'Free'}</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.subscription && user?.subscription !== 'free' 
                      ? 'Renouvellement automatique' 
                      : 'Passe à un plan payant pour plus de fonctionnalités'}
                  </p>
                </div>
                <Link href="/subscription" className="btn-primary" data-testid="manage-subscription">
                  Gérer
                </Link>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="card border-loss/30">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                <Shield className="w-5 h-5 text-loss" />
                <h2 className="font-heading font-bold uppercase tracking-tight text-loss">Zone Danger</h2>
              </div>
              
              <button 
                onClick={handleLogout}
                className="btn-secondary text-loss border-loss/30 hover:bg-loss/10 w-full"
                data-testid="logout-settings"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </main>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
