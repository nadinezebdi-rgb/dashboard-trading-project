'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Check,
  Loader2,
  Crown,
  Menu,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    features: [
      'Dashboard complet',
      'Journal de trading',
      'Statistiques de base',
      'Heatmap PnL',
      '10 analyses IA/mois'
    ],
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79,
    features: [
      'Tout Starter',
      'Analyse IA illimitée',
      'Coaching quotidien',
      'Calendrier économique',
      'Export des données'
    ],
    popular: true
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 149,
    features: [
      'Tout Pro',
      'Système éducatif IA',
      'Backtesting assisté',
      'Support prioritaire',
      'Accès bêta features'
    ],
    popular: false
  }
];

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, updateUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      checkPaymentStatus(sessionId);
    }
  }, [searchParams]);

  const checkPaymentStatus = async (sessionId) => {
    setCheckingPayment(true);
    let attempts = 0;
    const maxAttempts = 5;

    const poll = async () => {
      try {
        const data = await api.getPaymentStatus(sessionId);
        if (data.payment_status === 'paid') {
          toast.success('Paiement réussi ! Abonnement activé.');
          // Refresh user data
          const userData = await api.getMe();
          updateUser(userData.user);
          router.replace('/subscription');
        } else if (data.status === 'expired') {
          toast.error('Session expirée. Veuillez réessayer.');
          router.replace('/subscription');
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000);
        } else {
          toast.error('Vérification timeout. Contactez le support.');
          setCheckingPayment(false);
        }
      } catch (error) {
        toast.error('Erreur de vérification');
        setCheckingPayment(false);
      }
    };

    poll();
  };

  const handleSubscribe = async (planId) => {
    setLoading(planId);
    try {
      const data = await api.createCheckout(planId);
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors du paiement');
      setLoading(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (authLoading || checkingPayment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        {checkingPayment && <p className="text-muted-foreground">Vérification du paiement...</p>}
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/journal', label: 'Journal', icon: BookOpen },
    { href: '/analysis', label: 'Analyse IA', icon: Brain },
    { href: '/coaching', label: 'Coaching', icon: Target },
    { href: '/subscription', label: 'Abonnement', icon: Sparkles, active: true },
  ];

  const currentPlan = PLANS.find(p => p.id === user.subscription) || null;

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
              Abonnement
            </h1>
            <p className="text-muted-foreground">Choisis le plan adapté à tes objectifs</p>
          </div>

          {/* Current plan */}
          {currentPlan && (
            <div className="card mb-8 border-primary/30">
              <div className="flex items-center gap-3 mb-2">
                <Crown className="w-5 h-5 text-primary" />
                <span className="font-heading font-bold uppercase">Plan actuel</span>
              </div>
              <h3 className="font-heading text-2xl font-black">{currentPlan.name}</h3>
              <p className="text-muted-foreground">
                {currentPlan.price}€/mois • Renouvellement automatique
              </p>
            </div>
          )}

          {/* Plans grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const isCurrent = user.subscription === plan.id;
              return (
                <div 
                  key={plan.id}
                  className={`card relative ${
                    plan.popular ? 'border-primary/50 neon-glow' : ''
                  } ${isCurrent ? 'border-profit/50' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-xs font-bold uppercase tracking-wider">
                      Populaire
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 right-4 px-4 py-1 bg-profit text-xs font-bold uppercase tracking-wider">
                      Actif
                    </div>
                  )}
                  <div className="text-center mb-6 pt-2">
                    <h3 className="font-heading text-2xl font-bold uppercase tracking-tight mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="font-heading text-5xl font-black">{plan.price}</span>
                      <span className="text-muted-foreground">€/mois</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <Check className="w-4 h-4 text-profit flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading === plan.id || isCurrent}
                    className={`w-full ${
                      isCurrent 
                        ? 'btn-secondary cursor-default opacity-50' 
                        : plan.popular 
                          ? 'btn-primary' 
                          : 'btn-secondary'
                    } flex items-center justify-center gap-2`}
                    data-testid={`subscribe-${plan.id}`}
                  >
                    {loading === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redirection...
                      </>
                    ) : isCurrent ? (
                      'Plan actuel'
                    ) : (
                      `Choisir ${plan.name}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* FAQ */}
          <div className="mt-12">
            <h2 className="font-heading text-xl font-bold uppercase tracking-tight mb-6">Questions Fréquentes</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card">
                <h4 className="font-bold mb-2">Puis-je changer de plan ?</h4>
                <p className="text-sm text-muted-foreground">
                  Oui, tu peux upgrader ou downgrader à tout moment. Le changement prend effet immédiatement.
                </p>
              </div>
              <div className="card">
                <h4 className="font-bold mb-2">Comment annuler ?</h4>
                <p className="text-sm text-muted-foreground">
                  Tu peux annuler depuis les paramètres. Ton accès reste actif jusqu'à la fin de la période payée.
                </p>
              </div>
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
