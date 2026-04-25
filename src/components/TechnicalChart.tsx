import { 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Bar,
  ReferenceLine
} from 'recharts';

interface ChartDataItem {
  date: string;
  close: number;
  ema13: number;
  efi2: number;
  high: number;
  low: number;
}

export default function TechnicalChart({ data }: { data: ChartDataItem[] }) {
  const formattedData = data.map(d => ({
    ...d,
    formattedDate: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }));

  const minPrice = Math.min(...data.map(d => d.low)) * 0.98;
  const maxPrice = Math.max(...data.map(d => d.high)) * 1.02;

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Price Chart */}
      <div className="h-3/4 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="formattedDate" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8' }} 
              minTickGap={30}
            />
            <YAxis 
              domain={[minPrice, maxPrice]} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              orientation="right"
              tickFormatter={(val) => `R$ ${val}`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              labelStyle={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}
              formatter={(value: number) => [`R$ ${value.toFixed(2)}`]}
            />
            <Area 
              type="monotone" 
              dataKey="close" 
              stroke="#4338ca" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorClose)" 
              name="Preço"
            />
            <Line 
              type="monotone" 
              dataKey="ema13" 
              stroke="#fbbf24" 
              strokeWidth={2} 
              dot={false} 
              name="EMA 13 (Maré)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Force Index Chart (EFI 2) */}
      <div className="h-1/4 w-full border-t border-slate-100 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="formattedDate" hide />
            <YAxis axisLine={false} tickLine={false} hide />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Bar 
              dataKey="efi2" 
              name="Force Index"
              fill={(entry: any) => entry.efi2 > 0 ? '#10b981' : '#f43f5e'}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
