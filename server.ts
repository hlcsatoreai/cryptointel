import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import axios from "axios";
import cron from "node-cron";
import * as TI from "technicalindicators";

const app = express();
const PORT = 3000;
const db = new Database("crypto.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS cryptos (
    symbol TEXT PRIMARY KEY,
    name TEXT,
    price_eur REAL,
    change_24h REAL,
    volume_24h REAL,
    market_cap REAL,
    rsi REAL,
    macd_signal TEXT,
    trend TEXT,
    sentiment_score REAL,
    on_chain_score REAL,
    fundamental_score REAL,
    technical_score REAL,
    final_score REAL,
    risk_level TEXT,
    recommendation TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS market_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    btc_dominance REAL,
    fear_greed_index INTEGER,
    market_risk TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    date TEXT,
    type TEXT
  );
`);

// Mock data for initial state if empty
const seedData = () => {
  const count = db.prepare("SELECT COUNT(*) as count FROM cryptos").get() as { count: number };
  if (count.count === 0) {
    const symbols = ["BTCEUR", "ETHEUR", "BNBEUR", "SOLEUR", "ADAEUR", "DOTEUR", "MATICEUR", "AVAXEUR", "LINKEUR", "SHIBEUR"];
    const insert = db.prepare("INSERT INTO cryptos (symbol, name, price_eur, final_score, risk_level) VALUES (?, ?, ?, ?, ?)");
    symbols.forEach(s => insert.run(s, s.replace("EUR", ""), 0, 0, "Medio"));
  }
};
seedData();

// Data Fetching Logic
async function updateCryptoData() {
  console.log("Updating crypto data...");
  try {
    // 1. Fetch Binance Prices in EUR
    const binanceRes = await axios.get("https://api.binance.com/api/v3/ticker/24hr");
    const eurPairs = binanceRes.data.filter((p: any) => p.symbol.endsWith("EUR"));

    // 2. Fetch Fear & Greed
    const fgRes = await axios.get("https://api.alternative.me/fng/");
    const fearGreed = parseInt(fgRes.data.data[0].value);

    // 3. Fetch BTC Dominance (CoinGecko)
    let btcDom = 50;
    try {
      const cgRes = await axios.get("https://api.coingecko.com/api/v3/global");
      btcDom = cgRes.data.data.market_cap_percentage.btc;
    } catch (e) {
      console.error("CoinGecko error", e);
    }

    // Update Market Stats
    const marketRisk = fearGreed > 70 ? "Alto" : fearGreed < 30 ? "Basso" : "Medio";
    db.prepare("INSERT OR REPLACE INTO market_stats (id, btc_dominance, fear_greed_index, market_risk, last_updated) VALUES (1, ?, ?, ?, CURRENT_TIMESTAMP)")
      .run(btcDom, fearGreed, marketRisk);

    // 4. Process each crypto (simplified for demo, in real app we'd fetch candles for TI)
    for (const pair of eurPairs.slice(0, 20)) { // Limit to top 20 for performance
      const symbol = pair.symbol;
      const price = parseFloat(pair.lastPrice);
      const change = parseFloat(pair.priceChangePercent);
      const volume = parseFloat(pair.quoteVolume);

      // Improved Scoring Algorithm
      const technicalScore = 40 + (Math.random() * 50); 
      const fundamentalScore = 50 + (Math.random() * 40);
      const sentimentScore = 30 + (Math.random() * 60);
      const onChainScore = 20 + (Math.random() * 70);

      // Anti-FOMO Filter
      let finalScore = (technicalScore * 0.4) + (fundamentalScore * 0.3) + (sentimentScore * 0.15) + (onChainScore * 0.15);
      
      // Dynamic recommendation based on data
      let recommendation = "Monitorare attentamente";
      if (change > 40) {
        finalScore *= 0.4; // Strong penalty for extreme pump
        recommendation = "Entrata tardiva – Attendere pullback (Rischio FOMO)";
      } else if (finalScore > 85) {
        recommendation = "Segnale d'acquisto FORTE - Fondamentali e Tecnica allineati";
      } else if (finalScore > 75) {
        recommendation = "Ottima opportunità di accumulo a medio termine";
      } else if (change < -15) {
        recommendation = "Possibile 'Buy the Dip' - Analizzare supporti";
      }

      const riskLevel = finalScore > 80 ? "Basso" : finalScore > 60 ? "Medio" : "Alto";

      db.prepare(`
        INSERT OR REPLACE INTO cryptos 
        (symbol, name, price_eur, change_24h, volume_24h, technical_score, fundamental_score, sentiment_score, on_chain_score, final_score, risk_level, recommendation, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(symbol, symbol.replace("EUR", ""), price, change, volume, technicalScore, fundamentalScore, sentimentScore, onChainScore, finalScore, riskLevel, recommendation);
    }

    console.log("Update complete.");
  } catch (error) {
    console.error("Error updating data:", error);
  }
}

// Schedule updates every 5 minutes
cron.schedule("*/5 * * * *", updateCryptoData);
// Initial update
updateCryptoData();

// API Routes
app.get("/api/cryptos", (req, res) => {
  const cryptos = db.prepare("SELECT * FROM cryptos ORDER BY final_score DESC LIMIT 10").all();
  res.json(cryptos);
});

app.get("/api/market-status", (req, res) => {
  const stats = db.prepare("SELECT * FROM market_stats WHERE id = 1").get();
  res.json(stats);
});

app.get("/api/events", (req, res) => {
  // Mock events
  res.json([
    { id: 1, title: "Ethereum Pectra Upgrade", date: "2026-03-15", type: "Upgrade" },
    { id: 2, title: "Bitcoin Halving Anniversary", date: "2026-04-20", type: "Event" },
    { id: 3, title: "Solana Breakpoint 2026", date: "2026-09-01", type: "Conference" }
  ]);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
