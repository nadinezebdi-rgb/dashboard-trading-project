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
  Calendar as CalendarIcon,
  Menu,
  X,
  Newspaper,
  MessageSquare,
  Sun,
  Moon,
  Users,
  Trophy,
  Crown,
  Medal,
  Gift,
  Palette,
  Star,
  Lock,
  Check,
  ChevronRight,
  Loader2,
  Zap,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { api } from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';

const PERK_LABELS = {
  custom_avatar_border: { name: 'Bordure Avatar', icon: '🖼️' },
  profile_badge: { name: 'Badge Profil', icon: '🏅' },
  priority_support: { name: 'Support Prioritaire', icon: '⚡' },
  exclusive_emojis: { name: 'Emojis Exclusifs', icon: '😎' },
  webinar_access: { name: 'Accès Webinaires', icon: '🎓' },
  mentoring_discount_10: { name: '-10% Mentoring', icon: '💰' },
  mentoring_discount_20: { name: '-20% Mentoring', icon: '💰' },
  mentoring_discount_30: { name: '-30% Mentoring', icon: '💰' },
  mentoring_discount_50: { name: '-50% Mentoring', icon: '💰' },
  early_access: { name: 'Accès Anticipé', icon: '🚀' },
  vip_chat: { name: 'Chat VIP', icon: '💬' },
  all_perks: { name: 'Tous les Avantages', icon: '👑' },
  subscription_discount_10: { name: '-10% Abonnement', icon: '🎁' },
  free_mentoring_session: { name: 'Session Mentoring Gratuite', icon: '🎯' },
  free_month_subscription: { name: 'Mois Gratuit', icon: '🆓' },
  exclusive_webinar: { name: 'Webinaire Exclusif', icon: '📺' },
  '1on1_mentoring': { name: 'Mentoring 1-on-1', icon: '🤝' },
  champion_badge: { name: 'Badge Champion', icon: '🏆' },
  silver_badge: { name: 'Badge Argent', icon: '🥈' },
  bronze_badge: { name: 'Badge Bronze', icon: '🥉' },
};

export default function RewardsPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('themes');
  const [themes, setThemes] = useState([]);
  const [levelPerks, setLevelPerks] = useState(null);
  const [topPerformer, setTopPerformer] = useState(null);
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activatingTheme, setActivatingTheme] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [themesData, perksData, topData, seasonData] = await Promise.all([
        api.getThemes(),
        api.getLevelPerks(),
        api.getTopPerformerRewards(),
        api.getCurrentSeason()
      ]);
      setThemes(themesData.themes || []);
      setLevelPerks(perksData);
      setTopPerformer(topData);
      setSeason(seasonData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateTheme = async (themeId) => {
    setActivatingTheme(themeId);
    try {
      const result = await api.activateTheme(themeId);
      toast.success(result.message);
      loadData();
    } catch (error) {
      toast.error(error.message || 'Erreur');
    } finally {
      setActivatingTheme(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/journal', label: 'Journal', icon: BookOpen },
    { href: '/calendar', label: 'Calendrier', icon: CalendarIcon },
    { href: '/community', label: 'Communauté', icon: Users },
    { href: '/challenges', label: 'Challenges', icon: Trophy },
    { href: '/rewards', label: 'Récompenses', icon: Gift, active: true },
    { href: '/economic', label: 'Économie', icon: Newspaper },
    { href: '/analysis', label: 'Analyse IA', icon: Brain },
    { href: '/coaching', label: 'Coaching', icon: Target },
    { href: '/tickets', label: 'Experts', icon: MessageSquare },
    { href: '/subscription', label: 'Abonnement', icon: Sparkles },
  ];

  const unlockedThemes = themes.filter(t => t.unlocked);
  const lockedThemes = themes.filter(t => !t.unlocked);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b h-16 flex items-center justify-between px-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          <span className="font-heading font-bold tracking-tight uppercase">Trading AI</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={toggleTheme} className="p-2">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 z-40 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ backgroundColor: 'var(--card)', borderRight: '1px solid var(--border)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            <span className="font-heading font-bold text-lg tracking-tight uppercase">Trading AI</span>
          </div>
        </div>

        <nav className="p-4 space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-all ${
                item.active 
                  ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                  : 'hover:bg-secondary'
              }`}
              style={{ color: item.active ? 'var(--primary)' : 'var(--muted-foreground)' }}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <NotificationBell />
            <button onClick={toggleTheme} className="p-2 rounded-sm hover:bg-secondary">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link href="/settings" className="p-2 rounded-sm hover:bg-secondary">
              <Settings className="w-5 h-5" />
            </Link>
            <button onClick={handleLogout} className="p-2 rounded-sm hover:bg-secondary">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold uppercase tracking-tight flex items-center gap-3">
              <Gift className="w-8 h-8 text-primary" />
              Récompenses
            </h1>
            <p style={{ color: 'var(--muted-foreground)' }}>Thèmes, avantages et récompenses exclusives</p>
          </div>

          {/* Current Status */}
          {levelPerks && (
            <div className="card hero-card mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center text-white text-2xl font-black">
                    {levelPerks.user_level}
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-bold">{levelPerks.current_title}</h2>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      Niveau {levelPerks.user_level} • {levelPerks.current_perks.length} avantages actifs
                    </p>
                  </div>
                </div>
                {season && (
                  <div className="text-right">
                    <p className="text-sm font-bold">{season.season.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {season.season.days_remaining} jours restants
                    </p>
                    {topPerformer?.current_rank && (
                      <p className="text-sm mt-1">
                        Classement: <span className="font-bold text-primary">#{topPerformer.current_rank}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'themes', label: 'Thèmes', icon: Palette },
              { id: 'perks', label: 'Avantages', icon: Star },
              { id: 'season', label: 'Saison', icon: Trophy },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id ? 'btn-primary' : 'btn-secondary'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Themes Tab */}
          {activeTab === 'themes' && (
            <div>
              <h2 className="font-heading font-bold uppercase text-lg mb-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                Thèmes Débloqués ({unlockedThemes.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {unlockedThemes.map((t) => (
                  <div 
                    key={t.id}
                    className={`card text-center ${t.active ? 'border-2 border-primary' : ''}`}
                  >
                    <div 
                      className="w-16 h-16 rounded-full mx-auto mb-3"
                      style={{ 
                        background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`
                      }}
                    />
                    <h4 className="font-bold">{t.name}</h4>
                    <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
                      Niveau {t.required_level}+
                    </p>
                    {t.active ? (
                      <span className="text-xs text-green-500 font-bold">✓ Actif</span>
                    ) : (
                      <button
                        onClick={() => handleActivateTheme(t.id)}
                        disabled={activatingTheme === t.id}
                        className="btn-secondary text-xs py-1 px-3"
                        data-testid={`activate-${t.id}`}
                      >
                        {activatingTheme === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Activer'}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <h2 className="font-heading font-bold uppercase text-lg mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />
                Thèmes à Débloquer ({lockedThemes.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {lockedThemes.map((t) => (
                  <div key={t.id} className="card text-center opacity-60">
                    <div 
                      className="w-16 h-16 rounded-full mx-auto mb-3 grayscale"
                      style={{ 
                        background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`
                      }}
                    />
                    <h4 className="font-bold">{t.name}</h4>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      🔒 Niveau {t.required_level} requis
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Perks Tab */}
          {activeTab === 'perks' && levelPerks && (
            <div className="space-y-4">
              {levelPerks.all_levels.map((level) => (
                <div 
                  key={level.level}
                  className={`card ${level.unlocked ? 'border-green-500/30' : 'opacity-60'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${
                      level.unlocked ? 'bg-gradient-to-br from-primary to-cyan-400 text-white' : 'bg-secondary'
                    }`}>
                      {level.level}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{level.title}</h3>
                        {level.unlocked && <Check className="w-4 h-4 text-green-500" />}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {level.perks.map((perk) => (
                          <span 
                            key={perk}
                            className="text-xs px-2 py-1 rounded-sm"
                            style={{ backgroundColor: 'var(--secondary)' }}
                          >
                            {PERK_LABELS[perk]?.icon || '🎁'} {PERK_LABELS[perk]?.name || perk}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <span 
                        className="text-xs px-2 py-1 rounded-sm"
                        style={{ backgroundColor: `var(--${level.unlocked ? 'primary' : 'secondary'})`, color: level.unlocked ? 'white' : 'var(--foreground)' }}
                      >
                        {level.theme}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Season Tab */}
          {activeTab === 'season' && season && topPerformer && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Current Season */}
              <div className="card hero-card">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <h2 className="font-heading font-bold uppercase">{season.season.name}</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 rounded-sm" style={{ backgroundColor: 'var(--secondary)' }}>
                    <div className="font-heading text-3xl font-black">#{topPerformer.current_rank || '-'}</div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Ton Classement</div>
                  </div>
                  <div className="text-center p-4 rounded-sm" style={{ backgroundColor: 'var(--secondary)' }}>
                    <div className="font-heading text-3xl font-black">{topPerformer.total_participants}</div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Participants</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>PnL Saison</span>
                    <span className={`font-bold ${season.user_stats.total_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {season.user_stats.total_pnl >= 0 ? '+' : ''}{season.user_stats.total_pnl}€
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Trades</span>
                    <span className="font-bold">{season.user_stats.trades_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Winrate</span>
                    <span className="font-bold">{season.user_stats.winrate}%</span>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-sm text-center" style={{ backgroundColor: 'var(--secondary)' }}>
                  <Clock className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--muted-foreground)' }} />
                  <p className="font-bold">{season.season.days_remaining} jours restants</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>pour améliorer ton classement</p>
                </div>
              </div>

              {/* Season Rewards */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <Gift className="w-5 h-5 text-green-500" />
                  <h2 className="font-heading font-bold uppercase">Récompenses Saison</h2>
                </div>

                <div className="space-y-4">
                  {[1, 2, 3, 'top10'].map((rank) => {
                    const reward = topPerformer.all_rewards[rank];
                    const isEligible = topPerformer.eligible_reward?.rank === rank || 
                                       (rank === 'top10' && topPerformer.current_rank && topPerformer.current_rank <= 10 && topPerformer.current_rank > 3);
                    
                    return (
                      <div 
                        key={rank}
                        className={`p-4 rounded-sm ${isEligible ? 'border-2 border-primary bg-primary/5' : ''}`}
                        style={{ backgroundColor: isEligible ? undefined : 'var(--secondary)' }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            rank === 1 ? 'bg-yellow-500 text-white' :
                            rank === 2 ? 'bg-gray-400 text-white' :
                            rank === 3 ? 'bg-orange-600 text-white' :
                            'bg-blue-500 text-white'
                          }`}>
                            {rank === 'top10' ? '10' : `#${rank}`}
                          </div>
                          <div>
                            <h4 className="font-bold">{reward.name}</h4>
                            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                              -{reward.discount}% sur l'abonnement
                            </p>
                          </div>
                          {isEligible && (
                            <span className="ml-auto text-xs text-primary font-bold">✓ Éligible</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {reward.perks.map((perk) => (
                            <span 
                              key={perk}
                              className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: 'var(--background)' }}
                            >
                              {PERK_LABELS[perk]?.icon || '🎁'} {PERK_LABELS[perk]?.name || perk}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
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
