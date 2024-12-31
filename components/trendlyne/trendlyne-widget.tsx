'use client';

import React, { useEffect, useRef } from 'react';

type TrendlyneWidgetProps = {
  stockSymbol: string;
  widgetType: 'swot' | 'technical' | 'qvt' | 'checklist';
  theme?: string;
};

// Utility function to clean stock symbol
function cleanStockSymbol(symbol: string): string {
  return symbol.replace(/^(BSE:|NSE:)/, ''); // Remove BSE: or NSE: prefix if present
}

export function TrendlyneWidget({ stockSymbol, widgetType, theme = 'light' }: TrendlyneWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean the stock symbol
    const cleanedSymbol = cleanStockSymbol(stockSymbol);

    // Widget URLs based on the widget type
    const widgetUrls = {
      swot: `https://trendlyne.com/web-widget/swot-widget/Inter/${cleanedSymbol}/?posCol=00A25B&primaryCol=006AFF&negCol=EB3B00&neuCol=F7941E`,
      technical: `https://trendlyne.com/web-widget/technical-widget/Inter/${cleanedSymbol}/?posCol=00A25B&primaryCol=006AFF&negCol=EB3B00&neuCol=F7941E`,
      qvt: `https://trendlyne.com/web-widget/qvt-widget/Inter/${cleanedSymbol}/?posCol=00A25B&primaryCol=006AFF&negCol=EB3B00&neuCol=F7941E`,
      checklist: `https://trendlyne.com/web-widget/checklist-widget/Inter/${cleanedSymbol}/?posCol=00A25B&primaryCol=006AFF&negCol=EB3B00&neuCol=F7941E`,
    };

    const script = document.createElement('script');
    script.src = 'https://cdn-static.trendlyne.com/static/js/webwidgets/tl-widgets.js';
    script.async = true;
    script.charset = 'utf-8';

    // Add the widget to the container
    containerRef.current.innerHTML = `<blockquote class="trendlyne-widgets" data-get-url="${widgetUrls[widgetType]}" data-theme="${theme}"></blockquote>`;
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [stockSymbol, widgetType, theme]);

  return <div ref={containerRef}></div>;
}


// // Without the BSE NSE trim:
// 'use client';

// import React, { useEffect, useRef } from 'react';

// type TrendlyneWidgetProps = {
//   stockSymbol: string;
//   widgetType: 'swot' | 'technical' | 'qvt' | 'checklist';
//   theme?: string;
// };

// export function TrendlyneWidget({ stockSymbol, widgetType, theme = 'light' }: TrendlyneWidgetProps) {
//   const containerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (!containerRef.current) return;

//     const widgetUrls = {
//       swot: `https://trendlyne.com/web-widget/swot-widget/Inter/${stockSymbol}/?posCol=00A25B&primaryCol=006AFF&negCol=EB3B00&neuCol=F7941E`,
//       technical: `https://trendlyne.com/web-widget/technical-widget/Inter/${stockSymbol}/?posCol=00A25B&primaryCol=006AFF&negCol=EB3B00&neuCol=F7941E`,
//       qvt: `https://trendlyne.com/web-widget/qvt-widget/Inter/${stockSymbol}/?posCol=00A25B&primaryCol=006AFF&negCol=EB3B00&neuCol=F7941E`,
//       checklist: `https://trendlyne.com/web-widget/checklist-widget/Inter/${stockSymbol}/?posCol=00A25B&primaryCol=006AFF&negCol=EB3B00&neuCol=F7941E`,
//     };

//     const script = document.createElement('script');
//     script.src = 'https://cdn-static.trendlyne.com/static/js/webwidgets/tl-widgets.js';
//     script.async = true;
//     script.charset = 'utf-8';

//     containerRef.current.innerHTML = `<blockquote class="trendlyne-widgets" data-get-url="${widgetUrls[widgetType]}" data-theme="${theme}"></blockquote>`;
//     containerRef.current.appendChild(script);

//     return () => {
//       if (containerRef.current) {
//         containerRef.current.innerHTML = '';
//       }
//     };
//   }, [stockSymbol, widgetType, theme]);

//   return <div ref={containerRef}></div>;
// }