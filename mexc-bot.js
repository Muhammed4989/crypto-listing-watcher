const ccxt = require('ccxt');
const fs = require('fs');
const path = require('path');

// ===== CONFIG =====
const CONFIG_PATH = path.join(__dirname, 'mexc-config.json');
const SYMBOL = 'MANTA/USDT';  // Change this to any pair
const TRADE_AMOUNT_USDT = 30; // Amount per trade in USDT
const SMA20_PERIOD = 20;
const CHECK_INTERVAL_MIN = 60;  // Check every 60 minutes

// ===== LOAD CREDENTIALS =====
if (!fs.existsSync(CONFIG_PATH)) {
  console.error('Create mexc-config.json with your API keys first.');
  console.error(JSON.stringify({ apiKey: 'YOUR_KEY', secret: 'YOUR_SECRET' }, null, 2));
  process.exit(1);
}
const creds = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

// ===== INIT EXCHANGE =====
const exchange = new ccxt.mexc({
  apiKey: creds.apiKey,
  secret: creds.secret,
  enableRateLimit: true,
  options: { defaultType: 'spot' },
});

// ===== HELPERS =====
function sma(data, period) {
  const result = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j];
    result.push(sum / period);
  }
  return result;
}

function rsi(data, period) {
  const gains = [], losses = [];
  for (let i = 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    gains.push(Math.max(diff, 0));
    losses.push(Math.max(-diff, 0));
  }
  let avgG = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgL = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const rsiVals = [];
  for (let i = period; i < gains.length; i++) {
    avgG = (avgG * (period - 1) + gains[i]) / period;
    avgL = (avgL * (period - 1) + losses[i]) / period;
    rsiVals.push(avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL));
  }
  return rsiVals;
}

// ===== FETCH DATA =====
async function fetchDailyData() {
  const ohlcv = await exchange.fetchOHLCV(SYMBOL, '1d', undefined, 45);
  const closes = ohlcv.map(c => c[4]);
  const highs = ohlcv.map(c => c[2]);
  const lows = ohlcv.map(c => c[3]);
  return { ohlcv, closes, highs, lows };
}

// ===== CHECK SIGNAL =====
async function checkSignal() {
  console.log(`\n[${new Date().toLocaleString()}] Checking ${SYMBOL}...`);
  const { ohlcv, closes, highs, lows } = await fetchDailyData();
  const n = closes.length;

  const sma20Vals = sma(closes, SMA20_PERIOD);
  const rsiVals = rsi(closes, 14);
  const lastIdx = sma20Vals.length - 1;
  const currentPrice = closes[lastIdx + 19];
  const currentSMA20 = sma20Vals[lastIdx];
  const pctAbove = ((currentPrice - currentSMA20) / currentSMA20) * 100;
  const currentRSI = rsiVals[rsiVals.length - 1];

  console.log(`Price: $${currentPrice.toFixed(4)} | SMA20: $${currentSMA20.toFixed(4)} | ${pctAbove.toFixed(2)}% above SMA20 | RSI: ${currentRSI.toFixed(1)}`);

  // Detect breakout+retest pattern
  let wasBelow = false, crossedAbove = false, crossIdx = -1;
  for (let i = 0; i < sma20Vals.length; i++) {
    const c = closes[i + 19];
    const s = sma20Vals[i];
    if (c <= s) wasBelow = true;
    if (wasBelow && c > s && crossIdx === -1) { crossedAbove = true; crossIdx = i; }
  }

  // Check if retesting (price declined toward SMA20 after breakout)
  let decliningToSMA = false;
  if (crossedAbove && crossIdx < lastIdx - 1) {
    const pct3dAgo = ((closes[lastIdx + 16] - sma20Vals[lastIdx - 3]) / sma20Vals[lastIdx - 3]) * 100;
    const pct1dAgo = ((closes[lastIdx + 18] - sma20Vals[lastIdx - 1]) / sma20Vals[lastIdx - 1]) * 100;
    if (pct3dAgo > pct1dAgo && pct1dAgo > pctAbove) decliningToSMA = true;
  }

  const isSetup = crossedAbove && pctAbove >= 0 && pctAbove <= 4 && currentRSI >= 40 && currentRSI <= 65;

  console.log(`  Crossed above SMA20: ${crossedAbove} | Declining to SMA: ${decliningToSMA} | Setup: ${isSetup ? '✅' : '❌'}`);

  if (!isSetup) return null;

  // Calculate levels
  const atrPeriod = 14;
  const trs = [];
  for (let i = 1; i < ohlcv.length; i++) {
    const h = highs[i], l = lows[i], pc = closes[i - 1];
    trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  const atr = trs.slice(-atrPeriod).reduce((a, b) => a + b, 0) / atrPeriod;

  const stopPrice = currentSMA20 * 0.975;
  const stopPct = ((stopPrice - currentPrice) / currentPrice) * 100;

  // Target: nearest swing high
  const swingHighs = [];
  for (let i = 2; i < 25; i++) {
    const idx = ohlcv.length - i;
    if (idx > 0 && idx < highs.length - 1 && highs[idx] > highs[idx - 1] && highs[idx] > highs[idx + 1])
      swingHighs.push(highs[idx]);
  }
  const targetPrice = swingHighs.length > 0 ? swingHighs[swingHighs.length - 1] : currentPrice * 1.06;
  const targetPct = ((targetPrice - currentPrice) / currentPrice) * 100;

  return {
    price: currentPrice,
    sma20: currentSMA20,
    pctAbove: pctAbove.toFixed(2),
    rsi: currentRSI.toFixed(1),
    stop: { price: stopPrice.toFixed(4), pct: stopPct.toFixed(2) },
    target: { price: targetPrice.toFixed(4), pct: targetPct.toFixed(2) },
    atr: atr.toFixed(4),
    declining: decliningToSMA,
  };
}

// ===== EXECUTE TRADE =====
async function executeTrade(signal) {
  console.log(`\n🚀 SIGNAL DETECTED! Buying ${SYMBOL}`);
  console.log(`Entry: $${signal.price} | Stop: $${signal.stop.price} (${signal.stop.pct}%) | Target: $${signal.target.price} (${signal.target.pct}%)`);

  try {
    const balance = await exchange.fetchBalance();
    const usdtBalance = balance.USDT?.free || 0;
    if (usdtBalance < TRADE_AMOUNT_USDT) {
      console.log(`❌ Insufficient USDT balance: $${usdtBalance.toFixed(2)}`);
      return;
    }

    // Place market buy
    const amount = TRADE_AMOUNT_USDT / signal.price;
    const buyOrder = await exchange.createMarketBuyOrder(SYMBOL, amount);
    console.log(`✅ Buy filled: ${buyOrder.filled} @ ~$${signal.price}`);

    // Place stop-limit sell (stop-loss)
    const stopLimitPrice = parseFloat(signal.stop.price);
    await exchange.createOrder(SYMBOL, 'stop_market_loss', 'sell', amount, undefined, { stopPrice: stopLimitPrice });
    console.log(`✅ Stop-loss set at $${stopLimitPrice}`);

    // Place limit sell (take-profit)
    const tpPrice = parseFloat(signal.target.price);
    await exchange.createLimitSellOrder(SYMBOL, amount, tpPrice);
    console.log(`✅ Take-profit set at $${tpPrice}`);

    // Log trade
    const log = {
      time: new Date().toISOString(),
      symbol: SYMBOL,
      entry: signal.price,
      stop: signal.stop.price,
      target: signal.target.price,
      amount: amount,
      pctAboveSMA: signal.pctAbove,
      rsi: signal.rsi,
    };
    fs.appendFileSync(path.join(__dirname, 'trades.log'), JSON.stringify(log) + '\n');
    console.log('📝 Trade logged to trades.log');

  } catch (err) {
    console.error('❌ Trade failed:', err.message);
  }
}

// ===== MAIN LOOP =====
async function main() {
  console.log('=== MEXC SMA20 RETEST TRADING BOT ===');
  console.log(`Symbol: ${SYMBOL} | Trade Size: $${TRADE_AMOUNT_USDT}`);
  console.log(`Checking every ${CHECK_INTERVAL_MIN} minutes\n`);

  while (true) {
    try {
      const signal = await checkSignal();
      if (signal && signal.declining) {
        await executeTrade(signal);
        console.log('\n⏸️  Trade executed. Bot will continue monitoring.');
      } else if (signal) {
        console.log(`  ⏳ Setup exists but price is not declining toward SMA20 yet. Waiting...`);
      }
    } catch (err) {
      console.error('Error:', err.message);
    }
    await new Promise(r => setTimeout(r, CHECK_INTERVAL_MIN * 60 * 1000));
  }
}

main();
