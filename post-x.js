const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'x-config.json');

// ===== LOAD YOUR CREDENTIALS =====
// Option 1: Config file (recommended)
let config;
if (fs.existsSync(CONFIG_PATH)) {
  config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
} else {
  // Option 2: Environment variables
  config = {
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  };
  if (!config.appKey) {
    console.error('❌ No credentials found.');
    console.error('');
    console.error('Create x-config.json in this folder:');
    console.error(JSON.stringify({
      appKey: 'YOUR_API_KEY',
      appSecret: 'YOUR_API_SECRET',
      accessToken: 'YOUR_ACCESS_TOKEN',
      accessSecret: 'YOUR_ACCESS_SECRET',
    }, null, 2));
    process.exit(1);
  }
}

async function tweet(message) {
  const client = new TwitterApi({
    appKey: config.appKey,
    appSecret: config.appSecret,
    accessToken: config.accessToken,
    accessSecret: config.accessSecret,
  });

  try {
    const result = await client.v2.tweet(message);
    console.log(`✅ Tweet posted: https://x.com/user/status/${result.data.id}`);
    return result;
  } catch (err) {
    console.error('❌ Failed to post tweet:', err.data?.detail || err.message);
    if (err.data?.errors) console.error(err.data.errors);
  }
}

// ===== SIGNAL TO TWEET =====
const signal = `
📊 SIGNAL: $JTO

Breakout + Retest SMA20 on Daily

Entry: ~$0.514-0.532
Stop:  $0.509 (-4.3%)
T1:    $0.547 (+2.8%)
T2:    $0.555 (+4.4%)

RSI: 52.9 (neutral)
Trend: above SMA20 & SMA50

#Crypto #Trading #JTO #Altcoins
`.trim();

tweet(signal);
