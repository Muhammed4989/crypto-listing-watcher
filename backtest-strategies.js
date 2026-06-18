const https = require('https');
const fs = require('fs');
const path = require('path');

// ===== FETCH =====
function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 },
      (res) => { let d = ''; res.setEncoding('utf8'); res.on('data', c => d += c); res.on('end', () => resolve(d)); }
    ).on('error', reject);
  });
}

// ===== INDICATORS =====
function sma(data, p) { const r=[]; for(let i=p-1;i<data.length;i++){let s=0;for(let j=i-p+1;j<=i;j++)s+=data[j];r.push(s/p)} return r; }
function ema(data, p) { const k=2/(p+1), r=[data[0]]; for(let i=1;i<data.length;i++) r.push(data[i]*k + r[i-1]*(1-k)); return r; }
function rsi(data, p) { const g=[],l=[]; for(let i=1;i<data.length;i++){const d=data[i]-data[i-1];g.push(Math.max(d,0));l.push(Math.max(-d,0))} let ag=g.slice(0,p).reduce((a,b)=>a+b,0)/p, al=l.slice(0,p).reduce((a,b)=>a+b,0)/p; const r=[]; for(let i=p;i<g.length;i++){ag=(ag*(p-1)+g[i])/p;al=(al*(p-1)+l[i])/p;r.push(al===0?100:100-100/(1+ag/al))} return r; }
function atr(highs, lows, closes, p) { const tr=[]; for(let i=1;i<closes.length;i++) tr.push(Math.max(highs[i]-lows[i], Math.abs(highs[i]-closes[i-1]), Math.abs(lows[i]-closes[i-1]))); return sma(tr, p); }
function macd(data) { const e12=ema(data,12), e26=ema(data,26); const m=[]; for(let i=0;i<Math.min(e12.length,e26.length);i++) m.push(e12[i]-e26[i]); const s=ema(m,9); return {macd:m, signal:s, hist:m.map((v,i)=>v-(s[i]||0))}; }
function adx(highs, lows, closes, p) {
  const tr=[], plusDM=[], minusDM=[];
  for(let i=1;i<closes.length;i++){
    tr.push(Math.max(highs[i]-lows[i], Math.abs(highs[i]-closes[i-1]), Math.abs(lows[i]-closes[i-1])));
    plusDM.push(highs[i]-highs[i-1] > lows[i-1]-lows[i] ? Math.max(highs[i]-highs[i-1],0) : 0);
    minusDM.push(lows[i-1]-lows[i] > highs[i]-highs[i-1] ? Math.max(lows[i-1]-lows[i],0) : 0);
  }
  const atrV = sma(tr, p), plus = ema(plusDM, p), minus = ema(minusDM, p);
  const diPlus=[], diMinus=[], dx=[];
  for(let i=0;i<atrV.length;i++){
    diPlus.push(100*plus[i]/atrV[i]); diMinus.push(100*minus[i]/atrV[i]);
    const sum = diPlus[i]+diMinus[i];
    dx.push(sum===0?0:100*Math.abs(diPlus[i]-diMinus[i])/sum);
  }
  return { adx: sma(dx, p), diPlus, diMinus };
}
function bb(data, p, m) { const mid=sma(data,p), std=[]; for(let i=p-1;i<data.length;i++){let s=0;for(let j=i-p+1;j<=i;j++)s+=Math.pow(data[j]-mid[i-p+1],2);std.push(Math.sqrt(s/p))} return {mid, upper:mid.map((v,i)=>v+m*std[i]), lower:mid.map((v,i)=>v-m*std[i]), bandwidth:std.map((v,i)=>v/mid[i]*100)}; }
function emaArray(data, p) {
  const k=2/(p+1), r=[data[0]];
  for(let i=1;i<data.length;i++) r.push(data[i]*k + r[i-1]*(1-k));
  return r;
}

// ===== FIXED LENGTH HELPERS =====
function fixLen(arr, len) { while(arr.length < len) arr.unshift(0); return arr.slice(-len); }
function getVal(arr, idx) { return arr && arr.length > idx ? arr[idx] : null; }

// ===== STRATEGIES =====

// Strategy 0: Current strategy (SMA20 + RSI, daily only)
function strategy0(closes, highs, lows) {
  const n = closes.length;
  if (n < 50) return [];
  const sma20 = sma(closes, 20);
  const rsiV = rsi(closes, 14);
  const results = [];
  for (let i = 30; i < n; i++) {
    const idx20 = i - 19;
    if (idx20 < 0 || idx20 >= sma20.length) continue;
    const price = closes[i], s20 = sma20[idx20], r = rsiV[idx20 - 6];
    if (!r) continue;
    const pct = (price - s20) / s20 * 100;
    let wasBelow = false, crossed = false;
    for (let j = Math.max(0, idx20 - 15); j < idx20; j++) {
      if (closes[j + 19] <= sma20[j]) wasBelow = true;
      if (wasBelow && closes[j + 19] > sma20[j]) crossed = true;
    }
    if (crossed && pct >= 0 && pct <= 4 && r >= 40 && r <= 65) {
      const trs = []; for(let k=1;k<=i;k++) trs.push(Math.max(highs[k]-lows[k],Math.abs(highs[k]-closes[k-1]),Math.abs(lows[k]-closes[k-1])));
      const atrV = trs.slice(-14).reduce((a,b)=>a+b,0)/14;
      const stop = s20 * 0.975;
      const swing = []; for(let k=2;k<25;k++){const idx=i-k;if(idx>0&&idx<highs.length-1&&highs[idx]>highs[idx-1]&&highs[idx]>highs[idx+1])swing.push(highs[idx])}
      const target = swing.length>0 ? swing[swing.length-1] : price*1.06;
      const risk = (price - stop) / price;
      const reward = (target - price) / price;
      if (reward > 0 && risk > 0) results.push({ day:i, price, stop, target, risk, reward, rr:reward/risk, strat:0 });
    }
  }
  return results;
}

// Strategy 1: Triad (EMA200 regime + EMA20 momentum + 4h pullback)
function strategy1(closes, highs, lows) {
  const n = closes.length;
  if (n < 220) return [];
  const ema200 = ema(closes, 200);
  const ema50 = ema(closes, 50);
  const ema20 = ema(closes, 20);
  const rsiV = rsi(closes, 14);
  const adxV = adx(highs, lows, closes, 14);
  const results = [];
  for (let i = 210; i < n; i++) {
    const price = closes[i];
    if (price < ema200[i]) continue;
    if (ema50[i] < ema200[i]) continue;
    if (adxV.adx && adxV.adx[adxV.adx.length - (n - i)] < 20) continue;
    if (price < ema20[i]) continue;
    const r = rsiV[rsiV.length - (n - i)];
    if (!r || r < 50) continue;

    // Check pullback on 4h (simulate by checking recent 5-day min vs ema20)
    const recentLow = Math.min(...closes.slice(Math.max(0,i-5), i+1));
    const nearEma20 = recentLow <= ema20[i] * 1.02;

    if (nearEma20) {
      const trs = []; for(let k=1;k<=i;k++) trs.push(Math.max(highs[k]-lows[k],Math.abs(highs[k]-closes[k-1]),Math.abs(lows[k]-closes[k-1])));
      const atrV = trs.slice(-14).reduce((a,b)=>a+b,0)/14;
      const stop = price - 1.5 * atrV;
      const target1 = price + 1.5 * atrV;
      const target2 = price + 3 * atrV;
      const risk = (price - stop) / price;
      const reward = ((target1 + target2) / 2 - price) / price;
      if (reward > 0 && risk > 0) results.push({ day:i, price, stop, target: (target1+target2)/2, risk, reward, rr:reward/risk, strat:1, atr:atrV });
    }
  }
  return results;
}

// Strategy 2: Enhanced Triad (volume + MACD + Bollinger)
function strategy2(closes, highs, lows, volumes) {
  const n = closes.length;
  if (n < 220) return [];
  const ema200 = ema(closes, 200);
  const ema50 = ema(closes, 50);
  const ema20 = ema(closes, 20);
  const rsiV = rsi(closes, 14);
  const adxV = adx(highs, lows, closes, 14);
  const macdV = macd(closes);
  const bbV = bb(closes, 20, 2);
  const volSma = sma(volumes, 20);
  const results = [];
  for (let i = 210; i < n; i++) {
    const price = closes[i];
    if (price < ema200[i]) continue;
    if (ema50[i] < ema200[i]) continue;
    if (adxV.adx && adxV.adx[adxV.adx.length - (n - i)] < 20) continue;
    if (price < ema20[i]) continue;
    const r = rsiV[rsiV.length - (n - i)];
    if (!r || r < 50) continue;
    const vol = volumes[i]; const vs = volSma[volSma.length - (n - i)];
    if (vs && vol < vs) continue;
    const m = macdV.macd[macdV.macd.length - (n - i)];
    const ms = macdV.signal[macdV.signal.length - (n - i)];
    if (!m || m < 0) continue;
    if (ms && m < ms) continue;

    const recentLow = Math.min(...closes.slice(Math.max(0,i-5), i+1));
    const bbIdx = bbV.lower.length - (n - i);
    const bbL = bbV.lower[bbIdx];
    const nearEma20 = recentLow <= ema20[i] * 1.02;
    const nearBB = bbL && price <= bbL * 1.02;

    if (nearEma20 || nearBB) {
      const trs = []; for(let k=1;k<=i;k++) trs.push(Math.max(highs[k]-lows[k],Math.abs(highs[k]-closes[k-1]),Math.abs(lows[k]-closes[k-1])));
      const atrV = trs.slice(-14).reduce((a,b)=>a+b,0)/14;
      const stop = price - 1.5 * atrV;
      const target1 = price + 1.5 * atrV;
      const target2 = price + 3 * atrV;
      const risk = (price - stop) / price;
      const reward = ((target1 + target2) / 2 - price) / price;
      if (reward > 0 && risk > 0) results.push({ day:i, price, stop, target: (target1+target2)/2, risk, reward, rr:reward/risk, strat:2, atr:atrV });
    }
  }
  return results;
}

// Strategy 3: Ichimoku Cloud
function strategy3(closes, highs, lows) {
  const n = closes.length;
  if (n < 60) return [];
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const rsiV = rsi(closes, 14);
  const results = [];
  for (let i = 55; i < n; i++) {
    const price = closes[i];
    const tenkan = (Math.max(...highs.slice(i-9,i+1)) + Math.min(...lows.slice(i-9,i+1))) / 2;
    const kijun = (Math.max(...highs.slice(i-26,i+1)) + Math.min(...lows.slice(i-26,i+1))) / 2;
    const spanA = ((tenkan + kijun) / 2); // shifted +26 in real Ichimoku
    const spanB = (Math.max(...highs.slice(i-52,i+1)) + Math.min(...lows.slice(i-52,i+1))) / 2;

    if (price < kijun) continue;
    if (price < tenkan) continue;
    if (spanA < spanB) continue;
    const r = rsiV[rsiV.length - (n - i)];
    if (!r || r < 50) continue;
    if (price < ema20[i]) continue;

    const recentLow = Math.min(...closes.slice(Math.max(0,i-5), i+1));
    const nearTenkan = recentLow <= tenkan * 1.02;
    const nearKijun = recentLow <= kijun * 1.02;

    if (nearTenkan || nearKijun) {
      const trs = []; for(let k=1;k<=i;k++) trs.push(Math.max(highs[k]-lows[k],Math.abs(highs[k]-closes[k-1]),Math.abs(lows[k]-closes[k-1])));
      const atrV = trs.slice(-14).reduce((a,b)=>a+b,0)/14;
      const stop = price - 1.5 * atrV;
      const target1 = price + 1.5 * atrV;
      const target2 = price + 3 * atrV;
      const risk = (price - stop) / price;
      const reward = ((target1 + target2) / 2 - price) / price;
      if(reward>0&&risk>0) results.push({ day:i, price, stop, target: (target1+target2)/2, risk, reward, rr:reward/risk, strat:3 });
    }
  }
  return results;
}

// Strategy 4: Momentum Scoring (weighted factor model)
function strategy4(closes, highs, lows, volumes) {
  const n = closes.length;
  if (n < 220) return [];
  const ema200 = ema(closes, 200), ema100 = ema(closes, 100), ema50 = ema(closes, 50), ema20 = ema(closes, 20);
  const rsiV = rsi(closes, 14);
  const adxV = adx(highs, lows, closes, 14);
  const macdV = macd(closes);
  const volSma = sma(volumes, 20);
  const results = [];

  for (let i = 210; i < n; i++) {
    const price = closes[i];
    let score = 0;
    // Trend (40% weight)
    if (price > ema200[i]) score += 10;
    if (ema50[i] > ema200[i]) score += 10;
    if (price > ema100[i]) score += 10;
    if (price > ema50[i]) score += 5;
    if (price > ema20[i]) score += 5;
    // RSI (20%)
    const r = rsiV[rsiV.length - (n - i)];
    if (r && r > 55) score += 10;
    else if (r && r > 50) score += 5;
    else if (r && r > 45) score += 2;
    // ADX (15%)
    const a = adxV.adx && adxV.adx[adxV.adx.length - (n - i)];
    if (a && a > 30) score += 15;
    else if (a && a > 25) score += 10;
    else if (a && a > 20) score += 5;
    // MACD (15%)
    const m = macdV.macd[macdV.macd.length - (n - i)];
    const ms = macdV.signal[macdV.signal.length - (n - i)];
    if (m && m > 0 && ms && m > ms) score += 15;
    else if (m && m > 0) score += 8;
    // Volume (10%)
    const vol = volumes[i]; const vs = volSma[volSma.length - (n - i)];
    if (vs && vol > vs * 1.5) score += 10;
    else if (vs && vol > vs) score += 5;

    if (score >= 60) {
      const trs = []; for(let k=1;k<=i;k++) trs.push(Math.max(highs[k]-lows[k],Math.abs(highs[k]-closes[k-1]),Math.abs(lows[k]-closes[k-1])));
      const atrV = trs.slice(-14).reduce((a,b)=>a+b,0)/14;
      const stop = price - 1.5 * atrV;
      const target1 = price + 1.5 * atrV;
      const target2 = price + 3 * atrV;
      const risk = (price - stop) / price;
      const reward = ((target1 + target2) / 2 - price) / price;
      if(reward>0&&risk>0) results.push({ day:i, price, stop, target:(target1+target2)/2, risk, reward, rr:reward/risk, strat:4, score });
    }
  }
  return results;
}

// Strategy 5: SMA20+ATR (current strategy but with volatility-adjusted exits)
function strategy5(closes, highs, lows) {
  const n = closes.length;
  if (n < 50) return [];
  const sma20 = sma(closes, 20);
  const rsiV = rsi(closes, 14);
  const results = [];
  for (let i = 30; i < n; i++) {
    const idx20 = i - 19;
    if (idx20 < 0 || idx20 >= sma20.length) continue;
    const price = closes[i], s20 = sma20[idx20], r = rsiV[idx20 - 6];
    if (!r) continue;
    const pct = (price - s20) / s20 * 100;
    let wasBelow = false, crossed = false;
    for (let j = Math.max(0, idx20 - 15); j < idx20; j++) {
      if (closes[j + 19] <= sma20[j]) wasBelow = true;
      if (wasBelow && closes[j + 19] > sma20[j]) crossed = true;
    }
    if (crossed && pct >= 0 && pct <= 4 && r >= 40 && r <= 65) {
      const trs = []; for(let k=1;k<=i;k++) trs.push(Math.max(highs[k]-lows[k],Math.abs(highs[k]-closes[k-1]),Math.abs(lows[k]-closes[k-1])));
      const atrV = trs.slice(-14).reduce((a,b)=>a+b,0)/14;
      const stop = price - 2 * atrV;
      const target1 = price + 1.5 * atrV;
      const target2 = price + 3 * atrV;
      const avgTarget = (target1 + target2) / 2;
      const risk = (price - stop) / price;
      const reward = (avgTarget - price) / price;
      if (reward > 0 && risk > 0) results.push({ day:i, price, stop, target: avgTarget, risk, reward, rr:reward/risk, strat:5, atr:atrV });
    }
  }
  return results;
}

// Strategy 6: Momentum Breakout (EMA50 trend + RSI 50-65 + volume + ATR stops)
function strategy6(closes, highs, lows, volumes) {
  const n = closes.length;
  if (n < 100) return [];
  const ema50 = ema(closes, 50);
  const ema20 = ema(closes, 20);
  const rsiV = rsi(closes, 14);
  const macdV = macd(closes);
  const volSma = sma(volumes, 20);
  const bbV = bb(closes, 20, 2);
  const results = [];
  for (let i = 60; i < n; i++) {
    const price = closes[i];
    // Trend filter: price above EMA50 (broad trend)
    if (price < ema50[i]) continue;
    // Short-term momentum: above EMA20
    if (price < ema20[i]) continue;
    // RSI: bullish bias (50-70, not overbought)
    const r = rsiV[rsiV.length - (n - i)];
    if (!r || r < 50 || r > 70) continue;
    // MACD: positive
    const m = macdV.macd[macdV.macd.length - (n - i)];
    if (!m || m < 0) continue;
    // Volume confirmation
    const vol = volumes[i]; const vs = volSma[volSma.length - (n - i)];
    if (vs && vol < vs) continue;
    // Check if recent pullback to EMA20 area
    const recentLow = Math.min(...closes.slice(Math.max(0,i-5), i+1));
    const pctAboveEMA20 = (price - ema20[i]) / ema20[i] * 100;
    const nearEMA20 = recentLow <= ema20[i] * 1.015;
    // BB $B < 0.5 (near middle or lower band)
    const bbIdx = bbV.lower.length - (n - i);
    const bbL = bbV.lower[bbIdx];
    const bbM = bbV.mid[bbIdx];
    const nearBB = bbL && price <= (bbM + bbL) / 2;

    if (nearEMA20 && (nearBB || pctAboveEMA20 <= 3)) {
      const trs = []; for(let k=1;k<=i;k++) trs.push(Math.max(highs[k]-lows[k],Math.abs(highs[k]-closes[k-1]),Math.abs(lows[k]-closes[k-1])));
      const atrV = trs.slice(-14).reduce((a,b)=>a+b,0)/14;
      const stop = price - 1.8 * atrV;
      const target1 = price + 1.8 * atrV;
      const target2 = price + 3.5 * atrV;
      const avgTarget = (target1 + target2) / 2;
      const risk = (price - stop) / price;
      const reward = (avgTarget - price) / price;
      if(reward>0&&risk>0) results.push({ day:i, price, stop, target:avgTarget, risk, reward, rr:reward/risk, strat:6, atr:atrV, pctAboveEMA20 });
    }
  }
  return results;
}

// Strategy 7: Hybrid — SMA20 breakout + ATR stops + volume filter (best of current + volatility)
function strategy7(closes, highs, lows, volumes) {
  const n = closes.length;
  if (n < 50) return [];
  const sma20 = sma(closes, 20);
  const rsiV = rsi(closes, 14);
  const volSma = sma(volumes, 20);
  const results = [];
  for (let i = 30; i < n; i++) {
    const idx20 = i - 19;
    if (idx20 < 0 || idx20 >= sma20.length) continue;
    const price = closes[i], s20 = sma20[idx20], r = rsiV[idx20 - 6];
    if (!r) continue;
    const pct = (price - s20) / s20 * 100;
    let wasBelow = false, crossed = false;
    for (let j = Math.max(0, idx20 - 15); j < idx20; j++) {
      if (closes[j + 19] <= sma20[j]) wasBelow = true;
      if (wasBelow && closes[j + 19] > sma20[j]) crossed = true;
    }
    const vol = volumes[i]; const vs = volSma[volSma.length - (n - i)];
    if (!crossed || pct < 0 || pct > 4 || r < 45 || r > 65) continue;
    if (vs && vol < vs) continue;
    const trs = []; for(let k=1;k<=i;k++) trs.push(Math.max(highs[k]-lows[k],Math.abs(highs[k]-closes[k-1]),Math.abs(lows[k]-closes[k-1])));
    const atrV = trs.slice(-14).reduce((a,b)=>a+b,0)/14;
    const stop = price - 1.8 * atrV;
    const target1 = price + 2 * atrV;
    const target2 = price + 4 * atrV;
    const avgTarget = (target1 + target2) / 2;
    const risk = (price - stop) / price;
    const reward = (avgTarget - price) / price;
    if (reward > 0 && risk > 0) results.push({ day:i, price, stop, target:avgTarget, risk, reward, rr:reward/risk, strat:7 });
  }
  return results;
}

// Strategy 8: Filtered SMA20 (S0 + EMA20>EMA50 trend filter + ATR targets)
function strategy8(closes, highs, lows) {
  const n = closes.length;
  if (n < 60) return [];
  const sma20 = sma(closes, 20);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const rsiV = rsi(closes, 14);
  const results = [];
  for (let i = 55; i < n; i++) {
    const idx20 = i - 19;
    if (idx20 < 0 || idx20 >= sma20.length) continue;
    const price = closes[i], s20 = sma20[idx20], r = rsiV[idx20 - 6];
    if (!r) continue;
    const pct = (price - s20) / s20 * 100;
    // Trend filter: short-term uptrend
    if (ema20[i] < ema50[i]) continue;
    let wasBelow = false, crossed = false;
    for (let j = Math.max(0, idx20 - 15); j < idx20; j++) {
      if (closes[j + 19] <= sma20[j]) wasBelow = true;
      if (wasBelow && closes[j + 19] > sma20[j]) crossed = true;
    }
    if (crossed && pct >= 0 && pct <= 4 && r >= 45 && r <= 65) {
      const trs = []; for(let k=1;k<=i;k++) trs.push(Math.max(highs[k]-lows[k],Math.abs(highs[k]-closes[k-1]),Math.abs(lows[k]-closes[k-1])));
      const atrV = trs.slice(-14).reduce((a,b)=>a+b,0)/14;
      const stop = price - 1.5 * atrV;
      const target = price + 2.5 * atrV;
      const risk = (price - stop) / price;
      const reward = (target - price) / price;
      if (reward > 0 && risk > 0 && reward/risk > 1) results.push({ day:i, price, stop, target, risk, reward, rr:reward/risk, strat:8 });
    }
  }
  return results;
}

// Strategy 9: Mean Reversion - overextended pullback to EMA50 + volume climax
function strategy9(closes, highs, lows, volumes) {
  const n = closes.length;
  if (n < 60) return [];
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const rsiV = rsi(closes, 14);
  const bbV = bb(closes, 20, 2.5);
  const results = [];
  for (let i = 55; i < n; i++) {
    const price = closes[i];
    if (price < ema50[i]) continue;
    const r = rsiV[rsiV.length - (n - i)];
    if (!r || r > 40) continue;
    const bbIdx = bbV.lower.length - (n - i);
    const bbL = bbV.lower[bbIdx];
    if (!bbL || price > bbL) continue;

    // Oversold bounce setup: price touched BB lower, RSI < 40, but above EMA50 (uptrend)
    const trs = []; for(let k=1;k<=i;k++) trs.push(Math.max(highs[k]-lows[k],Math.abs(highs[k]-closes[k-1]),Math.abs(lows[k]-closes[k-1])));
    const atrV = trs.slice(-14).reduce((a,b)=>a+b,0)/14;
    const stop = price - atrV;
    const target = price + 2 * atrV;
    const risk = (price - stop) / price;
    const reward = (target - price) / price;
    if (reward > 0 && risk > 0) results.push({ day:i, price, stop, target, risk, reward, rr:reward/risk, strat:9 });
  }
  return results;
}

// ===== SIMULATE TRADE =====
function simulate(signals, closes) {
  if (signals.length === 0) return { trades: 0, wins: 0, losses: 0, totalReturn: 0, maxDrawdown: 0, profitFactor: 0, sharpe: 0, avgHoldingDays: 0 };
  let wins = 0, losses = 0, totalReturn = 0, equity = [10000];
  let peak = 10000, maxDD = 0, tradeReturns = [], holdingDays = [];

  for (const sig of signals) {
    const entry = sig.price;
    const stop = sig.stop;
    const target = sig.target;
    const entryIdx = sig.day;

    // Simulate forward: check if hit stop or target first
    let exitPrice = null, exitDay = entryIdx + 1;
    const maxLookahead = Math.min(entryIdx + 45, closes.length - 1);
    for (let d = entryIdx + 1; d <= maxLookahead; d++) {
      if (closes[d] <= stop) { exitPrice = stop; exitDay = d; break; }
      if (closes[d] >= target) { exitPrice = target; exitDay = d; break; }
    }
    if (!exitPrice) { exitPrice = closes[Math.min(entryIdx + 30, closes.length - 1)]; exitDay = Math.min(entryIdx + 30, closes.length - 1); }

    const ret = (exitPrice - entry) / entry;
    if (ret > 0) wins++; else losses++;
    totalReturn += ret;
    tradeReturns.push(ret);
    holdingDays.push(exitDay - entryIdx);

    equity.push(equity[equity.length - 1] * (1 + ret));
    if (equity[equity.length - 1] > peak) peak = equity[equity.length - 1];
    const dd = (peak - equity[equity.length - 1]) / peak;
    if (dd > maxDD) maxDD = dd;
  }

  const trades = signals.length;
  const winRate = trades > 0 ? wins / trades : 0;
  const avgRet = tradeReturns.length > 0 ? tradeReturns.reduce((a,b) => a+b, 0) / tradeReturns.length : 0;
  const avgPosRet = tradeReturns.filter(r => r > 0);
  const avgNegRet = tradeReturns.filter(r => r < 0);
  const avgWin = avgPosRet.length > 0 ? avgPosRet.reduce((a,b) => a+b, 0) / avgPosRet.length : 0;
  const avgLoss = avgNegRet.length > 0 ? avgNegRet.reduce((a,b) => a+b, 0) / avgNegRet.length : 0;
  const profitFactor = avgLoss !== 0 ? Math.abs((wins * avgWin) / (losses * avgLoss)) : wins > 0 ? 99 : 0;
  const avgHolding = holdingDays.length > 0 ? holdingDays.reduce((a,b) => a+b, 0) / holdingDays.length : 0;

  // Sharpe ratio (using daily returns approximation)
  const avgDailyRet = avgRet / avgHolding || 0;
  const variance = tradeReturns.map(r => Math.pow(r - avgRet, 2)).reduce((a,b)=>a+b,0) / tradeReturns.length || 0.0001;
  const sharpe = Math.sqrt(365) * avgDailyRet / Math.sqrt(variance);

  return { trades, wins, losses, winRate: +(winRate*100).toFixed(1), totalReturn: +(totalReturn*100).toFixed(1), maxDrawdown: +(maxDD*100).toFixed(1), profitFactor: +profitFactor.toFixed(2), sharpe: +sharpe.toFixed(2), avgHoldingDays: +avgHolding.toFixed(1), avgWin: +(avgWin*100).toFixed(1), avgLoss: +(avgLoss*100).toFixed(1) };
}

// ===== MAIN =====
async function main() {
  // Get top 15 coins by volume from MEXC
  console.log('=== STRATEGY BACKTEST ===\n');
  const tickerData = await fetch('https://api.mexc.com/api/v3/ticker/24hr');
  const tickers = JSON.parse(tickerData).filter(t => t.symbol.endsWith('USDT'))
    .sort((a,b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
    .slice(0, 15);

  const stableFilter = ['USDC','USDD','TUSD','BUSD','DAI','FDUSD','USD1','USDE','BRL','EUR','GBP','JPY','TRY','AUD','CAD','CHF','USTC','BKRW','USDP','BFUSD','RLUSD'];
  const realCoins = tickers.filter(t => !stableFilter.some(s => t.symbol.includes(s)));
  const coins = realCoins.map(t => ({ symbol: t.symbol, name: t.symbol.replace('USDT',''), vol: t.quoteVolume }));
  console.log(`Testing on ${coins.length} coins:\n${coins.map(c => c.name).join(', ')}\n`);

  const coinResults = {}; // { "BTC": { 0: {...}, 1: {...}, ... } }

  for (const coin of coins) {
    console.log(`\n=== ${coin.name} ===`);
    process.stdout.write('  Fetching daily data...');
    const dailyData = await fetch(`https://api.mexc.com/api/v3/klines?symbol=${coin.symbol}&interval=1d&limit=365`);
    const daily = JSON.parse(dailyData);
    const closes = daily.map(k => parseFloat(k[4]));
    const highs = daily.map(k => parseFloat(k[2]));
    const lows = daily.map(k => parseFloat(k[3]));
    const volumes = daily.map(k => parseFloat(k[5]));
    console.log(` ${closes.length} days`);
    if (closes.length < 220) { console.log('  Skipping (not enough data)'); continue; }

    // Run all strategies
    process.stdout.write('  Running strategies...');
    const s0 = strategy0(closes, highs, lows);
    const s1 = strategy1(closes, highs, lows);
    const s2 = strategy2(closes, highs, lows, volumes);
    const s3 = strategy3(closes, highs, lows);
    const s4 = strategy4(closes, highs, lows, volumes);
    const s5 = strategy5(closes, highs, lows);
    const s6 = strategy6(closes, highs, lows, volumes);
    const s7 = strategy7(closes, highs, lows, volumes);
    const s8 = strategy8(closes, highs, lows);
    const s9 = strategy9(closes, highs, lows, volumes);
    console.log(` S0:${s0.length} S1:${s1.length} S2:${s2.length} S3:${s3.length} S4:${s4.length} S5:${s5.length} S6:${s6.length} S7:${s7.length} S8:${s8.length} S9:${s9.length} trades`);

    // Simulate each
    const r0 = simulate(s0, closes);
    const r1 = simulate(s1, closes);
    const r2 = simulate(s2, closes);
    const r3 = simulate(s3, closes);
    const r4 = simulate(s4, closes);
    const r5 = simulate(s5, closes);
    const r6 = simulate(s6, closes);
    const r7 = simulate(s7, closes);
    const r8 = simulate(s8, closes);
    const r9 = simulate(s9, closes);

    coinResults[coin.name] = { 0: r0, 1: r1, 2: r2, 3: r3, 4: r4, 5: r5, 6: r6, 7: r7, 8: r8, 9: r9 };

    console.log(`  S0(SMA20):      ${r0.trades} tr | WR:${r0.winRate}% | R:${r0.totalReturn}% | DD:${r0.maxDrawdown}% | PF:${r0.profitFactor} | S:${r0.sharpe}`);
    console.log(`  S8(FiltSMA20):  ${r8.trades} tr | WR:${r8.winRate}% | R:${r8.totalReturn}% | DD:${r8.maxDrawdown}% | PF:${r8.profitFactor} | S:${r8.sharpe}`);
    console.log(`  S5(SMA20+ATR):  ${r5.trades} tr | WR:${r5.winRate}% | R:${r5.totalReturn}% | DD:${r5.maxDrawdown}% | PF:${r5.profitFactor} | S:${r5.sharpe}`);
    console.log(`  S7(Hybrid):     ${r7.trades} tr | WR:${r7.winRate}% | R:${r7.totalReturn}% | DD:${r7.maxDrawdown}% | PF:${r7.profitFactor} | S:${r7.sharpe}`);
    console.log(`  S9(MeanRev):    ${r9.trades} tr | WR:${r9.winRate}% | R:${r9.totalReturn}% | DD:${r9.maxDrawdown}% | PF:${r9.profitFactor} | S:${r9.sharpe}`);
    console.log(`  S1(Triad):      ${r1.trades} tr | WR:${r1.winRate}% | R:${r1.totalReturn}% | DD:${r1.maxDrawdown}% | PF:${r1.profitFactor} | S:${r1.sharpe}`);
  }

  // ===== AGGREGATE =====
  console.log('\n\n========== FINAL AGGREGATED RESULTS ==========');
  const strategyNames = ['S0: SMA20+RSI', 'S1: Triad(EMA200)', 'S2: Enhanced Triad', 'S3: Ichimoku', 'S4: Factor Scoring', 'S5: SMA20+ATR', 'S6: MomBreakout', 'S7: Hybrid', 'S8: FilteredSMA20', 'S9: MeanRev EMA50'];
  const totals = Array.from({length: 10}, () => ({trades:0,wins:0,losses:0,totalReturn:0,totalTrades:0,totalWins:0,totalLosses:0,coins:0,winRates:[],profitFactors:[],sharpeRatios:[],drawdowns:[],avgHoldingDays:[]}));
  for(let s=0;s<10;s++) totals[s] = ({trades:0,wins:0,losses:0,totalReturn:0,totalTrades:0,totalWins:0,totalLosses:0,coins:0,winRates:[],profitFactors:[],sharpeRatios:[],drawdowns:[],avgHoldingDays:[]});

  for (const [coin, results] of Object.entries(coinResults)) {
    for (let s = 0; s < 10; s++) {
      const r = results[s];
      if (r && r.trades > 0) {
        totals[s].coins++;
        totals[s].totalTrades += r.trades;
        totals[s].totalWins += r.wins;
        totals[s].totalLosses += r.losses;
        totals[s].totalReturn += r.totalReturn;
        totals[s].winRates.push(r.winRate);
        totals[s].profitFactors.push(r.profitFactor);
        totals[s].sharpeRatios.push(r.sharpe);
        totals[s].drawdowns.push(r.maxDrawdown);
        totals[s].avgHoldingDays.push(r.avgHoldingDays);
      }
    }
  }

  console.log('='.repeat(120));
  console.log('Strategy'.padEnd(22) + 'Coins'.padEnd(6) + 'Trades'.padEnd(8) + 'Win%'.padEnd(8) + 'Return%'.padEnd(10) + 'DD%'.padEnd(8) + 'PF'.padEnd(8) + 'Sharpe'.padEnd(8) + 'AvgHold'.padEnd(8) + 'Score');
  console.log('='.repeat(120));
  for (let s = 0; s < 10; s++) {
    const t = totals[s];
    const avgWR = t.winRates.length > 0 ? (t.winRates.reduce((a,b)=>a+b,0)/t.winRates.length) : 0;
    const avgPF = t.profitFactors.length > 0 ? (t.profitFactors.reduce((a,b)=>a+b,0)/t.profitFactors.length) : 0;
    const avgSH = t.sharpeRatios.length > 0 ? (t.sharpeRatios.reduce((a,b)=>a+b,0)/t.sharpeRatios.length) : 0;
    const avgDD = t.drawdowns.length > 0 ? (t.drawdowns.reduce((a,b)=>a+b,0)/t.drawdowns.length) : 0;
    const avgHold = t.avgHoldingDays.length > 0 ? (t.avgHoldingDays.reduce((a,b)=>a+b,0)/t.avgHoldingDays.length) : 0;
    // Composite score: winRate * return * sharpe / (dd + 0.1)
    const score = avgWR * Math.max(0, t.totalReturn + 50) * Math.max(0, avgSH + 2) / (avgDD + 5);
    if (isNaN(score) || !isFinite(score)) continue;
    console.log(`${strategyNames[s].padEnd(22)} ${String(t.coins).padEnd(5)} ${String(t.totalTrades).padEnd(7)} ${avgWR.toFixed(1).padEnd(7)} ${t.totalReturn.toFixed(1).padEnd(9)} ${avgDD.toFixed(1).padEnd(7)} ${(avgPF>99?'99+':avgPF.toFixed(2)).padEnd(7)} ${avgSH.toFixed(2).padEnd(7)} ${avgHold.toFixed(1).padEnd(7)} ${score.toFixed(0)}`);
  }
  console.log('='.repeat(120));
}

main().catch(console.error);
