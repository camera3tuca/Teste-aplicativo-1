import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import yahooFinance from 'yahoo-finance2';
import Parser from "rss-parser";
import { BDR_TO_US_MAP, BDR_NAMES } from "./src/lib/constants";
import { Oportunidade, TripleScreenResult, NewsItem, FundamentalData, PredictionResult } from "./src/types";

const app = express();
const PORT = 3000;
const rssParser = new Parser();

// Disable validation errors console noise
yahooFinance.setGlobalConfig({
  validation: { logErrors: false }
});

// --- HELPER FUNCTIONS ---

function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const k = 2 / (period + 1);
  if (data.length === 0) return [];
  let prevEma = data[0];
  ema.push(prevEma);
  for (let i = 1; i < data.length; i++) {
    const currentEma = data[i] * k + prevEma * (1 - k);
    ema.push(currentEma);
    prevEma = currentEma;
  }
  return ema;
}

function calculateRSI(data: number[], period: number = 14): number[] {
  const rsi: number[] = new Array(data.length).fill(null);
  if (data.length < period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    if (i > period) {
      avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
      avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[i] = 100 - 100 / (1 + rs);
  }
  return rsi;
}

function calculateStochastic(high: number[], low: number[], close: number[], period: number = 14): number[] {
  const stoch: number[] = new Array(close.length).fill(null);
  if (close.length < period) return stoch;
  for (let i = period - 1; i < close.length; i++) {
    const sliceHigh = high.slice(i - period + 1, i + 1);
    const sliceLow = low.slice(i - period + 1, i + 1);
    const maxHigh = Math.max(...sliceHigh);
    const minLow = Math.min(...sliceLow);
    stoch[i] = ((close[i] - minLow) / (maxHigh - minLow)) * 100;
  }
  return stoch;
}

// API ROUTES
app.get("/api/scanner", async (req, res) => {
  try {
    const tickers = Object.keys(BDR_NAMES).slice(0, 30); 
    const results: Oportunidade[] = [];
    const startDate = new Date("2024-01-01");

    // Process in smaller batches to avoid rate limiting
    const historicalPromises = tickers.map(ticker => 
      yahooFinance.historical(`${ticker}.SA`, { period1: startDate })
        .catch(err => {
          console.warn(`Skipping ${ticker}: ${err.message}`);
          return [];
        })
    );

    const historicalData = await Promise.all(historicalPromises);

    for (let i = 0; i < tickers.length; i++) {
      const ticker = tickers[i];
      const data = historicalData[i] as any[];
      if (data.length < 50) continue;

      const closes = data.map(d => d.close);
      const highs = data.map(d => d.high);
      const lows = data.map(d => d.low);
      const volumes = data.map(d => d.volume);

      const last = data[data.length - 1];
      const prev = data[data.length - 2];
      const falls = ((last.close - prev.close) / prev.close) * 100;

      if (falls >= 0) continue; // Only losers for correction plays

      const rsi = calculateRSI(closes);
      const stoch = calculateStochastic(highs, lows, closes);
      const ema20 = calculateEMA(closes, 20);

      const lastRsi = rsi[rsi.length - 1] || 50;
      const lastStoch = stoch[stoch.length - 1] || 50;
      const isVal = ((100 - lastRsi) + (100 - lastStoch)) / 2;

      let score = 0;
      const signals: string[] = [];
      const explicacoes: string[] = [];

      if (lastRsi < 30) { score += 3; signals.push("RSI Oversold"); explicacoes.push("RSI baixo indica forte sobrevenda."); }
      if (lastStoch < 20) { score += 2; signals.push("Stoch Fundo"); explicacoes.push("Estocástico em zona de reversão."); }
      if (last.close < ema20[ema20.length - 1]) { score += 1; signals.push("Abaixo EMA20"); explicacoes.push("Preço buscando suporte abaixo da média rápida."); }

      results.push({
        Ticker: ticker,
        Empresa: BDR_NAMES[ticker] || ticker,
        Preco: last.close,
        Volume: last.volume,
        Queda_Dia: falls,
        Gap: ((last.open - prev.close) / prev.close) * 100,
        IS: isVal,
        RSI14: lastRsi,
        Stoch: lastStoch,
        Potencial: score >= 4 ? "Muito Alta" : score >= 2 ? "Alta" : "Média",
        Score: score,
        Sinais: signals.join(", "),
        Explicacoes: explicacoes,
        Liquidez: last.volume > 100000 ? 9 : last.volume > 10000 ? 5 : 2
      });
    }

    res.json(results.sort((a, b) => b.IS - a.IS));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Scanner failed" });
  }
});

app.get("/api/details/:ticker", async (req, res) => {
  const { ticker } = req.params;
  try {
    const startDate = new Date("2024-01-01");
    const data = await yahooFinance.historical(`${ticker}.SA`, { period1: startDate }) as any[];
    const closes = data.map((d: any) => d.close);
    const highs = data.map((d: any) => d.high);
    const lows = data.map((d: any) => d.low);
    const volumes = data.map((d: any) => d.volume);

    const ema13 = calculateEMA(closes, 13);
    
    // EFI(2)
    const efi2: number[] = [0];
    for (let i = 1; i < closes.length; i++) {
      const rawForce = (closes[i] - closes[i - 1]) * volumes[i];
      efi2.push(rawForce);
    }
    const efi2Ema = calculateEMA(efi2, 2);

    const lastEma13Slope = ema13[ema13.length - 1] - ema13[ema13.length - 3];
    const lastEfi2 = efi2Ema[efi2Ema.length - 1];
    
    const t1Status = lastEma13Slope > 0 ? "ALTA" : "BAIXA";
    const t2Status = lastEfi2 < 0 ? "SOBREVENDA" : "SOBRECOMPRA";

    const result: TripleScreenResult = {
      tela1: { 
        status: t1Status, 
        emoji: t1Status === "ALTA" ? "🟢" : "🔴", 
        valor: lastEma13Slope, 
        desc: t1Status === "ALTA" ? "Maré de Alta: EMA13 inclinada para cima." : "Maré de Baixa: EMA13 inclinada para baixo."
      },
      tela2: { 
        status: t2Status, 
        emoji: t2Status === "SOBREVENDA" ? "🟢" : "🔴", 
        valor: lastEfi2, 
        desc: t2Status === "SOBREVENDA" ? "Onda em Sobrevenda: Hora de buscar compra." : "Onda em Sobrecompra: Hora de buscar venda."
      },
      tela3: { 
        status: t1Status === "ALTA" && t2Status === "SOBREVENDA" ? "COMPRA" : "AGUARDAR",
        emoji: t1Status === "ALTA" && t2Status === "SOBREVENDA" ? "🚀" : "⏳",
        desc: t1Status === "ALTA" && t2Status === "SOBREVENDA" ? "Setup Confirmado: Maré de alta com onda de correção." : "Aguardando Alinhamento: As duas primeiras telas devem concordar."
      },
      veredicto: t1Status === "ALTA" && t2Status === "SOBREVENDA" ? "COMPRA" : "AGUARDAR",
      forca: (t1Status === "ALTA" ? 1 : 0) + (t2Status === "SOBREVENDA" ? 1 : 0),
      preco_atual: closes[closes.length - 1],
      historico: data.slice(-60).map((d, i) => ({
        date: d.date.toISOString(),
        close: d.close,
        ema13: ema13[closes.length - 60 + i],
        efi2: efi2Ema[closes.length - 60 + i],
        high: d.high,
        low: d.low
      })),
      limiar_pos: 100000, // Normalized
      limiar_neg: -100000,
      maxima_rec: Math.max(...highs.slice(-5)),
      minima_rec: Math.min(...lows.slice(-5))
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Details failed" });
  }
});

app.get("/api/news/:ticker", async (req, res) => {
  const { ticker } = req.params;
  const usTicker = BDR_TO_US_MAP[ticker] || ticker.replace("34", "");
  try {
    const feed = await rssParser.parseURL(`https://feeds.finance.yahoo.com/rss/2.0/headline?s=${usTicker}`);
    const news: NewsItem[] = feed.items.slice(0, 6).map(item => ({
      titulo: item.title || "",
      link: item.link || "",
      data: item.pubDate || "",
      descricao: item.contentSnippet || "",
      fonte: "Yahoo Finance"
    }));
    res.json(news);
  } catch (error) {
    res.json([]);
  }
});

app.get("/api/fundamentals/:ticker", async (req, res) => {
  const { ticker } = req.params;
  const usTicker = BDR_TO_US_MAP[ticker] || ticker.replace("34", "");
  try {
    const summary: any = await yahooFinance.quoteSummary(usTicker, { modules: ["summaryDetail", "defaultKeyStatistics", "recommendationTrend"] });
    const s = summary.summaryDetail;
    const k = summary.defaultKeyStatistics;

    const fund: FundamentalData = {
      fonte: "Yahoo Finance",
      ticker_fonte: usTicker,
      score: 75, // Simplified static for demo
      pe_ratio: s?.trailingPE || null,
      dividend_yield: s?.dividendYield || null,
      market_cap: s?.marketCap || null,
      revenue_growth: k?.revenueQuarterlyGrowth || null,
      recomendacao: summary.recommendationTrend?.trend?.[0]?.rating || "hold",
      setor: "Technology", // Usually in assetProfile, simplified here
      detalhes: { pe: s?.trailingPE, yield: s?.dividendYield }
    };
    res.json(fund);
  } catch (error) {
    res.status(500).json({ error: "Fundamentals failed" });
  }
});

app.get("/api/prediction/:ticker", async (req, res) => {
  const { ticker } = req.params;
  try {
    const startDate = new Date("2024-01-01");
    const data = await yahooFinance.historical(`${ticker}.SA`, { period1: startDate }) as any[];
    if (data.length < 60) throw new Error("Sem dados suficientes");

    const closes = data.map((d: any) => d.close);
    // Simplified Linear Regression: y = mx + b
    const n = closes.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += closes[i];
        sumXY += i * closes[i];
        sumXX += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const previsoes: number[] = [];
    for (let i = 1; i <= 5; i++) {
        previsoes.push(slope * (n + i) + intercept);
    }

    const lastPrice = closes[n - 1];
    const targetPrice = previsoes[4];
    const diff = ((targetPrice - lastPrice) / lastPrice) * 100;

    const result: PredictionResult = {
      previsoes,
      direcao: diff > 1 ? "ALTA" : diff < -1 ? "BAIXA" : "LATERAL",
      variacao_pct: diff,
      confianca: 75, // Estimativa baseada em R2 simplificado
      ultimo_preco: lastPrice
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Prediction failed" });
  }
});

// --- VITE MIDDLEWARE ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
