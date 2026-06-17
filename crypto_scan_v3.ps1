$ErrorActionPreference = "SilentlyContinue"

Write-Host "Fetching ticker data from Binance..." -ForegroundColor Cyan
$tickerResp = Invoke-RestMethod -Uri "https://api.binance.com/api/v3/ticker/24hr" -TimeoutSec 30
$usdtPairs = $tickerResp | Where-Object { $_.symbol -like "*USDT" -and $_.symbol -notlike "*UPUSDT" -and $_.symbol -notlike "*DOWNUSDT" -and $_.symbol -notlike "*BULLUSDT" -and $_.symbol -notlike "*BEARUSDT" -and $_.symbol -notlike "*BKRW*" -and $_.symbol -notlike "*EUR*" -and $_.symbol -notlike "*GBP*" -and $_.symbol -notlike "*JPY*" -and $_.symbol -notlike "*BRL*" -and $_.symbol -notlike "*TRY*" -and $_.symbol -notlike "*DAI*" -and $_.symbol -notlike "*TUSD*" -and $_.symbol -notlike "*USDP*" -and $_.symbol -notlike "*USDC*" -and $_.symbol -notlike "*FDUSD*" -and $_.symbol -notlike "*USDD*" -and $_.symbol -notlike "*BFUSD*" -and $_.symbol -notlike "*USD1*" -and $_.symbol -notlike "*RLUSD*" -and $_.symbol -notlike "*USDE*" -and $_.symbol -notlike "*USTC*" -and $_.symbol -notlike "*BUSD*" -and $_.symbol -notlike "*USDP*" }

Write-Host "Found $($usdtPairs.Count) non-stable USDT pairs" -ForegroundColor Cyan

$sorted = $usdtPairs | Sort-Object { [double]$_.quoteVolume } -Descending | Select-Object -First 200

$results = @()
$count = 0

foreach ($pair in $sorted) {
    $symbol = $pair.symbol
    $name = $symbol -replace 'USDT', ''
    $vol = [double]$pair.quoteVolume
    $price = [double]$pair.lastPrice
    if ($vol -lt 50000) { continue }
    
    $count++
    Write-Host "[$count] $name - Vol: $($vol.ToString('N0'))" -ForegroundColor Gray
    
    try {
        $klines = Invoke-RestMethod -Uri "https://api.binance.com/api/v3/klines?symbol=$symbol&interval=1d&limit=40" -TimeoutSec 10
        
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
        
        # Detect breakout: was below SMA20 then crossed above
        $crossedAbove = $false
        $wasBelow = $false
        $firstCrossIdx = -1
        $recentBelow = $false
        
        for ($i = 0; $i -lt $sma20.Count; $i++) {
            $di = $i + 19
            $c = $closes[$di]
            $s = $sma20[$i]
            if ($c -le $s) { $wasBelow = $true }
            if ($wasBelow -and $c -gt $s -and $firstCrossIdx -eq -1) {
                $crossedAbove = $true
                $firstCrossIdx = $i
            }
        }
        
        # Check if price has been declining TOWARD SMA20 in recent days (retesting)
        $decliningTowardSma = $false
        if ($currentAbove -and $firstCrossIdx -ge 0) {
            $daysSinceCross = $sma20.Count - 1 - $firstCrossIdx
            if ($daysSinceCross -ge 2) {
                # Check last 3 candles trend toward SMA20
                $pct2 = (($closes[$lastIdx + 17] - $sma20[$lastIdx - 1]) / $sma20[$lastIdx - 1]) * 100
                $pct1 = (($closes[$lastIdx + 18] - $sma20[$lastIdx - 1]) / $sma20[$lastIdx - 1]) * 100  # approximate
                if (($pct2 -gt $pct1 -or $pct1 -gt $pct) -and $pct -lt $pct2) {
                    $decliningTowardSma = $true
                }
            }
        }
        
        # Store coin if near SMA20
        if ($currentAbove -and $pct -le 6) {
            $isRetest = $crossedAbove -and $pct -le 3
            $status = if ($isRetest) { "BREAKOUT+RETEST" } 
                     elseif ($crossedAbove -and $decliningTowardSma) { "POST-BREAKOUT declining" }
                     elseif ($crossedAbove) { "POST-BREAKOUT" }
                     else { "NEAR SMA20" }
            
            $results += [PSCustomObject]@{
                Name = $name
                Price = $price
                SMA20 = [Math]::Round($lastSma, 8)
                Pct = [Math]::Round($pct, 2)
                Vol = $vol
                VolStr = $vol.ToString('N0')
                Status = $status
            }
        }
        
        Start-Sleep -Milliseconds 100
    }
    catch {}
}

Write-Host "`n=============================================================" -ForegroundColor Cyan
Write-Host "RESULTS: Coins above SMA20 on Daily (non-stablecoins)" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

if ($results.Count -eq 0) {
    Write-Host "No coins found above SMA20." -ForegroundColor Yellow
}
else {
    $sortedR = $results | Sort-Object Pct
    
    # Group by status
    $retests = $sortedR | Where-Object { $_.Status -eq "BREAKOUT+RETEST" }
    $declining = $sortedR | Where-Object { $_.Status -eq "POST-BREAKOUT declining" }
    $others = $sortedR | Where-Object { $_.Status -ne "BREAKOUT+RETEST" -and $_.Status -ne "POST-BREAKOUT declining" }
    
    if ($retests.Count -gt 0) {
        Write-Host "`n>>> BREAKOUT + RETEST (best candidates) <<<" -ForegroundColor Green
        $retests | Sort-Object Pct | Format-Table Name, @{N='Price';E={$_.Price.ToString('N8')}}, @{N='SMA20';E={$_.SMA20.ToString('N8')}}, @{N='%AboveMA20';E={$_.Pct}}, VolStr, Status -AutoSize
    }
    
    if ($declining.Count -gt 0) {
        Write-Host "`n>>> POST-BREAKOUT declining toward SMA20 <<<" -ForegroundColor Yellow
        $declining | Sort-Object Pct | Format-Table Name, @{N='Price';E={$_.Price.ToString('N8')}}, @{N='SMA20';E={$_.SMA20.ToString('N8')}}, @{N='%AboveMA20';E={$_.Pct}}, VolStr, Status -AutoSize
    }
    
    if ($others.Count -gt 0) {
        Write-Host "`n>>> Other coins above SMA20 <<<" -ForegroundColor DarkGray
        $others | Sort-Object Pct | Format-Table Name, @{N='Price';E={$_.Price.ToString('N8')}}, @{N='SMA20';E={$_.SMA20.ToString('N8')}}, @{N='%AboveMA20';E={$_.Pct}}, VolStr, Status -AutoSize
    }
}

Write-Host "`nScanned $count coins. Found $($results.Count) above SMA20." -ForegroundColor Cyan
Write-Host "Of those, $($retests.Count) are in BREAKOUT+RETEST pattern." -ForegroundColor Cyan
