const https = require('https');
const fs = require('fs');
const path = require('path');

const STATE_DIR = process.env.STATE_DIR || __dirname;
const CONFIG_PATH = path.join(__dirname, 'listing-config.json');
const STATE_PATH = path.join(STATE_DIR, 'listing-state.json');
const LOG_PATH = path.join(STATE_DIR, 'listing-alerts.log');

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

let state = { seenMexc: [], seenFundings: [], seenCoins: [] };
if (fs.existsSync(STATE_PATH)) {
  try {
    const saved = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    state.seenMexc = saved.seenMexc || [];
    state.seenFundings = saved.seenFundings || [];
    state.seenCoins = saved.seenCoins || [];
  } catch (e) {}
}

const TARGET_VCS = config.targetVCs || ['Binance Labs', 'a16z', 'Pantera Capital', 'Animoca Brands', 'Paradigm', 'Coinbase Ventures', 'Dragonfly Capital', 'Polychain Capital'];

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + '\n', 'utf8');
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/html'
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function sendTelegram(msg) {
  if (!config.telegramBotToken || !config.telegramChatId) return;
  try {
    const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage?chat_id=${config.telegramChatId}&text=${encodeURIComponent(msg)}&parse_mode=HTML`;
    await fetch(url);
  } catch (e) {
    log('Telegram send failed: ' + e.message);
  }
}

// ── 1. CoinGecko All Coins (detect new ones) ──
async function checkNewCoins() {
  try {
    const data = await fetch('https://api.coingecko.com/api/v3/coins/list');
    const coins = JSON.parse(data);
    const allIds = coins.map(c => c.id);
    const newCoins = coins.filter(c => !state.seenCoins.includes(c.id));
    if (newCoins.length > 500) {
      log(`CoinGecko: ${allIds.length} total, ${newCoins.length} new (first run or reset)`);
    } else if (newCoins.length > 0) {
      let msg = '🪙 <b>New Coins on CoinGecko!</b>\n\n';
      for (const c of newCoins.slice(0, 15)) {
        msg += `• ${c.name} (${c.symbol.toUpperCase()})\n`;
        log(`New coin: ${c.name} (${c.symbol})`);
      }
      if (newCoins.length > 15) msg += `\n... and ${newCoins.length - 15} more`;
      msg += '\n\nBuy on DEX before CEX listing arrives!';
      await sendTelegram(msg);
    }
    state.seenCoins = allIds;
  } catch (e) {
    log('CoinGecko error: ' + e.message);
  }
}

// ── 2. CryptoRank Fundraising Scraper ──
async function checkFundings() {
  try {
    const html = await fetch('https://cryptorank.io/fundraising');
    const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    const newFundings = [];
    for (const row of rows) {
      const text = row.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.length < 10) continue;
      const matchedVCs = TARGET_VCS.filter(vc => text.includes(vc));
      if (matchedVCs.length > 0) {
        const key = text.substring(0, 80);
        if (!state.seenFundings.includes(key)) {
          newFundings.push({ text: text.substring(0, 150), vcs: matchedVCs });
          state.seenFundings.push(key);
        }
      }
    }
    if (newFundings.length > 0) {
      let msg = '💰 <b>VC Funding Alert!</b>\n\n';
      for (const f of newFundings) {
        msg += `• ${f.text}\n  VCs: ${f.vcs.join(', ')}\n\n`;
        log(`Funding: ${f.text}`);
      }
      await sendTelegram(msg);
    }
    state.seenFundings = state.seenFundings.slice(-500);
  } catch (e) {
    log('Funding check error: ' + e.message);
  }
}

// ── 3. DexScreener New DEX Token Profiles ──
async function checkDexTrending() {
  try {
    const data = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
    const profiles = JSON.parse(data);
    if (!profiles || !Array.isArray(profiles)) return;
    const newOnes = profiles.filter(p => !state.seenMexc.includes(p.tokenAddress || p.url));
    if (newOnes.length > 0 && state.seenMexc.length > 0) {
      let msg = '⚡ <b>New DEX Tokens Spotted!</b>\n\n';
      for (const p of newOnes.slice(0, 10)) {
        const chain = p.chainId || '?';
        const symbol = p.symbol || p.tokenSymbol || '?';
        const name = p.name || p.tokenName || symbol;
        msg += `• ${name} (${symbol}) | ${chain}\n`;
      }
      if (newOnes.length > 10) msg += `\n... and ${newOnes.length - 10} more`;
      await sendTelegram(msg);
    }
    state.seenMexc = [...new Set(profiles.map(p => p.tokenAddress || p.url))];
  } catch (e) {
    log('DexScreener error: ' + e.message);
  }
}

// ── Main ──
async function run() {
  log('=== Listing Watcher Run ===');
  await checkNewCoins();
  await checkDexTrending();
  await checkFundings();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
  log('Done. GitHub Actions will trigger next run per cron.');
}

run().then(() => process.exit(0)).catch(() => process.exit(1));
