'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import TradingHeatmap from 'components/trading-heatmap';

const SUPABASE_URL = 'https://yyzgzcxqegeliluaqjqw.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5emd6Y3hxZWdlbGlsdWFxanF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDk3ODcsImV4cCI6MjA4NjIyNTc4N30.7dztpUcxizBSa_fDLEqJIrQmn_yykZgvJCK1csvhwm0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ─── Constants ─── */
const SESSIONS = [
    { value: 'London', label: 'London', flag: '\uD83C\uDDEC\uD83C\uDDE7' },
    { value: 'New York', label: 'New York', flag: '\uD83C\uDDFA\uD83C\uDDF8' },
    { value: 'Asia', label: 'Asia', flag: '\uD83C\uDDEF\uD83C\uDDF5' }
];

const SETUPS = ['SMC', 'ICT', 'VWAP', 'Breakout', 'Pullback', 'Reversal', 'Scalp', 'Swing'];

const SENTIMENTS = [
    { value: 'Serein', emoji: '\uD83D\uDE0E', label: 'Serein' },
    { value: 'Stresse', emoji: '\uD83D\uDE30', label: 'Stress\u00e9' },
    { value: 'En colere', emoji: '\uD83D\uDE21', label: 'En col\u00e8re' },
    { value: 'FOMO', emoji: '\uD83C\uDFC3\u200D\u2642\uFE0F', label: 'FOMO' }
];

const SESSION_COLORS = {
    'London': { line: '#3b82f6', marker: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', label: '\uD83C\uDDEC\uD83C\uDDE7 London' },
    'New York': { line: '#ef4444', marker: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: '\uD83C\uDDFA\uD83C\uDDF8 New York' },
    'Asia': { line: '#eab308', marker: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', label: '\uD83C\uDDEF\uD83C\uDDF5 Asia' }
};

/* ─── Dummy Data Generator ─── */
function generateDummyData() {
    const trades = [];
    const setups = SETUPS;
    const sessions = ['London', 'New York', 'Asia'];
    const sentiments = ['Serein', 'Stresse', 'En colere', 'FOMO'];
    let date = new Date('2025-01-02');
    for (let i = 0; i < 40; i++) {
        const isConforme = Math.random() > 0.3;
        const pnl = isConforme ? Math.random() * 500 - 100 : Math.random() * 400 - 300;
        const session = sessions[Math.floor(Math.random() * sessions.length)];
        const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
        trades.push({
            id: i + 1,
            created_at: date.toISOString(),
            pnl: Math.round(pnl * 100) / 100,
            conforme: isConforme,
            setup: setups[Math.floor(Math.random() * setups.length)],
            session,
            sentiment,
            prix_entree: null,
            prix_sortie: null
        });
        date = new Date(date.getTime() + 86400000 + Math.random() * 86400000);
    }
    return trades;
}

/* ─── Metrics Computation ─── */
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

/* ─── AI Coach Insights Generator ─── */
function generateCoachInsights(trades) {
    if (trades.length < 3) {
        return {
            message: "Bienvenue ! Commence \u00e0 enregistrer tes trades pour que je puisse t'aider \u00e0 progresser.",
            type: 'info',
            icon: '\uD83D\uDC4B'
        };
    }

    const insights = [];

    // Analyze losses by session + sentiment
    const lossBySessionSentiment = {};
    const totalLosses = trades.filter((t) => t.pnl < 0);

    totalLosses.forEach((t) => {
        if (t.session && t.sentiment) {
            const key = `${t.session}|${t.sentiment}`;
            if (!lossBySessionSentiment[key]) lossBySessionSentiment[key] = { count: 0, total: 0 };
            lossBySessionSentiment[key].count++;
            lossBySessionSentiment[key].total += t.pnl;
        }
    });

    // Find worst session+sentiment combo
    let worstCombo = null;
    let worstComboCount = 0;
    Object.entries(lossBySessionSentiment).forEach(([key, data]) => {
        if (data.count > worstComboCount && data.count >= 2) {
            worstCombo = key;
            worstComboCount = data.count;
        }
    });

    if (worstCombo && totalLosses.length > 0) {
        const [session, sentiment] = worstCombo.split('|');
        const pct = Math.round((worstComboCount / totalLosses.length) * 100);
        const sentimentLabel = SENTIMENTS.find((s) => s.value === sentiment)?.label || sentiment;
        const sessionInfo = SESSIONS.find((s) => s.value === session);
        if (pct >= 30) {
            insights.push({
                message: `Attention, ${pct}% de tes pertes ce mois-ci ont eu lieu durant la session de ${sessionInfo?.label || session} ${sessionInfo?.flag || ''} alors que tu \u00e9tais '${sentimentLabel}'. Pense \u00e0 faire une pause quand tu ressens ce sentiment.`,
                type: 'warning',
                icon: '\u26A0\uFE0F'
            });
        }
    }

    // Analyze discipline trend (last 10 trades)
    const recent = trades.slice(-10);
    const recentDiscipline = recent.filter((t) => t.conforme).length / recent.length;
    const overallDiscipline = trades.filter((t) => t.conforme).length / trades.length;

    if (recentDiscipline < overallDiscipline - 0.15) {
        insights.push({
            message: `Ta discipline baisse ! Sur tes 10 derniers trades, seulement ${Math.round(recentDiscipline * 100)}% sont conformes, contre ${Math.round(overallDiscipline * 100)}% en moyenne. Recentre-toi sur ton plan.`,
            type: 'warning',
            icon: '\uD83D\uDCE9'
        });
    } else if (recentDiscipline >= 0.8 && recent.length >= 5) {
        insights.push({
            message: `Excellent ! ${Math.round(recentDiscipline * 100)}% de discipline sur tes 10 derniers trades. Continue comme \u00e7a, la r\u00e9gularit\u00e9 est la cl\u00e9 !`,
            type: 'success',
            icon: '\uD83D\uDE80'
        });
    }

    // Analyze best performing session
    const sessionStats = {};
    trades.forEach((t) => {
        if (!t.session) return;
        if (!sessionStats[t.session]) sessionStats[t.session] = { pnl: 0, count: 0, wins: 0 };
        sessionStats[t.session].pnl += t.pnl;
        sessionStats[t.session].count++;
        if (t.pnl > 0) sessionStats[t.session].wins++;
    });

    let bestSession = null;
    let bestSessionPnl = -Infinity;
    Object.entries(sessionStats).forEach(([session, stats]) => {
        if (stats.count >= 3 && stats.pnl > bestSessionPnl) {
            bestSession = session;
            bestSessionPnl = stats.pnl;
        }
    });

    if (bestSession && bestSessionPnl > 0) {
        const info = SESSIONS.find((s) => s.value === bestSession);
        const wr = Math.round((sessionStats[bestSession].wins / sessionStats[bestSession].count) * 100);
        insights.push({
            message: `Ta meilleure session est ${info?.label || bestSession} ${info?.flag || ''} avec un winrate de ${wr}% et +${bestSessionPnl.toFixed(2)}\u20AC de PnL. Concentre tes efforts l\u00e0 !`,
            type: 'success',
            icon: '\uD83C\uDFAF'
        });
    }

    // Analyze worst sentiment
    const sentimentStats = {};
    trades.forEach((t) => {
        if (!t.sentiment) return;
        if (!sentimentStats[t.sentiment]) sentimentStats[t.sentiment] = { pnl: 0, count: 0, losses: 0 };
        sentimentStats[t.sentiment].pnl += t.pnl;
        sentimentStats[t.sentiment].count++;
        if (t.pnl < 0) sentimentStats[t.sentiment].losses++;
    });

    let worstSentiment = null;
    let worstSentimentPnl = Infinity;
    Object.entries(sentimentStats).forEach(([sentiment, stats]) => {
        if (stats.count >= 2 && stats.pnl < worstSentimentPnl) {
            worstSentiment = sentiment;
            worstSentimentPnl = stats.pnl;
        }
    });

    if (worstSentiment && worstSentimentPnl < 0) {
        const info = SENTIMENTS.find((s) => s.value === worstSentiment);
        insights.push({
            message: `Quand tu es '${info?.label || worstSentiment}' ${info?.emoji || ''}, tu perds en moyenne ${(worstSentimentPnl / sentimentStats[worstSentiment].count).toFixed(2)}\u20AC par trade. Envisage de ne pas trader dans cet \u00e9tat.`,
            type: 'warning',
            icon: '\uD83E\uDDE0'
        });
    }

    // FOMO detection
    const fomoTrades = trades.filter((t) => t.sentiment === 'FOMO');
    if (fomoTrades.length >= 2) {
        const fomoLosses = fomoTrades.filter((t) => t.pnl < 0);
        const fomoLossRate = fomoLosses.length / fomoTrades.length;
        if (fomoLossRate > 0.6) {
            insights.push({
                message: `${Math.round(fomoLossRate * 100)}% de tes trades en mode FOMO sont perdants. Le FOMO est ton ennemi n\u00b01 : respire, et attends le prochain setup propre.`,
                type: 'danger',
                icon: '\uD83D\uDED1'
            });
        }
    }

    if (insights.length === 0) {
        return {
            message: "Continue \u00e0 enregistrer tes trades avec tous les d\u00e9tails. Plus j'ai de donn\u00e9es, plus mes analyses seront pr\u00e9cises !",
            type: 'info',
            icon: '\uD83D\uDCCA'
        };
    }

    // Return the most important insight (warnings/dangers first)
    const priority = { danger: 0, warning: 1, success: 2, info: 3 };
    insights.sort((a, b) => priority[a.type] - priority[b.type]);
    return insights[0];
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

/* ─── AI Coach Bubble Component ─── */
function CoachBubble({ trades }) {
    const insight = useMemo(() => generateCoachInsights(trades), [trades]);

    const bgMap = {
        info: 'from-blue-500/10 to-indigo-500/5 border-blue-500/20',
        success: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20',
        warning: 'from-amber-500/10 to-orange-500/5 border-amber-500/20',
        danger: 'from-rose-500/10 to-red-500/5 border-rose-500/20'
    };

    const textMap = {
        info: 'text-blue-300',
        success: 'text-emerald-300',
        warning: 'text-amber-300',
        danger: 'text-rose-300'
    };

    return (
        <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-r ${bgMap[insight.type]} p-5`}>
            <div className="absolute -right-6 -top-6 text-[80px] opacity-[0.06] select-none">{insight.icon}</div>
            <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800/80 text-xl shadow-inner">
                    {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Coach IA</span>
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <p className={`text-sm leading-relaxed ${textMap[insight.type]}`}>
                        {insight.message}
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ─── SQL Migration Panel ─── */
function SqlMigrationPanel() {
    const [show, setShow] = useState(false);
    const [copied, setCopied] = useState(false);

    const sql = `-- Ajouter les colonnes session et sentiment \u00e0 la table trades
-- Copiez-collez ce code dans l'\u00e9diteur SQL de Supabase

ALTER TABLE trades
ADD COLUMN IF NOT EXISTS session TEXT DEFAULT NULL;

ALTER TABLE trades
ADD COLUMN IF NOT EXISTS sentiment TEXT DEFAULT NULL;

-- V\u00e9rification : affiche la structure de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'trades'
ORDER BY ordinal_position;`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(sql);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!show) {
        return (
            <button
                onClick={() => setShow(true)}
                className="flex items-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-900/50 px-4 py-2.5 text-xs text-slate-500 transition-all hover:border-slate-600 hover:text-slate-400"
            >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="stroke-current">
                    <path d="M4 6h8M4 10h5M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Voir le SQL pour ajouter les colonnes manquantes
            </button>
        );
    }

    return (
        <BentoCard title="SQL Migration \u2014 Colonnes session & sentiment">
            <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-400">
                    {sql}
                </pre>
                <button
                    onClick={handleCopy}
                    className="absolute right-3 top-3 rounded-md bg-slate-800 px-3 py-1.5 text-[10px] font-semibold text-slate-400 transition-all hover:bg-slate-700 hover:text-slate-300"
                >
                    {copied ? '\u2705 Copi\u00e9 !' : 'Copier'}
                </button>
            </div>
            <p className="mt-3 text-[11px] text-slate-600">
                Allez dans votre Dashboard Supabase &rarr; SQL Editor &rarr; Collez ce code &rarr; Run
            </p>
        </BentoCard>
    );
}

/* ─── Main Dashboard Component ─── */
export default function TradingDashboard() {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const [trades, setTrades] = useState([]);
    const [isDummy, setIsDummy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [tableColumns, setTableColumns] = useState([]);
    const [formData, setFormData] = useState({
        pnl: '',
        conforme: true,
        setup: '',
        session: 'London',
        sentiment: 'Serein'
    });
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
                setTableColumns(['id', 'created_at', 'pnl', 'conforme', 'setup', 'session', 'sentiment']);
                setLoading(false);
                return;
            }

            if (!data || data.length === 0) {
                const dummy = generateDummyData();
                setTrades(dummy);
                setIsDummy(true);
                setTableColumns(['id', 'created_at', 'pnl', 'conforme', 'setup', 'session', 'sentiment']);
            } else {
                setTrades(data);
                setIsDummy(false);
                setTableColumns(Object.keys(data[0]));
            }
        } catch {
            const dummy = generateDummyData();
            setTrades(dummy);
            setIsDummy(true);
            setTableColumns(['id', 'created_at', 'pnl', 'conforme', 'setup', 'session', 'sentiment']);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchTrades();
    }, [fetchTrades]);

    /* ─── Chart with Session-Colored Markers ─── */
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

            // Build equity curve
            let cumulative = 0;
            const areaData = trades
                .filter((t) => t.created_at)
                .map((t) => {
                    cumulative += Number(t.pnl) || 0;
                    return {
                        time: t.created_at.split('T')[0],
                        value: Math.round(cumulative * 100) / 100,
                        session: t.session || null
                    };
                });

            // Deduplicate by date (keep last value per day)
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
            series.setData(uniqueData.map(({ time, value }) => ({ time, value })));

            // Add session-colored markers
            const markers = uniqueData
                .filter((d) => d.session && SESSION_COLORS[d.session])
                .map((d) => ({
                    time: d.time,
                    position: d.value >= 0 ? 'belowBar' : 'aboveBar',
                    color: SESSION_COLORS[d.session].marker,
                    shape: 'circle',
                    size: 0.8
                }));

            if (markers.length > 0) {
                series.setMarkers(markers);
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

    /* ─── Form Submit ─── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitMsg('');

        const newTrade = {
            pnl: parseFloat(formData.pnl),
            conforme: formData.conforme,
            setup: formData.setup || null,
            session: formData.session || null,
            sentiment: formData.sentiment || null,
            created_at: new Date().toISOString()
        };

        try {
            const { error } = await supabase.from('trades').insert([newTrade]);
            if (error) {
                setSubmitMsg(`Erreur: ${error.message}`);
            } else {
                setSubmitMsg('Trade ajout\u00e9 avec succ\u00e8s');
                setFormData({ pnl: '', conforme: true, setup: '', session: 'London', sentiment: 'Serein' });
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

    // Check if session/sentiment columns exist
    const hasSessionColumn = tableColumns.includes('session') || isDummy;
    const hasSentimentColumn = tableColumns.includes('sentiment') || isDummy;
    const showMigration = !hasSessionColumn || !hasSentimentColumn;

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
                            <div className="text-sm font-bold tracking-tight text-slate-100">Journal de Trading Intelligent</div>
                            <div className="text-[10px] font-medium text-slate-500">Coach IA &bull; Adri</div>
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
                            A
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
                        absente de votre table. Elle est n\u00e9cessaire pour afficher le graphique temporel.
                        Colonnes d\u00e9tect\u00e9es : {tableColumns.join(', ')}
                    </div>
                )}

                {/* ─── Zone 1: AI Coach Bubble ─── */}
                <div className="mb-6">
                    <CoachBubble trades={trades} />
                </div>

                {/* ─── Zone 5: Enhanced Trade Entry Form ─── */}
                {showForm && (
                    <div className="mb-6 animate-[fadeIn_0.3s_ease-out]">
                        <BentoCard title="Journal de Trade \u2014 Saisie D\u00e9taill\u00e9e">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Row 1: PnL + Discipline */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                            R\u00e9sultat (\u20AC)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.pnl}
                                            onChange={(e) => setFormData({ ...formData, pnl: e.target.value })}
                                            placeholder="-250.00"
                                            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 font-mono text-sm text-slate-100 placeholder-slate-600 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                            Discipline
                                        </label>
                                        <div className="flex h-[42px] items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, conforme: true })}
                                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${
                                                    formData.conforme
                                                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400 shadow-lg shadow-emerald-500/10'
                                                        : 'border-slate-700 bg-slate-800 text-slate-500 hover:border-slate-600'
                                                }`}
                                            >
                                                <span>\u2705</span> Respect du plan
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, conforme: false })}
                                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${
                                                    !formData.conforme
                                                        ? 'border-rose-500/40 bg-rose-500/15 text-rose-400 shadow-lg shadow-rose-500/10'
                                                        : 'border-slate-700 bg-slate-800 text-slate-500 hover:border-slate-600'
                                                }`}
                                            >
                                                <span>\u274C</span> Hors-plan
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Session + Setup */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                            Session
                                        </label>
                                        <div className="flex gap-2">
                                            {SESSIONS.map((s) => (
                                                <button
                                                    key={s.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, session: s.value })}
                                                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                                                        formData.session === s.value
                                                            ? 'border-blue-500/40 bg-blue-500/15 text-blue-300 shadow-lg shadow-blue-500/10'
                                                            : 'border-slate-700 bg-slate-800 text-slate-500 hover:border-slate-600'
                                                    }`}
                                                >
                                                    <span>{s.flag}</span>
                                                    <span className="hidden sm:inline">{s.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                            Setup
                                        </label>
                                        <select
                                            value={formData.setup}
                                            onChange={(e) => setFormData({ ...formData, setup: e.target.value })}
                                            className="w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="">Choisir un setup...</option>
                                            {SETUPS.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Row 3: Emotional State */}
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        \u00C9tat \u00C9motionnel
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {SENTIMENTS.map((s) => (
                                            <button
                                                key={s.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, sentiment: s.value })}
                                                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                                                    formData.sentiment === s.value
                                                        ? 'border-violet-500/40 bg-violet-500/15 text-violet-300 shadow-lg shadow-violet-500/10'
                                                        : 'border-slate-700 bg-slate-800 text-slate-500 hover:border-slate-600'
                                                }`}
                                            >
                                                <span className="text-lg">{s.emoji}</span>
                                                <span>{s.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="flex items-center gap-4 pt-1">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/15 transition-all hover:shadow-emerald-500/25 hover:brightness-110 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:shadow-none"
                                    >
                                        {submitting ? (
                                            <>
                                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Envoi...
                                            </>
                                        ) : (
                                            'Enregistrer le trade'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-400 transition-all hover:border-slate-600 hover:text-slate-300"
                                    >
                                        Annuler
                                    </button>
                                    {submitMsg && (
                                        <p className={`text-xs font-medium ${submitMsg.startsWith('Erreur') ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {submitMsg}
                                        </p>
                                    )}
                                </div>
                            </form>
                        </BentoCard>
                    </div>
                )}

                {/* ─── KPI Row ─── */}
                <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <KpiCard
                        title="PnL Total"
                        value={pnlTotal >= 0 ? `+${pnlTotal.toFixed(2)}` : pnlTotal.toFixed(2)}
                        suffix="\u20AC"
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
                        suffix="\u20AC"
                        positive={avgTrade >= 0}
                    />
                </div>

                {/* ─── Trading Heatmap ─── */}
                <div className="mb-6">
                    <BentoCard title="Heatmap \u2014 Activit\u00e9 & PnL sur 365 Jours" className="shadow-xl shadow-slate-950/50">
                        <TradingHeatmap trades={trades} />
                    </BentoCard>
                </div>

                {/* ─── Chart with Session Legend ─── */}
                <div className="mb-6">
                    <BentoCard title="Equity Curve \u2014 \u00C9volution du Capital" className="shadow-xl shadow-slate-950/50">
                        {loading ? (
                            <div className="flex h-[380px] items-center justify-center">
                                <div className="flex items-center gap-3 text-sm text-slate-500">
                                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Chargement des donn\u00e9es...
                                </div>
                            </div>
                        ) : (
                            <>
                                <div ref={chartContainerRef} className="min-h-[380px] w-full rounded-lg" />
                                {/* Session color legend */}
                                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-800/60 pt-4">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Sessions :</span>
                                    {Object.entries(SESSION_COLORS).map(([key, val]) => (
                                        <div key={key} className="flex items-center gap-1.5">
                                            <div
                                                className="h-2.5 w-2.5 rounded-full"
                                                style={{ backgroundColor: val.marker }}
                                            />
                                            <span className="text-[11px] text-slate-500">{val.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </BentoCard>
                </div>

                {/* ─── Zones de V\u00e9rit\u00e9 \u2014 Bento Grid ─── */}
                <div className="mb-6 grid gap-4 md:grid-cols-2">
                    {/* Zone 1: Discipline Score */}
                    <BentoCard title="Zone 1 \u2014 Score de Discipline">
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
                    <BentoCard title="Zone 2 \u2014 Conformes vs Non-Conformes">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">Conformes</p>
                                <p className="mt-1.5 font-mono text-lg font-bold text-slate-100">
                                    WR: {metrics.conformeWinrate.toFixed(1)}%
                                </p>
                                <p className={`mt-0.5 font-mono text-xs ${metrics.conformePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    PnL: {metrics.conformePnl >= 0 ? '+' : ''}
                                    {metrics.conformePnl.toFixed(2)}\u20AC
                                </p>
                            </div>
                            <div className="rounded-xl border border-rose-500/15 bg-rose-500/5 p-3.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-500">Non-Conformes</p>
                                <p className="mt-1.5 font-mono text-lg font-bold text-slate-100">
                                    WR: {metrics.nonConformeWinrate.toFixed(1)}%
                                </p>
                                <p className={`mt-0.5 font-mono text-xs ${metrics.nonConformePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    PnL: {metrics.nonConformePnl >= 0 ? '+' : ''}
                                    {metrics.nonConformePnl.toFixed(2)}\u20AC
                                </p>
                            </div>
                        </div>
                    </BentoCard>

                    {/* Zone 3: Co\u00fbt de l'Indiscipline */}
                    <BentoCard title="Zone 3 \u2014 Co\u00fbt de l'Indiscipline">
                        <div className="flex items-baseline gap-2">
                            <span
                                className={`font-mono text-[32px] font-bold leading-none ${
                                    metrics.indisciplineCost < 0 ? 'text-rose-400' : 'text-slate-400'
                                }`}
                            >
                                {metrics.indisciplineCost >= 0 ? '+' : ''}
                                {metrics.indisciplineCost.toFixed(2)}
                            </span>
                            <span className="text-sm text-slate-500">\u20AC</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                            Somme des PnL des {metrics.nonConformes.length} trades non-conformes
                        </p>
                        {metrics.indisciplineCost < 0 && (
                            <div className="mt-3 rounded-lg border border-rose-500/15 bg-rose-500/5 px-3 py-2.5 text-xs text-rose-400">
                                L&apos;indiscipline vous co\u00fbte{' '}
                                <strong className="font-semibold">{Math.abs(metrics.indisciplineCost).toFixed(2)}\u20AC</strong> sur cette
                                p\u00e9riode.
                            </div>
                        )}
                    </BentoCard>

                    {/* Zone 4: Erreur Prioritaire */}
                    <BentoCard title="Zone 4 \u2014 Erreur Prioritaire">
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
                                            Rat\u00e9 {metrics.priorityErrorCount} fois en non-conforme
                                        </p>
                                    </div>
                                </div>
                                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                                    Ce setup est celui que vous \u00e9chouez le plus souvent. Travaillez-le en simulation avant de le reprendre en
                                    r\u00e9el.
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-slate-500">Aucune erreur d\u00e9tect\u00e9e. Continuez ainsi.</p>
                        )}
                    </BentoCard>
                </div>

                {/* ─── Recent Trades Table (Enhanced) ─── */}
                <BentoCard title={`Derniers Trades${isDummy ? ' (Donn\u00e9es fictives)' : ''}`} noPadding>
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
                                        Discipline
                                    </th>
                                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        Setup
                                    </th>
                                    <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        Session
                                    </th>
                                    <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        Sentiment
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {trades
                                    .slice()
                                    .reverse()
                                    .slice(0, 20)
                                    .map((t, i) => {
                                        const sessionInfo = SESSIONS.find((s) => s.value === t.session);
                                        const sentimentInfo = SENTIMENTS.find((s) => s.value === t.sentiment);
                                        return (
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
                                                    {Number(t.pnl).toFixed(2)}\u20AC
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span
                                                        className={`inline-block rounded-md px-2.5 py-0.5 text-[10px] font-semibold ${
                                                            t.conforme
                                                                ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                                                                : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20'
                                                        }`}
                                                    >
                                                        {t.conforme ? '\u2705 Plan' : '\u274C Hors'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-xs text-slate-400">{t.setup || '-'}</td>
                                                <td className="px-5 py-3 text-center">
                                                    {sessionInfo ? (
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                                                            {sessionInfo.flag} {sessionInfo.label}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-600">-</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    {sentimentInfo ? (
                                                        <span className="text-sm" title={sentimentInfo.label}>
                                                            {sentimentInfo.emoji}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-600">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </BentoCard>

                {/* ─── SQL Migration Helper ─── */}
                {showMigration && (
                    <div className="mt-6">
                        <SqlMigrationPanel />
                    </div>
                )}

                {/* ─── Footer ─── */}
                <div className="pb-6 pt-8 text-center text-[11px] text-slate-600">
                    Journal de Trading Intelligent &bull; Coach IA Adri &bull; Les chiffres ne mentent pas.
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
