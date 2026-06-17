const https = require('https');
const fs = require('fs');
const path = require('path');

const STATE_DIR = process.env.STATE_DIR || __dirname;
const STATE_PATH = path.join(STATE_DIR, 'mexc-alert-state.json');
const CONFIG_PATH = path.join(__dirname, 'listing-config.json');

const config = fs.existsSync(CONFIG_PATH) ? JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) : {};

let state = { alertedSetups: [] };
if (fs.existsSync(STATE_PATH)) {
  try { state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); } catch (e) {}
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 },
      (res) => {
        let d = '';
        res.setEncoding('utf8');
        res.on('data', c => d += c);
        res.on('end', () => resolve(d));
        res.on('error', reject);
      }
    ).on('error', reject);
  });
}

async function sendTelegram(msg) {
  if (!config.telegramBotToken || !config.telegramChatId) return;
  try {
    const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage?chat_id=${config.telegramChatId}&text=${encodeURIComponent(msg)}&parse_mode=HTML`;
    await fetch(url);
  } catch (e) {
    console.error('Telegram send failed:', e.message);
  }
}

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

function detectSetup(closes, highs, lows) {
  const n = closes.length;
  const sma20Vals = sma(closes, 20);
  const rsiVals = rsi(closes, 14);
  const lastIdx = sma20Vals.length - 1;
  const price = closes[lastIdx + 19];
  const sma20 = sma20Vals[lastIdx];
  const pctAbove = ((price - sma20) / sma20) * 100;
  const currentRSI = rsiVals[rsiVals.length - 1];

  let wasBelow = false, crossIdx = -1;
  for (let i = 0; i < sma20Vals.length; i++) {
    const c = closes[i + 19];
    const s = sma20Vals[i];
    if (c <= s) wasBelow = true;
    if (wasBelow && c > s && crossIdx === -1) crossIdx = i;
  }

  const crossedAbove = crossIdx >= 0;

  let decliningToSMA = false;
  if (crossedAbove && crossIdx < lastIdx - 1) {
    const pct3dAgo = ((closes[lastIdx + 16] - sma20Vals[lastIdx - 3]) / sma20Vals[lastIdx - 3]) * 100;
    const pct1dAgo = ((closes[lastIdx + 18] - sma20Vals[lastIdx - 1]) / sma20Vals[lastIdx - 1]) * 100;
    if (pct3dAgo > pct1dAgo && pct1dAgo > pctAbove) decliningToSMA = true;
  }

  const isSetup = crossedAbove && pctAbove >= 0 && pctAbove <= 4 && currentRSI >= 40 && currentRSI <= 65;

  if (!isSetup) return null;

  const atrPeriod = 14;
  const trs = [];
  for (let i = 1; i < closes.length; i++) {
    const h = highs[i], l = lows[i], pc = closes[i - 1];
    trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  const atr = trs.slice(-atrPeriod).reduce((a, b) => a + b, 0) / atrPeriod;

  const stopPrice = sma20 * 0.975;

  const swingHighs = [];
  for (let i = 2; i < 25; i++) {
    const idx = closes.length - i;
    if (idx > 0 && idx < highs.length - 1 && highs[idx] > highs[idx - 1] && highs[idx] > highs[idx + 1])
      swingHighs.push(highs[idx]);
  }
  const targetPrice = swingHighs.length > 0 ? swingHighs[swingHighs.length - 1] : price * 1.06;

  return {
    price, sma20, pctAbove: +pctAbove.toFixed(2),
    rsi: +currentRSI.toFixed(1),
    stopPrice: +stopPrice.toFixed(4),
    targetPrice: +targetPrice.toFixed(4),
    atr: +atr.toFixed(4),
    declining: decliningToSMA
  };
}

async function scan() {
  console.log('Fetching top USDT pairs from Binance...');
  console.time('fetch-tickers');
  const tickerData = await fetch('https://api.binance.com/api/v3/ticker/24hr');
  console.timeEnd('fetch-tickers');
  console.log('Response length:', tickerData.length, 'bytes');
  let tickers;
  try {
    tickers = JSON.parse(tickerData);
    if (!Array.isArray(tickers)) throw new Error('Response is not an array: ' + typeof tickers);
  } catch (e) {
    console.error('Failed to parse ticker data:', e.message);
    console.error('Response preview:', tickerData.substring(0, 300));
    throw e;
  }

  const usdtPairs = tickers.filter(t =>
    t.symbol.endsWith('USDT') &&
    !t.symbol.includes('UP') && !t.symbol.includes('DOWN') &&
    !t.symbol.includes('BULL') && !t.symbol.includes('BEAR') &&
    !['BKRW','EUR','GBP','JPY','BRL','TRY','DAI','TUSD','USDP',
      'USDC','FDUSD','USDD','BFUSD','USD1','RLUSD','USDE',
      'USTC','BUSD'].some(s => t.symbol.includes(s))
  );

  const sorted = usdtPairs
    .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
    .slice(0, 200);

  console.log(`Scanning top ${sorted.length} pairs...`);

  let foundSignals = [];

  for (let i = 0; i < sorted.length; i++) {
    const symbol = sorted[i].symbol;
    const name = symbol.replace('USDT', '');
    const vol = parseFloat(sorted[i].quoteVolume);
    const price = parseFloat(sorted[i].lastPrice);
    if (vol < 50000) continue;

    try {
      const klineData = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=45`);
      const klines = JSON.parse(klineData);
      if (klines.length < 22) continue;

      const closes = klines.map(k => parseFloat(k[4]));
      const highs = klines.map(k => parseFloat(k[2]));
      const lows = klines.map(k => parseFloat(k[3]));

      const setup = detectSetup(closes, highs, lows);
      if (setup) {
        setup.symbol = name;
        setup.price = price;
        foundSignals.push(setup);
        console.log(`  ${name}: SETUP @ $${price} (${setup.pctAbove}% above SMA20, RSI ${setup.rsi})`);
      }
    } catch (e) {
      // skip
    }
  }

  return foundSignals;
}

async function main() {
  console.log('=== MEXC SMA20 Alert Scanner ===');
  console.log(new Date().toISOString());

  try {
    const signals = await scan();

    if (signals.length === 0) {
      console.log('No setups found.');
      await sendTelegram('📊 <b>MEXC Scan</b>\nNo SMA20 breakout+retest setups found.');
    } else {
      // Check which ones are new (not alerted before)
      const newSignals = signals.filter(s => !state.alertedSetups.includes(s.symbol));

      if (newSignals.length > 0) {
        let msg = '🚀 <b>SMA20 Setup Alert!</b>\n\n';
        for (const s of newSignals) {
          const declineMsg = s.declining ? ' (declining toward SMA20 ✅)' : '';
          msg += `<b>${s.symbol}</b> — $${s.price}\n`;
          msg += `  SMA20: ${s.pctAbove}% above | RSI: ${s.rsi}${declineMsg}\n`;
          msg += `  Stop: $${s.stopPrice} | Target: $${s.targetPrice}\n\n`;
          state.alertedSetups.push(s.symbol);
        }
        msg += '⚠️ Manual trade — not automated. Deposit to MEXC to trade.';

        await sendTelegram(msg);
        console.log(`Alerted ${newSignals.length} new setups.`);
      } else {
        const symbolList = signals.map(s => s.symbol).join(', ');
        await sendTelegram(`📊 <b>MEXC Scan</b>\n${signals.length} setups active (already alerted): ${symbolList}`);
        console.log('No new setups beyond previously alerted ones.');
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  }

  fs.writeFileSync(STATE_PATH, JSON.stringify(state), 'utf8');
}

main().then(() => process.exit(0)).catch(() => process.exit(1));
