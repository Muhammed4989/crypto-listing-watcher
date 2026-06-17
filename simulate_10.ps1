$ErrorActionPreference = "SilentlyContinue"
Write-Host "=== SIMULATING 10 SMA20 BREAKOUT TRADES (Backtest on past 30 days) ===" -ForegroundColor Magenta

$tickerResp = Invoke-RestMethod -Uri "https://api.binance.com/api/v3/ticker/24hr" -TimeoutSec 30
$pairs = $tickerResp | Where-Object { $_.symbol -like "*USDT" -and $_.symbol -notlike "*UP*" -and $_.symbol -notlike "*DOWN*" }
$sorted = $pairs | Sort-Object { [double]$_.quoteVolume } -Descending | Select-Object -First 150

$trades = @()
$count = 0

foreach ($pair in $sorted) {
    $symbol = $pair.symbol; $name = $symbol -replace 'USDT', ''
    $vol = [double]$pair.quoteVolume
    if ($vol -lt 500000) { continue }
    $stable = @("USDC","USDT","BUSD","DAI","TUSD","USDP","USDD","FDUSD","USD1","RLUSD","USDE","BFUSD","USTC","EUR","GBP","JPY","BRL","TRY","USDS","USDG","USDF","USDY","USDTB","USD0")
    if ($stable -contains $name) { continue }

    $count++
    if ($trades.Count -ge 10) { Write-Host "Reached 10 trades, stopping scan" -ForegroundColor Yellow; break }
    

    try {
        $k = Invoke-RestMethod -Uri "https://api.binance.com/api/v3/klines?symbol=$symbol&interval=1d&limit=90" -TimeoutSec 10
        if ($k.Count -lt 40) { continue }

        $closes = $k | ForEach-Object { [double]$_[4] }; $highs = $k | ForEach-Object { [double]$_[2] }; $lows = $k | ForEach-Object { [double]$_[3] }
        $n = $closes.Count

        # SMA
        $sma20 = @()
        for ($i = 19; $i -lt $n; $i++) { $sum=0; for ($j=$i-19;$j-le$i;$j++){$sum+=$closes[$j]}; $sma20+=$sum/20 }

        # ATR
        $atrs = @()
        for ($i=1; $i -lt $n; $i++) {
            $hl=$highs[$i]-$lows[$i]; $hc=[Math]::Abs($highs[$i]-$closes[$i-1]); $lc=[Math]::Abs($lows[$i]-$closes[$i-1])
            $atrs+= [Math]::Max($hl,[Math]::Max($hc,$lc))
        }

        # Find breakout signals in past 30 days (days 20-50 in the array)
        for ($signalDay = 20; $signalDay -lt [Math]::Min(50, $sma20.Count - 5); $signalDay++) {
            $entryIdx = $signalDay + 19
            $entryPrice = $closes[$entryIdx]
            $entrySma = $sma20[$signalDay]
            $pctAbove = (($entryPrice - $entrySma) / $entrySma) * 100

            # Check: was it JUST above SMA20 (retesting, within 3%)
            if ($pctAbove -lt 0 -or $pctAbove -gt 3.5) { continue }

            # Check: was price significantly higher 1-3 days ago (declining into SMA20)?
            $wasHigher = $false
            for ($p = [Math]::Max(0, $signalDay - 3); $p -lt $signalDay; $p++) {
                $prevPct = (($closes[$p + 19] - $sma20[$p]) / $sma20[$p]) * 100
                if ($prevPct -gt $pctAbove + 1.5) { $wasHigher = $true; break }
            }
            if (-not $wasHigher) { continue }

            # Check: was price BELOW SMA20 before the move up (real breakout origin)
            $hadDip = $false
            for ($d = [Math]::Max(0, $signalDay - 10); $d -lt [Math]::Max(0, $signalDay - 3); $d++) {
                if ($closes[$d + 19] -lt $sma20[$d]) { $hadDip = $true; break }
            }
            if (-not $hadDip) { continue }

            # TRADE SETUP
            $atr = ($atrs[($entryIdx-14)..($entryIdx-1)] | Measure-Object -Average).Average
            $stopPrice = $entrySma * 0.975
            $stopPct = (($stopPrice - $entryPrice) / $entryPrice) * 100

            # Target: nearest swing high in last 20 days
            $priorHighs = @()
            for ($h = $entryIdx - 20; $h -lt $entryIdx; $h++) { if ($h -ge 0) { $priorHighs += $highs[$h] } }
            $targetPrice = ($priorHighs | Measure-Object -Maximum).Maximum

            # Ensure targets are realistic
            if ($targetPrice -le $entryPrice -or $targetPrice -gt $entryPrice * 1.3) { $targetPrice = $entryPrice * 1.06 }
            $targetPct = (($targetPrice - $entryPrice) / $entryPrice) * 100

            # Check what happened after entry
            $remaining = $sma20.Count - $signalDay
            $stopHit = $false; $targetHit = $false; $maxPrice = $entryPrice; $minPrice = $entryPrice

            for ($x = $entryIdx + 1; $x -lt $closes.Count; $x++) {
                if ($closes[$x] -gt $maxPrice) { $maxPrice = $closes[$x] }
                if ($lows[$x] -lt $minPrice) { $minPrice = $lows[$x] }
                if ($lows[$x] -le $stopPrice) { $stopHit = $true; break }
                if ($highs[$x] -ge $targetPrice) { $targetHit = $true; break }
            }

            $exitPrice = if ($targetHit) { $targetPrice } else { $stopPrice }
            $pnl = if ($targetHit) { $targetPct } else { $stopPct }
            $daysHeld = 0
            $maxRunup = (($maxPrice - $entryPrice) / $entryPrice) * 100
            $maxDrawdown = -(($entryPrice - $minPrice) / $entryPrice) * 100

            $entryDate = (Get-Date).AddDays(-($closes.Count - 1 - $entryIdx))

            $trades += [PSCustomObject]@{
                Coin = $name
                Entry = [Math]::Round($entryPrice, 6)
                Stop = [Math]::Round($stopPrice, 6)
                Target = [Math]::Round($targetPrice, 6)
                PctAboveSMA = [Math]::Round($pctAbove, 2)
                PnL = [Math]::Round($pnl, 2)
                MaxRunup = [Math]::Round($maxRunup, 2)
                MaxDD = [Math]::Round($maxDrawdown, 2)
                Result = if ($targetHit) { "WIN" } else { "LOSS" }
                Date = $entryDate.ToString('MMM dd')
            }
            $resultIcon = if($targetHit){'✅ WIN'}else{'❌ LOSS'}
            Write-Host "#$($trades.Count) ${name}: Entry=$([Math]::Round($entryPrice,4)) Stop=$([Math]::Round($stopPrice,4)) Target=$([Math]::Round($targetPrice,4)) -> $resultIcon ($([Math]::Round($pnl,2))%)" -ForegroundColor $(if($targetHit){'Green'}else{'Red'})
            break
        }
        Start-Sleep -Milliseconds 80
    } catch {}
}

if ($trades.Count -eq 0) { Write-Host "No setups found."; exit }

$wins = ($trades | Where-Object { $_.PnL -gt 0 } | Measure-Object).Count
$losses = ($trades | Where-Object { $_.PnL -le 0 } | Measure-Object).Count
$totalPnl = ($trades | Measure-Object PnL -Sum).Sum
$avgPnl = ($trades | Measure-Object PnL -Average).Average
$avgRunup = ($trades | Measure-Object MaxRunup -Average).Average
$avgDD = ($trades | Measure-Object MaxDD -Average).Average

Write-Host "`n============================================================" -ForegroundColor Magenta
Write-Host "  TRADER PERFORMANCE REPORT" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Strategy: Buy on SMA20 retest after breakout (Daily)" -ForegroundColor Cyan
Write-Host "Stop:     2.5% below SMA20" -ForegroundColor Cyan
Write-Host "Target:   Prior swing high (capped at +30%)" -ForegroundColor Cyan
Write-Host ""

Write-Host "Total Trades: $($trades.Count)" -ForegroundColor White
Write-Host "Wins: $wins / Losses: $losses" -ForegroundColor $(if($wins -ge $losses){'Green'}else{'Red'})
$wr = ($wins / $trades.Count) * 100
Write-Host "Win Rate: $([Math]::Round($wr,1))%" -ForegroundColor $(if($wr -ge 50){'Green'}else{'Red'})
Write-Host "Total Return: $([Math]::Round($totalPnl,2))%" -ForegroundColor $(if($totalPnl -gt 0){'Green'}else{'Red'})
Write-Host "Avg Return/Trade: $([Math]::Round($avgPnl,2))%" -ForegroundColor $(if($avgPnl -gt 0){'Green'}else{'Red'})
Write-Host "Avg Max Run-up: $([Math]::Round($avgRunup,1))%" -ForegroundColor Green
Write-Host "Avg Max Drawdown: $([Math]::Round($avgDD,1))%" -ForegroundColor Red
$profitFactor = if ($totalPnl -ne 0) { ($wins / [Math]::Max(1,$losses)) * ($avgPnl / [Math]::Abs($avgPnl)) } else { 0 }
Write-Host ""

$trades | Sort-Object Date | Select-Object @{N='#';E={[array]::IndexOf($trades,$_)+1}}, Coin, Entry, PctAboveSMA, Stop, Target, PnL, @{N='Result';E={if($_.PnL -gt 0){'✅'}else{'❌'}}}, MaxRunup, MaxDD, Date | Format-Table -AutoSize
