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
  Upload,
  Loader2,
  X,
  Image as ImageIcon,
  Menu
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function AnalysisPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [symbol, setSymbol] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [notes, setNotes] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onload = (e) => setScreenshotPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!screenshotPreview) {
      toast.error('Ajoute un screenshot d\'abord');
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const screenshotBase64 = screenshotPreview.split(',')[1];
      const data = await api.analyzeSetup({
        screenshot_base64: screenshotBase64,
        symbol,
        timeframe,
        notes
      });
      setAnalysis(data.analysis);
      toast.success('Analyse terminée !');
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'analyse');
    } finally {
      setLoading(false);
    }
  };

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
    { href: '/analysis', label: 'Analyse IA', icon: Brain, active: true },
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
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">
              Analyse de Setup IA
            </h1>
            <p className="text-muted-foreground">Upload un screenshot pour une analyse détaillée</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Upload section */}
            <div className="space-y-6">
              <div className="card">
                <h3 className="font-heading font-bold uppercase tracking-tight mb-4">Screenshot du Setup</h3>
                {screenshotPreview ? (
                  <div className="relative">
                    <img src={screenshotPreview} alt="Screenshot" className="w-full rounded-sm border border-zinc-800" />
                    <button
                      type="button"
                      onClick={() => { setScreenshot(null); setScreenshotPreview(null); setAnalysis(null); }}
                      className="absolute top-2 right-2 p-1 bg-zinc-900/80 rounded-sm hover:bg-zinc-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-800 hover:border-primary/50 rounded-sm cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="hidden"
                      data-testid="analysis-screenshot-input"
                    />
                    <ImageIcon className="w-12 h-12 text-muted-foreground mb-3" />
                    <span className="text-muted-foreground text-center">
                      Cliquer pour uploader<br />
                      <span className="text-xs">ou glisser-déposer</span>
                    </span>
                  </label>
                )}
              </div>

              <div className="card">
                <h3 className="font-heading font-bold uppercase tracking-tight mb-4">Contexte (optionnel)</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Symbole</label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="BTCUSDT"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      data-testid="analysis-symbol"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Timeframe</label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="1H, 4H, 1D..."
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value.toUpperCase())}
                      data-testid="analysis-timeframe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    className="input w-full min-h-[80px] resize-none"
                    placeholder="Contexte supplémentaire..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    data-testid="analysis-notes"
                  />
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading || !screenshotPreview}
                className="btn-primary w-full flex items-center justify-center gap-2"
                data-testid="analyze-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Analyser le Setup
                  </>
                )}
              </button>
            </div>

            {/* Analysis result */}
            <div className="card min-h-[400px]">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-800">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold uppercase tracking-tight">Analyse IA</h3>
              </div>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center h-80">
                  <div className="relative">
                    <div className="w-16 h-16 border-2 border-primary/20 rounded-full" />
                    <div className="absolute inset-0 w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="mt-4 text-muted-foreground">L'IA analyse ton setup...</p>
                </div>
              ) : analysis ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {analysis}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-center">
                  <Brain className="w-16 h-16 text-muted-foreground mb-4 opacity-30" />
                  <p className="text-muted-foreground">
                    Upload un screenshot et clique sur "Analyser" pour recevoir une analyse IA détaillée de ton setup
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
