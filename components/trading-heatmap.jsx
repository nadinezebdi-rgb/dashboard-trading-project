'use client';

import { useMemo, useState } from 'react';
import {
    subDays,
    startOfDay,
    format,
    getDay,
    eachDayOfInterval,
    parseISO
} from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * TradingHeatmap — GitHub-style contribution heatmap for daily PnL.
 *
 * Props:
 *  - trades: Array of trade objects with { created_at, pnl }
 */
export default function TradingHeatmap({ trades = [] }) {
    const [tooltip, setTooltip] = useState(null);

    // Group trades by day and compute daily PnL
    const { days, maxAbsPnl, weeks, monthLabels } = useMemo(() => {
        const today = startOfDay(new Date());
        const start = subDays(today, 364); // 365 days including today

        // Build a map of date string -> total PnL
        const pnlByDay = {};
        trades.forEach((t) => {
            if (!t.created_at) return;
            const dateStr = format(
                startOfDay(typeof t.created_at === 'string' ? parseISO(t.created_at) : t.created_at),
                'yyyy-MM-dd'
            );
            pnlByDay[dateStr] = (pnlByDay[dateStr] || 0) + (Number(t.pnl) || 0);
        });

        // Generate all days in the range
        const allDays = eachDayOfInterval({ start, end: today });
        const dayEntries = allDays.map((d) => {
            const dateStr = format(d, 'yyyy-MM-dd');
            const pnl = pnlByDay[dateStr] || null;
            return {
                date: d,
                dateStr,
                pnl,
                dayOfWeek: getDay(d) // 0=Sun, 6=Sat
            };
        });

        // Find max absolute PnL for intensity scaling
        let maxAbs = 0;
        dayEntries.forEach((d) => {
            if (d.pnl !== null) {
                maxAbs = Math.max(maxAbs, Math.abs(d.pnl));
            }
        });
        if (maxAbs === 0) maxAbs = 1; // avoid division by zero

        // Organize into weeks (columns) — each week starts on Sunday
        const weekColumns = [];
        let currentWeek = new Array(7).fill(null);

        dayEntries.forEach((day, idx) => {
            currentWeek[day.dayOfWeek] = day;
            // End of a week (Saturday) or last day
            if (day.dayOfWeek === 6 || idx === dayEntries.length - 1) {
                weekColumns.push(currentWeek);
                currentWeek = new Array(7).fill(null);
            }
        });

        // Month labels positioned above the grid
        const labels = [];
        let lastMonth = -1;
        weekColumns.forEach((week, weekIdx) => {
            // Find the first non-null day in the week
            const firstDay = week.find((d) => d !== null);
            if (firstDay) {
                const month = firstDay.date.getMonth();
                if (month !== lastMonth) {
                    labels.push({
                        month: format(firstDay.date, 'MMM', { locale: fr }),
                        weekIdx
                    });
                    lastMonth = month;
                }
            }
        });

        return { days: dayEntries, maxAbsPnl: maxAbs, weeks: weekColumns, monthLabels: labels };
    }, [trades]);

    // Compute cell color based on PnL
    function getCellColor(pnl) {
        if (pnl === null) return 'bg-slate-800/60';
        if (pnl === 0) return 'bg-slate-800/60';

        const intensity = Math.min(Math.abs(pnl) / maxAbsPnl, 1);

        if (pnl > 0) {
            if (intensity > 0.75) return 'bg-emerald-400 shadow-emerald-400/30 shadow-sm';
            if (intensity > 0.5) return 'bg-emerald-500';
            if (intensity > 0.25) return 'bg-emerald-600';
            return 'bg-emerald-700/80';
        } else {
            if (intensity > 0.75) return 'bg-rose-400 shadow-rose-400/30 shadow-sm';
            if (intensity > 0.5) return 'bg-rose-500';
            if (intensity > 0.25) return 'bg-rose-600';
            return 'bg-rose-700/80';
        }
    }

    const dayLabels = ['', 'Lun', '', 'Mer', '', 'Ven', ''];
    const cellSize = 13;
    const cellGap = 3;
    const totalCellSize = cellSize + cellGap;

    // Stats for the legend
    const tradingDays = days.filter((d) => d.pnl !== null && d.pnl !== 0);
    const winDays = tradingDays.filter((d) => d.pnl > 0).length;
    const lossDays = tradingDays.filter((d) => d.pnl < 0).length;

    return (
        <div className="relative">
            {/* Header row with stats */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">
                        <span className="font-mono font-semibold text-slate-300">{tradingDays.length}</span> jours de trading
                    </span>
                    <span className="text-xs text-slate-500">
                        <span className="font-mono font-semibold text-emerald-400">{winDays}</span> gagnants
                    </span>
                    <span className="text-xs text-slate-500">
                        <span className="font-mono font-semibold text-rose-400">{lossDays}</span> perdants
                    </span>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span>Moins</span>
                    <div className="h-[11px] w-[11px] rounded-[2px] bg-slate-800/60" />
                    <div className="h-[11px] w-[11px] rounded-[2px] bg-emerald-700/80" />
                    <div className="h-[11px] w-[11px] rounded-[2px] bg-emerald-600" />
                    <div className="h-[11px] w-[11px] rounded-[2px] bg-emerald-500" />
                    <div className="h-[11px] w-[11px] rounded-[2px] bg-emerald-400" />
                    <span>Plus</span>
                </div>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto">
                <div className="inline-flex gap-0" style={{ minWidth: 'max-content' }}>
                    {/* Day-of-week labels */}
                    <div className="mr-2 flex flex-col" style={{ gap: `${cellGap}px` }}>
                        {dayLabels.map((label, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-end text-[10px] text-slate-600"
                                style={{ height: `${cellSize}px` }}
                            >
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Weeks columns */}
                    <div className="relative">
                        {/* Month labels */}
                        <div className="absolute flex text-[10px] text-slate-500" style={{ top: '-16px' }}>
                            {monthLabels.map((ml, i) => (
                                <span
                                    key={i}
                                    className="absolute capitalize"
                                    style={{ left: `${ml.weekIdx * totalCellSize}px` }}
                                >
                                    {ml.month}
                                </span>
                            ))}
                        </div>

                        {/* Grid of cells */}
                        <div className="flex" style={{ gap: `${cellGap}px`, paddingTop: '4px' }}>
                            {weeks.map((week, weekIdx) => (
                                <div key={weekIdx} className="flex flex-col" style={{ gap: `${cellGap}px` }}>
                                    {week.map((day, dayIdx) => (
                                        <div
                                            key={dayIdx}
                                            className={`rounded-[2px] transition-all ${
                                                day
                                                    ? `${getCellColor(day.pnl)} cursor-pointer hover:ring-1 hover:ring-slate-400/50 hover:brightness-125`
                                                    : 'bg-transparent'
                                            }`}
                                            style={{
                                                width: `${cellSize}px`,
                                                height: `${cellSize}px`
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!day) return;
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setTooltip({
                                                    x: rect.left + rect.width / 2,
                                                    y: rect.top,
                                                    date: format(day.date, 'd MMM yyyy', { locale: fr }),
                                                    pnl: day.pnl
                                                });
                                            }}
                                            onMouseLeave={() => setTooltip(null)}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 shadow-xl shadow-black/40"
                    style={{
                        left: `${tooltip.x}px`,
                        top: `${tooltip.y - 8}px`
                    }}
                >
                    <div className="text-[11px] font-medium text-slate-300">
                        {tooltip.date}
                    </div>
                    {tooltip.pnl !== null ? (
                        <div
                            className={`mt-0.5 font-mono text-xs font-bold ${
                                tooltip.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                        >
                            Résultat : {tooltip.pnl >= 0 ? '+' : ''}
                            {tooltip.pnl.toFixed(2)}$
                        </div>
                    ) : (
                        <div className="mt-0.5 text-[11px] text-slate-500">Aucun trade</div>
                    )}
                    <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-700" />
                </div>
            )}
        </div>
    );
}
