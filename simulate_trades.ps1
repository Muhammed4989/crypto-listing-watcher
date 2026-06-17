$ErrorActionPreference = "SilentlyContinue"

Write-Host "=== CRYPTO TRADER SIMULATION: 10 SMA20 Breakout+Retest Trades ===" -ForegroundColor Magenta
Write-Host "Strategy: Buy when price breaks above SMA20, hold until stop/target hit"
Write-Host ""

$tickerResp = Invoke-RestMethod -Uri "https://api.binance.com/api/v3/ticker/24hr" -TimeoutSec 30
$usdtPairs = $tickerResp | Where-Object { $_.symbol -like "*USDT" -and $_.symbol -notlike "*UP*" -and $_.symbol -notlike "*DOWN*" -and $_.symbol -notlike "*BULL*" -and $_.symbol -notlike "*BEAR*" }
$stableFilter = @("USDC","USDT","BUSD","DAI","TUSD","USDP","USDD","FDUSD","USD1","RLUSD","USDE","BFUSD","USTC","EUR","GBP","JPY","BRL","TRY","USDS","USDG")
$pairs = $usdtPairs | Where-Object { $stableFilter -notcontains ($_.symbol -replace 'USDT', '') }
$sorted = $pairs | Sort-Object { [double]$_.quoteVolume } -Descending | Select-Object -First 80

$trades = @()
$count = 0

foreach ($pair in $sorted) {
    $symbol = $pair.symbol
    $name = $symbol -replace 'USDT', ''
    $vol = [double]$pair.quoteVolume
    if ($vol -lt 2000000) { continue }
    $count++

    try {
        $k = Invoke-RestMethod -Uri "https://api.binance.com/api/v3/klines?symbol=$symbol&interval=1d&limit=90" -TimeoutSec 10
        if ($k.Count -lt 60) { continue }

        $closes = $k | ForEach-Object { [double]$_[4] }
        $highs = $k | ForEach-Object { [double]$_[2] }
        $lows = $k | ForEach-Object { [double]$_[3] }

        $n = $closes.Count

        # SMA20 function
        $sma20 = @()
        for ($i = 19; $i -lt $n; $i++) {
            $sum = 0; for ($j = $i - 19; $j -le $i; $j++) { $sum += $closes[$j] }
            $sma20 += $sum / 20
        }

        # ATR function
        $atrs = @()
        for ($i = 1; $i -lt $n; $i++) {
            $hl = $highs[$i] - $lows[$i]
            $hc = [Math]::Abs($highs[$i] - $closes[$i-1])
            $lc = [Math]::Abs($lows[$i] - $closes[$i-1])
            $atrs += [Math]::Max($hl, [Math]::Max($hc, $lc))
        }

        # Look for a breakout signal in the PAST (5-15 days ago)
        $signalFound = $false
        for ($lookback = 15; $lookback -ge 5; $lookback--) {
            $signalDay = $n - $lookback
            if ($signalDay -lt 20 -or $signalDay -ge $sma20.Count) { continue }

            $signalClose = $closes[$signalDay + 19]
            $signalSma = $sma20[$signalDay]

            # Check: was price below SMA20 for 3+ days before, then crossed above?
            $wasBelow = $true
            for ($b = $signalDay - 3; $b -lt $signalDay; $b++) {
                if ($b -ge 0 -and $closes[$b + 19] -gt $sma20[$b]) { $wasBelow = $false; break }
            }
            if (-not $wasBelow) { continue }

            # Breakout confirmed: close above SMA20
            if ($signalClose -le $signalSma) { continue }

            # Check if price THEN retested SMA20 within next 3 days
            $retestDay = -1
            for ($r = $signalDay + 1; $r -lt [Math]::Min($signalDay + 5, $sma20.Count); $r++) {
                $rClose = $closes[$r + 19]
                $rSma = $sma20[$r]
                $pct = (($rClose - $rSma) / $rSma) * 100
                if ($pct -ge 0 -and $pct -le 3.5) { $retestDay = $r; break }
            }

            if ($retestDay -ge 0) {
                # SIMULATED TRADE
                $entryIdx = $retestDay + 19
                $entryPrice = $closes[$entryIdx]
                $entrySma = $sma20[$retestDay]
                $entryDate = (Get-Date).AddDays(-($n - 1 - $entryIdx))

                # Stop: 2% below SMA20
                $stopPrice = $entrySma * 0.98
                $stopPct = (($stopPrice - $entryPrice) / $entryPrice) * 100

                # Target: previous swing high (last 20 days before signal)
                $priorHighs = $highs[($entryIdx - 25)..($entryIdx - 5)]
                $targetPrice = ($priorHighs | Measure-Object -Maximum).Maximum * 0.995
                if ($targetPrice -le $entryPrice) { $targetPrice = $entryPrice * 1.05 }
                $targetPct = (($targetPrice - $entryPrice) / $entryPrice) * 100

                # Simulate what happened: check remaining candles
                $remaining = $sma20.Count - $retestDay - 1
                $stopHit = $false; $targetHit = $false; $exitIdx = -1
                $highestPrice = $entryPrice

                for ($x = $entryIdx + 1; $x -lt $closes.Count; $x++) {
                    $c = $closes[$x]; $h = $highs[$x]; $l = $lows[$x]
                    if ($c -gt $highestPrice) { $highestPrice = $c }
                    if ($l -le $stopPrice -or $c -le $stopPrice) { $stopHit = $true; $exitIdx = $x; break }
                    if ($h -ge $targetPrice -or $c -ge $targetPrice) { $targetHit = $true; $exitIdx = $x; break }
                }

                if ($exitIdx -ge 0) {
                    if ($stopHit) { $exitPrice = $stopPrice; $result = "STOP HIT"; $pnl = $stopPct }
                    else { $exitPrice = $targetPrice; $result = "TARGET HIT"; $pnl = $targetPct }
                    $daysHeld = $exitIdx - $entryIdx
                    $maxRunup = (($highestPrice - $entryPrice) / $entryPrice) * 100

                    $trades += [PSCustomObject]@{
                        Coin = $name
                        Entry = [Math]::Round($entryPrice, 6)
                        Stop = [Math]::Round($stopPrice, 6)
                        Target = [Math]::Round($targetPrice, 6)
                        Exit = [Math]::Round($exitPrice, 6)
                        PnL = [Math]::Round($pnl, 2)
                        Days = $daysHeld
                        MaxRunup = [Math]::Round($maxRunup, 2)
                        Result = $result
                        EntryDate = $entryDate.ToString('MMM dd')
                        SMA20 = [Math]::Round($entrySma, 6)
                        PctAboveSMA20 = [Math]::Round((($entryPrice - $entrySma)/$entrySma)*100, 2)
                    }
                    $signalFound = $true
                    Write-Host "$count. $name - $result ($([Math]::Round($pnl,2))%) - held $daysHeld days" -ForegroundColor $(if($pnl -gt 0){'Green'}else{'Red'})
                    break
                }
            }
        }

        Start-Sleep -Milliseconds 100
    } catch {}
}

Write-Host "`n=============================================" -ForegroundColor Magenta
Write-Host "PERFORMANCE SUMMARY - $($trades.Count) Trades" -ForegroundColor Magenta
Write-Host "=============================================" -ForegroundColor Magenta

if ($trades.Count -eq 0) { Write-Host "No trades found."; exit }

$win = $trades | Where-Object { $_.PnL -gt 0 } | Measure-Object | Select-Object -ExpandProperty Count
$loss = $trades | Where-Object { $_.PnL -le 0 } | Measure-Object | Select-Object -ExpandProperty Count
$totalPnl = ($trades | Measure-Object PnL -Sum).Sum
$avgPnl = ($trades | Measure-Object PnL -Average).Average
$avgDays = ($trades | Measure-Object Days -Average).Average
$avgMaxRunup = ($trades | Measure-Object MaxRunup -Average).Average
$winRate = if ($trades.Count -gt 0) { ($win / $trades.Count) * 100 } else { 0 }

Write-Host "Total Trades: $($trades.Count)" -ForegroundColor White
Write-Host "Wins: $win / Losses: $loss" -ForegroundColor $(if($win -ge $loss){'Green'}else{'Red'})
Write-Host "Win Rate: $([Math]::Round($winRate,1))%" -ForegroundColor $(if($winRate -ge 50){'Green'}else{'Red'})
Write-Host "Total PnL: $([Math]::Round($totalPnl,2))%" -ForegroundColor $(if($totalPnl -gt 0){'Green'}else{'Red'})
Write-Host "Avg PnL/Trade: $([Math]::Round($avgPnl,2))%" -ForegroundColor $(if($avgPnl -gt 0){'Green'}else{'Red'})
Write-Host "Avg Hold Time: $([Math]::Round($avgDays,1)) days"
Write-Host "Avg Max Run-up: $([Math]::Round($avgMaxRunup,1))%"

Write-Host "`n=== TRADE LOG ===" -ForegroundColor Cyan
$trades | Sort-Object { [datetime]::ParseExact($_.EntryDate, 'MMM dd', $null) } | 
    Select-Object @{N='#';E={[array]::IndexOf($trades,$_)+1}}, Coin, Entry, SMA20, Stop, Target, Exit, PnL, Result, Days, MaxRunup | 
    Format-Table -AutoSize
