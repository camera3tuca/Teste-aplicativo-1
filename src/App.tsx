import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingDown, 
  Search, 
  RefreshCw, 
  Info, 
  BarChart3, 
  Newspaper, 
  Cpu, 
  ChevronRight,
  TrendingUp,
  Activity,
  Award
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Oportunidade } from './types';
import Scanner from './components/Scanner';
import DetailPanel from './components/DetailPanel';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [opportunities, setOpportunities] = useState<Oportunidade[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchScan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scanner');
      const data = await res.json();
      if (Array.isArray(data)) {
        setOpportunities(data);
      } else {
        console.error("Scanner failed to return array:", data);
        setOpportunities([]);
      }
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
    } catch (err) {
      console.error(err);
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScan();
  }, []);

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="card-gradient text-white px-6 py-10 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,1),transparent)]" />
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight"
          >
            📊 Monitor BDR - Swing Trade Pro
          </motion.h1>
          <p className="mt-4 text-white/90 text-lg font-medium">
            Análise Técnica Avançada | Rastreamento de Oportunidades em Tempo Real
          </p>
          <div className="mt-2 flex items-center gap-2 text-white/70 text-sm">
            <Activity className="w-4 h-4" />
            <span>Última atualização: {lastUpdate || '---'}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-8 space-y-8">
        {/* Metric Cards Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            title="Estratégia" 
            value="Reversão em Sobrevenda" 
            subtitle="Filtro RSI < 30 + Stoch < 20"
            icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
          />
          <MetricCard 
            title="Foco do Monitor" 
            value="BDRs em Queda" 
            subtitle="Identificando correções profundas"
            icon={<TrendingDown className="w-5 h-5 text-rose-500" />}
          />
          <MetricCard 
            title="Sinais Ativos" 
            value={`${opportunities.length} Oportunidades`} 
            subtitle="Aguardando confirmação de preço"
            icon={<Award className="w-5 h-5 text-amber-500" />}
          />
        </div>

        {/* Info Expander */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold text-slate-700">Guia dos Indicadores - Entenda os Sinais</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-open:rotate-90 transition-transform" />
            </summary>
            <div className="p-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-600">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                   🎯 Índice de Sobrevenda (I.S.)
                </h4>
                <p>Combina RSI e Estocástico para medir o nível de sobrevenda. Valores acima de 75 indicam zona de reversão iminente.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                   🌊 Triple Screen (Alexander Elder)
                </h4>
                <p>Usa EMA13 como "Maré" (tendência) e Force Index como "Onda" (correção). Só compramos na maré de alta com onda de baixa.</p>
              </div>
            </div>
          </details>
        </section>

        {/* Scan Actions */}
        <div className="flex justify-center">
          <button 
            onClick={fetchScan}
            disabled={loading}
            className="group flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-1 active:translate-y-0"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            {loading ? 'Sincronizando Dados...' : '🔄 Atualizar Análise do Mercado'}
          </button>
        </div>

        {/* Scanner Table */}
        <section className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              Oportunidades Detectadas
            </h2>
          </div>
          <Scanner 
            data={opportunities} 
            loading={loading} 
            onSelect={(ticker) => setSelectedTicker(ticker === selectedTicker ? null : ticker)}
            selectedTicker={selectedTicker}
          />
        </section>

        {/* Detail View */}
        <AnimatePresence mode="wait">
          {selectedTicker && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <DetailPanel ticker={selectedTicker} name={opportunities.find(o => o.Ticker === selectedTicker)?.Empresa || ''} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 text-center text-slate-400 text-sm">
         Monitor BDR - Swing Trade Pro | Baseado em Alexander Elder | {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon }: { title: string, value: string, subtitle: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-xl font-bold text-slate-800 mt-1">{value}</h3>
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>
        <div className="p-2 bg-slate-50 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}

