$ErrorActionPreference = "SilentlyContinue"

Write-Host "Fetching ticker data from Binance..." -ForegroundColor Cyan
$tickerResp = Invoke-RestMethod -Uri "https://api.binance.com/api/v3/ticker/24hr" -TimeoutSec 30
$usdtPairs = $tickerResp | Where-Object { $_.symbol -like "*USDT" -and $_.symbol -notlike "*UPUSDT" -and $_.symbol -notlike "*DOWNUSDT" -and $_.symbol -notlike "*BULLUSDT" -and $_.symbol -notlike "*BEARUSDT" }

Write-Host "Found $($usdtPairs.Count) USDT pairs" -ForegroundColor Cyan

$sorted = $usdtPairs | Sort-Object { [double]$_.quoteVolume } -Descending | Select-Object -First 150

$results = @()
$count = 0

foreach ($pair in $sorted) {
    $symbol = $pair.symbol
    $name = $symbol -replace 'USDT', ''
    $vol = [double]$pair.quoteVolume
    $price = [double]$pair.lastPrice
    if ($vol -lt 100000) { continue }
    
    $count++
    
    try {
        $klines = Invoke-RestMethod -Uri "https://api.binance.com/api/v3/klines?symbol=$symbol&interval=1d&limit=40" -TimeoutSec 15
        
        if ($klines.Count -lt 22) { continue }
        
        $closes = $klines | ForEach-Object { [double]$_[4] }
        
        $sma20 = @()
        for ($i = 19; $i -lt $closes.Count; $i++) {
            $sum = 0
            for ($j = $i - 19; $j -le $i; $j++) { $sum += $closes[$j] }
            $sma20 += $sum / 20
        }
        
        $lastIdx = $sma20.Count - 1
        $lastClose = $closes[$lastIdx + 19]
        $lastSma = $sma20[$lastIdx]
        $pct = (($lastClose - $lastSma) / $lastSma) * 100
        
        $currentAbove = $lastClose -gt $lastSma
        
        # Track history: check if there was a crossover (was below, then went above)
        $crossedAbove = $false
        $crossedAboveIdx = -1
        $wasBelow = $false
        
        for ($i = 0; $i -lt $sma20.Count; $i++) {
            $di = $i + 19
            $c = $closes[$di]
            $s = $sma20[$i]
            if ($c -le $s) { $wasBelow = $true }
            if ($wasBelow -and $c -gt $s -and $crossedAboveIdx -eq -1) {
                $crossedAbove = $true
                $crossedAboveIdx = $i
            }
        }
        
        # Check previous candle position relative to SMA20
        $prevClose = $closes[$lastIdx + 18]
        $prevPct = (($prevClose - $lastSma) / $lastSma) * 100
        
        if ($currentAbove -and $pct -le 5) {
            # Determine status
            if ($crossedAbove -and $pct -le 3) {
                $status = "RETEST after breakout"
            }
            elseif ($crossedAbove) {
                $status = "ABOVE SMA20 (post-breakout)"
            }
            else {
                $status = "NEAR SMA20"
            }
            
            $results += [PSCustomObject]@{
                Name = $name
                Price = $price
                SMA20 = [Math]::Round($lastSma, 8)
                Pct = [Math]::Round($pct, 2)
                PrevPct = [Math]::Round($prevPct, 2)
                Crossed = $crossedAbove
                Vol = $vol.ToString('N0')
                Status = $status
            }
        }
        elseif (-not $currentAbove -and $pct -ge -2 -and $crossedAbove) {
            # Just dipped slightly below SMA20 after being above - could be retesting from below
            $results += [PSCustomObject]@{
                Name = $name
                Price = $price
                SMA20 = [Math]::Round($lastSma, 8)
                Pct = [Math]::Round($pct, 2)
                PrevPct = [Math]::Round($prevPct, 2)
                Crossed = $crossedAbove
                Vol = $vol.ToString('N0')
                Status = "SLIGHTLY BELOW SMA20 (retest)"
            }
        }
        
        Start-Sleep -Milliseconds 150
    }
    catch {}
}

Write-Host "`n=============================================================" -ForegroundColor Cyan
Write-Host "COINS NEAR SMA20 ON DAILY (Breakout + Retest candidates)" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

if ($results.Count -eq 0) {
    Write-Host "No matching coins found." -ForegroundColor Yellow
}
else {
    # Best candidates: retesting after breakout first, then by proximity to SMA20
    $retest = $results | Where-Object { $_.Status -eq "RETEST after breakout" -or $_.Status -eq "SLIGHTLY BELOW SMA20 (retest)" }
    $near = $results | Where-Object { $_.Status -ne "RETEST after breakout" -and $_.Status -ne "SLIGHTLY BELOW SMA20 (retest)" } | Sort-Object { [Math]::Abs($_.Pct) }
    
    if ($retest.Count -gt 0) {
        Write-Host "`n--- RETEST CANDIDATES (broke out then came back to SMA20) ---" -ForegroundColor Green
        $retest | Sort-Object { [Math]::Abs($_.Pct) } | Format-Table Name, @{N='Price';E={$_.Price.ToString('N8')}}, @{N='SMA20';E={$_.SMA20.ToString('N8')}}, @{N='%FromMA20';E={$_.Pct}}, @{N='Prev%';E={$_.PrevPct}}, Vol, Status -AutoSize
    }
    
    if ($near.Count -gt 0) {
        Write-Host "`n--- NEAR SMA20 (potential retest setups) ---" -ForegroundColor Yellow
        $near | Sort-Object { [Math]::Abs($_.Pct) } | Format-Table Name, @{N='Price';E={$_.Price.ToString('N8')}}, @{N='SMA20';E={$_.SMA20.ToString('N8')}}, @{N='%FromMA20';E={$_.Pct}}, @{N='Prev%';E={$_.PrevPct}}, Vol, Status -AutoSize
    }
}

Write-Host "`nScanned $count coins. Found $($results.Count) near SMA20, $($retest.Count) retesting." -ForegroundColor Cyan
