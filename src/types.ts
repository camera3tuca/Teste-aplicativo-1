export interface Oportunidade {
  Ticker: string;
  Empresa: string;
  Preco: number;
  Volume: number;
  Queda_Dia: number;
  Gap: number;
  IS: number;
  RSI14: number;
  Stoch: number;
  Potencial: string;
  Score: number;
  Sinais: string;
  Explicacoes: string[];
  Liquidez: number;
}

export interface TripleScreenResult {
  tela1: { status: string; emoji: string; valor: number; desc: string };
  tela2: { status: string; emoji: string; valor: number; desc: string };
  tela3: { status: string; emoji: string; desc: string };
  veredicto: string;
  forca: number;
  preco_atual: number;
  historico: { date: string; close: number; ema13: number; efi2: number; high: number; low: number }[];
  limiar_pos: number;
  limiar_neg: number;
  maxima_rec: number;
  minima_rec: number;
}

export interface NewsItem {
  titulo: string;
  link: string;
  data: string;
  descricao: string;
  fonte: string;
}

export interface FundamentalData {
  fonte: string;
  ticker_fonte: string;
  score: number;
  pe_ratio: number | null;
  dividend_yield: number | null;
  market_cap: number | null;
  revenue_growth: number | null;
  recomendacao: string | null;
  setor: string;
  detalhes: Record<string, any>;
}

export interface PredictionResult {
  previsoes: number[];
  direcao: 'ALTA' | 'BAIXA' | 'LATERAL';
  variacao_pct: number;
  confianca: number;
  ultimo_preco: number;
  erro?: string;
}
