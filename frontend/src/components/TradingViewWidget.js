'use client';

import { useEffect, useRef, memo } from 'react';
import { useTheme } from '@/lib/theme-context';

function TradingViewWidget({ symbol = 'FX:EURUSD', height = 400 }) {
  const container = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!container.current) return;

    // Clear previous widget
    container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: 'D',
      timezone: 'Europe/Paris',
      theme: theme === 'dark' ? 'dark' : 'light',
      style: '1',
      locale: 'fr',
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      hide_volume: false,
      backgroundColor: theme === 'dark' ? 'rgba(17, 17, 17, 1)' : 'rgba(255, 255, 255, 1)',
      gridColor: theme === 'dark' ? 'rgba(40, 40, 40, 1)' : 'rgba(240, 240, 240, 1)',
    });

    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, theme]);

  return (
    <div 
      className="tradingview-widget-container rounded-sm overflow-hidden border"
      style={{ 
        height: `${height}px`,
        borderColor: 'var(--border)',
        backgroundColor: theme === 'dark' ? 'rgba(17, 17, 17, 1)' : 'rgba(255, 255, 255, 1)'
      }}
      data-testid="tradingview-widget"
    >
      <div 
        ref={container} 
        className="tradingview-widget-container__widget" 
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}

export default memo(TradingViewWidget);
