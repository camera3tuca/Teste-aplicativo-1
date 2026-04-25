import { Oportunidade } from '../types';
import { motion } from 'motion/react';
import { TrendingDown, TrendingUp, Minus, Search } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ScannerProps {
  data: Oportunidade[];
  loading: boolean;
  onSelect: (ticker: string) => void;
  selectedTicker: string | null;
}

export default function Scanner({ data, loading, onSelect, selectedTicker }: ScannerProps) {
  const isDataValid = Array.isArray(data);

  if (loading && (!isDataValid || data.length === 0)) {
    return (
      <div className="p-20 flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="font-medium">Escaneando mercado financeiro...</p>
      </div>
    );
  }

  if (!isDataValid || data.length === 0) {
    return (
      <div className="p-20 flex flex-col items-center justify-center text-slate-400">
        <div className="p-4 bg-slate-50 rounded-full mb-4">
          <Search className="w-8 h-8" />
        </div>
        <p className="font-medium">Nenhuma oportunidade detectada no momento.</p>
        <p className="text-sm">Aguarde o mercado se movimentar.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <th className="px-6 py-4">Ticker</th>
            <th className="px-6 py-4">Empresa</th>
            <th className="px-6 py-4">Preço</th>
            <th className="px-6 py-4">Queda Dia</th>
            <th className="px-6 py-4">I.S. (Sobrevenda)</th>
            <th className="px-6 py-4">Potencial</th>
            <th className="px-6 py-4">Score</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row) => (
            <motion.tr
              key={row.Ticker}
              onClick={() => onSelect(row.Ticker)}
              whileHover={{ backgroundColor: selectedTicker === row.Ticker ? 'rgb(248 250 252)' : 'rgb(249 250 251)' }}
              className={cn(
                "cursor-pointer transition-colors",
                selectedTicker === row.Ticker && "bg-slate-50 border-l-4 border-l-indigo-600"
              )}
            >
              <td className="px-6 py-4">
                <span className="font-mono font-bold text-slate-900">{row.Ticker}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-700 whitespace-nowrap">{row.Empresa}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-tighter">BDR Patrocinado</span>
                </div>
              </td>
              <td className="px-6 py-4 font-medium text-slate-900">
                R$ {row.Preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1 font-bold text-rose-600">
                  <TrendingDown className="w-4 h-4" />
                  {row.Queda_Dia.toFixed(2)}%
                </div>
              </td>
              <td className="px-6 py-4">
                <div className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold",
                  row.IS > 75 ? "bg-rose-100 text-rose-700" : row.IS > 60 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
                )}>
                  {row.IS.toFixed(0)}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold",
                  row.Potencial === 'Muito Alta' ? "bg-emerald-500 text-white" :
                  row.Potencial === 'Alta' ? "bg-emerald-100 text-emerald-700" :
                  "bg-slate-100 text-slate-600"
                )}>
                  {row.Potencial}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(row.Score / 10) * 100}%` }}
                    className={cn(
                      "h-full",
                      row.Score >= 5 ? "bg-emerald-500" : "bg-amber-500"
                    )}
                  />
                </div>
              </td>
              <td className="px-6 py-4 text-slate-400">
                <div className={cn(
                  "p-1.5 rounded-full transition-transform",
                  selectedTicker === row.Ticker && "rotate-90 text-indigo-600"
                )}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      width="16" height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
