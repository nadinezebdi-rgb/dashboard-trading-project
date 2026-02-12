'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  TrendingUp, 
  ArrowLeft,
  Upload,
  Loader2,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

const SETUP_TYPES = [
  'BOS', 'CHOCH', 'FVG', 'Liquidité', 'Order Block', 'Break & Retest', 'Autre'
];

const SESSIONS = [
  { id: 'asia', label: 'Asie' },
  { id: 'london', label: 'Londres' },
  { id: 'new_york', label: 'New York' },
];

const ERRORS = [
  'Entrée trop rapide',
  'FOMO',
  'Overtrading',
  'Stop trop serré',
  'Stop trop large',
  'Mauvais timing',
  'Pas respecté le plan',
];

export default function NewTradePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [formData, setFormData] = useState({
    symbol: '',
    direction: 'LONG',
    entry_price: '',
    exit_price: '',
    quantity: '',
    pnl: '',
    setup_type: '',
    session: '',
    respected_plan: true,
    emotions: '',
    errors: [],
    notes: ''
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let screenshotBase64 = null;
      if (screenshot) {
        screenshotBase64 = screenshotPreview?.split(',')[1];
      }

      await api.createTrade({
        ...formData,
        entry_price: parseFloat(formData.entry_price) || 0,
        exit_price: formData.exit_price ? parseFloat(formData.exit_price) : null,
        quantity: parseFloat(formData.quantity) || 0,
        pnl: formData.pnl ? parseFloat(formData.pnl) : null,
        screenshot_base64: screenshotBase64
      });

      toast.success('Trade enregistré !');
      router.push('/journal');
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const toggleError = (error) => {
    const errors = formData.errors.includes(error)
      ? formData.errors.filter(e => e !== error)
      : [...formData.errors, error];
    setFormData({ ...formData, errors });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background bg-grid">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/journal" className="p-2 hover:bg-zinc-900 rounded-sm transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold uppercase tracking-tight">
              Nouveau Trade
            </h1>
            <p className="text-muted-foreground text-sm">Enregistre ton trade</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Screenshot upload */}
          <div className="card">
            <h3 className="font-heading font-bold uppercase tracking-tight mb-4">Screenshot (optionnel)</h3>
            {screenshotPreview ? (
              <div className="relative">
                <img src={screenshotPreview} alt="Screenshot" className="w-full rounded-sm border border-zinc-800" />
                <button
                  type="button"
                  onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}
                  className="absolute top-2 right-2 p-1 bg-zinc-900/80 rounded-sm hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-800 hover:border-primary/50 rounded-sm cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="hidden"
                  data-testid="screenshot-input"
                />
                <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Cliquer pour uploader</span>
              </label>
            )}
          </div>

          {/* Basic info */}
          <div className="card">
            <h3 className="font-heading font-bold uppercase tracking-tight mb-4">Informations</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Symbole *</label>
                <input
                  type="text"
                  required
                  className="input w-full"
                  placeholder="BTCUSDT, EURUSD..."
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  data-testid="trade-symbol"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Direction *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, direction: 'LONG' })}
                    className={`flex-1 py-2 text-sm font-bold uppercase ${
                      formData.direction === 'LONG' 
                        ? 'bg-profit text-white' 
                        : 'bg-zinc-900 text-muted-foreground hover:bg-zinc-800'
                    }`}
                    data-testid="direction-long"
                  >
                    Long
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, direction: 'SHORT' })}
                    className={`flex-1 py-2 text-sm font-bold uppercase ${
                      formData.direction === 'SHORT' 
                        ? 'bg-loss text-white' 
                        : 'bg-zinc-900 text-muted-foreground hover:bg-zinc-800'
                    }`}
                    data-testid="direction-short"
                  >
                    Short
                  </button>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">Prix d'entrée *</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="input w-full"
                  placeholder="0.00"
                  value={formData.entry_price}
                  onChange={(e) => setFormData({ ...formData, entry_price: e.target.value })}
                  data-testid="trade-entry-price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Prix de sortie</label>
                <input
                  type="number"
                  step="any"
                  className="input w-full"
                  placeholder="0.00"
                  value={formData.exit_price}
                  onChange={(e) => setFormData({ ...formData, exit_price: e.target.value })}
                  data-testid="trade-exit-price"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">Quantité *</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="input w-full"
                  placeholder="0.00"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  data-testid="trade-quantity"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">PnL (€)</label>
                <input
                  type="number"
                  step="any"
                  className="input w-full"
                  placeholder="0.00"
                  value={formData.pnl}
                  onChange={(e) => setFormData({ ...formData, pnl: e.target.value })}
                  data-testid="trade-pnl"
                />
              </div>
            </div>
          </div>

          {/* Setup details */}
          <div className="card">
            <h3 className="font-heading font-bold uppercase tracking-tight mb-4">Détails du Setup</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Type de setup</label>
              <div className="flex flex-wrap gap-2">
                {SETUP_TYPES.map((setup) => (
                  <button
                    key={setup}
                    type="button"
                    onClick={() => setFormData({ ...formData, setup_type: setup })}
                    className={`px-3 py-1.5 text-xs font-medium uppercase ${
                      formData.setup_type === setup 
                        ? 'bg-primary text-white' 
                        : 'bg-zinc-900 text-muted-foreground hover:bg-zinc-800'
                    }`}
                    data-testid={`setup-${setup.toLowerCase()}`}
                  >
                    {setup}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Session</label>
              <div className="flex gap-2">
                {SESSIONS.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, session: session.id })}
                    className={`flex-1 px-3 py-2 text-xs font-medium uppercase ${
                      formData.session === session.id 
                        ? 'bg-primary text-white' 
                        : 'bg-zinc-900 text-muted-foreground hover:bg-zinc-800'
                    }`}
                    data-testid={`session-${session.id}`}
                  >
                    {session.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Plan respecté ?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, respected_plan: true })}
                  className={`flex-1 px-3 py-2 text-xs font-medium uppercase ${
                    formData.respected_plan 
                      ? 'bg-profit text-white' 
                      : 'bg-zinc-900 text-muted-foreground hover:bg-zinc-800'
                  }`}
                  data-testid="plan-yes"
                >
                  Oui
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, respected_plan: false })}
                  className={`flex-1 px-3 py-2 text-xs font-medium uppercase ${
                    !formData.respected_plan 
                      ? 'bg-loss text-white' 
                      : 'bg-zinc-900 text-muted-foreground hover:bg-zinc-800'
                  }`}
                  data-testid="plan-no"
                >
                  Non
                </button>
              </div>
            </div>
          </div>

          {/* Errors */}
          <div className="card">
            <h3 className="font-heading font-bold uppercase tracking-tight mb-4">Erreurs commises</h3>
            <div className="flex flex-wrap gap-2">
              {ERRORS.map((error) => (
                <button
                  key={error}
                  type="button"
                  onClick={() => toggleError(error)}
                  className={`px-3 py-1.5 text-xs font-medium ${
                    formData.errors.includes(error) 
                      ? 'bg-loss text-white' 
                      : 'bg-zinc-900 text-muted-foreground hover:bg-zinc-800'
                  }`}
                  data-testid={`error-${error}`}
                >
                  {error}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <h3 className="font-heading font-bold uppercase tracking-tight mb-4">Notes</h3>
            <textarea
              className="input w-full min-h-[100px] resize-none"
              placeholder="Notes sur ce trade..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              data-testid="trade-notes"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Link href="/journal" className="btn-secondary flex-1 text-center">
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              data-testid="submit-trade"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer le trade'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
