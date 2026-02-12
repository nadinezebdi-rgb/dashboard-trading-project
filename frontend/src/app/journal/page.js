'use client';

import { useState, useEffect } from 'react';
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
  ArrowLeft,
  Search,
  Filter,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function JournalPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadTrades();
    }
  }, [user]);

  const loadTrades = async () => {
    try {
      const data = await api.getTrades({ limit: 100 });
      setTrades(data.trades || []);
    } catch (error) {
      console.error('Error loading trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  const filteredTrades = trades.filter(t => 
    t.symbol?.toLowerCase().includes(search.toLowerCase()) ||
    t.setup_type?.toLowerCase().includes(search.toLowerCase())
  );

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/journal', label: 'Journal', icon: BookOpen, active: true },
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
              className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-all ${
                item.active 
                  ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                  : 'text-muted-foreground hover:text-white hover:bg-zinc-900'
              }`}
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
            <Link href="/settings" className="btn-secondary flex-1 flex items-center justify-center gap-2 py-2">
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">
                Journal de Trading
              </h1>
              <p className="text-muted-foreground">Historique de tous tes trades</p>
            </div>
            <Link href="/journal/new" className="btn-primary flex items-center gap-2" data-testid="add-trade-btn">
              <Plus className="w-4 h-4" />
              Nouveau Trade
            </Link>
          </div>

          {/* Search */}
          <div className="card mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher par symbole ou setup..."
                className="input w-full pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="search-trades"
              />
            </div>
          </div>

          {/* Trades list */}
          {filteredTrades.length > 0 ? (
            <div className="space-y-3">
              {filteredTrades.map((trade, index) => (
                <div 
                  key={index}
                  className="card flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/30 transition-colors"
                  data-testid={`trade-${index}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-sm flex items-center justify-center ${
                      trade.direction === 'LONG' ? 'bg-profit/10' : 'bg-loss/10'
                    }`}>
                      {trade.direction === 'LONG' ? (
                        <TrendingUp className="w-6 h-6 text-profit" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-loss" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{trade.symbol}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          trade.direction === 'LONG' ? 'bg-profit/20 text-profit' : 'bg-loss/20 text-loss'
                        }`}>
                          {trade.direction}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {trade.setup_type || 'Setup non défini'} • {trade.session || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className={`font-mono font-bold ${
                        (trade.pnl || 0) >= 0 ? 'text-profit' : 'text-loss'
                      }`}>
                        {(trade.pnl || 0) >= 0 ? '+' : ''}{formatCurrency(trade.pnl || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {trade.created_at ? formatDate(trade.created_at) : 'N/A'}
                      </p>
                    </div>
                    {!trade.respected_plan && (
                      <div className="w-2 h-2 rounded-full bg-loss" title="Hors plan" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-heading text-xl font-bold mb-2">Aucun trade enregistré</h3>
              <p className="text-muted-foreground mb-6">Commence à suivre tes trades pour voir tes stats</p>
              <Link href="/journal/new" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Ajouter mon premier trade
              </Link>
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
