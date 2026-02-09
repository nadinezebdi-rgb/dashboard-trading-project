'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yyzgzcxqegeliluaqjqw.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5emd6Y3hxZWdlbGlsdWFxanF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDk3ODcsImV4cCI6MjA4NjIyNTc4N30.7dztpUcxizBSa_fDLEqJIrQmn_yykZgvJCK1csvhwm0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const COLORS = {
    bg: '#0f172a',
    card: '#1e293b',
    cardBorder: '#334155',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    profit: '#10b981',
    profitGlow: '#34d399',
    loss: '#f43f5e',
    lossGlow: '#fb7185',
    accent: '#6366f1',
    accentGlow: '#818cf8',
    warning: '#f59e0b',
    chartArea: 'rgba(16, 185, 129, 0.12)',
    chartLine: '#10b981'
};

function generateDummyData() {
    const trades = [];
    const setups = ['Breakout', 'Pullback', 'Reversal', 'Scalp', 'Swing'];
    let date = new Date('2025-01-02');
    for (let i = 0; i < 40; i++) {
        const isConforme = Math.random() > 0.3;
        const pnl = isConforme ? (Math.random() * 500 - 100) : (Math.random() * 400 - 300);
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

    // Priority error: setup most often non-conforme
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

function MetricCard({ title, children, className = '' }) {
    return (
        <div
            className={className}
            style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}
        >
            <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: COLORS.textMuted }}>
                {title}
            </div>
            {children}
        </div>
    );
}

function StatValue({ value, suffix = '', color = COLORS.text, size = '28px' }) {
    return (
        <div style={{ fontSize: size, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.2 }}>
            {value}
            {suffix && <span style={{ fontSize: '14px', fontWeight: 400, marginLeft: '4px', color: COLORS.textMuted }}>{suffix}</span>}
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
                height: 360,
                layout: {
                    background: { type: ColorType.Solid, color: 'transparent' },
                    textColor: COLORS.textMuted,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 11
                },
                grid: {
                    vertLines: { color: 'rgba(51, 65, 85, 0.4)', style: LineStyle.Dotted },
                    horzLines: { color: 'rgba(51, 65, 85, 0.4)', style: LineStyle.Dotted }
                },
                crosshair: {
                    vertLine: { color: COLORS.accentGlow, width: 1, style: LineStyle.Dashed, labelBackgroundColor: COLORS.accent },
                    horzLine: { color: COLORS.accentGlow, width: 1, style: LineStyle.Dashed, labelBackgroundColor: COLORS.accent }
                },
                rightPriceScale: {
                    borderColor: COLORS.cardBorder,
                    scaleMargins: { top: 0.1, bottom: 0.1 }
                },
                timeScale: {
                    borderColor: COLORS.cardBorder,
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
                    upColor: COLORS.profit,
                    downColor: COLORS.loss,
                    borderUpColor: COLORS.profitGlow,
                    borderDownColor: COLORS.lossGlow,
                    wickUpColor: COLORS.profitGlow,
                    wickDownColor: COLORS.lossGlow
                }).setData(candleData);
            } else {
                let cumulative = 0;
                const areaData = trades
                    .filter((t) => t.created_at)
                    .map((t) => {
                        cumulative += Number(t.pnl) || 0;
                        return { time: t.created_at.split('T')[0], value: Math.round(cumulative * 100) / 100 };
                    });

                // Deduplicate by date (keep last entry for each date)
                const dateMap = new Map();
                areaData.forEach((d) => dateMap.set(d.time, d));
                const uniqueData = Array.from(dateMap.values());

                const series = chart.addAreaSeries({
                    topColor: COLORS.chartArea,
                    bottomColor: 'rgba(16, 185, 129, 0.01)',
                    lineColor: COLORS.chartLine,
                    lineWidth: 2,
                    crosshairMarkerBackgroundColor: COLORS.profit,
                    crosshairMarkerBorderColor: '#fff',
                    crosshairMarkerRadius: 4
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
                setSubmitMsg('Trade ajout\u00e9 avec succ\u00e8s');
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

    return (
        <div
            style={{
                minHeight: '100vh',
                backgroundColor: COLORS.bg,
                color: COLORS.text,
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
            }}
        >
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { background: ${COLORS.bg} !important; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
                ::-webkit-scrollbar-thumb { background: ${COLORS.cardBorder}; border-radius: 3px; }
                input, select { outline: none; }
                input:focus, select:focus { border-color: ${COLORS.accent} !important; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }
                @keyframes pulse-profit { 0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.3); } 50% { box-shadow: 0 0 20px 4px rgba(16,185,129,0.15); } }
                @keyframes pulse-loss { 0%, 100% { box-shadow: 0 0 0 0 rgba(244,63,94,0.3); } 50% { box-shadow: 0 0 20px 4px rgba(244,63,94,0.15); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .fade-in { animation: fadeIn 0.4s ease-out forwards; }
            `}</style>

            {/* Header */}
            <header
                style={{
                    borderBottom: `1px solid ${COLORS.cardBorder}`,
                    padding: '16px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backdropFilter: 'blur(12px)',
                    background: 'rgba(15, 23, 42, 0.8)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: `linear-gradient(135deg, ${COLORS.profit}, ${COLORS.accent})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '16px'
                        }}
                    >
                        TP
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-0.02em' }}>Trading Psychologique</div>
                        <div style={{ fontSize: '11px', color: COLORS.textMuted }}>Dashboard V\u00e9rit\u00e9</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isDummy && (
                        <span
                            style={{
                                fontSize: '11px',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: COLORS.warning,
                                border: `1px solid rgba(245, 158, 11, 0.3)`,
                                fontWeight: 500
                            }}
                        >
                            DUMMY DATA
                        </span>
                    )}
                    <button
                        onClick={() => setShowForm(!showForm)}
                        style={{
                            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentGlow})`,
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>+</span> Ajouter un trade
                    </button>
                </div>
            </header>

            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
                {/* Column warnings */}
                {hasMissingColumns && (
                    <div
                        style={{
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: `1px solid rgba(245, 158, 11, 0.3)`,
                            borderRadius: '8px',
                            padding: '12px 16px',
                            marginBottom: '20px',
                            fontSize: '13px',
                            color: COLORS.warning
                        }}
                    >
                        <strong>Attention :</strong> La colonne <code>created_at</code> est absente de votre table. Elle est
                        n\u00e9cessaire pour afficher le graphique temporel. Colonnes d\u00e9tect\u00e9es : {tableColumns.join(', ')}
                    </div>
                )}

                {/* Form panel */}
                {showForm && (
                    <div className="fade-in" style={{ marginBottom: '24px' }}>
                        <MetricCard title="Zone 5 \u2014 Saisie Rapide de Trade">
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
                                <div style={{ flex: '1 1 140px' }}>
                                    <label style={{ display: 'block', fontSize: '11px', color: COLORS.textMuted, marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em' }}>
                                        PnL ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.pnl}
                                        onChange={(e) => setFormData({ ...formData, pnl: e.target.value })}
                                        placeholder="-250.00"
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            border: `1px solid ${COLORS.cardBorder}`,
                                            background: COLORS.bg,
                                            color: COLORS.text,
                                            fontSize: '14px',
                                            fontFamily: "'JetBrains Mono', monospace"
                                        }}
                                    />
                                </div>
                                <div style={{ flex: '1 1 140px' }}>
                                    <label style={{ display: 'block', fontSize: '11px', color: COLORS.textMuted, marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em' }}>
                                        Setup
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.setup}
                                        onChange={(e) => setFormData({ ...formData, setup: e.target.value })}
                                        placeholder="Breakout, Pullback..."
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            border: `1px solid ${COLORS.cardBorder}`,
                                            background: COLORS.bg,
                                            color: COLORS.text,
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                <div style={{ flex: '1 1 140px' }}>
                                    <label style={{ display: 'block', fontSize: '11px', color: COLORS.textMuted, marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em' }}>
                                        Conforme ?
                                    </label>
                                    <select
                                        value={formData.conforme ? 'true' : 'false'}
                                        onChange={(e) => setFormData({ ...formData, conforme: e.target.value === 'true' })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            border: `1px solid ${COLORS.cardBorder}`,
                                            background: COLORS.bg,
                                            color: COLORS.text,
                                            fontSize: '14px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="true">Oui - Conforme</option>
                                        <option value="false">Non - Non conforme</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{
                                        padding: '10px 24px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: submitting ? COLORS.cardBorder : `linear-gradient(135deg, ${COLORS.profit}, #059669)`,
                                        color: '#fff',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        cursor: submitting ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {submitting ? 'Envoi...' : 'Enregistrer'}
                                </button>
                            </form>
                            {submitMsg && (
                                <div
                                    style={{
                                        marginTop: '8px',
                                        fontSize: '13px',
                                        color: submitMsg.startsWith('Erreur') ? COLORS.loss : COLORS.profit,
                                        fontWeight: 500
                                    }}
                                >
                                    {submitMsg}
                                </div>
                            )}
                        </MetricCard>
                    </div>
                )}

                {/* Top stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <MetricCard title="Total PnL">
                        <StatValue value={pnlTotal >= 0 ? `+${pnlTotal.toFixed(2)}` : pnlTotal.toFixed(2)} suffix="$" color={pnlTotal >= 0 ? COLORS.profit : COLORS.loss} />
                    </MetricCard>
                    <MetricCard title="Nombre de Trades">
                        <StatValue value={metrics.totalTrades} />
                    </MetricCard>
                    <MetricCard title="Winrate Global">
                        <StatValue
                            value={metrics.totalTrades ? ((trades.filter((t) => t.pnl > 0).length / trades.length) * 100).toFixed(1) : '0'}
                            suffix="%"
                            color={trades.filter((t) => t.pnl > 0).length / (trades.length || 1) >= 0.5 ? COLORS.profit : COLORS.loss}
                        />
                    </MetricCard>
                    <MetricCard title="Trades Conformes">
                        <StatValue value={metrics.conformes.length} suffix={`/ ${metrics.totalTrades}`} color={COLORS.profit} />
                    </MetricCard>
                </div>

                {/* Chart */}
                <MetricCard title="Equity Curve \u2014 \u00c9volution du Capital">
                    {loading ? (
                        <div style={{ height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textMuted }}>
                            Chargement des donn\u00e9es...
                        </div>
                    ) : (
                        <div ref={chartContainerRef} style={{ width: '100%', minHeight: '360px', borderRadius: '8px' }} />
                    )}
                </MetricCard>

                {/* 5 Zones de Verite */}
                <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                    {/* Zone 1: Discipline Score */}
                    <MetricCard title="Zone 1 \u2014 Score de Discipline">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                                <svg viewBox="0 0 80 80" style={{ width: '80px', height: '80px', transform: 'rotate(-90deg)' }}>
                                    <circle cx="40" cy="40" r="34" fill="none" stroke={COLORS.cardBorder} strokeWidth="6" />
                                    <circle
                                        cx="40"
                                        cy="40"
                                        r="34"
                                        fill="none"
                                        stroke={metrics.discipline >= 80 ? COLORS.profit : COLORS.loss}
                                        strokeWidth="6"
                                        strokeDasharray={`${(metrics.discipline / 100) * 213.6} 213.6`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        fontSize: '16px',
                                        fontFamily: "'JetBrains Mono', monospace",
                                        color: metrics.discipline >= 80 ? COLORS.profit : COLORS.loss
                                    }}
                                >
                                    {metrics.discipline.toFixed(0)}%
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: metrics.discipline >= 80 ? COLORS.profit : COLORS.loss }}>
                                    {metrics.discipline >= 80 ? 'Discipline solide' : 'Discipline insuffisante'}
                                </div>
                                {metrics.discipline < 80 && (
                                    <div
                                        style={{
                                            marginTop: '6px',
                                            fontSize: '12px',
                                            color: COLORS.loss,
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            background: 'rgba(244, 63, 94, 0.1)',
                                            border: `1px solid rgba(244, 63, 94, 0.2)`
                                        }}
                                    >
                                        Statistiques non exploitables.
                                    </div>
                                )}
                            </div>
                        </div>
                    </MetricCard>

                    {/* Zone 2: Conformes vs Non-conformes */}
                    <MetricCard title="Zone 2 \u2014 Conformes vs Non-Conformes">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div
                                style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: 'rgba(16, 185, 129, 0.08)',
                                    border: `1px solid rgba(16, 185, 129, 0.2)`
                                }}
                            >
                                <div style={{ fontSize: '11px', color: COLORS.profit, fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Conformes</div>
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '18px' }}>
                                    WR: {metrics.conformeWinrate.toFixed(1)}%
                                </div>
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: metrics.conformePnl >= 0 ? COLORS.profit : COLORS.loss }}>
                                    PnL: {metrics.conformePnl >= 0 ? '+' : ''}
                                    {metrics.conformePnl.toFixed(2)}$
                                </div>
                            </div>
                            <div
                                style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: 'rgba(244, 63, 94, 0.08)',
                                    border: `1px solid rgba(244, 63, 94, 0.2)`
                                }}
                            >
                                <div style={{ fontSize: '11px', color: COLORS.loss, fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Non-Conformes</div>
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '18px' }}>
                                    WR: {metrics.nonConformeWinrate.toFixed(1)}%
                                </div>
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: metrics.nonConformePnl >= 0 ? COLORS.profit : COLORS.loss }}>
                                    PnL: {metrics.nonConformePnl >= 0 ? '+' : ''}
                                    {metrics.nonConformePnl.toFixed(2)}$
                                </div>
                            </div>
                        </div>
                    </MetricCard>

                    {/* Zone 3: Cost of Indiscipline */}
                    <MetricCard title="Zone 3 \u2014 Co\u00fbt de l'Indiscipline">
                        <StatValue
                            value={metrics.indisciplineCost >= 0 ? `+${metrics.indisciplineCost.toFixed(2)}` : metrics.indisciplineCost.toFixed(2)}
                            suffix="$"
                            color={metrics.indisciplineCost < 0 ? COLORS.loss : COLORS.textMuted}
                            size="32px"
                        />
                        <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
                            Somme des PnL des {metrics.nonConformes.length} trades non-conformes
                        </div>
                        {metrics.indisciplineCost < 0 && (
                            <div
                                style={{
                                    fontSize: '12px',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    background: 'rgba(244, 63, 94, 0.08)',
                                    border: `1px solid rgba(244, 63, 94, 0.15)`,
                                    color: COLORS.loss
                                }}
                            >
                                L'indiscipline vous co\u00fbte <strong>{Math.abs(metrics.indisciplineCost).toFixed(2)}$</strong> sur cette p\u00e9riode.
                            </div>
                        )}
                    </MetricCard>

                    {/* Zone 4: Priority Error */}
                    <MetricCard title="Zone 4 \u2014 Erreur Prioritaire">
                        {metrics.priorityError ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '12px',
                                            background: 'rgba(244, 63, 94, 0.12)',
                                            border: `1px solid rgba(244, 63, 94, 0.3)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '20px',
                                            flexShrink: 0
                                        }}
                                    >
                                        !
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.loss, fontFamily: "'JetBrains Mono', monospace" }}>
                                            {metrics.priorityError}
                                        </div>
                                        <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
                                            Rat\u00e9 {metrics.priorityErrorCount} fois en non-conforme
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
                                    Ce setup est celui que vous \u00e9chouez le plus souvent. Travaillez-le en simulation avant de le reprendre en r\u00e9el.
                                </div>
                            </>
                        ) : (
                            <div style={{ fontSize: '14px', color: COLORS.textMuted }}>Aucune erreur d\u00e9tect\u00e9e. Continuez ainsi.</div>
                        )}
                    </MetricCard>
                </div>

                {/* Recent trades table */}
                <div style={{ marginTop: '24px' }}>
                    <MetricCard title={`Derniers Trades ${isDummy ? '(Donn\u00e9es fictives)' : ''}`}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: `1px solid ${COLORS.cardBorder}`, color: COLORS.textMuted, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                            Date
                                        </th>
                                        <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: `1px solid ${COLORS.cardBorder}`, color: COLORS.textMuted, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                            PnL
                                        </th>
                                        <th style={{ textAlign: 'center', padding: '8px 12px', borderBottom: `1px solid ${COLORS.cardBorder}`, color: COLORS.textMuted, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                            Conforme
                                        </th>
                                        <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: `1px solid ${COLORS.cardBorder}`, color: COLORS.textMuted, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
                                                style={{
                                                    borderBottom: `1px solid ${COLORS.cardBorder}`,
                                                    transition: 'background 0.15s',
                                                    background: 'transparent'
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)')}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: COLORS.textMuted }}>
                                                    {t.created_at ? new Date(t.created_at).toLocaleDateString('fr-FR') : '-'}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: '10px 12px',
                                                        textAlign: 'right',
                                                        fontFamily: "'JetBrains Mono', monospace",
                                                        fontWeight: 600,
                                                        color: t.pnl >= 0 ? COLORS.profit : COLORS.loss
                                                    }}
                                                >
                                                    {t.pnl >= 0 ? '+' : ''}
                                                    {Number(t.pnl).toFixed(2)}$
                                                </td>
                                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                    <span
                                                        style={{
                                                            display: 'inline-block',
                                                            padding: '2px 10px',
                                                            borderRadius: '4px',
                                                            fontSize: '11px',
                                                            fontWeight: 600,
                                                            background: t.conforme ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                                                            color: t.conforme ? COLORS.profit : COLORS.loss,
                                                            border: `1px solid ${t.conforme ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`
                                                        }}
                                                    >
                                                        {t.conforme ? 'OUI' : 'NON'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '10px 12px', fontSize: '12px' }}>{t.setup || '-'}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </MetricCard>
                </div>

                {/* Footer */}
                <div style={{ marginTop: '32px', paddingBottom: '24px', textAlign: 'center', fontSize: '11px', color: COLORS.textMuted }}>
                    Trading Psychologique \u2014 Dashboard V\u00e9rit\u00e9 &bull; Les chiffres ne mentent pas.
                </div>
            </div>
        </div>
    );
}
