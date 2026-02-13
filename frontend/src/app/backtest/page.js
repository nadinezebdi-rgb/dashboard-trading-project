'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  TrendingUp, 
  Plus, 
  Play, 
  Trash2, 
  ChevronRight,
  BarChart3,
  Target,
  Clock,
  DollarSign,
  Percent,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Brain,
  Calendar,
  Settings,
  LogOut,
  BookOpen,
  Users,
  Trophy,
  Newspaper,
  MessageSquare,
  Sparkles,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// Add API methods for backtest
const backtestApi = {
  create: (data) => api.request('/api/backtest', { method: 'POST', body: JSON.stringify(data) }),
  getAll: () => api.request('/api/backtest'),
  getOne: (id) => api.request(`/api/backtest/${id}`),
  addTrade: (id, trade) => api.request(`/api/backtest/${id}/trades`, { method: 'POST', body: JSON.stringify(trade) }),
  calculate: (id) => api.request(`/api/backtest/${id}/calculate`, { method: 'POST' }),
  delete: (id) => api.request(`/api/backtest/${id}`, { method: 'DELETE' }),
  deleteTrade: (id, tradeId) => api.request(`/api/backtest/${id}/trades/${tradeId}`, { method: 'DELETE' }),
};

const TIMEFRAMES = [
  { value: '1m', label: '1 minute' },
  { value: '5m', label: '5 minutes' },
  { value: '15m', label: '15 minutes' },
  { value: '1h', label: '1 heure' },
  { value: '4h', label: '4 heures' },
  { value: '1d', label: '1 jour' },
];

const SYMBOLS = [
  { value: 'EURUSD', label: 'EUR/USD' },
  { value: 'GBPUSD', label: 'GBP/USD' },
  { value: 'USDJPY', label: 'USD/JPY' },
  { value: 'BTCUSD', label: 'BTC/USD' },
  { value: 'ETHUSD', label: 'ETH/USD' },
  { value: 'XAUUSD', label: 'Or (XAU/USD)' },
  { value: 'US500', label: 'S&P 500' },
  { value: 'NAS100', label: 'NASDAQ 100' },
];

export default function BacktestPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [backtests, setBacktests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBacktest, setSelectedBacktest] = useState(null);
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    strategy_description: '',
    symbol: 'EURUSD',
    timeframe: '1h',
    start_date: '',
    end_date: '',
    initial_capital: 10000,
    risk_per_trade: 1,
    entry_rules: [''],
    exit_rules: [''],
    stop_loss_type: 'fixed',
    stop_loss_value: 1,
    take_profit_type: 'rr_ratio',
    take_profit_value: 2,
  });

  const [tradeForm, setTradeForm] = useState({
    entry_date: '',
    exit_date: '',
    direction: 'LONG',
    entry_price: '',
    exit_price: '',
    pnl: '',
    pnl_percent: '',
    notes: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadBacktests();
    }
  }, [user]);

  const loadBacktests = async () => {
    try {
      const data = await backtestApi.getAll();
      setBacktests(data.backtests || []);
    } catch (error) {
      console.error('Error loading backtests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBacktest = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const data = await backtestApi.create({
        ...formData,
        entry_rules: formData.entry_rules.filter(r => r.trim()),
        exit_rules: formData.exit_rules.filter(r => r.trim()),
      });
      toast.success('Backtest créé avec analyse IA !');
      setShowCreateForm(false);
      loadBacktests();
      // Load the new backtest details
      const backtest = await backtestApi.getOne(data.id);
      setSelectedBacktest(backtest);
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const handleAddTrade = async (e) => {
    e.preventDefault();
    if (!selectedBacktest) return;
    
    try {
      await backtestApi.addTrade(selectedBacktest.id, {
        ...tradeForm,
        entry_price: parseFloat(tradeForm.entry_price),
        exit_price: parseFloat(tradeForm.exit_price),
        pnl: parseFloat(tradeForm.pnl),
        pnl_percent: parseFloat(tradeForm.pnl_percent),
      });
      toast.success('Trade ajouté');
      setShowAddTrade(false);
      setTradeForm({
        entry_date: '',
        exit_date: '',
        direction: 'LONG',
        entry_price: '',
        exit_price: '',
        pnl: '',
        pnl_percent: '',
        notes: '',
      });
      // Reload backtest
      const backtest = await backtestApi.getOne(selectedBacktest.id);
      setSelectedBacktest(backtest);
    } catch (error) {
      toast.error(error.message || 'Erreur');
    }
  };

  const handleCalculate = async () => {
    if (!selectedBacktest) return;
    setCalculating(true);
    try {
      const results = await backtestApi.calculate(selectedBacktest.id);
      toast.success('Résultats calculés !');
      setSelectedBacktest({ ...selectedBacktest, results, status: 'completed' });
      loadBacktests();
    } catch (error) {
      toast.error(error.message || 'Erreur de calcul');
    } finally {
      setCalculating(false);
    }
  };

  const handleDeleteBacktest = async (id) => {
    if (!confirm('Supprimer ce backtest ?')) return;
    try {
      await backtestApi.delete(id);
      toast.success('Backtest supprimé');
      setSelectedBacktest(null);
      loadBacktests();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const addRule = (type) => {
    if (type === 'entry') {
      setFormData({ ...formData, entry_rules: [...formData.entry_rules, ''] });
    } else {
      setFormData({ ...formData, exit_rules: [...formData.exit_rules, ''] });
    }
  };

  const updateRule = (type, index, value) => {
    if (type === 'entry') {
      const rules = [...formData.entry_rules];
      rules[index] = value;
      setFormData({ ...formData, entry_rules: rules });
    } else {
      const rules = [...formData.exit_rules];
      rules[index] = value;
      setFormData({ ...formData, exit_rules: rules });
    }
  };

  const removeRule = (type, index) => {
    if (type === 'entry') {
      const rules = formData.entry_rules.filter((_, i) => i !== index);
      setFormData({ ...formData, entry_rules: rules.length ? rules : [''] });
    } else {
      const rules = formData.exit_rules.filter((_, i) => i !== index);
      setFormData({ ...formData, exit_rules: rules.length ? rules : [''] });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/journal', label: 'Journal', icon: BookOpen },
    { href: '/calendar', label: 'Calendrier', icon: Calendar },
    { href: '/backtest', label: 'Backtesting', icon: Target, active: true },
    { href: '/community', label: 'Communauté', icon: Users },
    { href: '/challenges', label: 'Challenges', icon: Trophy },
    { href: '/economic', label: 'Économie', icon: Newspaper },
    { href: '/analysis', label: 'Analyse IA', icon: Brain },
    { href: '/coaching', label: 'Coaching', icon: Target },
    { href: '/tickets', label: 'Experts', icon: MessageSquare },
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
                item.active ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'hover:bg-secondary'
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold uppercase tracking-tight flex items-center gap-3">
                <Target className="w-8 h-8 text-primary" />
                Backtesting IA
              </h1>
              <p style={{ color: 'var(--muted-foreground)' }}>Teste et optimise tes stratégies avec l'IA</p>
            </div>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn-primary flex items-center gap-2"
              data-testid="create-backtest-btn"
            >
              <Plus className="w-4 h-4" />
              Nouveau Backtest
            </button>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Backtests List */}
            <div className="lg:col-span-1">
              <div className="card">
                <h2 className="font-heading text-lg font-bold uppercase tracking-tight mb-4">Mes Backtests</h2>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : backtests.length === 0 ? (
                  <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun backtest créé</p>
                    <p className="text-sm mt-1">Crée ton premier backtest pour tester ta stratégie</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {backtests.map((bt) => (
                      <button
                        key={bt.id}
                        onClick={async () => {
                          const full = await backtestApi.getOne(bt.id);
                          setSelectedBacktest(full);
                        }}
                        className={`w-full text-left p-3 rounded-sm border transition-all ${
                          selectedBacktest?.id === bt.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-secondary'
                        }`}
                        style={{ borderColor: selectedBacktest?.id === bt.id ? 'var(--primary)' : 'var(--border)' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{bt.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            bt.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                            bt.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-zinc-500/20 text-zinc-400'
                          }`}>
                            {bt.status === 'completed' ? 'Terminé' : bt.status === 'in_progress' ? 'En cours' : 'En attente'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          <span>{bt.symbol}</span>
                          <span>•</span>
                          <span>{bt.timeframe}</span>
                          <span>•</span>
                          <span>{bt.trades_count} trades</span>
                        </div>
                        {bt.results && (
                          <div className={`mt-2 font-mono text-sm font-bold ${bt.results.roi >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {bt.results.roi >= 0 ? '+' : ''}{bt.results.roi}% ROI
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Backtest Details */}
            <div className="lg:col-span-2">
              {selectedBacktest ? (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="font-heading text-xl font-bold">{selectedBacktest.name}</h2>
                        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                          {selectedBacktest.symbol} • {selectedBacktest.timeframe} • {selectedBacktest.start_date} à {selectedBacktest.end_date}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteBacktest(selectedBacktest.id)}
                        className="p-2 hover:bg-red-500/10 rounded-sm text-red-400"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                      {selectedBacktest.strategy_description}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center p-3 rounded-sm" style={{ backgroundColor: 'var(--secondary)' }}>
                        <DollarSign className="w-5 h-5 mx-auto mb-1 text-primary" />
                        <div className="font-mono font-bold">{selectedBacktest.initial_capital}€</div>
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Capital</div>
                      </div>
                      <div className="text-center p-3 rounded-sm" style={{ backgroundColor: 'var(--secondary)' }}>
                        <Percent className="w-5 h-5 mx-auto mb-1 text-primary" />
                        <div className="font-mono font-bold">{selectedBacktest.risk_per_trade}%</div>
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Risque/Trade</div>
                      </div>
                      <div className="text-center p-3 rounded-sm" style={{ backgroundColor: 'var(--secondary)' }}>
                        <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-loss" />
                        <div className="font-mono font-bold">{selectedBacktest.stop_loss_value}</div>
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Stop Loss</div>
                      </div>
                      <div className="text-center p-3 rounded-sm" style={{ backgroundColor: 'var(--secondary)' }}>
                        <Target className="w-5 h-5 mx-auto mb-1 text-profit" />
                        <div className="font-mono font-bold">{selectedBacktest.take_profit_value}</div>
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Take Profit</div>
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  {selectedBacktest.ai_analysis && (
                    <div className="card">
                      <div className="flex items-center gap-2 mb-4">
                        <Brain className="w-5 h-5 text-primary" />
                        <h3 className="font-heading font-bold uppercase">Analyse IA de la Stratégie</h3>
                      </div>
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        {selectedBacktest.ai_analysis}
                      </div>
                    </div>
                  )}

                  {/* Trades */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-heading font-bold uppercase">Trades ({selectedBacktest.trades?.length || 0})</h3>
                      <button
                        onClick={() => setShowAddTrade(true)}
                        className="btn-secondary py-2 px-3 text-sm flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter Trade
                      </button>
                    </div>
                    {selectedBacktest.trades?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                              <th className="text-left py-2 px-2">Date</th>
                              <th className="text-left py-2 px-2">Direction</th>
                              <th className="text-right py-2 px-2">Entrée</th>
                              <th className="text-right py-2 px-2">Sortie</th>
                              <th className="text-right py-2 px-2">PnL</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedBacktest.trades.map((trade, i) => (
                              <tr key={i} className="border-b" style={{ borderColor: 'var(--border)' }}>
                                <td className="py-2 px-2">{trade.entry_date}</td>
                                <td className="py-2 px-2">
                                  <span className={`px-2 py-0.5 rounded text-xs ${trade.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {trade.direction}
                                  </span>
                                </td>
                                <td className="text-right py-2 px-2 font-mono">{trade.entry_price}</td>
                                <td className="text-right py-2 px-2 font-mono">{trade.exit_price}</td>
                                <td className={`text-right py-2 px-2 font-mono font-bold ${trade.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                                  {trade.pnl >= 0 ? '+' : ''}{trade.pnl}€
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center py-4" style={{ color: 'var(--muted-foreground)' }}>
                        Aucun trade ajouté. Ajoute tes trades de backtest pour calculer les résultats.
                      </p>
                    )}
                    
                    {selectedBacktest.trades?.length > 0 && selectedBacktest.status !== 'completed' && (
                      <button
                        onClick={handleCalculate}
                        disabled={calculating}
                        className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                      >
                        {calculating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Calcul en cours...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Calculer les Résultats
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Results */}
                  {selectedBacktest.results && (
                    <div className="card">
                      <h3 className="font-heading font-bold uppercase mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Résultats du Backtest
                      </h3>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <div className="p-3 rounded-sm" style={{ backgroundColor: 'var(--secondary)' }}>
                          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Winrate</div>
                          <div className={`font-mono text-xl font-bold ${selectedBacktest.results.winrate >= 50 ? 'text-profit' : 'text-loss'}`}>
                            {selectedBacktest.results.winrate}%
                          </div>
                        </div>
                        <div className="p-3 rounded-sm" style={{ backgroundColor: 'var(--secondary)' }}>
                          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Profit Factor</div>
                          <div className={`font-mono text-xl font-bold ${selectedBacktest.results.profit_factor >= 1.5 ? 'text-profit' : 'text-loss'}`}>
                            {selectedBacktest.results.profit_factor}
                          </div>
                        </div>
                        <div className="p-3 rounded-sm" style={{ backgroundColor: 'var(--secondary)' }}>
                          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>ROI</div>
                          <div className={`font-mono text-xl font-bold ${selectedBacktest.results.roi >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {selectedBacktest.results.roi >= 0 ? '+' : ''}{selectedBacktest.results.roi}%
                          </div>
                        </div>
                        <div className="p-3 rounded-sm" style={{ backgroundColor: 'var(--secondary)' }}>
                          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Max Drawdown</div>
                          <div className="font-mono text-xl font-bold text-loss">
                            -{selectedBacktest.results.max_drawdown_percent}%
                          </div>
                        </div>
                      </div>

                      {/* Equity Curve */}
                      {selectedBacktest.results.equity_curve && (
                        <div className="h-48 mb-6">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={selectedBacktest.results.equity_curve.map((v, i) => ({ trade: i, equity: v }))}>
                              <XAxis dataKey="trade" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                                formatter={(value) => [`${value}€`, 'Capital']}
                              />
                              <ReferenceLine y={selectedBacktest.initial_capital} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
                              <Line 
                                type="monotone" 
                                dataKey="equity" 
                                stroke="var(--primary)" 
                                strokeWidth={2}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* AI Performance Analysis */}
                      {selectedBacktest.results.ai_performance_analysis && (
                        <div className="mt-4 p-4 rounded-sm" style={{ backgroundColor: 'var(--secondary)' }}>
                          <div className="flex items-center gap-2 mb-3">
                            <Brain className="w-5 h-5 text-primary" />
                            <h4 className="font-bold">Analyse IA des Résultats</h4>
                          </div>
                          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            {selectedBacktest.results.ai_performance_analysis}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="card text-center py-12">
                  <Target className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: 'var(--muted-foreground)' }} />
                  <h3 className="font-heading text-xl font-bold mb-2">Sélectionne un Backtest</h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    Choisis un backtest existant ou crée-en un nouveau pour commencer
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Create Backtest Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold uppercase">Nouveau Backtest</h2>
              <button onClick={() => setShowCreateForm(false)} className="p-2 hover:bg-secondary rounded-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBacktest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom de la stratégie</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Ex: BOS + FVG Londres"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="input w-full h-20"
                  placeholder="Décris ta stratégie en détail..."
                  value={formData.strategy_description}
                  onChange={(e) => setFormData({ ...formData, strategy_description: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Symbole</label>
                  <select
                    className="input w-full"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  >
                    {SYMBOLS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Timeframe</label>
                  <select
                    className="input w-full"
                    value={formData.timeframe}
                    onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                  >
                    {TIMEFRAMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date de début</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date de fin</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Capital initial (€)</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={formData.initial_capital}
                    onChange={(e) => setFormData({ ...formData, initial_capital: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Risque par trade (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input w-full"
                    value={formData.risk_per_trade}
                    onChange={(e) => setFormData({ ...formData, risk_per_trade: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              
              {/* Entry Rules */}
              <div>
                <label className="block text-sm font-medium mb-2">Règles d'entrée</label>
                {formData.entry_rules.map((rule, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="input flex-1"
                      placeholder="Ex: BOS confirmé sur 15min"
                      value={rule}
                      onChange={(e) => updateRule('entry', i, e.target.value)}
                    />
                    {formData.entry_rules.length > 1 && (
                      <button type="button" onClick={() => removeRule('entry', i)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-sm">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addRule('entry')} className="text-sm text-primary hover:underline">
                  + Ajouter une règle
                </button>
              </div>
              
              {/* Exit Rules */}
              <div>
                <label className="block text-sm font-medium mb-2">Règles de sortie</label>
                {formData.exit_rules.map((rule, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="input flex-1"
                      placeholder="Ex: TP atteint ou clôture sous EMA"
                      value={rule}
                      onChange={(e) => updateRule('exit', i, e.target.value)}
                    />
                    {formData.exit_rules.length > 1 && (
                      <button type="button" onClick={() => removeRule('exit', i)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-sm">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addRule('exit')} className="text-sm text-primary hover:underline">
                  + Ajouter une règle
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Stop Loss</label>
                  <div className="flex gap-2">
                    <select
                      className="input"
                      value={formData.stop_loss_type}
                      onChange={(e) => setFormData({ ...formData, stop_loss_type: e.target.value })}
                    >
                      <option value="fixed">Fixe (pips)</option>
                      <option value="percentage">Pourcentage</option>
                      <option value="atr">ATR</option>
                    </select>
                    <input
                      type="number"
                      step="0.1"
                      className="input w-24"
                      value={formData.stop_loss_value}
                      onChange={(e) => setFormData({ ...formData, stop_loss_value: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Take Profit</label>
                  <div className="flex gap-2">
                    <select
                      className="input"
                      value={formData.take_profit_type}
                      onChange={(e) => setFormData({ ...formData, take_profit_type: e.target.value })}
                    >
                      <option value="fixed">Fixe (pips)</option>
                      <option value="rr_ratio">Ratio R/R</option>
                      <option value="percentage">Pourcentage</option>
                    </select>
                    <input
                      type="number"
                      step="0.1"
                      className="input w-24"
                      value={formData.take_profit_value}
                      onChange={(e) => setFormData({ ...formData, take_profit_value: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={creating} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      Créer et Analyser
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Trade Modal */}
      {showAddTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold uppercase">Ajouter un Trade</h2>
              <button onClick={() => setShowAddTrade(false)} className="p-2 hover:bg-secondary rounded-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddTrade} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date d'entrée</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={tradeForm.entry_date}
                    onChange={(e) => setTradeForm({ ...tradeForm, entry_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date de sortie</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={tradeForm.exit_date}
                    onChange={(e) => setTradeForm({ ...tradeForm, exit_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Direction</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-sm border ${tradeForm.direction === 'LONG' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-zinc-700'}`}
                    onClick={() => setTradeForm({ ...tradeForm, direction: 'LONG' })}
                  >
                    LONG
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-sm border ${tradeForm.direction === 'SHORT' ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-zinc-700'}`}
                    onClick={() => setTradeForm({ ...tradeForm, direction: 'SHORT' })}
                  >
                    SHORT
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prix d'entrée</label>
                  <input
                    type="number"
                    step="any"
                    className="input w-full"
                    placeholder="1.0850"
                    value={tradeForm.entry_price}
                    onChange={(e) => setTradeForm({ ...tradeForm, entry_price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prix de sortie</label>
                  <input
                    type="number"
                    step="any"
                    className="input w-full"
                    placeholder="1.0900"
                    value={tradeForm.exit_price}
                    onChange={(e) => setTradeForm({ ...tradeForm, exit_price: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">PnL (€)</label>
                  <input
                    type="number"
                    step="any"
                    className="input w-full"
                    placeholder="150"
                    value={tradeForm.pnl}
                    onChange={(e) => setTradeForm({ ...tradeForm, pnl: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">PnL (%)</label>
                  <input
                    type="number"
                    step="any"
                    className="input w-full"
                    placeholder="1.5"
                    value={tradeForm.pnl_percent}
                    onChange={(e) => setTradeForm({ ...tradeForm, pnl_percent: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (optionnel)</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Setup BOS propre, entrée optimale"
                  value={tradeForm.notes}
                  onChange={(e) => setTradeForm({ ...tradeForm, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddTrade(false)} className="btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
