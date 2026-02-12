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
  AlertTriangle,
  TrendingDown,
  Loader2,
  RefreshCw,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { api } from '@/lib/api';

const IMPACT_COLORS = {
  high: { bg: 'rgba(239, 68, 68, 0.2)', text: '#EF4444', label: 'Fort' },
  medium: { bg: 'rgba(245, 158, 11, 0.2)', text: '#F59E0B', label: 'Moyen' },
  low: { bg: 'rgba(34, 197, 94, 0.2)', text: '#22C55E', label: 'Faible' }
};

const CURRENCY_FLAGS = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  CHF: '🇨🇭',
  AUD: '🇦🇺',
  CAD: '🇨🇦',
  NZD: '🇳🇿'
};

export default function EconomicPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentiment, setSentiment] = useState(null);
  const [loadingSentiment, setLoadingSentiment] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getEconomicEvents();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSentiment = async () => {
    setLoadingSentiment(true);
    try {
      const data = await api.getMarketSentiment();
      setSentiment(data.sentiment);
    } catch (error) {
      toast.error('Erreur lors du chargement du sentiment');
    } finally {
      setLoadingSentiment(false);
    }
  };

  const analyzeEvent = async (event) => {
    setSelectedEvent(event);
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const data = await api.analyzeEconomicEvent(event.id);
      setAnalysis(data.analysis);
    } catch (error) {
      toast.error('Erreur lors de l\'analyse');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.impact === filter);

  const groupEventsByDate = (events) => {
    const groups = {};
    events.forEach(event => {
      const date = event.date.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
    });
    return groups;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return date.toLocaleDateString('fr-FR', options);
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
    { href: '/economic', label: 'Économie', icon: Newspaper, active: true },
    { href: '/analysis', label: 'Analyse IA', icon: Brain },
    { href: '/coaching', label: 'Coaching', icon: Target },
    { href: '/tickets', label: 'Experts', icon: MessageSquare },
    { href: '/subscription', label: 'Abonnement', icon: Sparkles },
  ];

  const groupedEvents = groupEventsByDate(filteredEvents);

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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">
                Journal Économique
              </h1>
              <p style={{ color: 'var(--muted-foreground)' }}>Calendrier économique avec analyse IA</p>
            </div>
            <button 
              onClick={loadSentiment}
              disabled={loadingSentiment}
              className="btn-primary flex items-center gap-2"
              data-testid="load-sentiment-btn"
            >
              {loadingSentiment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              Analyse Sentiment
            </button>
          </div>

          {/* Market Sentiment */}
          {sentiment && (
            <div className="card mb-8 hero-card">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <Brain className="w-5 h-5 text-primary" />
                <h2 className="font-heading font-bold uppercase">Sentiment de Marché</h2>
              </div>
              <div className="whitespace-pre-wrap text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {sentiment}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Events List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Filters */}
              <div className="flex gap-2">
                {['all', 'high', 'medium', 'low'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 text-xs font-bold uppercase transition-all ${
                      filter === f ? 'btn-primary' : 'btn-secondary'
                    }`}
                    data-testid={`filter-${f}`}
                  >
                    {f === 'all' ? 'Tous' : IMPACT_COLORS[f].label}
                  </button>
                ))}
              </div>

              {/* Events by Date */}
              {Object.entries(groupedEvents).map(([date, dayEvents]) => (
                <div key={date} className="card">
                  <h3 className="font-heading font-bold uppercase text-lg mb-4 capitalize">
                    {formatDate(date)}
                  </h3>
                  <div className="space-y-3">
                    {dayEvents.map((event) => (
                      <div 
                        key={event.id}
                        className="flex items-center gap-4 p-3 rounded-sm cursor-pointer hover:bg-secondary transition-colors"
                        style={{ backgroundColor: selectedEvent?.id === event.id ? 'var(--secondary)' : 'transparent' }}
                        onClick={() => analyzeEvent(event)}
                        data-testid={`event-${event.id}`}
                      >
                        <div className="text-2xl">{CURRENCY_FLAGS[event.currency] || '🌐'}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{event.event}</span>
                            <span 
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                              style={{ 
                                backgroundColor: IMPACT_COLORS[event.impact].bg,
                                color: IMPACT_COLORS[event.impact].text
                              }}
                            >
                              {IMPACT_COLORS[event.impact].label}
                            </span>
                          </div>
                          <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            {event.time} • {event.currency}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div style={{ color: 'var(--muted-foreground)' }}>Prév: {event.forecast}</div>
                          <div style={{ color: 'var(--muted-foreground)' }}>Préc: {event.previous}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Analysis Panel */}
            <div className="card min-h-[400px] sticky top-20">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold uppercase">Analyse IA</h3>
              </div>
              
              {analyzing ? (
                <div className="flex flex-col items-center justify-center h-60">
                  <div className="relative">
                    <div className="w-16 h-16 border-2 rounded-full" style={{ borderColor: 'var(--border)' }} />
                    <div className="absolute inset-0 w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Analyse en cours...</p>
                </div>
              ) : analysis ? (
                <div>
                  <div className="mb-4 p-3 rounded-sm" style={{ backgroundColor: 'var(--secondary)' }}>
                    <div className="font-bold">{selectedEvent?.event}</div>
                    <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      {selectedEvent?.currency} • {selectedEvent?.time}
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                    {analysis}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-60 text-center">
                  <Newspaper className="w-16 h-16 mb-4 opacity-30" style={{ color: 'var(--muted-foreground)' }} />
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    Clique sur un événement pour obtenir une analyse IA détaillée de son impact
                  </p>
                </div>
              )}
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
