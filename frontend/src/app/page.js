'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  ChevronRight, 
  TrendingUp, 
  Brain, 
  BookOpen, 
  Target, 
  BarChart3,
  Sparkles,
  Check,
  Menu,
  X,
  Calendar,
  MessageSquare,
  Newspaper,
  Clock,
  Sun,
  Moon,
  Zap,
  Shield,
  Users
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Dashboard Intelligent',
      description: 'Performance, winrate, RR moyen, trades hors règles - tout en un coup d\'œil avec insights IA.',
      gradient: 'from-blue-500 to-cyan-400'
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'Journal de Trading',
      description: 'Entrée manuelle ou screenshot, classification automatique, analyse comportementale.',
      gradient: 'from-purple-500 to-pink-400'
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'Analyse de Setup IA',
      description: 'Screenshot ton setup, l\'IA trouve les trades similaires et affiche tes stats personnelles.',
      gradient: 'from-orange-500 to-yellow-400'
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Coaching Quotidien',
      description: 'Objectifs du jour, rappel du plan, erreurs à éviter - ton coach personnel.',
      gradient: 'from-green-500 to-emerald-400'
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Calendrier des Trades',
      description: 'Visualise tes trades par mois, analyse tes patterns et identifie tes meilleurs jours.',
      gradient: 'from-indigo-500 to-blue-400'
    },
    {
      icon: <Newspaper className="w-6 h-6" />,
      title: 'Journal Économique IA',
      description: 'Calendrier économique avec analyse IA des tendances et impact sur tes marchés.',
      gradient: 'from-rose-500 to-red-400'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Analyse de Durée',
      description: 'Graphiques détaillés de la durée de tes trades pour optimiser ton timing.',
      gradient: 'from-teal-500 to-cyan-400'
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Consultation Experts',
      description: 'Système de tickets pour des consultations personnalisées avec des traders pros.',
      gradient: 'from-violet-500 to-purple-400'
    },
  ];

  const plans = [
    {
      name: 'Starter',
      price: '29',
      features: ['Dashboard complet', 'Journal de trading', 'Statistiques de base', 'Heatmap PnL', 'Calendrier mensuel'],
      popular: false
    },
    {
      name: 'Pro',
      price: '79',
      features: ['Tout Starter', 'Analyse IA illimitée', 'Coaching quotidien', 'Journal économique', 'Graphiques avancés'],
      popular: true
    },
    {
      name: 'Elite',
      price: '149',
      features: ['Tout Pro', 'Consultations experts', 'Système éducatif IA', 'Backtesting assisté', 'Support prioritaire'],
      popular: false
    },
  ];

  const stats = [
    { value: '10K+', label: 'Traders Actifs' },
    { value: '2M+', label: 'Trades Analysés' },
    { value: '89%', label: 'Satisfaction' },
    { value: '24/7', label: 'Support IA' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="relative">
                <TrendingUp className="w-8 h-8 text-primary" />
                <div className="absolute inset-0 w-8 h-8 bg-primary/30 blur-lg" />
              </div>
              <span className="font-heading font-bold text-xl tracking-tight uppercase">Trading AI</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm hover:text-primary transition-colors" style={{ color: 'var(--muted-foreground)' }}>Fonctionnalités</a>
              <a href="#pricing" className="text-sm hover:text-primary transition-colors" style={{ color: 'var(--muted-foreground)' }}>Tarifs</a>
              <Link href="/login" className="text-sm hover:text-primary transition-colors" style={{ color: 'var(--muted-foreground)' }}>Connexion</Link>
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-sm transition-colors hover:bg-secondary"
                data-testid="theme-toggle"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Link href="/register" className="btn-primary" data-testid="cta-register-nav">
                Commencer
              </Link>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-sm"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="mobile-menu-toggle"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className="block text-sm" style={{ color: 'var(--muted-foreground)' }}>Fonctionnalités</a>
              <a href="#pricing" className="block text-sm" style={{ color: 'var(--muted-foreground)' }}>Tarifs</a>
              <Link href="/login" className="block text-sm" style={{ color: 'var(--muted-foreground)' }}>Connexion</Link>
              <Link href="/register" className="btn-primary w-full text-center">Commencer</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-8 animate-fade-in">
            <Zap className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Propulsé par GPT-5.2</span>
          </div>
          
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-black tracking-tight uppercase mb-6 animate-fade-in stagger-1">
            <span className="block">Ton Coach Trading</span>
            <span className="gradient-text">Intelligence Artificielle</span>
          </h1>
          
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-10 animate-fade-in stagger-2" style={{ color: 'var(--muted-foreground)' }}>
            L'assistant IA qui analyse tes trades, comprend tes erreurs et t'accompagne vers la rentabilité. 
            Journal intelligent, coaching personnalisé, analyse de setup en temps réel.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in stagger-3">
            <Link href="/register" className="btn-primary text-base px-8 py-4 flex items-center gap-2" data-testid="cta-register-hero">
              <Sparkles className="w-5 h-5" />
              Démarrer Gratuitement
              <ChevronRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="btn-secondary text-base px-8 py-4">
              Découvrir
            </a>
          </div>
          
          <p className="mt-6 text-sm animate-fade-in stagger-4" style={{ color: 'var(--muted-foreground)' }}>
            Pas de carte de crédit requise • Essai gratuit 14 jours
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 animate-fade-in stagger-5">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-heading text-3xl md:text-4xl font-black gradient-text">{stat.value}</div>
                <div className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4" style={{ backgroundColor: 'var(--secondary)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight mb-4">
              Fonctionnalités <span className="gradient-text">Puissantes</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--muted-foreground)' }}>
              Tout ce dont tu as besoin pour devenir un trader profitable
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="card group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-10 rounded-full blur-3xl 
                               group-hover:opacity-20 transition-opacity duration-500`} />
                <div className="relative">
                  <div className={`w-12 h-12 rounded-sm bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4
                                 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="font-heading text-lg font-bold uppercase tracking-tight mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight mb-6">
                Pourquoi <span className="gradient-text">Trading AI</span> ?
              </h2>
              <p className="text-lg mb-8" style={{ color: 'var(--muted-foreground)' }}>
                Contrairement aux autres outils, notre plateforme s'adapte à TON style de trading. 
                L'IA apprend de tes erreurs, comprend tes patterns et te guide vers la rentabilité.
              </p>
              <div className="space-y-4">
                {[
                  { icon: <Brain className="w-5 h-5" />, text: 'IA personnalisée qui s\'adapte à ton profil' },
                  { icon: <Shield className="w-5 h-5" />, text: 'Aucun signal, juste de l\'éducation et du coaching' },
                  { icon: <Users className="w-5 h-5" />, text: 'Accès à des experts pour des consultations' },
                  { icon: <Zap className="w-5 h-5" />, text: 'Analyses en temps réel de tes setups' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="hero-card rounded-sm p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold">Coach IA</div>
                      <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>En ligne</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-sm" style={{ backgroundColor: 'var(--secondary)' }}>
                    <p className="text-sm">
                      "Tu trades mieux en session Londres. J'ai remarqué que 78% de tes trades gagnants sont des BOS sur le 15min. 
                      Concentre-toi sur ce setup aujourd'hui. 🎯"
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    <Sparkles className="w-4 h-4 text-primary" />
                    Conseil personnalisé basé sur tes 127 trades
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4" style={{ backgroundColor: 'var(--secondary)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight mb-4">
              Tarifs <span className="gradient-text">Transparents</span>
            </h2>
            <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>
              Choisis le plan adapté à tes objectifs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`card relative ${plan.popular ? 'gradient-border neon-glow' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-xs font-bold uppercase tracking-wider text-white">
                    Populaire
                  </div>
                )}
                <div className="text-center mb-6 pt-2">
                  <h3 className="font-heading text-2xl font-bold uppercase tracking-tight mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-heading text-5xl font-black">{plan.price}</span>
                    <span style={{ color: 'var(--muted-foreground)' }}>€/mois</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <Check className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--profit)' }} />
                      <span style={{ color: 'var(--muted-foreground)' }}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link 
                  href="/register"
                  className={`w-full block text-center ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                  data-testid={`plan-${plan.name.toLowerCase()}`}
                >
                  Choisir {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
        
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-5xl font-bold uppercase tracking-tight mb-6">
            Prêt à <span className="gradient-text">transformer</span> ton trading ?
          </h2>
          <p className="text-lg mb-8" style={{ color: 'var(--muted-foreground)' }}>
            Rejoins des milliers de traders qui utilisent l'IA pour améliorer leurs performances chaque jour.
          </p>
          <Link href="/register" className="btn-primary text-base px-10 py-4 inline-flex items-center gap-2" data-testid="cta-register-bottom">
            <Sparkles className="w-5 h-5" />
            Commencer Maintenant
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="font-heading font-bold tracking-tight uppercase">Trading AI</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            © 2025 Trading AI Platform. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
