$ErrorActionPreference = "SilentlyContinue"

Write-Host "Fetching ticker data from Binance..." -ForegroundColor Cyan
$tickerResp = Invoke-RestMethod -Uri "https://api.binance.com/api/v3/ticker/24hr" -TimeoutSec 30
$usdtPairs = $tickerResp | Where-Object { $_.symbol -like "*USDT" -and $_.symbol -notlike "*UPUSDT" -and $_.symbol -notlike "*DOWNUSDT" -and $_.symbol -notlike "*BULLUSDT" -and $_.symbol -notlike "*BEARUSDT" }

Write-Host "Found $($usdtPairs.Count) USDT pairs on Binance" -ForegroundColor Cyan

# Sort by quoteVolume as proxy for market cap
$sorted = $usdtPairs | Sort-Object { [double]$_.quoteVolume } -Descending | Select-Object -First 80

$matched = @()
$count = 0

foreach ($pair in $sorted) {
    $symbol = $pair.symbol
    $name = $symbol -replace 'USDT', ''
    $vol = [double]$pair.quoteVolume
    $price = [double]$pair.lastPrice
    $volUsd = $vol
    
    # Rough market cap estimate: we can't get exact MC from Binance, but we can use volume as proxy
    if ($volUsd -lt 1000000) { 
        Write-Host "  Skipping $name - low volume" -ForegroundColor DarkGray
        continue 
    }
    
    $count++
    Write-Host "[$count] Processing $name - Vol: $($volUsd.ToString('N0')) USD" -ForegroundColor Gray
    
    try {
        # Get klines (daily candles)
        $klines = Invoke-RestMethod -Uri "https://api.binance.com/api/v3/klines?symbol=$symbol&interval=1d&limit=40" -TimeoutSec 15
        
        if ($klines.Count -lt 22) {
            Write-Host "  Insufficient data" -ForegroundColor DarkYellow
            continue
        }
        
        $closes = $klines | ForEach-Object { [double]$_[4] }
        
        # Calculate SMA20
        $sma20Values = @()
        for ($i = 19; $i -lt $closes.Count; $i++) {
            $sum = 0
            for ($j = $i - 19; $j -le $i; $j++) {
                $sum += $closes[$j]
            }
            $sma20Values += $sum / 20
        }
        
        $lastIdx = $sma20Values.Count - 1
        $lastClose = $closes[$lastIdx + 19]
        $lastSma = $sma20Values[$lastIdx]
        $pctFromSma = (($lastClose - $lastSma) / $lastSma) * 100
        
        # Check if currently above SMA20
        $currentAbove = $lastClose -gt $lastSma
        
        # Check for breakout history: was below SMA20 then crossed above
        $wasBelow = $false
        $hadBreakout = $false
        $breakoutIdx = -1
        
        for ($i = 0; $i -lt $sma20Values.Count - 1; $i++) {
            $di = $i + 19
            $c = $closes[$di]
            $s = $sma20Values[$i]
            
            if ($c -le $s) { $wasBelow = $true }
            if ($wasBelow -and $c -gt $s -and $breakoutIdx -eq -1) { 
                $hadBreakout = $true
                $breakoutIdx = $i
            }
        }
        
        # Condition: Currently above SMA20, had a breakout, and price is near SMA20 (retesting)
        # OR currently just above/at SMA20 (could be retesting)
        if ($currentAbove -and $pctFromSma -le 3.5) {
            $isRetest = $hadBreakout -and $pctFromSma -le 3
            $status = if ($isRetest) { "RETESTING SMA20" } else { "NEAR SMA20" }
            
            $matched += [PSCustomObject]@{
                Symbol = $name
                Price = $price
                SMA20 = [Math]::Round($lastSma, 8)
                PctFromSMA20 = [Math]::Round($pctFromSma, 2)
                Volume24h = $volUsd.ToString('N0')
                Status = $status
            }
            Write-Host "  >> MATCH: $name at $([Math]::Round($pctFromSma, 2))% from SMA20 ($status)" -ForegroundColor Green
        }
        elseif ($currentAbove) {
            Write-Host "  Above SMA20 but at $([Math]::Round($pctFromSma, 2))% (too far)" -ForegroundColor DarkGray
        }
        else {
            Write-Host "  Below SMA20 ($([Math]::Round($pctFromSma, 2))%)" -ForegroundColor DarkGray
        }
        
        Start-Sleep -Milliseconds 200
    }
    catch {
        Write-Host "  Error on $name : $_" -ForegroundColor Red
    }
}

Write-Host "`n=============================================================" -ForegroundColor Cyan
Write-Host "SCAN RESULTS - Coins near/retesting SMA20 (Daily)" -ForegroundColor Cyan
Write-Host "Conditions: Price broke above SMA20 then came back to retest" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

if ($matched.Count -eq 0) {
    Write-Host "No matching coins found." -ForegroundColor Yellow
}
else {
    $sortedResults = $matched | Sort-Object PctFromSMA20
    $sortedResults | Format-Table -Property @{N='Symbol';E={$_.Symbol.PadRight(12)}}, 
        @{N='Price';E={$_.Price.ToString('N8').PadLeft(14)}}, 
        @{N='SMA20';E={$_.SMA20.ToString('N8').PadLeft(14)}},
        @{N='%FromMA20';E={$_.PctFromSMA20.ToString('N2').PadLeft(8)}},
        @{N='Vol24h(USD)';E={$_.Volume24h.PadLeft(14)}},
        Status -AutoSize
}

Write-Host "`nProcessed $count coins. Found $($matched.Count) matches." -ForegroundColor Cyan
