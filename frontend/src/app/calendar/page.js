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
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Newspaper,
  MessageSquare,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function CalendarPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadCalendarData();
    }
  }, [user, currentDate]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const data = await api.getCalendarData(year, month);
      setCalendarData(data.data || {});
    } catch (error) {
      console.error('Error loading calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get the day of week for first day (0 = Sunday, adjust for Monday start)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
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
    { href: '/calendar', label: 'Calendrier', icon: CalendarIcon, active: true },
    { href: '/economic', label: 'Économie', icon: Newspaper },
    { href: '/analysis', label: 'Analyse IA', icon: Brain },
    { href: '/coaching', label: 'Coaching', icon: Target },
    { href: '/tickets', label: 'Experts', icon: MessageSquare },
    { href: '/subscription', label: 'Abonnement', icon: Sparkles },
  ];

  const days = getDaysInMonth();
  const monthStats = Object.values(calendarData).reduce((acc, day) => {
    acc.trades += day.trades;
    acc.pnl += day.pnl;
    acc.wins += day.wins;
    acc.losses += day.losses;
    return acc;
  }, { trades: 0, pnl: 0, wins: 0, losses: 0 });

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
            <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">
              Calendrier des Trades
            </h1>
            <p style={{ color: 'var(--muted-foreground)' }}>Visualise tes performances par jour</p>
          </div>

          {/* Month Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--muted-foreground)' }}>Trades</div>
              <div className="font-heading text-2xl font-bold">{monthStats.trades}</div>
            </div>
            <div className="card">
              <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--muted-foreground)' }}>PnL</div>
              <div className={`font-heading text-2xl font-bold ${monthStats.pnl >= 0 ? 'text-profit' : 'text-loss'}`} style={{ color: monthStats.pnl >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                {monthStats.pnl >= 0 ? '+' : ''}{formatCurrency(monthStats.pnl)}
              </div>
            </div>
            <div className="card">
              <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--muted-foreground)' }}>Gagnants</div>
              <div className="font-heading text-2xl font-bold" style={{ color: 'var(--profit)' }}>{monthStats.wins}</div>
            </div>
            <div className="card">
              <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--muted-foreground)' }}>Perdants</div>
              <div className="font-heading text-2xl font-bold" style={{ color: 'var(--loss)' }}>{monthStats.losses}</div>
            </div>
          </div>

          {/* Calendar */}
          <div className="card">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonth} className="p-2 rounded-sm hover:bg-secondary" data-testid="prev-month">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="font-heading text-xl font-bold uppercase">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button onClick={nextMonth} className="p-2 rounded-sm hover:bg-secondary" data-testid="next-month">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {DAYS.map((day) => (
                <div key={day} className="text-center text-xs font-bold uppercase py-2" style={{ color: 'var(--muted-foreground)' }}>
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {days.map((day, index) => {
                const dayData = calendarData[day];
                const hasTrades = dayData && dayData.trades > 0;
                const isProfit = dayData && dayData.pnl > 0;
                const isLoss = dayData && dayData.pnl < 0;
                const isSelected = selectedDay === day;
                
                return (
                  <div
                    key={index}
                    onClick={() => day && setSelectedDay(day)}
                    className={`calendar-day ${day ? 'cursor-pointer' : ''} ${hasTrades ? 'has-trades' : ''} ${isProfit ? 'profit' : ''} ${isLoss ? 'loss' : ''}`}
                    style={{
                      backgroundColor: isSelected ? 'var(--primary)' : day ? 'var(--secondary)' : 'transparent',
                      color: isSelected ? 'white' : 'var(--foreground)',
                      opacity: day ? 1 : 0.3
                    }}
                    data-testid={day ? `day-${day}` : undefined}
                  >
                    {day && (
                      <>
                        <span className="font-medium">{day}</span>
                        {hasTrades && (
                          <span className="text-[10px] font-mono" style={{ color: isSelected ? 'white' : isProfit ? 'var(--profit)' : 'var(--loss)' }}>
                            {dayData.pnl >= 0 ? '+' : ''}{dayData.pnl.toFixed(0)}€
                          </span>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Day Details */}
            {selectedDay && calendarData[selectedDay] && (
              <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                <h3 className="font-heading font-bold uppercase mb-4">
                  {selectedDay} {MONTHS[currentDate.getMonth()]}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs uppercase" style={{ color: 'var(--muted-foreground)' }}>Trades</div>
                    <div className="font-mono font-bold text-lg">{calendarData[selectedDay].trades}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase" style={{ color: 'var(--muted-foreground)' }}>PnL</div>
                    <div className="font-mono font-bold text-lg" style={{ color: calendarData[selectedDay].pnl >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                      {calendarData[selectedDay].pnl >= 0 ? '+' : ''}{formatCurrency(calendarData[selectedDay].pnl)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase" style={{ color: 'var(--muted-foreground)' }}>Gagnants</div>
                    <div className="font-mono font-bold text-lg" style={{ color: 'var(--profit)' }}>{calendarData[selectedDay].wins}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase" style={{ color: 'var(--muted-foreground)' }}>Perdants</div>
                    <div className="font-mono font-bold text-lg" style={{ color: 'var(--loss)' }}>{calendarData[selectedDay].losses}</div>
                  </div>
                </div>
              </div>
            )}
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
