param(
    [int]$TopN = 60,
    [decimal]$MinMarketCap = 10000000
)

$ErrorActionPreference = "Stop"
$results = @()

Write-Host "Fetching top coins from CoinGecko..." -ForegroundColor Cyan
$resp = Invoke-RestMethod -Uri "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=$TopN&page=1&sparkline=false" -TimeoutSec 30
$coins = $resp | Where-Object { $_.market_cap -gt $MinMarketCap -and $_.symbol -ne 'usdt' -and $_.symbol -ne 'usdc' -and $_.symbol -ne 'dai' -and $_.symbol -ne 'busd' -and $_.symbol -ne 'tusd' -and $_.symbol -ne 'usdd' -and $_.symbol -ne 'usdp' }
Write-Host "Found $($coins.Count) coins with market cap > $($MinMarketCap)N USD (stablecoins excluded)" -ForegroundColor Cyan

$count = 0
$matched = @()

foreach ($coin in $coins) {
    $count++
    $id = $coin.id
    $name = $coin.name
    $symbol = $coin.symbol
    $mc = $coin.market_cap
    $price = $coin.current_price
    
    Write-Host "[$count/$($coins.Count)] Processing $name ($symbol) - MC: $($mc.ToString('N0')) USD" -ForegroundColor Gray
    
    try {
        Start-Sleep -Milliseconds 600
        $ohlc = Invoke-RestMethod -Uri "https://api.coingecko.com/api/v3/coins/$id/ohlc?vs_currency=usd&days=40" -TimeoutSec 15
        
        if ($ohlc.Count -lt 22) {
            Write-Host "  Skipping: insufficient data ($($ohlc.Count) candles)" -ForegroundColor DarkYellow
            continue
        }
        
        $closes = $ohlc | ForEach-Object { $_[4] }
        $timestamps = $ohlc | ForEach-Object { [DateTimeOffset]::FromUnixTimeMilliseconds($_[0]).DateTime }
        
        $sma20Values = @()
        for ($i = 19; $i -lt $closes.Count; $i++) {
            $sum = 0
            for ($j = $i - 19; $j -le $i; $j++) {
                $sum += $closes[$j]
            }
            $sma20Values += $sum / 20
        }
        
        $aboveSmaCount = 0
        $belowSmaCount = 0
        $wasAbove = $false
        $breakoutIndex = -1
        
        for ($i = 0; $i -lt $sma20Values.Count; $i++) {
            $dataIndex = $i + 19
            $close = $closes[$dataIndex]
            $sma = $sma20Values[$i]
            $pctAbove = (($close - $sma) / $sma) * 100
            
            if ($close -gt $sma -and -not $wasAbove) {
                $wasAbove = $true
                if ($breakoutIndex -eq -1) {
                    $breakoutIndex = $i
                }
            }
            elseif ($close -le $sma -and $wasAbove) {
                $wasAbove = $false
            }
            
            if ($i -ge ($sma20Values.Count - 3)) {
                if ($close -gt $sma) { $aboveSmaCount++ }
                else { $belowSmaCount++ }
            }
        }
        
        if ($breakoutIndex -ge 0) {
            $lastIdx = $sma20Values.Count - 1
            $lastClose = $closes[$lastIdx + 19]
            $lastSma = $sma20Values[$lastIdx]
            $pctFromSma = (($lastClose - $lastSma) / $lastSma) * 100
            
            $currentAbove = $lastClose -gt $lastSma
            
            if ($currentAbove -and $pctFromSma -le 3) {
                $matched += [PSCustomObject]@{
                    Name = $name
                    Symbol = $symbol.ToUpper()
                    Price = $price
                    MarketCap = $mc
                    SMA20 = [Math]::Round($lastSma, 4)
                    PriceToSMA20Pct = [Math]::Round($pctFromSma, 2)
                    Status = "RETESTING SMA20 - Bullish"
                }
                Write-Host "  MATCH: $name - Price at $([Math]::Round($pctFromSma, 2))% above SMA20 (retesting)" -ForegroundColor Green
            }
        }
        
        if ($breakoutIndex -lt 0) {
            $lastIdx = $sma20Values.Count - 1
            $lastClose = $closes[$lastIdx + 19]
            $lastSma = $sma20Values[$lastIdx]
            $pctFromSma = (($lastClose - $lastSma) / $lastSma) * 100
            $currentAbove = $lastClose -gt $lastSma
            
            if ($currentAbove -and $pctFromSma -le 5) {
                $matched += [PSCustomObject]@{
                    Name = $name
                    Symbol = $symbol.ToUpper()
                    Price = $price
                    MarketCap = $mc
                    SMA20 = [Math]::Round($lastSma, 4)
                    PriceToSMA20Pct = [Math]::Round($pctFromSma, 2)
                    Status = "NEAR SMA20 (possible recent breakout)"
                }
                Write-Host "  MATCH: $name - Price at $([Math]::Round($pctFromSma, 2))% above SMA20" -ForegroundColor Green
            }
            else {
                Write-Host "  No breakout to SMA20 found" -ForegroundColor DarkGray
            }
        }
    }
    catch {
        Write-Host "  Error: $_" -ForegroundColor Red
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "SCAN RESULTS - Coins near/retesting SMA20" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

if ($matched.Count -eq 0) {
    Write-Host "No matching coins found." -ForegroundColor Yellow
}
else {
    $matched | Format-Table -Property Name, Symbol, Price, SMA20, PriceToSMA20Pct, Status, @{N='MarketCap';E={$_.MarketCap.ToString('N0')}} -AutoSize
}

Write-Host "`nDone! Processed $count coins." -ForegroundColor Cyan
