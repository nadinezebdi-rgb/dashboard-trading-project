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
  X
} from 'lucide-react';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Dashboard Intelligent',
      description: 'Performance, winrate, RR moyen, trades hors règles - tout en un coup d\'œil avec insights IA.'
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'Journal de Trading',
      description: 'Entrée manuelle ou screenshot, classification automatique, analyse comportementale.'
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'Analyse de Setup IA',
      description: 'Screenshot ton setup, l\'IA trouve les trades similaires et affiche tes stats personnelles.'
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Coaching Quotidien',
      description: 'Objectifs du jour, rappel du plan, erreurs à éviter - ton coach personnel.'
    },
  ];

  const plans = [
    {
      name: 'Starter',
      price: '29',
      features: ['Dashboard complet', 'Journal de trading', 'Statistiques de base', 'Heatmap PnL'],
      popular: false
    },
    {
      name: 'Pro',
      price: '79',
      features: ['Tout Starter', 'Analyse IA illimitée', 'Coaching quotidien', 'Calendrier économique'],
      popular: true
    },
    {
      name: 'Elite',
      price: '149',
      features: ['Tout Pro', 'Système éducatif IA', 'Backtesting assisté', 'Support prioritaire'],
      popular: false
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-primary" />
              <span className="font-heading font-bold text-xl tracking-tight uppercase">Trading AI</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-white transition-colors">Fonctionnalités</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-white transition-colors">Tarifs</a>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-white transition-colors">Connexion</Link>
              <Link href="/register" className="btn-primary" data-testid="cta-register-nav">
                Commencer
              </Link>
            </div>

            <button 
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-zinc-900/95 backdrop-blur-lg border-t border-white/5">
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className="block text-sm text-muted-foreground">Fonctionnalités</a>
              <a href="#pricing" className="block text-sm text-muted-foreground">Tarifs</a>
              <Link href="/login" className="block text-sm text-muted-foreground">Connexion</Link>
              <Link href="/register" className="btn-primary w-full text-center">Commencer</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-[100px]" />
        
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Propulsé par GPT-5.2</span>
          </div>
          
          <h1 className="font-heading text-5xl md:text-7xl font-black tracking-tight uppercase mb-6">
            Ton Coach Trading
            <br />
            <span className="text-primary">Intelligence Artificielle</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            L'assistant IA qui analyse tes trades, comprend tes erreurs et t'accompagne vers la rentabilité. 
            Journal intelligent, coaching personnalisé, analyse de setup.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn-primary text-base px-8 py-4" data-testid="cta-register-hero">
              Démarrer Gratuitement
              <ChevronRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="btn-secondary text-base px-8 py-4">
              Découvrir
            </a>
          </div>
          
          <p className="mt-6 text-sm text-muted-foreground">
            Pas de carte de crédit requise • Essai gratuit 14 jours
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight mb-4">
              Fonctionnalités
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tout ce dont tu as besoin pour devenir un trader profitable
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="card group hover:border-blue-500/30 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-heading text-xl font-bold uppercase tracking-tight mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight mb-4">
              Tarifs
            </h2>
            <p className="text-muted-foreground text-lg">
              Choisis le plan adapté à tes objectifs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`card relative ${plan.popular ? 'border-primary/50 neon-glow' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-xs font-bold uppercase tracking-wider">
                    Populaire
                  </div>
                )}
                <div className="text-center mb-6">
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
      <section className="py-20 px-4 bg-zinc-950/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold uppercase tracking-tight mb-6">
            Prêt à transformer ton trading ?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Rejoins des centaines de traders qui utilisent l'IA pour améliorer leurs performances.
          </p>
          <Link href="/register" className="btn-primary text-base px-8 py-4" data-testid="cta-register-bottom">
            Commencer Maintenant
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="font-heading font-bold tracking-tight uppercase">Trading AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Trading AI Platform. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
