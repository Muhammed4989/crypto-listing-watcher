$ErrorActionPreference = "SilentlyContinue"

Write-Host "=== DEEP CRYPTO SCAN: SMA20 + RSI + VOLUME ===" -ForegroundColor Magenta

$tickerResp = Invoke-RestMethod -Uri "https://api.binance.com/api/v3/ticker/24hr" -TimeoutSec 30
$usdtPairs = $tickerResp | Where-Object { $_.symbol -like "*USDT" -and $_.symbol -notlike "*UPUSDT" -and $_.symbol -notlike "*DOWNUSDT" -and $_.symbol -notlike "*BULLUSDT" -and $_.symbol -notlike "*BEARUSDT" }
$stableFilter = @("USDC","USDT","BUSD","DAI","TUSD","USDP","USDD","FDUSD","USD1","RLUSD","USDE","BFUSD","USTC","EUR","GBP","JPY","BRL","TRY","EUR","USDS","USDG","USD0","USDTB","USDF","USDY","USD","U")
$pairs = $usdtPairs | Where-Object { 
    $sym = $_.symbol -replace 'USDT', ''
    $stableFilter -notcontains $sym 
}
$sorted = $pairs | Sort-Object { [double]$_.quoteVolume } -Descending | Select-Object -First 200

$results = @()
$count = 0

foreach ($pair in $sorted) {
    $symbol = $pair.symbol
    $name = $symbol -replace 'USDT', ''
    $vol = [double]$pair.quoteVolume
    $price = [double]$pair.lastPrice
    if ($vol -lt 50000) { continue }
    $count++

    try {
        $klines = Invoke-RestMethod -Uri "https://api.binance.com/api/v3/klines?symbol=$symbol&interval=1d&limit=45" -TimeoutSec 10
        if ($klines.Count -lt 30) { continue }

        $closes = $klines | ForEach-Object { [double]$_[4] }
        $volumes = $klines | ForEach-Object { [double]$_[5] }
        $highs = $klines | ForEach-Object { [double]$_[2] }
        $lows = $klines | ForEach-Object { [double]$_[3] }
        $n = $closes.Count

        # --- SMA20 ---
        $sma20 = @()
        for ($i = 19; $i -lt $n; $i++) { $sum = 0; for ($j = $i - 19; $j -le $i; $j++) { $sum += $closes[$j] }; $sma20 += $sum / 20 }
        $lastIdx = $sma20.Count - 1
        $lastClose = $closes[$lastIdx + 19]
        $lastSma = $sma20[$lastIdx]
        $pctSma20 = (($lastClose - $lastSma) / $lastSma) * 100
        $aboveSMA = $lastClose -gt $lastSma

        # --- Breakout detection ---
        $crossedAbove = $false
        $wasBelow = $false
        $crossIdx = -1
        for ($i = 0; $i -lt $sma20.Count; $i++) {
            $di = $i + 19; $c = $closes[$di]; $s = $sma20[$i]
            if ($c -le $s) { $wasBelow = $true }
            if ($wasBelow -and $c -gt $s -and $crossIdx -eq -1) { $crossedAbove = $true; $crossIdx = $i }
        }

        if (-not $aboveSMA) { continue }

        # --- RSI(14) ---
        $rsiPeriod = 14
        $gains = @(); $losses = @()
        for ($i = 1; $i -lt $n; $i++) { $diff = $closes[$i] - $closes[$i-1]; $gains += [Math]::Max($diff, 0); $losses += [Math]::Max(-$diff, 0) }

        $avgGain = ($gains[0..($rsiPeriod-1)] | Measure-Object -Average).Average
        $avgLoss = ($losses[0..($rsiPeriod-1)] | Measure-Object -Average).Average
        $rsiValues = @()
        for ($i = $rsiPeriod; $i -lt $gains.Count; $i++) {
            $avgGain = (($avgGain * 13) + $gains[$i]) / 14
            $avgLoss = (($avgLoss * 13) + $losses[$i]) / 14
            if ($avgLoss -eq 0) { $rsiValues += 100 } else { $rsiValues += 100 - (100 / (1 + ($avgGain / $avgLoss))) }
        }
        $currentRsi = $rsiValues[-1]
        $prevRsi = if ($rsiValues.Count -ge 2) { $rsiValues[-2] } else { $currentRsi }

        # --- Volume analysis ---
        $breakoutCandle = $crossIdx + 19  # index in original array
        if ($crossedAbove -and $breakoutCandle -gt 0 -and $breakoutCandle -lt ($n - 1)) {
            $breakoutVol = $volumes[$breakoutCandle]
            $avgVol10 = ($volumes[($breakoutCandle-10)..($breakoutCandle-1)] | Measure-Object -Average).Average
            $volRatioBreakout = if ($avgVol10 -gt 0) { $breakoutVol / $avgVol10 } else { 1 }
        } else { $volRatioBreakout = 0 }

        # Current volume vs 10-day average
        $lastVol = $volumes[-1]
        $avgVolRecent = ($volumes[-11..-2] | Measure-Object -Average).Average
        $volRatioNow = if ($avgVolRecent -gt 0) { $lastVol / $avgVolRecent } else { 1 }

        # --- RSI divergence check (bearish if price went up but RSI went down) ---
        if ($crossedAbove -and $crossIdx -ge 2) {
            $rsiAtBreakout = if ($crossIdx -lt $rsiValues.Count) { $rsiValues[$crossIdx] } else { $null }
            $priceAtBreakout = $closes[$crossIdx + 19]
            
            $peakPriceAfter = ($closes[($crossIdx+20)..($n-1)] | Measure-Object -Maximum).Maximum
            $peakPriceIdx = [Array]::IndexOf($closes, $peakPriceAfter)
            $rsiAtPeak = if ($peakPriceIdx -ge 19 -and ($peakPriceIdx - 19) -lt $rsiValues.Count) { $rsiValues[$peakPriceIdx - 19] } else { $null }
            $divergence = "none"
            if ($null -ne $rsiAtBreakout -and $null -ne $rsiAtPeak -and $peakPriceAfter -gt $priceAtBreakout -and $rsiAtPeak -lt $rsiAtBreakout) {
                $divergence = "BEARISH_DIVERGENCE"
            }
        } else { $divergence = "none" }

        if ($aboveSMA -and $pctSma20 -le 6) {
            # Determine retest quality
            $isRetest = $crossedAbove -and $pctSma20 -le 3.5
            $declining = $false
            if ($crossedAbove -and $crossIdx -ge 0 -and $sma20.Count - $crossIdx -ge 3) {
                $pct3dAgo = (($closes[$lastIdx + 16] - $sma20[$lastIdx - 3]) / $sma20[$lastIdx - 3]) * 100
                $declining = $pct3dAgo -gt $pctSma20
            }

            $status = if ($isRetest -and $declining) { "RETESTING" } 
                      elseif ($declining) { "DECLINING_TOWARD" }
                      elseif ($crossedAbove) { "POST_BREAKOUT" }
                      else { "NEAR_SMA20" }

            # Volume signal
            $volSignal = if ($volRatioNow -gt 1.5) { "HIGH" } elseif ($volRatioNow -gt 0.7) { "NORMAL" } else { "LOW" }
            
            # RSI signal
            $rsiSignal = if ($currentRsi -ge 70) { "OVERBOUGHT" } elseif ($currentRsi -le 30) { "OVERSOLD" } elseif ($currentRsi -ge 40 -and $currentRsi -le 60) { "NEUTRAL" } else { "MODERATE" }

            $results += [PSCustomObject]@{
                Name = $name
                Price = $price
                SMA20Pct = [Math]::Round($pctSma20, 2)
                RSI = [Math]::Round($currentRsi, 1)
                RSI_Prev = [Math]::Round($prevRsi, 1)
                VolRatio = [Math]::Round($volRatioNow, 2)
                BreakoutVolRatio = [Math]::Round($volRatioBreakout, 2)
                Vol24h = $vol.ToString('N0')
                RSI_Signal = $rsiSignal
                Vol_Signal = $volSignal
                Divergence = $divergence
                Status = $status
            }
        }
        Start-Sleep -Milliseconds 80
    } catch {}
}

Write-Host "`n=============================================================" -ForegroundColor Magenta
Write-Host "DEEP SCAN - Coins above SMA20 on Daily (with RSI + Volume)" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Magenta

if ($results.Count -eq 0) { Write-Host "None found." -ForegroundColor Yellow; exit }

# Best: RETESTING + NEUTRAL RSI + good vol
$retests = $results | Where-Object { $_.Status -eq "RETESTING" }
$declining = $results | Where-Object { $_.Status -eq "DECLINING_TOWARD" }
$others = $results | Where-Object { $_.Status -ne "RETESTING" -and $_.Status -ne "DECLINING_TOWARD" }

if ($retests.Count -gt 0) {
    Write-Host "`n>>> BREAKOUT + RETESTING (best candidates) <<<" -ForegroundColor Green
    $retests | Sort-Object SMA20Pct | Select-Object Name, Price, SMA20Pct, RSI, @{N='RSI_Signal';E={$_.RSI_Signal}}, @{N='VolRatio';E={$_.VolRatio}}, @{N='Vol24h';E={$_.Vol24h}}, Divergence, Status | Format-Table -AutoSize
}
if ($declining.Count -gt 0) {
    Write-Host "`n>>> DECLINING TOWARD SMA20 (watchlist) <<<" -ForegroundColor Yellow
    $declining | Sort-Object SMA20Pct | Select-Object Name, Price, SMA20Pct, RSI, @{N='RSI_Signal';E={$_.RSI_Signal}}, @{N='VolRatio';E={$_.VolRatio}}, @{N='Vol24h';E={$_.Vol24h}}, Divergence, @{N='BrkVol';E={$_.BreakoutVolRatio}} | Format-Table -AutoSize
}
if ($others.Count -gt 0) {
    Write-Host "`n>>> OTHER above SMA20 <<<" -ForegroundColor DarkGray
    $others | Sort-Object SMA20Pct | Select-Object Name, Price, SMA20Pct, RSI, RSI_Signal, VolRatio, Vol24h, Status | Format-Table -AutoSize
}

Write-Host "`nScanned $count coins. Found $($results.Count) above SMA20, $($retests.Count) retesting." -ForegroundColor Cyan
