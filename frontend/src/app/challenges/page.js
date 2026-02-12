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
  Flame,
  Star,
  Crown,
  Medal,
  Zap,
  Gift,
  CheckCircle,
  Lock,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import NotificationBell from '@/components/NotificationBell';

const PERIOD_LABELS = {
  daily: 'Aujourd\'hui',
  weekly: 'Cette semaine',
  monthly: 'Ce mois',
  season: 'Saison'
};

const CHALLENGE_TYPE_COLORS = {
  daily: { bg: 'rgba(34, 197, 94, 0.2)', text: '#22C55E', border: '#22C55E' },
  weekly: { bg: 'rgba(59, 130, 246, 0.2)', text: '#3B82F6', border: '#3B82F6' },
  monthly: { bg: 'rgba(168, 85, 247, 0.2)', text: '#A855F7', border: '#A855F7' }
};

export default function ChallengesPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('challenges');
  const [profile, setProfile] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [hallOfFame, setHallOfFame] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('weekly');
  const [claimingChallenge, setClaimingChallenge] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, leaderboardPeriod]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileData, challengesData, leaderboardData, hofData, achievementsData] = await Promise.all([
        api.getGamificationProfile(),
        api.getChallenges(),
        api.getLeaderboard(leaderboardPeriod),
        api.getHallOfFame(),
        api.getAllAchievements()
      ]);
      setProfile(profileData);
      setChallenges(challengesData.challenges || []);
      setLeaderboard(leaderboardData.leaderboard || []);
      setHallOfFame(hofData);
      setAchievements(achievementsData.achievements || []);
      
      // Check for new achievements
      if (profileData.new_achievements?.length > 0) {
        profileData.new_achievements.forEach(ach => {
          toast.success(`🏆 Nouveau badge débloqué !`);
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    try {
      const result = await api.dailyCheckin();
      toast.success(`${result.message} +${result.xp_earned} XP`);
      loadData();
    } catch (error) {
      toast.error('Erreur lors du check-in');
    }
  };

  const handleClaimReward = async (challengeId) => {
    setClaimingChallenge(challengeId);
    try {
      const result = await api.claimChallengeReward(challengeId);
      toast.success(`${result.message} +${result.xp_earned} XP`);
      if (result.badge_awarded) {
        toast.success(`🏆 Badge débloqué: ${result.badge_awarded.name}`);
      }
      if (result.leveled_up) {
        toast.success(`🎉 Niveau supérieur atteint !`);
      }
      loadData();
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la réclamation');
    } finally {
      setClaimingChallenge(null);
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
    { href: '/challenges', label: 'Challenges', icon: Trophy, active: true },
    { href: '/economic', label: 'Économie', icon: Newspaper },
    { href: '/analysis', label: 'Analyse IA', icon: Brain },
    { href: '/coaching', label: 'Coaching', icon: Target },
    { href: '/tickets', label: 'Experts', icon: MessageSquare },
    { href: '/subscription', label: 'Abonnement', icon: Sparkles },
  ];

  const earnedAchievements = achievements.filter(a => a.earned);
  const lockedAchievements = achievements.filter(a => !a.earned);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b h-16 flex items-center justify-between px-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          <span className="font-heading font-bold tracking-tight uppercase">Trading AI</span>
        </div>
        <div className="flex items-center gap-2">
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
          {/* Profile Header */}
          {profile && (
            <div className="card mb-8 hero-card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center text-white text-3xl font-black">
                      {profile.level}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="font-heading text-2xl font-bold uppercase">Niveau {profile.level}</h1>
                    <p style={{ color: 'var(--muted-foreground)' }}>{profile.xp} XP</p>
                    <div className="mt-2 w-48 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--secondary)' }}>
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-500"
                        style={{ width: `${profile.progress}%` }}
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      {profile.xp} / {profile.next_threshold} XP
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-orange-500">
                      <Flame className="w-6 h-6" />
                      <span className="font-heading text-3xl font-black">{profile.current_streak}</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Jours de suite</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-primary">
                      <Medal className="w-6 h-6" />
                      <span className="font-heading text-3xl font-black">{profile.achievements_count}</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Badges</p>
                  </div>
                  <button 
                    onClick={handleCheckin}
                    className="btn-primary flex items-center gap-2"
                    data-testid="checkin-btn"
                  >
                    <Zap className="w-4 h-4" />
                    Check-in
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'challenges', label: 'Challenges', icon: Target },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
              { id: 'hall-of-fame', label: 'Hall of Fame', icon: Crown },
              { id: 'achievements', label: 'Badges', icon: Medal },
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

          {/* Challenges Tab */}
          {activeTab === 'challenges' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {challenges.map((challenge) => (
                <div 
                  key={challenge.id}
                  className="card relative overflow-hidden"
                  style={{ borderColor: challenge.is_completed ? CHALLENGE_TYPE_COLORS[challenge.type].border : 'var(--border)' }}
                >
                  {challenge.is_completed && (
                    <div className="absolute top-0 right-0 w-16 h-16">
                      <div className="absolute transform rotate-45 bg-green-500 text-white text-xs font-bold py-1 right-[-35px] top-[8px] w-[100px] text-center">
                        ✓
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-3xl">{challenge.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{challenge.title}</h3>
                        <span 
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                          style={{ 
                            backgroundColor: CHALLENGE_TYPE_COLORS[challenge.type].bg,
                            color: CHALLENGE_TYPE_COLORS[challenge.type].text
                          }}
                        >
                          {challenge.type === 'daily' ? 'Jour' : challenge.type === 'weekly' ? 'Semaine' : 'Mois'}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{challenge.description}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: 'var(--muted-foreground)' }}>Progression</span>
                      <span className="font-mono font-bold">{challenge.current}/{challenge.target}</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--secondary)' }}>
                      <div 
                        className="h-full transition-all duration-500"
                        style={{ 
                          width: `${challenge.progress}%`,
                          backgroundColor: CHALLENGE_TYPE_COLORS[challenge.type].text
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-bold text-yellow-500">+{challenge.xp_reward} XP</span>
                      {challenge.badge_reward && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--secondary)' }}>
                          +Badge
                        </span>
                      )}
                    </div>
                    {challenge.is_completed ? (
                      <button
                        onClick={() => handleClaimReward(challenge.id)}
                        disabled={claimingChallenge === challenge.id}
                        className="btn-primary py-2 px-3 text-xs"
                        data-testid={`claim-${challenge.id}`}
                      >
                        {claimingChallenge === challenge.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Réclamer'
                        )}
                      </button>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {challenge.reset_text}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="card">
              <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="font-heading font-bold uppercase flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Classement
                </h2>
                <div className="flex gap-2">
                  {['daily', 'weekly', 'monthly'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setLeaderboardPeriod(period)}
                      className={`px-3 py-1 text-xs font-bold uppercase rounded-sm transition-all ${
                        leaderboardPeriod === period ? 'bg-primary text-white' : ''
                      }`}
                      style={{ backgroundColor: leaderboardPeriod !== period ? 'var(--secondary)' : undefined }}
                      data-testid={`period-${period}`}
                    >
                      {PERIOD_LABELS[period]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div 
                    key={entry.user_id}
                    className={`flex items-center gap-4 p-4 rounded-sm transition-all ${entry.is_current_user ? 'border-2 border-primary' : ''}`}
                    style={{ backgroundColor: entry.is_current_user ? 'var(--primary)' + '10' : index < 3 ? 'var(--secondary)' : 'transparent' }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${
                      entry.rank === 1 ? 'bg-yellow-500 text-white' :
                      entry.rank === 2 ? 'bg-gray-400 text-white' :
                      entry.rank === 3 ? 'bg-orange-600 text-white' :
                      'bg-secondary'
                    }`}>
                      {entry.rank <= 3 ? (
                        entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'
                      ) : entry.rank}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{entry.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--secondary)' }}>
                          Niv. {entry.level}
                        </span>
                        {entry.is_current_user && (
                          <span className="text-xs text-primary font-bold">← Toi</span>
                        )}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        {entry.trades_count} trades • {entry.winrate}% winrate
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-heading text-xl font-black ${entry.total_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {entry.total_pnl >= 0 ? '+' : ''}{formatCurrency(entry.total_pnl)}
                      </div>
                    </div>
                  </div>
                ))}

                {leaderboard.length === 0 && (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: 'var(--muted-foreground)' }} />
                    <p style={{ color: 'var(--muted-foreground)' }}>Pas encore de données pour cette période</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hall of Fame Tab */}
          {activeTab === 'hall-of-fame' && hallOfFame && (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Top Levels */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-heading font-bold uppercase">Top Niveaux</h3>
                </div>
                <div className="space-y-3">
                  {hallOfFame.top_levels?.map((user, i) => (
                    <div key={user.user_id} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        i === 0 ? 'bg-yellow-500 text-white' :
                        i === 1 ? 'bg-gray-400 text-white' :
                        i === 2 ? 'bg-orange-600 text-white' :
                        'bg-secondary'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{user.name}</div>
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Niveau {user.level}</div>
                      </div>
                      <div className="text-sm font-mono font-bold text-primary">{user.xp} XP</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top PnL */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <h3 className="font-heading font-bold uppercase">Top PnL</h3>
                </div>
                <div className="space-y-3">
                  {hallOfFame.top_pnl?.map((user, i) => (
                    <div key={user.user_id} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        i === 0 ? 'bg-yellow-500 text-white' :
                        i === 1 ? 'bg-gray-400 text-white' :
                        i === 2 ? 'bg-orange-600 text-white' :
                        'bg-secondary'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{user.name}</div>
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{user.trades_count} trades</div>
                      </div>
                      <div className="text-sm font-mono font-bold text-green-500">+{formatCurrency(user.total_pnl)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Winrate */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <Target className="w-5 h-5 text-blue-500" />
                  <h3 className="font-heading font-bold uppercase">Top Winrate</h3>
                </div>
                <div className="space-y-3">
                  {hallOfFame.top_winrate?.map((user, i) => (
                    <div key={user.user_id} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        i === 0 ? 'bg-yellow-500 text-white' :
                        i === 1 ? 'bg-gray-400 text-white' :
                        i === 2 ? 'bg-orange-600 text-white' :
                        'bg-secondary'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{user.name}</div>
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{user.trades_count} trades</div>
                      </div>
                      <div className="text-sm font-mono font-bold text-blue-500">{user.winrate}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div>
              {/* Earned Achievements */}
              <div className="mb-8">
                <h2 className="font-heading font-bold uppercase text-lg mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Badges Débloqués ({earnedAchievements.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {earnedAchievements.map((ach) => (
                    <div key={ach.id} className="card text-center border-green-500/30">
                      <div className="text-4xl mb-2">{ach.icon}</div>
                      <h4 className="font-bold text-sm">{ach.name}</h4>
                      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{ach.description}</p>
                      <div className="mt-2 text-xs font-bold text-green-500">+{ach.xp} XP</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Locked Achievements */}
              <div>
                <h2 className="font-heading font-bold uppercase text-lg mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />
                  Badges à Débloquer ({lockedAchievements.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {lockedAchievements.map((ach) => (
                    <div key={ach.id} className="card text-center opacity-60">
                      <div className="text-4xl mb-2 grayscale">{ach.icon}</div>
                      <h4 className="font-bold text-sm">{ach.name}</h4>
                      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{ach.description}</p>
                      <div className="mt-2 text-xs font-bold" style={{ color: 'var(--muted-foreground)' }}>+{ach.xp} XP</div>
                    </div>
                  ))}
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
