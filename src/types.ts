export interface CryptoData {
  symbol: string;
  name: string;
  price_eur: number;
  change_24h: number;
  volume_24h: number;
  market_cap: number;
  rsi: number;
  macd_signal: string;
  trend: string;
  sentiment_score: number;
  on_chain_score: number;
  fundamental_score: number;
  technical_score: number;
  final_score: number;
  risk_level: 'Basso' | 'Medio' | 'Alto';
  recommendation: string;
  last_updated: string;
}

export interface MarketStats {
  btc_dominance: number;
  fear_greed_index: number;
  market_risk: 'Basso' | 'Medio' | 'Alto';
  last_updated: string;
}

export interface CryptoEvent {
  id: number;
  title: string;
  date: string;
  type: string;
}
