'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

const TRADING_STYLES = [
  { id: 'scalping', label: 'Scalping', desc: 'Trades de quelques secondes à minutes' },
  { id: 'day_trading', label: 'Day Trading', desc: 'Trades intraday, positions fermées avant la clôture' },
  { id: 'swing', label: 'Swing Trading', desc: 'Trades de plusieurs jours à semaines' },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Débutant', desc: 'Moins de 1 an' },
  { id: 'intermediate', label: 'Intermédiaire', desc: '1 à 3 ans' },
  { id: 'advanced', label: 'Avancé', desc: '3 à 5 ans' },
  { id: 'expert', label: 'Expert', desc: 'Plus de 5 ans' },
];

const MARKETS = [
  { id: 'crypto', label: 'Crypto', icon: '₿' },
  { id: 'forex', label: 'Forex', icon: '$' },
  { id: 'indices', label: 'Indices', icon: '📊' },
  { id: 'stocks', label: 'Actions', icon: '📈' },
];

const SESSIONS = [
  { id: 'asia', label: 'Asie', time: '00:00 - 09:00' },
  { id: 'london', label: 'Londres', time: '08:00 - 17:00' },
  { id: 'new_york', label: 'New York', time: '14:00 - 23:00' },
];

const DIFFICULTIES = [
  { id: 'entries_too_fast', label: 'Entrées trop rapides' },
  { id: 'fomo', label: 'FOMO' },
  { id: 'overtrading', label: 'Overtrading' },
  { id: 'not_respecting_plan', label: 'Non-respect du plan' },
  { id: 'bad_risk_management', label: 'Mauvais risk management' },
  { id: 'emotions', label: 'Gestion des émotions' },
];

const KNOWN_APPROACHES = [
  { id: 'ict', label: 'ICT / SMC' },
  { id: 'price_action', label: 'Price Action' },
  { id: 'indicators', label: 'Indicateurs techniques' },
  { id: 'orderflow', label: 'Order Flow' },
  { id: 'none', label: 'Aucune stratégie définie' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({
    trading_style: '',
    experience_level: '',
    markets: [],
    sessions: [],
    daily_time: '',
    difficulties: [],
    has_journal: false,
    does_backtesting: false,
    objectives: '',
    known_approaches: [],
    learning_style: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const steps = [
    {
      title: 'Style de Trading',
      subtitle: 'Comment trades-tu ?',
      component: (
        <div className="grid gap-4">
          {TRADING_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => setAnswers({ ...answers, trading_style: style.id })}
              className={`card text-left transition-all ${
                answers.trading_style === style.id 
                  ? 'border-primary neon-glow' 
                  : 'hover:border-zinc-700'
              }`}
              data-testid={`style-${style.id}`}
            >
              <h4 className="font-bold mb-1">{style.label}</h4>
              <p className="text-sm text-muted-foreground">{style.desc}</p>
            </button>
          ))}
        </div>
      ),
      valid: answers.trading_style !== ''
    },
    {
      title: 'Niveau d\'expérience',
      subtitle: 'Depuis combien de temps trades-tu ?',
      component: (
        <div className="grid gap-4">
          {EXPERIENCE_LEVELS.map((level) => (
            <button
              key={level.id}
              type="button"
              onClick={() => setAnswers({ ...answers, experience_level: level.id })}
              className={`card text-left transition-all ${
                answers.experience_level === level.id 
                  ? 'border-primary neon-glow' 
                  : 'hover:border-zinc-700'
              }`}
              data-testid={`level-${level.id}`}
            >
              <h4 className="font-bold mb-1">{level.label}</h4>
              <p className="text-sm text-muted-foreground">{level.desc}</p>
            </button>
          ))}
        </div>
      ),
      valid: answers.experience_level !== ''
    },
    {
      title: 'Marchés',
      subtitle: 'Sur quels marchés trades-tu ?',
      component: (
        <div className="grid grid-cols-2 gap-4">
          {MARKETS.map((market) => (
            <button
              key={market.id}
              type="button"
              onClick={() => {
                const markets = answers.markets.includes(market.id)
                  ? answers.markets.filter(m => m !== market.id)
                  : [...answers.markets, market.id];
                setAnswers({ ...answers, markets });
              }}
              className={`card text-center transition-all ${
                answers.markets.includes(market.id) 
                  ? 'border-primary neon-glow' 
                  : 'hover:border-zinc-700'
              }`}
              data-testid={`market-${market.id}`}
            >
              <span className="text-3xl mb-2 block">{market.icon}</span>
              <h4 className="font-bold">{market.label}</h4>
            </button>
          ))}
        </div>
      ),
      valid: answers.markets.length > 0
    },
    {
      title: 'Sessions de Trading',
      subtitle: 'Quand trades-tu ?',
      component: (
        <div className="grid gap-4">
          {SESSIONS.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => {
                const sessions = answers.sessions.includes(session.id)
                  ? answers.sessions.filter(s => s !== session.id)
                  : [...answers.sessions, session.id];
                setAnswers({ ...answers, sessions });
              }}
              className={`card text-left transition-all ${
                answers.sessions.includes(session.id) 
                  ? 'border-primary neon-glow' 
                  : 'hover:border-zinc-700'
              }`}
              data-testid={`session-${session.id}`}
            >
              <h4 className="font-bold mb-1">{session.label}</h4>
              <p className="text-sm text-muted-foreground">{session.time} UTC</p>
            </button>
          ))}
        </div>
      ),
      valid: answers.sessions.length > 0
    },
    {
      title: 'Difficultés',
      subtitle: 'Quels sont tes principaux défis ?',
      component: (
        <div className="grid grid-cols-2 gap-3">
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff.id}
              type="button"
              onClick={() => {
                const difficulties = answers.difficulties.includes(diff.id)
                  ? answers.difficulties.filter(d => d !== diff.id)
                  : [...answers.difficulties, diff.id];
                setAnswers({ ...answers, difficulties });
              }}
              className={`card text-center p-4 transition-all ${
                answers.difficulties.includes(diff.id) 
                  ? 'border-primary neon-glow' 
                  : 'hover:border-zinc-700'
              }`}
              data-testid={`diff-${diff.id}`}
            >
              <span className="text-sm font-medium">{diff.label}</span>
            </button>
          ))}
        </div>
      ),
      valid: answers.difficulties.length > 0
    },
    {
      title: 'Approches Connues',
      subtitle: 'Quelles stratégies connais-tu ?',
      component: (
        <div className="grid gap-3">
          {KNOWN_APPROACHES.map((approach) => (
            <button
              key={approach.id}
              type="button"
              onClick={() => {
                const approaches = answers.known_approaches.includes(approach.id)
                  ? answers.known_approaches.filter(a => a !== approach.id)
                  : [...answers.known_approaches, approach.id];
                setAnswers({ ...answers, known_approaches: approaches });
              }}
              className={`card text-left p-4 transition-all ${
                answers.known_approaches.includes(approach.id) 
                  ? 'border-primary neon-glow' 
                  : 'hover:border-zinc-700'
              }`}
              data-testid={`approach-${approach.id}`}
            >
              <span className="font-medium">{approach.label}</span>
            </button>
          ))}
        </div>
      ),
      valid: answers.known_approaches.length > 0
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.saveQuestionnaire({
        questionnaire_type: 'assistant',
        answers
      });
      
      await api.saveQuestionnaire({
        questionnaire_type: 'educational',
        answers
      });

      updateUser({ onboarding_completed: true });
      toast.success('Profil configuré !');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = steps[step];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-grid">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5" />
      
      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <TrendingUp className="w-8 h-8 text-primary" />
            <span className="font-heading font-bold text-xl tracking-tight uppercase">Trading AI</span>
          </div>
          
          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div 
                key={i}
                className={`flex-1 h-1 transition-all ${
                  i <= step ? 'bg-primary' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
          
          <h1 className="font-heading text-2xl font-bold uppercase tracking-tight mb-2">
            {currentStep.title}
          </h1>
          <p className="text-muted-foreground">
            {currentStep.subtitle}
          </p>
        </div>

        <div className="mb-8">
          {currentStep.component}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            data-testid="onboarding-prev"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour
          </button>
          
          <button
            type="button"
            onClick={handleNext}
            disabled={!currentStep.valid || loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
            data-testid="onboarding-next"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement...
              </>
            ) : step === steps.length - 1 ? (
              'Terminer'
            ) : (
              <>
                Suivant
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
