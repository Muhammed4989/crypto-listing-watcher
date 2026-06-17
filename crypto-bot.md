# Crypto Trading Bot — Session Log

**Date:** 2026-06-05
**Name to use:** "crypto bot"

## What We Built

### 1. Market Scanner Scripts
- `crypto_scan_v3.ps1` — Scans top 200 Binance USDT pairs for Daily SMA20 position, RSI(14), volume vs 20d avg
- `target_analysis.ps1` — Calculates stop losses (2% below SMA20 / 2× ATR / nearest swing low) and targets (swing high / SMA50 / 30d high)
- `simulate_10.ps1` — Backtests SMA20 retest strategy on past 30 days; reports win rate, total return, P&L

### 2. X/Twitter Poster
- `post-x.js` — Posts trade signals to X via API v2 using `twitter-api-v2` npm package
- Requires `x-config.json` with X API credentials

### 3. MEXC Trading Bot (NEW)
- `mexc-bot.js` — Fully automated spot trading bot
- **Exchange:** MEXC via CCXT library
- **Strategy:** Daily SMA20 breakout + retest
- **Trade size:** $30 USDT per trade (configurable)
- **Features:**
  - Checks every 60 minutes
  - Fetches 45 days of daily klines
  - Calculates SMA20, RSI(14), ATR
  - Detects breakout-above-SMA20 + pullback-to-retest pattern
  - Places market buy + stop-limit sell (stop loss) + limit sell (take profit)
  - Logs all trades to `trades.log`
- `mexc-config.json` — MEXC API credentials (keep secret!)

## Live Scan Results (2026-06-05 15:45)
- Only ~6 of 200 top coins above Daily SMA20 (bearish market)
- Top candidates: MANTA ($0.08, +1.04% above SMA20, RSI 52.5), XLM ($0.10, +3.56%, RSI 50.5), JTO, FORM
- Backtest: 60% win rate, +21.56% total return, +$2,194 profit on $10k

## API Keys Status
- **MEXC:** ✅ Connected. Spot wallet has $0 USDT — needs deposit to trade
- **X/Twitter:** Not configured yet

## How to Run the Bot
```bash
cd C:\Users\moham\AppData\Local\Temp\opencode
node mexc-bot.js
```

## How to Run the Scanner
```powershell
C:\Users\moham\AppData\Local\Temp\opencode\crypto_scan_v3.ps1
```

## How to Run Backtest
```powershell
C:\Users\moham\AppData\Local\Temp\opencode\simulate_10.ps1
```

## Next Steps
1. Deposit USDT to MEXC Spot wallet
2. Run the bot: `node mexc-bot.js`
3. (Optional) Set up X API credentials for tweet posting
