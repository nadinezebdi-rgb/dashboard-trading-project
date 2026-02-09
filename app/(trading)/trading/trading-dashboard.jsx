'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yyzgzcxqegeliluaqjqw.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5emd6Y3hxZWdlbGlsdWFxanF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDk3ODcsImV4cCI6MjA4NjIyNTc4N30.7dztpUcxizBSa_fDLEqJIrQmn_yykZgvJCK1csvhwm0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function generateDummyData() {
    const trades = [];
    const setups = ['Breakout', 'Pullback', 'Reversal', 'Scalp', 'Swing'];
    let date = new Date('2025-01-02');
    for (let i = 0; i < 40; i++) {
        const isConforme = Math.random() > 0.3;
        const pnl = isConforme ? Math.random() * 500 - 100 : Math.random() * 400 - 300;
        trades.push({
            id: i + 1,
            created_at: date.toISOString(),
            pnl: Math.round(pnl * 100) / 100,
            conforme: isConforme,
            setup: setups[Math.floor(Math.random() * setups.length)],
            prix_entree: null,
            prix_sortie: null
        });
        date = new Date(date.getTime() + 86400000 + Math.random() * 86400000);
    }
    return trades;
}

function computeMetrics(trades) {
    if (!trades.length) {
        return {
            discipline: 0,
            totalTrades: 0,
            conformes: [],
            nonConformes: [],
            conformeWinrate: 0,
            nonConformeWinrate: 0,
            conformePnl: 0,
            nonConformePnl: 0,
            indisciplineCost: 0,
            priorityError: null,
            priorityErrorCount: 0
        };
    }

    const conformes = trades.filter((t) => t.conforme);
    const nonConformes = trades.filter((t) => !t.conforme);
    const discipline = (conformes.length / trades.length) * 100;

    const conformeWins = conformes.filter((t) => t.pnl > 0).length;
    const nonConformeWins = nonConformes.filter((t) => t.pnl > 0).length;
    const conformeWinrate = conformes.length ? (conformeWins / conformes.length) * 100 : 0;
    const nonConformeWinrate = nonConformes.length ? (nonConformeWins / nonConformes.length) * 100 : 0;

    const conformePnl = conformes.reduce((s, t) => s + t.pnl, 0);
    const nonConformePnl = nonConformes.reduce((s, t) => s + t.pnl, 0);
    const indisciplineCost = nonConformePnl;

    const setupFailCounts = {};
    nonConformes.forEach((t) => {
        const setup = t.setup || 'Unknown';
        setupFailCounts[setup] = (setupFailCounts[setup] || 0) + 1;
    });
    let priorityError = null;
    let priorityErrorCount = 0;
    Object.entries(setupFailCounts).forEach(([setup, count]) => {
        if (count > priorityErrorCount) {
            priorityError = setup;
            priorityErrorCount = count;
        }
    });

    return {
        discipline,
        totalTrades: trades.length,
        conformes,
        nonConformes,
        conformeWinrate,
        nonConformeWinrate,
        conformePnl,
        nonConformePnl,
        indisciplineCost,
        priorityError,
        priorityErrorCount
    };
}

/* ─── Reusable UI Components ─── */

function KpiCard({ title, value, suffix, positive, badge }) {
    const color = positive === undefined ? 'text-slate-100' : positive ? 'text-emerald-400' : 'text-rose-400';
    return (
        <div className="group relative rounded-2xl border border-slate-800 bg-slate-900 p-5 transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-slate-950/50">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-800/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <p className="relative text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
            <div className="relative mt-2 flex items-baseline gap-2">
                <span className={`font-mono text-[28px] font-bold leading-none ${color}`}>{value}</span>
                {suffix && <span className="text-sm font-normal text-slate-500">{suffix}</span>}
                {badge !== undefined && badge !== null && (
                    <span
                        className={`ml-auto rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            badge >= 0
                                ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20'
                        }`}
                    >
                        {badge >= 0 ? '+' : ''}
                        {badge}%
                    </span>
                )}
            </div>
        </div>
    );
}

function BentoCard({ title, children, className = '', noPadding = false }) {
    return (
        <div
            className={`rounded-2xl border border-slate-800 bg-slate-900 transition-all ${className}`}
        >
            {title && (
                <div className="border-b border-slate-800/60 px-5 py-3">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
                </div>
            )}
            <div className={noPadding ? '' : 'p-5'}>{children}</div>
        </div>
    );
}

export default function TradingDashboard() {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const [trades, setTrades] = useState([]);
    const [isDummy, setIsDummy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [tableColumns, setTableColumns] = useState([]);
    const [formData, setFormData] = useState({ pnl: '', conforme: true, setup: '' });
    const [submitting, setSubmitting] = useState(false);
    const [submitMsg, setSubmitMsg] = useState('');
    const [showForm, setShowForm] = useState(false);

    const fetchTrades = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('trades').select('*').order('created_at', { ascending: true });

            if (error) {
                console.error('Supabase error:', error);
                const dummy = generateDummyData();
                setTrades(dummy);
                setIsDummy(true);
                setTableColumns(['id', 'created_at', 'pnl', 'conforme', 'setup']);
                setLoading(false);
                return;
            }

            if (!data || data.length === 0) {
                const dummy = generateDummyData();
                setTrades(dummy);
                setIsDummy(true);
                setTableColumns(['id', 'created_at', 'pnl', 'conforme', 'setup']);
            } else {
                setTrades(data);
                setIsDummy(false);
                setTableColumns(Object.keys(data[0]));
            }
        } catch {
            const dummy = generateDummyData();
            setTrades(dummy);
            setIsDummy(true);
            setTableColumns(['id', 'created_at', 'pnl', 'conforme', 'setup']);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchTrades();
    }, [fetchTrades]);

    useEffect(() => {
        if (!chartContainerRef.current || trades.length === 0) return;

        let disposed = false;

        async function initChart() {
            const { createChart, ColorType, LineStyle } = await import('lightweight-charts');
            if (disposed) return;

            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }

            const container = chartContainerRef.current;
            const chart = createChart(container, {
                width: container.clientWidth,
                height: 380,
                layout: {
                    background: { type: ColorType.Solid, color: 'transparent' },
                    textColor: '#64748b',
                    fontFamily: "'JetBrains Mono', 'Geist Mono', monospace",
                    fontSize: 11
                },
                grid: {
                    vertLines: { color: 'rgba(51, 65, 85, 0.3)', style: LineStyle.Dotted },
                    horzLines: { color: 'rgba(51, 65, 85, 0.3)', style: LineStyle.Dotted }
                },
                crosshair: {
                    vertLine: { color: '#6366f1', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#4f46e5' },
                    horzLine: { color: '#6366f1', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#4f46e5' }
                },
                rightPriceScale: {
                    borderColor: '#1e293b',
                    scaleMargins: { top: 0.08, bottom: 0.08 }
                },
                timeScale: {
                    borderColor: '#1e293b',
                    timeVisible: false
                },
                handleScroll: true,
                handleScale: true
            });

            chartRef.current = chart;

            const hasCandleData = trades.some((t) => t.prix_entree != null && t.prix_sortie != null);

            if (hasCandleData) {
                const candleData = trades
                    .filter((t) => t.prix_entree != null && t.prix_sortie != null && t.created_at)
                    .map((t) => {
                        const time = t.created_at.split('T')[0];
                        const open = Number(t.prix_entree);
                        const close = Number(t.prix_sortie);
                        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
                        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
                        return { time, open, high, low, close };
                    });

                chart.addCandlestickSeries({
                    upColor: '#10b981',
                    downColor: '#f43f5e',
                    borderUpColor: '#34d399',
                    borderDownColor: '#fb7185',
                    wickUpColor: '#34d399',
                    wickDownColor: '#fb7185'
                }).setData(candleData);
            } else {
                let cumulative = 0;
                const areaData = trades
                    .filter((t) => t.created_at)
                    .map((t) => {
                        cumulative += Number(t.pnl) || 0;
                        return { time: t.created_at.split('T')[0], value: Math.round(cumulative * 100) / 100 };
                    });

                const dateMap = new Map();
                areaData.forEach((d) => dateMap.set(d.time, d));
                const uniqueData = Array.from(dateMap.values());

                const series = chart.addAreaSeries({
                    topColor: 'rgba(16, 185, 129, 0.15)',
                    bottomColor: 'rgba(16, 185, 129, 0.01)',
                    lineColor: '#10b981',
                    lineWidth: 2,
                    crosshairMarkerBackgroundColor: '#10b981',
                    crosshairMarkerBorderColor: '#fff',
                    crosshairMarkerRadius: 5
                });
                series.setData(uniqueData);
            }

            chart.timeScale().fitContent();

            const resizeObserver = new ResizeObserver((entries) => {
                if (entries.length > 0) {
                    const { width } = entries[0].contentRect;
                    chart.applyOptions({ width });
                }
            });
            resizeObserver.observe(container);

            return () => {
                resizeObserver.disconnect();
            };
        }

        initChart();

        return () => {
            disposed = true;
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [trades]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitMsg('');

        const newTrade = {
            pnl: parseFloat(formData.pnl),
            conforme: formData.conforme,
            setup: formData.setup || null,
            created_at: new Date().toISOString()
        };

        try {
            const { error } = await supabase.from('trades').insert([newTrade]);
            if (error) {
                setSubmitMsg(`Erreur: ${error.message}`);
            } else {
                setSubmitMsg('Trade ajouté avec succès');
                setFormData({ pnl: '', conforme: true, setup: '' });
                await fetchTrades();
            }
        } catch (err) {
            setSubmitMsg(`Erreur: ${err.message}`);
        }
        setSubmitting(false);
    };

    const metrics = computeMetrics(trades);
    const hasMissingColumns = !tableColumns.includes('created_at') && tableColumns.length > 0 && !isDummy;
    const pnlTotal = trades.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
    const globalWinrate = metrics.totalTrades ? (trades.filter((t) => t.pnl > 0).length / trades.length) * 100 : 0;
    const avgTrade = metrics.totalTrades ? pnlTotal / metrics.totalTrades : 0;

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
            {/* ─── Header ─── */}
            <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/20">
                            TP
                        </div>
                        <div>
                            <div className="text-sm font-bold tracking-tight text-slate-100">Trading Psychologique</div>
                            <div className="text-[10px] font-medium text-slate-500">Dashboard Vérité</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isDummy && (
                            <span className="rounded-md bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-400 ring-1 ring-amber-500/20">
                                DEMO
                            </span>
                        )}
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:brightness-110 active:scale-[0.98]"
                        >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="stroke-current">
                                <path d="M8 3v10M3 8h10" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Nouveau trade
                        </button>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-400 ring-1 ring-slate-700">
                            U
                        </div>
                    </div>
                </div>
            </header>

            {/* ─── Main Content ─── */}
            <main className="mx-auto max-w-[1440px] px-6 py-6">
                {/* Warning banner */}
                {hasMissingColumns && (
                    <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-400">
                        <strong>Attention :</strong> La colonne <code className="rounded bg-slate-800 px-1 py-0.5 font-mono text-amber-300">created_at</code> est
                        absente de votre table. Elle est nécessaire pour afficher le graphique temporel.
                        Colonnes détectées : {tableColumns.join(', ')}
                    </div>
                )}

                {/* ─── Form Panel (slide-down) ─── */}
                {showForm && (
                    <div className="mb-6 animate-[fadeIn_0.3s_ease-out]">
                        <BentoCard title="Saisie rapide de trade">
                            <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
                                <div className="min-w-[140px] flex-1">
                                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        PnL ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.pnl}
                                        onChange={(e) => setFormData({ ...formData, pnl: e.target.value })}
                                        placeholder="-250.00"
                                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 font-mono text-sm text-slate-100 placeholder-slate-600 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div className="min-w-[140px] flex-1">
                                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        Setup
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.setup}
                                        onChange={(e) => setFormData({ ...formData, setup: e.target.value })}
                                        placeholder="Breakout, Pullback..."
                                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div className="min-w-[140px] flex-1">
                                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        Conforme ?
                                    </label>
                                    <select
                                        value={formData.conforme ? 'true' : 'false'}
                                        onChange={(e) => setFormData({ ...formData, conforme: e.target.value === 'true' })}
                                        className="w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="true">Oui - Conforme</option>
                                        <option value="false">Non - Non conforme</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="whitespace-nowrap rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/15 transition-all hover:shadow-emerald-500/25 hover:brightness-110 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:shadow-none"
                                >
                                    {submitting ? 'Envoi...' : 'Enregistrer'}
                                </button>
                            </form>
                            {submitMsg && (
                                <p className={`mt-3 text-xs font-medium ${submitMsg.startsWith('Erreur') ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {submitMsg}
                                </p>
                            )}
                        </BentoCard>
                    </div>
                )}

                {/* ─── KPI Row ─── */}
                <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <KpiCard
                        title="PnL Total"
                        value={pnlTotal >= 0 ? `+${pnlTotal.toFixed(2)}` : pnlTotal.toFixed(2)}
                        suffix="$"
                        positive={pnlTotal >= 0}
                    />
                    <KpiCard title="Trades" value={metrics.totalTrades} />
                    <KpiCard
                        title="Winrate"
                        value={globalWinrate.toFixed(1)}
                        suffix="%"
                        positive={globalWinrate >= 50}
                        badge={globalWinrate >= 50 ? Math.round(globalWinrate - 50) : -Math.round(50 - globalWinrate)}
                    />
                    <KpiCard
                        title="Moy. / Trade"
                        value={avgTrade >= 0 ? `+${avgTrade.toFixed(2)}` : avgTrade.toFixed(2)}
                        suffix="$"
                        positive={avgTrade >= 0}
                    />
                </div>

                {/* ─── Chart ─── */}
                <div className="mb-6">
                    <BentoCard title="Equity Curve — Évolution du Capital" className="shadow-xl shadow-slate-950/50">
                        {loading ? (
                            <div className="flex h-[380px] items-center justify-center">
                                <div className="flex items-center gap-3 text-sm text-slate-500">
                                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Chargement des données...
                                </div>
                            </div>
                        ) : (
                            <div ref={chartContainerRef} className="min-h-[380px] w-full rounded-lg" />
                        )}
                    </BentoCard>
                </div>

                {/* ─── Zones de Vérité — Bento Grid ─── */}
                <div className="mb-6 grid gap-4 md:grid-cols-2">
                    {/* Zone 1: Discipline Score */}
                    <BentoCard title="Zone 1 — Score de Discipline">
                        <div className="flex items-center gap-5">
                            <div className="relative h-[88px] w-[88px] shrink-0">
                                <svg viewBox="0 0 88 88" className="h-[88px] w-[88px] -rotate-90">
                                    <circle cx="44" cy="44" r="36" fill="none" className="stroke-slate-800" strokeWidth="7" />
                                    <circle
                                        cx="44"
                                        cy="44"
                                        r="36"
                                        fill="none"
                                        className={metrics.discipline >= 80 ? 'stroke-emerald-500' : 'stroke-rose-500'}
                                        strokeWidth="7"
                                        strokeDasharray={`${(metrics.discipline / 100) * 226.2} 226.2`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span
                                        className={`font-mono text-lg font-bold ${metrics.discipline >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}
                                    >
                                        {metrics.discipline.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className={`text-sm font-semibold ${metrics.discipline >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {metrics.discipline >= 80 ? 'Discipline solide' : 'Discipline insuffisante'}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {metrics.conformes.length} conformes sur {metrics.totalTrades} trades
                                </p>
                                {metrics.discipline < 80 && (
                                    <div className="mt-2 rounded-md border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-400">
                                        Statistiques non exploitables.
                                    </div>
                                )}
                            </div>
                        </div>
                    </BentoCard>

                    {/* Zone 2: Conformes vs Non-Conformes */}
                    <BentoCard title="Zone 2 — Conformes vs Non-Conformes">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">Conformes</p>
                                <p className="mt-1.5 font-mono text-lg font-bold text-slate-100">
                                    WR: {metrics.conformeWinrate.toFixed(1)}%
                                </p>
                                <p className={`mt-0.5 font-mono text-xs ${metrics.conformePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    PnL: {metrics.conformePnl >= 0 ? '+' : ''}
                                    {metrics.conformePnl.toFixed(2)}$
                                </p>
                            </div>
                            <div className="rounded-xl border border-rose-500/15 bg-rose-500/5 p-3.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-500">Non-Conformes</p>
                                <p className="mt-1.5 font-mono text-lg font-bold text-slate-100">
                                    WR: {metrics.nonConformeWinrate.toFixed(1)}%
                                </p>
                                <p className={`mt-0.5 font-mono text-xs ${metrics.nonConformePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    PnL: {metrics.nonConformePnl >= 0 ? '+' : ''}
                                    {metrics.nonConformePnl.toFixed(2)}$
                                </p>
                            </div>
                        </div>
                    </BentoCard>

                    {/* Zone 3: Coût de l'Indiscipline */}
                    <BentoCard title="Zone 3 — Coût de l'Indiscipline">
                        <div className="flex items-baseline gap-2">
                            <span
                                className={`font-mono text-[32px] font-bold leading-none ${
                                    metrics.indisciplineCost < 0 ? 'text-rose-400' : 'text-slate-400'
                                }`}
                            >
                                {metrics.indisciplineCost >= 0 ? '+' : ''}
                                {metrics.indisciplineCost.toFixed(2)}
                            </span>
                            <span className="text-sm text-slate-500">$</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                            Somme des PnL des {metrics.nonConformes.length} trades non-conformes
                        </p>
                        {metrics.indisciplineCost < 0 && (
                            <div className="mt-3 rounded-lg border border-rose-500/15 bg-rose-500/5 px-3 py-2.5 text-xs text-rose-400">
                                L&apos;indiscipline vous coûte{' '}
                                <strong className="font-semibold">{Math.abs(metrics.indisciplineCost).toFixed(2)}$</strong> sur cette
                                période.
                            </div>
                        )}
                    </BentoCard>

                    {/* Zone 4: Erreur Prioritaire */}
                    <BentoCard title="Zone 4 — Erreur Prioritaire">
                        {metrics.priorityError ? (
                            <>
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-rose-400">
                                            <path
                                                d="M10 6v4m0 4h.01M3.072 17h13.856c1.544 0 2.5-1.67 1.73-3L11.73 3.27c-.77-1.33-2.694-1.33-3.464 0L1.34 14c-.77 1.33.193 3 1.732 3z"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-mono text-xl font-bold text-rose-400">{metrics.priorityError}</p>
                                        <p className="text-xs text-slate-500">
                                            Raté {metrics.priorityErrorCount} fois en non-conforme
                                        </p>
                                    </div>
                                </div>
                                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                                    Ce setup est celui que vous échouez le plus souvent. Travaillez-le en simulation avant de le reprendre en
                                    réel.
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-slate-500">Aucune erreur détectée. Continuez ainsi.</p>
                        )}
                    </BentoCard>
                </div>

                {/* ─── Recent Trades Table ─── */}
                <BentoCard title={`Derniers Trades${isDummy ? ' (Données fictives)' : ''}`} noPadding>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        Date
                                    </th>
                                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        PnL
                                    </th>
                                    <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        Conforme
                                    </th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        Setup
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {trades
                                    .slice()
                                    .reverse()
                                    .slice(0, 20)
                                    .map((t, i) => (
                                        <tr
                                            key={t.id || i}
                                            className="border-b border-slate-800/50 transition-colors hover:bg-slate-800/30"
                                        >
                                            <td className="px-5 py-3 font-mono text-xs text-slate-500">
                                                {t.created_at ? new Date(t.created_at).toLocaleDateString('fr-FR') : '-'}
                                            </td>
                                            <td
                                                className={`px-5 py-3 text-right font-mono text-xs font-semibold ${
                                                    t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                }`}
                                            >
                                                {t.pnl >= 0 ? '+' : ''}
                                                {Number(t.pnl).toFixed(2)}$
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span
                                                    className={`inline-block rounded-md px-2.5 py-0.5 text-[10px] font-semibold ${
                                                        t.conforme
                                                            ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                                                            : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20'
                                                    }`}
                                                >
                                                    {t.conforme ? 'OUI' : 'NON'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-xs text-slate-400">{t.setup || '-'}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </BentoCard>

                {/* ─── Footer ─── */}
                <div className="pb-6 pt-8 text-center text-[11px] text-slate-600">
                    Trading Psychologique — Dashboard Vérité &bull; Les chiffres ne mentent pas.
                </div>
            </main>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
                ::-webkit-scrollbar-thumb:hover { background: #475569; }
            `}</style>
        </div>
    );
}
