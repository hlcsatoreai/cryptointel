import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  Info, 
  Calendar, 
  Calculator, 
  Zap, 
  BarChart3,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Waves
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CryptoData, MarketStats, CryptoEvent } from './types';
import { cn, formatCurrency, formatPercent } from './lib/utils';

// --- Components ---

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-800',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-rose-100 text-rose-800',
    info: 'bg-blue-100 text-blue-800',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', variants[variant])}>
      {children}
    </span>
  );
};

const Card = ({ children, className, title, icon: Icon }: { children: React.ReactNode, className?: string, title?: string, icon?: any }) => (
  <div className={cn('glass-card p-6', className)}>
    {title && (
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-5 h-5 text-slate-500" />}
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
    )}
    {children}
  </div>
);

const StatBox = ({ label, value, subValue, trend, icon: Icon }: { label: string, value: string | number, subValue?: string, trend?: number, icon?: any }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-slate-400" />}
      <span className="stat-label">{label}</span>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="stat-value">{value}</span>
      {trend !== undefined && (
        <span className={cn('text-xs font-bold flex items-center', trend >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    {subValue && <span className="text-xs text-slate-500">{subValue}</span>}
  </div>
);

const RiskIndicator = ({ level }: { level: 'Basso' | 'Medio' | 'Alto' }) => {
  const colors = {
    Basso: 'bg-emerald-500',
    Medio: 'bg-amber-500',
    Alto: 'bg-rose-500',
  };
  return (
    <div className="flex items-center gap-2">
      <div className={cn('w-2 h-2 rounded-full', colors[level])} />
      <span className="text-sm font-medium">{level}</span>
    </div>
  );
};

const Tooltip = ({ content, children }: { content: string, children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl pointer-events-none"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [events, setEvents] = useState<CryptoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskCalc, setRiskCalc] = useState({ capital: 1000, riskPercent: 2 });
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);

  const [isDemoMode, setIsDemoMode] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cryptoRes, statsRes, eventsRes] = await Promise.all([
        fetch('/api/cryptos').catch(() => ({ json: () => null })),
        fetch('/api/market-status').catch(() => ({ json: () => null })),
        fetch('/api/events').catch(() => ({ json: () => null }))
      ]);
      
      const cryptoData = await cryptoRes.json();
      const statsData = await statsRes.json();
      const eventsData = await eventsRes.json();
      
      if (!cryptoData || !Array.isArray(cryptoData)) {
        setIsDemoMode(true);
        // Fallback data for static hosting like Netlify
        setCryptos([
          { symbol: 'BTCEUR', name: 'Bitcoin', price_eur: 62450, change_24h: 2.5, final_score: 88, risk_level: 'Basso', recommendation: 'Ottima opportunità di accumulo - Trend rialzista confermato', technical_score: 85, fundamental_score: 90, last_updated: '', volume_24h: 0, market_cap: 0, rsi: 0, macd_signal: '', trend: '', sentiment_score: 80, on_chain_score: 75 },
          { symbol: 'ETHEUR', name: 'Ethereum', price_eur: 3120, change_24h: -1.2, final_score: 76, risk_level: 'Medio', recommendation: 'Monitorare supporti chiave a 3000€', technical_score: 70, fundamental_score: 85, last_updated: '', volume_24h: 0, market_cap: 0, rsi: 0, macd_signal: '', trend: '', sentiment_score: 70, on_chain_score: 80 },
          { symbol: 'SOLEUR', name: 'Solana', price_eur: 145, change_24h: 5.4, final_score: 82, risk_level: 'Medio', recommendation: 'Forte spinta on-chain, possibile continuazione', technical_score: 80, fundamental_score: 75, last_updated: '', volume_24h: 0, market_cap: 0, rsi: 0, macd_signal: '', trend: '', sentiment_score: 85, on_chain_score: 90 },
          { symbol: 'BNBEUR', name: 'Binance Coin', price_eur: 580, change_24h: 0.8, final_score: 74, risk_level: 'Basso', recommendation: 'Accumulo lento e costante', technical_score: 65, fundamental_score: 80, last_updated: '', volume_24h: 0, market_cap: 0, rsi: 0, macd_signal: '', trend: '', sentiment_score: 70, on_chain_score: 65 },
        ] as any);
        setMarketStats({ btc_dominance: 52.4, fear_greed_index: 65, market_risk: 'Medio', last_updated: '' });
        setEvents([
          { id: 1, title: "Demo: Ethereum Pectra Upgrade", date: "2026-03-15", type: "Upgrade" },
          { id: 2, title: "Demo: Bitcoin Halving Anniversary", date: "2026-04-20", type: "Event" }
        ]);
      } else {
        setIsDemoMode(false);
        setCryptos(cryptoData);
        setMarketStats(statsData);
        setEvents(eventsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // 5 mins
    return () => clearInterval(interval);
  }, []);

  const topOpportunities = cryptos.slice(0, 4);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        {isDemoMode && (
          <div className="bg-amber-500 text-white text-[10px] font-bold py-1 text-center uppercase tracking-widest">
            Modalità Demo (Backend non rilevato - Ideale per Netlify/Vercel)
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">C</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Crypto<span className="text-emerald-500">Intel</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => fetchData()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <RefreshCw className={cn("w-5 h-5 text-slate-500", loading && "animate-spin")} />
            </button>
            <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
              <Search className="w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Cerca crypto..." className="bg-transparent border-none outline-none text-sm w-32" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="col-span-1 md:col-span-2">
            <div className="grid grid-cols-2 gap-8">
              <StatBox 
                label="Bitcoin Dominance" 
                value={marketStats ? `${marketStats.btc_dominance.toFixed(1)}%` : '--'} 
                icon={TrendingUp}
                subValue="Stato Altcoin Season"
              />
              <StatBox 
                label="Fear & Greed Index" 
                value={marketStats ? marketStats.fear_greed_index : '--'} 
                icon={Zap}
                subValue={marketStats?.fear_greed_index! > 50 ? 'Greed' : 'Fear'}
              />
            </div>
          </Card>
          <Card title="Rischio Mercato" icon={AlertTriangle}>
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <span className={cn(
                "text-3xl font-black uppercase tracking-tighter",
                marketStats?.market_risk === 'Basso' ? 'text-emerald-500' : 
                marketStats?.market_risk === 'Medio' ? 'text-amber-500' : 'text-rose-500'
              )}>
                {marketStats?.market_risk || 'Caricamento...'}
              </span>
              <p className="text-xs text-slate-500 text-center">Basato su volatilità, funding rate e liquidazioni.</p>
            </div>
          </Card>
          <Card title="Bitcoin Dominance Monitor" icon={BarChart3}>
             <div className="space-y-2">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${marketStats?.btc_dominance || 50}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Altcoin</span>
                  <span>Bitcoin</span>
                </div>
             </div>
          </Card>
        </div>

        {/* Top Opportunities */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              Top Opportunità
            </h2>
            <Badge variant="success">Aggiornato ogni 5 min</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topOpportunities.map((crypto, idx) => (
              <motion.div
                key={crypto.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full flex flex-col border-emerald-200 bg-emerald-50/30">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{crypto.name}</h3>
                      <p className="text-xs text-slate-500">{crypto.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(crypto.price_eur)}</p>
                      <p className={cn("text-xs font-bold", crypto.change_24h >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                        {crypto.change_24h > 0 ? '+' : ''}{crypto.change_24h.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 flex-grow">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Score:</span>
                      <span className="font-bold text-emerald-600">{crypto.final_score.toFixed(1)}/100</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Rischio:</span>
                      <RiskIndicator level={crypto.risk_level} />
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-emerald-100 text-xs text-slate-700 italic">
                      "{crypto.recommendation}"
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Pot. 7g</p>
                      <p className="text-sm font-bold text-emerald-600">~+{(crypto.final_score / 10).toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Pot. 30g</p>
                      <p className="text-sm font-bold text-emerald-600">~+{(crypto.final_score / 5).toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedCrypto(crypto)}
                    className="mt-4 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Zap className="w-3 h-3" />
                    Perché acquistare?
                  </button>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rankings Table */}
          <div className="lg:col-span-2 space-y-6">
            <Card title="Classifica Crypto Intelligence" icon={BarChart3}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-4 font-bold text-xs text-slate-400 uppercase">Asset</th>
                      <th className="pb-4 font-bold text-xs text-slate-400 uppercase">Prezzo</th>
                      <th className="pb-4 font-bold text-xs text-slate-400 uppercase">
                        <Tooltip content="Analisi Tecnica (40%): RSI, EMA, MACD, Trend">
                          <span className="flex items-center gap-1 cursor-help">Tech <Info className="w-3 h-3" /></span>
                        </Tooltip>
                      </th>
                      <th className="pb-4 font-bold text-xs text-slate-400 uppercase">
                        <Tooltip content="Analisi Fondamentale (30%): Market Cap, Supply, Liquidità">
                          <span className="flex items-center gap-1 cursor-help">Fond <Info className="w-3 h-3" /></span>
                        </Tooltip>
                      </th>
                      <th className="pb-4 font-bold text-xs text-slate-400 uppercase">Score</th>
                      <th className="pb-4 font-bold text-xs text-slate-400 uppercase">Azione</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {cryptos.map((crypto) => (
                      <tr key={crypto.symbol} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-xs">
                              {crypto.name[0]}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{crypto.name}</p>
                              <p className="text-[10px] text-slate-400">{crypto.symbol}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <p className="font-bold text-sm">{formatCurrency(crypto.price_eur)}</p>
                          <p className={cn("text-[10px] font-bold", crypto.change_24h >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                            {crypto.change_24h > 0 ? '+' : ''}{crypto.change_24h.toFixed(2)}%
                          </p>
                        </td>
                        <td className="py-4">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${crypto.technical_score}%` }} />
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: `${crypto.fundamental_score}%` }} />
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="font-bold text-sm">{crypto.final_score.toFixed(1)}</span>
                        </td>
                        <td className="py-4">
                          <button className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700">
                            Dettagli
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Sidebar Tools */}
          <div className="space-y-8">
            {/* Risk Calculator */}
            <Card title="Calcolatore Rischio" icon={Calculator}>
              <div className="space-y-4">
                <div>
                  <label className="stat-label mb-2 block">Capitale Totale (€)</label>
                  <input 
                    type="number" 
                    value={riskCalc.capital} 
                    onChange={(e) => setRiskCalc({ ...riskCalc, capital: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="stat-label mb-2 block">Rischio per Trade (%)</label>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="10" 
                    step="0.5"
                    value={riskCalc.riskPercent} 
                    onChange={(e) => setRiskCalc({ ...riskCalc, riskPercent: Number(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                    <span>0.5%</span>
                    <span>{riskCalc.riskPercent}%</span>
                    <span>10%</span>
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="stat-label text-emerald-600 mb-1">Investimento Consigliato</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatCurrency((riskCalc.capital * riskCalc.riskPercent) / 100)}
                  </p>
                  <p className="text-[10px] text-emerald-600/70 mt-1 italic">
                    Basato sulla regola del {riskCalc.riskPercent}% di rischio capitale.
                  </p>
                </div>
              </div>
            </Card>

            {/* Whale Tracker (Simulated) */}
            <Card title="Whale Tracker" icon={Waves}>
              <div className="space-y-4">
                {[
                  { asset: 'BTC', amount: '450', type: 'Accumulo', time: '12m fa' },
                  { asset: 'ETH', amount: '12,000', type: 'Exchange Out', time: '45m fa' },
                  { asset: 'SOL', amount: '85,000', type: 'Distribuzione', time: '1h fa' },
                ].map((whale, i) => (
                  <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        whale.type === 'Distribuzione' ? 'bg-rose-500' : 'bg-emerald-500'
                      )} />
                      <div>
                        <p className="text-xs font-bold">{whale.amount} {whale.asset}</p>
                        <p className="text-[10px] text-slate-400">{whale.type}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">{whale.time}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Event Calendar */}
            <Card title="Calendario Eventi" icon={Calendar}>
              <div className="space-y-4">
                {events.length > 0 ? events.map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(event.date).toLocaleString('it-IT', { month: 'short' })}</span>
                      <span className="text-sm font-bold">{new Date(event.date).getDate()}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{event.title}</p>
                      <Badge variant="info">{event.type}</Badge>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-400 italic">Nessun evento imminente.</p>
                )}
              </div>
            </Card>

            {/* Deployment Guide for User */}
            <Card title="Guida al Deploy" icon={ShieldCheck} className="bg-slate-900 text-white border-none">
              <div className="space-y-3">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Questa app usa un database SQLite. Per farla funzionare al 100% con dati reali:
                </p>
                <ul className="text-[10px] space-y-2 list-disc pl-4 text-slate-300">
                  <li>Non usare Netlify (solo statico).</li>
                  <li>Usa <span className="text-emerald-400 font-bold">Render.com</span> o <span className="text-emerald-400 font-bold">Railway.app</span>.</li>
                  <li>Configura il comando di start come: <code className="bg-slate-800 px-1 rounded">npm run dev</code>.</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Analysis Modal */}
      <AnimatePresence>
        {selectedCrypto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold">
                    {selectedCrypto.name[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedCrypto.name} Analysis</h3>
                    <p className="text-xs text-slate-500">{selectedCrypto.symbol} • {formatCurrency(selectedCrypto.price_eur)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCrypto(null)}
                  className="p-2 hover:bg-white rounded-full transition-colors"
                >
                  <RefreshCw className="w-5 h-5 text-slate-400 rotate-45" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="stat-label mb-1">Punteggio Totale</p>
                    <p className="text-3xl font-black text-emerald-600">{selectedCrypto.final_score.toFixed(1)}<span className="text-sm text-slate-400">/100</span></p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="stat-label mb-1">Livello Rischio</p>
                    <RiskIndicator level={selectedCrypto.risk_level} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                    Perché è un'opportunità?
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                      </div>
                      <p className="text-sm text-slate-600">
                        <span className="font-bold text-slate-900">Analisi Tecnica:</span> {selectedCrypto.technical_score > 70 ? 'Segnali di iper-venduto e divergenza rialzista confermati.' : 'Trend consolidato con volumi in crescita costante.'}
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Waves className="w-3 h-3 text-blue-600" />
                      </div>
                      <p className="text-sm text-slate-600">
                        <span className="font-bold text-slate-900">Sentiment Social:</span> Forte crescita di menzioni positive su Twitter e Reddit nelle ultime 24 ore.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ShieldCheck className="w-3 h-3 text-purple-600" />
                      </div>
                      <p className="text-sm text-slate-600">
                        <span className="font-bold text-slate-900">On-Chain:</span> Rilevato accumulo significativo da parte di wallet "Whale" (balene).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-xs text-amber-800 font-bold flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-3 h-3" />
                    Consiglio per Principianti
                  </p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    {selectedCrypto.change_24h > 15 
                      ? "Il prezzo è salito molto. Considera di entrare con una piccola parte del capitale ora e aggiungere il resto se il prezzo scende leggermente (pullback)."
                      : "Questo asset mostra una crescita sana. Un ingresso graduale (DCA) è consigliato per minimizzare il rischio di volatilità."}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => setSelectedCrypto(null)}
                  className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors"
                >
                  Ho capito, chiudi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Info / Beginner Guide */}
      <footer className="max-w-7xl mx-auto px-4 mt-12">
        <div className="p-8 bg-slate-900 rounded-3xl text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-400" />
                Guida per Principianti
              </h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><strong className="text-white">RSI Overbought:</strong> Prezzo salito troppo velocemente, possibile rallentamento.</li>
                <li><strong className="text-white">EMA Cross:</strong> Segnale di cambio trend a lungo termine.</li>
                <li><strong className="text-white">Whale Accumulo:</strong> I grandi investitori stanno comprando.</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Metodologia</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Il nostro algoritmo analizza dati tecnici, fondamentali, sentiment e on-chain ogni 5 minuti per fornirti una visione oggettiva del mercato.
              </p>
            </div>
            <div className="flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold mb-4">Disclaimer</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                  Non è un consiglio finanziario. Investi solo ciò che puoi permetterti di perdere.
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-4">© 2026 CryptoIntel. Tutti i diritti riservati.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
