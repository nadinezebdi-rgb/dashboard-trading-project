'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  BookOpen, 
  Brain, 
  Target,
  Settings,
  LogOut,
  Plus,
  Sparkles,
  Calendar,
  ChevronRight,
  AlertCircle,
  Menu,
  X,
  Newspaper,
  MessageSquare,
  Sun,
  Moon,
  Clock,
  Users
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { api } from '@/lib/api';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { 
  subDays, 
  startOfDay, 
  format, 
  getDay, 
  eachDayOfInterval, 
  parseISO 
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Heatmap Component
function TradingHeatmap({ trades = [] }) {
  const [tooltip, setTooltip] = useState(null);

  const { days, maxAbsPnl, weeks, monthLabels } = useMemo(() => {
    const today = startOfDay(new Date());
    const start = subDays(today, 364);

    const pnlByDay = {};
    trades.forEach((t) => {
      if (!t.created_at) return;
      const dateStr = format(
        startOfDay(typeof t.created_at === 'string' ? parseISO(t.created_at) : t.created_at),
        'yyyy-MM-dd'
      );
      pnlByDay[dateStr] = (pnlByDay[dateStr] || 0) + (Number(t.pnl) || 0);
    });

    const allDays = eachDayOfInterval({ start, end: today });
    const dayEntries = allDays.map((d) => {
      const dateStr = format(d, 'yyyy-MM-dd');
      const pnl = pnlByDay[dateStr] || null;
      return { date: d, dateStr, pnl, dayOfWeek: getDay(d) };
    });

    let maxAbs = 0;
    dayEntries.forEach((d) => {
      if (d.pnl !== null) maxAbs = Math.max(maxAbs, Math.abs(d.pnl));
    });
    if (maxAbs === 0) maxAbs = 1;

    const weekColumns = [];
    let currentWeek = new Array(7).fill(null);

    dayEntries.forEach((day, idx) => {
      currentWeek[day.dayOfWeek] = day;
      if (day.dayOfWeek === 6 || idx === dayEntries.length - 1) {
        weekColumns.push(currentWeek);
        currentWeek = new Array(7).fill(null);
      }
    });

    const labels = [];
    let lastMonth = -1;
    weekColumns.forEach((week, weekIdx) => {
      const firstDay = week.find((d) => d !== null);
      if (firstDay) {
        const month = firstDay.date.getMonth();
        if (month !== lastMonth) {
          labels.push({ month: format(firstDay.date, 'MMM', { locale: fr }), weekIdx });
          lastMonth = month;
        }
      }
    });

    return { days: dayEntries, maxAbsPnl: maxAbs, weeks: weekColumns, monthLabels: labels };
  }, [trades]);

  function getCellColor(pnl) {
    if (pnl === null || pnl === 0) return 'bg-zinc-800/60';
    const intensity = Math.min(Math.abs(pnl) / maxAbsPnl, 1);
    if (pnl > 0) {
      if (intensity > 0.75) return 'bg-emerald-400 shadow-emerald-400/30 shadow-sm';
      if (intensity > 0.5) return 'bg-emerald-500';
      if (intensity > 0.25) return 'bg-emerald-600';
      return 'bg-emerald-700/80';
    } else {
      if (intensity > 0.75) return 'bg-rose-400 shadow-rose-400/30 shadow-sm';
      if (intensity > 0.5) return 'bg-rose-500';
      if (intensity > 0.25) return 'bg-rose-600';
      return 'bg-rose-700/80';
    }
  }

  const dayLabels = ['', 'Lun', '', 'Mer', '', 'Ven', ''];
  const cellSize = 12;
  const cellGap = 3;
  const totalCellSize = cellSize + cellGap;

  const tradingDays = days.filter((d) => d.pnl !== null && d.pnl !== 0);
  const winDays = tradingDays.filter((d) => d.pnl > 0).length;
  const lossDays = tradingDays.filter((d) => d.pnl < 0).length;

  return (
    <div className="relative">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-500">
            <span className="font-mono font-semibold text-zinc-300">{tradingDays.length}</span> jours
          </span>
          <span className="text-xs text-zinc-500">
            <span className="font-mono font-semibold text-profit">{winDays}</span> gagnants
          </span>
          <span className="text-xs text-zinc-500">
            <span className="font-mono font-semibold text-loss">{lossDays}</span> perdants
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span>-</span>
          <div className="h-[11px] w-[11px] rounded-[2px] bg-zinc-800/60" />
          <div className="h-[11px] w-[11px] rounded-[2px] bg-emerald-700/80" />
          <div className="h-[11px] w-[11px] rounded-[2px] bg-emerald-500" />
          <div className="h-[11px] w-[11px] rounded-[2px] bg-emerald-400" />
          <span>+</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-0" style={{ minWidth: 'max-content' }}>
          <div className="mr-2 flex flex-col" style={{ gap: `${cellGap}px` }}>
            {dayLabels.map((label, i) => (
              <div key={i} className="flex items-center justify-end text-[10px] text-zinc-600" style={{ height: `${cellSize}px` }}>
                {label}
              </div>
            ))}
          </div>

          <div className="relative">
            <div className="absolute flex text-[10px] text-zinc-500" style={{ top: '-16px' }}>
              {monthLabels.map((ml, i) => (
                <span key={i} className="absolute capitalize" style={{ left: `${ml.weekIdx * totalCellSize}px` }}>
                  {ml.month}
                </span>
              ))}
            </div>

            <div className="flex" style={{ gap: `${cellGap}px`, paddingTop: '4px' }}>
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col" style={{ gap: `${cellGap}px` }}>
                  {week.map((day, dayIdx) => (
                    <div
                      key={dayIdx}
                      className={`rounded-[2px] transition-all ${
                        day ? `${getCellColor(day.pnl)} cursor-pointer hover:ring-1 hover:ring-zinc-400/50 hover:brightness-125` : 'bg-transparent'
                      }`}
                      style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                      onMouseEnter={(e) => {
                        if (!day) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                          date: format(day.date, 'd MMM yyyy', { locale: fr }),
                          pnl: day.pnl
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-full rounded-sm border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-xl"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y - 8}px` }}
        >
          <div className="text-[11px] font-medium text-zinc-300">{tooltip.date}</div>
          {tooltip.pnl !== null ? (
            <div className={`mt-0.5 font-mono text-xs font-bold ${tooltip.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
              {tooltip.pnl >= 0 ? '+' : ''}{tooltip.pnl.toFixed(2)}€
            </div>
          ) : (
            <div className="mt-0.5 text-[11px] text-zinc-500">Aucun trade</div>
          )}
        </div>
      )}
    </div>
  );
}

// Stats Card Component
function StatCard({ label, value, subValue, trend, icon: Icon }) {
  return (
    <div className="card group" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        {Icon && <Icon className="w-5 h-5 text-primary opacity-60" />}
      </div>
      <div className="font-heading text-3xl font-black tracking-tight">{value}</div>
      {subValue && (
        <div className={`text-sm font-mono mt-1 ${trend === 'up' ? 'text-profit' : trend === 'down' ? 'text-loss' : 'text-muted-foreground'}`}>
          {subValue}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [durationStats, setDurationStats] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const [statsData, heatmap, duration] = await Promise.all([
        api.getTradeStats(),
        api.getHeatmapData(),
        api.getDurationStats()
      ]);
      setStats(statsData);
      setHeatmapData(heatmap.trades || []);
      setDurationStats(duration.duration_stats || null);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const loadBriefing = async () => {
    setLoadingBriefing(true);
    try {
      const data = await api.getDailyBriefing();
      setBriefing(data.briefing);
    } catch (error) {
      console.error('Error loading briefing:', error);
    } finally {
      setLoadingBriefing(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Prepare duration chart data
  const durationChartData = useMemo(() => {
    if (!durationStats) return [];
    return Object.entries(durationStats).map(([key, value]) => ({
      name: key,
      count: value.count,
      pnl: value.total_pnl,
      winrate: value.count > 0 ? Math.round((value.wins / value.count) * 100) : 0
    }));
  }, [durationStats]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3, active: true },
    { href: '/journal', label: 'Journal', icon: BookOpen },
    { href: '/calendar', label: 'Calendrier', icon: Calendar },
    { href: '/community', label: 'Communauté', icon: Users },
    { href: '/challenges', label: 'Challenges', icon: Trophy },
    { href: '/economic', label: 'Économie', icon: Newspaper },
    { href: '/analysis', label: 'Analyse IA', icon: Brain },
    { href: '/coaching', label: 'Coaching', icon: Target },
    { href: '/tickets', label: 'Experts', icon: MessageSquare },
    { href: '/subscription', label: 'Abonnement', icon: Sparkles },
  ];

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
          <button onClick={() => setSidebarOpen(!sidebarOpen)} data-testid="mobile-sidebar-toggle">
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

        <nav className="p-4 space-y-1">
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
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={toggleTheme} className="p-2 rounded-sm hover:bg-secondary">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link href="/settings" className="p-2 rounded-sm hover:bg-secondary" data-testid="nav-settings">
              <Settings className="w-5 h-5" />
            </Link>
            <button onClick={handleLogout} className="p-2 rounded-sm hover:bg-secondary" data-testid="logout-btn">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">
                Bonjour, {user?.name}
              </h1>
              <p style={{ color: 'var(--muted-foreground)' }}>Voici ta performance de trading</p>
            </div>
            <Link href="/journal/new" className="btn-primary flex items-center gap-2" data-testid="add-trade-btn">
              <Plus className="w-4 h-4" />
              Nouveau Trade
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              label="Total Trades" 
              value={stats?.total_trades || 0} 
              icon={BarChart3}
            />
            <StatCard 
              label="Winrate" 
              value={`${stats?.winrate || 0}%`}
              trend={stats?.winrate >= 50 ? 'up' : 'down'}
              icon={TrendingUp}
            />
            <StatCard 
              label="PnL Total" 
              value={formatCurrency(stats?.total_pnl || 0)}
              trend={stats?.total_pnl >= 0 ? 'up' : 'down'}
              icon={stats?.total_pnl >= 0 ? TrendingUp : TrendingDown}
            />
            <StatCard 
              label="Respect du Plan" 
              value={`${stats?.plan_adherence || 0}%`}
              trend={stats?.plan_adherence >= 80 ? 'up' : 'down'}
              icon={Target}
            />
          </div>

          {/* Heatmap */}
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-heading text-lg font-bold uppercase tracking-tight">Heatmap PnL</h2>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>365 derniers jours</span>
            </div>
            <TradingHeatmap trades={heatmapData} />
          </div>

          {/* Duration Chart */}
          {durationChartData.length > 0 && (
            <div className="card mb-8">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="font-heading text-lg font-bold uppercase tracking-tight">Durée des Trades</h2>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={durationChartData}>
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      axisLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis 
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      axisLine={{ stroke: 'var(--border)' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        border: '1px solid var(--border)',
                        borderRadius: '4px'
                      }}
                      labelStyle={{ color: 'var(--foreground)' }}
                      formatter={(value, name) => {
                        if (name === 'count') return [value, 'Trades'];
                        if (name === 'winrate') return [`${value}%`, 'Winrate'];
                        return [value, name];
                      }}
                    />
                    <Bar dataKey="count" name="count" radius={[4, 4, 0, 0]}>
                      {durationChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'var(--profit)' : 'var(--loss)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Two columns */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* AI Briefing */}
            <div className="card">
              <div className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="font-heading text-lg font-bold uppercase tracking-tight">Briefing IA</h2>
                </div>
                {!briefing && (
                  <button 
                    onClick={loadBriefing}
                    disabled={loadingBriefing}
                    className="btn-secondary py-2 px-3 text-xs"
                    data-testid="load-briefing-btn"
                  >
                    {loadingBriefing ? 'Chargement...' : 'Générer'}
                  </button>
                )}
              </div>
              {briefing ? (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                    {briefing}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: 'var(--muted-foreground)' }} />
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Clique sur "Générer" pour ton briefing personnalisé
                  </p>
                </div>
              )}
            </div>

            {/* Common Errors */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <AlertCircle className="w-5 h-5" style={{ color: 'var(--loss)' }} />
                <h2 className="font-heading text-lg font-bold uppercase tracking-tight">Erreurs Fréquentes</h2>
              </div>
              {stats?.common_errors?.length > 0 ? (
                <div className="space-y-3">
                  {stats.common_errors.map((error, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                      <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{error.error}</span>
                      <span className="font-mono text-sm font-bold" style={{ color: 'var(--loss)' }}>{error.count}x</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: 'var(--profit)' }} />
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Aucune erreur enregistrée. Continue comme ça !
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-4 gap-4 mt-8">
            <Link href="/journal" className="card flex items-center gap-4 hover:border-primary/30 transition-colors group" data-testid="quick-journal">
              <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">Journal</h3>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Voir tous tes trades</p>
              </div>
              <ChevronRight className="w-5 h-5 group-hover:text-primary transition-colors" style={{ color: 'var(--muted-foreground)' }} />
            </Link>

            <Link href="/calendar" className="card flex items-center gap-4 hover:border-primary/30 transition-colors group" data-testid="quick-calendar">
              <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">Calendrier</h3>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Vue mensuelle</p>
              </div>
              <ChevronRight className="w-5 h-5 group-hover:text-primary transition-colors" style={{ color: 'var(--muted-foreground)' }} />
            </Link>

            <Link href="/economic" className="card flex items-center gap-4 hover:border-primary/30 transition-colors group" data-testid="quick-economic">
              <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center">
                <Newspaper className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">Économie</h3>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Journal économique</p>
              </div>
              <ChevronRight className="w-5 h-5 group-hover:text-primary transition-colors" style={{ color: 'var(--muted-foreground)' }} />
            </Link>

            <Link href="/tickets" className="card flex items-center gap-4 hover:border-primary/30 transition-colors group" data-testid="quick-experts">
              <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">Experts</h3>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Consultations</p>
              </div>
              <ChevronRight className="w-5 h-5 group-hover:text-primary transition-colors" style={{ color: 'var(--muted-foreground)' }} />
            </Link>
          </div>
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
