import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  Target, 
  Cpu, 
  Newspaper, 
  ShieldCheck, 
  Zap,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import { TripleScreenResult, NewsItem, FundamentalData, PredictionResult } from '../types';
import TechnicalChart from './TechnicalChart';

interface DetailPanelProps {
  ticker: string;
  name: string;
}

export default function DetailPanel({ ticker, name }: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'tech' | 'fund' | 'news' | 'ai'>('tech');
  const [data, setData] = useState<TripleScreenResult | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [fundamentals, setFundamentals] = useState<FundamentalData | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resDetails, resNews, resFund, resPred] = await Promise.all([
          fetch(`/api/details/${ticker}`),
          fetch(`/api/news/${ticker}`),
          fetch(`/api/fundamentals/${ticker}`),
          fetch(`/api/prediction/${ticker}`)
        ]);
        setData(await resDetails.json());
        setNews(await resNews.json());
        setFundamentals(await resFund.json());
        setPrediction(await resPred.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ticker]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 mt-4 p-20 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 animate-pulse font-medium">Buscando análise profunda para {ticker}...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 mt-4 shadow-sm overflow-hidden min-h-[600px]">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-100 p-2 gap-2 bg-slate-50/50">
        <TabButton 
          active={activeTab === 'tech'} 
          onClick={() => setActiveTab('tech')}
          icon={<BarChart3 className="w-4 h-4" />}
          label="Análise Técnica"
        />
        <TabButton 
          active={activeTab === 'ai'} 
          onClick={() => setActiveTab('ai')}
          icon={<Cpu className="w-4 h-4" />}
          label="Previsão IA"
        />
        <TabButton 
          active={activeTab === 'fund'} 
          onClick={() => setActiveTab('fund')}
          icon={<Target className="w-4 h-4" />}
          label="Fundamentos"
        />
        <TabButton 
          active={activeTab === 'news'} 
          onClick={() => setActiveTab('news')}
          icon={<Newspaper className="w-4 h-4" />}
          label="Notícias"
        />
      </div>

      <div className="p-6">
        {activeTab === 'tech' && data && (
          <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">{ticker} — {name}</h3>
                <p className="text-slate-500 text-sm">Preço Atual: R$ {data.preco_atual.toFixed(2)}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Veredicto Elder</span>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${
                    data.veredicto === 'COMPRA' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-amber-400 bg-amber-50 text-amber-700'
                  }`}>
                    <span className="text-xl">{data.tela3.emoji}</span>
                    <span className="font-extrabold uppercase tracking-widest">{data.veredicto || 'AGUARDAR'}</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Technical Charts */}
            <div className="h-[400px] w-full">
               <TechnicalChart data={data.historico} />
            </div>

            {/* Triple Screen Logic */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TripleScreenCard 
                num="1ª" 
                title="Maré (EMA13)" 
                status={data.tela1.status} 
                emoji={data.tela1.emoji} 
                desc={data.tela1.desc}
              />
              <TripleScreenCard 
                num="2ª" 
                title="Onda (EFI 2)" 
                status={data.tela2.status} 
                emoji={data.tela2.emoji} 
                desc={data.tela2.desc}
              />
              <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col justify-between">
                <div>
                   <h4 className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">3ª Tela — Execução</h4>
                   <p className="text-sm font-medium leading-relaxed opacity-90">{data.tela3.desc}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono opacity-60">
                   <span>Buy Stop: R$ {data.maxima_rec.toFixed(2)}</span>
                   <span>Stop Loss: R$ {data.minima_rec.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && prediction && (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
             <Cpu className="w-12 h-12 mb-4 animate-bounce text-indigo-500" />
             <h4 className="text-xl font-bold text-slate-700">Previsão por Machine Learning</h4>
             <p className="max-w-md text-center mt-2 leading-relaxed text-sm">
               Modelo de Regressão Linear treinado com os últimos 250 pregões de {ticker}.
             </p>
             
             <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                   <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2">Direção Prevista</p>
                   <p className={cn("font-black text-2xl flex items-center justify-center gap-2", 
                      prediction.direcao === 'ALTA' ? "text-emerald-500" : prediction.direcao === 'BAIXA' ? "text-rose-500" : "text-amber-500"
                   )}>
                      {prediction.direcao === 'ALTA' ? <TrendingUp /> : <TrendingDown />} {prediction.direcao}
                   </p>
                </div>
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                   <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2">Variação Esperada</p>
                   <p className="text-slate-800 font-black text-2xl">{prediction.variacao_pct > 0 ? '+' : ''}{prediction.variacao_pct.toFixed(2)}%</p>
                </div>
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                   <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2">Preço Estimado (D+5)</p>
                   <p className="text-slate-800 font-black text-2xl">R$ {prediction.previsoes[4].toFixed(2)}</p>
                </div>
             </div>

             <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3 max-w-2xl">
                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Aviso:</strong> Previsões de ML são estimativas estatísticas baseadas em performance passada e não garantem retornos futuros. Use como ferramenta auxiliar na sua tomada de decisão.
                </p>
             </div>
          </div>
        )}

        {activeTab === 'fund' && fundamentals && (
          <div className="space-y-8">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Metric label="P/E Ratio" value={fundamentals.pe_ratio?.toFixed(2) || '---'} />
                <Metric label="Div. Yield" value={fundamentals.dividend_yield ? `${(fundamentals.dividend_yield * 100).toFixed(2)}%` : '---'} />
                <Metric label="Market Cap" value={fundamentals.market_cap ? `$ ${(fundamentals.market_cap / 1e9).toFixed(1)}B` : '---'} />
                <Metric label="Growth" value={fundamentals.revenue_growth ? `${(fundamentals.revenue_growth * 100).toFixed(2)}%` : '---'} />
             </div>
             <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                   <ShieldCheck className="w-5 h-5 text-indigo-600" />
                   Análise Fundamentalista (Health Score: {fundamentals.score}%)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                   <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${fundamentals.score}%` }} />
                   </div>
                   <p className="text-sm text-slate-500 italic">
                     Score baseado no consenso de analistas e métricas de valuation histórica comparada com peers do setor.
                   </p>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.isArray(news) && news.map((item, idx) => (
              <a 
                key={idx} 
                href={item.link} 
                target="_blank" 
                rel="noreferrer"
                className="p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-xl transition-all group"
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest">{item.fonte}</span>
                  <span className="text-[10px] text-slate-400">{new Date(item.data).toLocaleDateString('pt-BR')}</span>
                </div>
                <h5 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors line-clamp-2">{item.titulo}</h5>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">{item.descricao}</p>
              </a>
            ))}
            {(!Array.isArray(news) || news.length === 0) && (
              <div className="col-span-full p-12 text-center text-slate-400">
                Nenhuma notícia encontrada para este ativo.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
        active 
          ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' 
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function TripleScreenCard({ num, title, status, emoji, desc }: { num: string, title: string, status: string, emoji: string, desc: string }) {
  return (
    <div className={`p-6 rounded-2xl border ${
      status === 'ALTA' || status === 'SOBREVENDA' 
        ? 'border-emerald-100 bg-emerald-50/30' 
        : 'border-rose-100 bg-rose-50/30'
    }`}>
       <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{num} Tela — {title}</h4>
            <span className={`text-xs font-black uppercase tracking-tighter ${
              status === 'ALTA' || status === 'SOBREVENDA' ? 'text-emerald-600' : 'text-rose-600'
            }`}>{status}</span>
          </div>
          <span className="text-2xl">{emoji}</span>
       </div>
       <p className="text-xs text-slate-600 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
       <p className="text-lg font-black text-slate-800">{value}</p>
    </div>
  );
}

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

