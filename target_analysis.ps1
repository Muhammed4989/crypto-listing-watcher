param($Coin)
$symbol = $Coin.ToUpper() + "USDT"

try {
    $k = Invoke-RestMethod -Uri "https://api.binance.com/api/v3/klines?symbol=$symbol&interval=1d&limit=90" -TimeoutSec 10
    if ($k.Count -lt 30) { Write-Host "Insufficient data"; return }
}
catch { Write-Host "Error fetching data"; return }

$closes = $k | ForEach-Object { [double]$_[4] }
$highs = $k | ForEach-Object { [double]$_[2] }
$lows = $k | ForEach-Object { [double]$_[3] }
$vols = $k | ForEach-Object { [double]$_[5] }
$n = $closes.Count

function Calc-SMA($data, $period) {
    $result = @()
    for ($i = $period - 1; $i -lt $data.Count; $i++) {
        $sum = 0; for ($j = $i - $period + 1; $j -le $i; $j++) { $sum += $data[$j] }
        $result += $sum / $period
    }
    return $result
}

function Calc-RSI($data, $period) {
    $g = @(); $l = @()
    for ($i = 1; $i -lt $data.Count; $i++) { $d = $data[$i] - $data[$i-1]; $g += [Math]::Max($d,0); $l += [Math]::Max(-$d,0) }
    $ag = ($g[0..($period-1)] | Measure-Object -Average).Average
    $al = ($l[0..($period-1)] | Measure-Object -Average).Average
    $r = @()
    for ($i = $period; $i -lt $g.Count; $i++) {
        $ag = (($ag * 13) + $g[$i]) / 14; $al = (($al * 13) + $l[$i]) / 14
        $r += if ($al -eq 0) { 100 } else { 100 - (100 / (1 + ($ag / $al))) }
    }
    return $r
}

$sma20 = Calc-SMA $closes 20
$sma50 = Calc-SMA $closes 50
$li = $sma20.Count - 1
$curPrice = $closes[$li + 19]
$curSma = $sma20[$li]
$pctSma = (($curPrice - $curSma) / $curSma) * 100
$li50 = $sma50.Count - 1
$curSma50 = $sma50[$li50]
$pctSma50 = (($curPrice - $curSma50) / $curSma50) * 100

$rsiVals = Calc-RSI $closes 14
$rsi = [Math]::Round($rsiVals[-1], 1)

$trs = @()
for ($i = 1; $i -lt $n; $i++) {
    $hl = $highs[$i] - $lows[$i]
    $hc = [Math]::Abs($highs[$i] - $closes[$i-1])
    $lc = [Math]::Abs($lows[$i] - $closes[$i-1])
    $trs += [Math]::Max($hl, [Math]::Max($hc, $lc))
}
$atr = ($trs[-14..-1] | Measure-Object -Average).Average

# Swing points
$swingLows = @(); $swingHighs = @()
for ($i = 1; $i -lt ($n - 1); $i++) {
    if ($lows[$i] -lt $lows[$i-1] -and $lows[$i] -lt $lows[$i+1]) { $swingLows += $lows[$i] }
    if ($highs[$i] -gt $highs[$i-1] -and $highs[$i] -gt $highs[$i+1]) { $swingHighs += $highs[$i] }
}

$monthHigh = ($highs[-30..-1] | Measure-Object -Maximum).Maximum
$monthLow = ($lows[-30..-1] | Measure-Object -Minimum).Minimum

# Stop loss calculation
$nearestSupport = ($swingLows | Where-Object { $_ -lt $curPrice } | Sort-Object -Descending | Select-Object -First 1)
if (-not $nearestSupport) { $nearestSupport = $monthLow }
$sma20stop = $curSma * 0.99
$atrStop = $curPrice - ($atr * 2)
$stopPrice = $sma20stop
if ($nearestSupport -gt $stopPrice) { $stopPrice = $nearestSupport }
if ($atrStop -gt $stopPrice) { $stopPrice = $atrStop }
if ($stopPrice -ge $curPrice) { $stopPrice = $curSma * 0.985 }

# Targets
$resistances = @()
if ($curSma50 -gt $curPrice) { $resistances += $curSma50 }
$resistances += $recentHigh = ($highs[-20..-1] | Measure-Object -Maximum).Maximum
$resistances += $monthHigh
$swingHighs | Where-Object { $_ -gt $curPrice } | Sort-Object | Select-Object -First 2 | ForEach-Object { $resistances += $_ }
$resistances = $resistances | Where-Object { $_ -gt $curPrice } | Sort-Object -Unique

$t1 = if ($resistances.Count -ge 1) { $resistances[0] } else { $curPrice * 1.05 }
$t2 = if ($resistances.Count -ge 2) { $resistances[1] } else { $curPrice * 1.12 }

$risk = (($curPrice - $stopPrice) / $curPrice) * 100
$r1 = (($t1 - $curPrice) / $curPrice) * 100
$r2 = (($t2 - $curPrice) / $curPrice) * 100
$rr1 = if ($risk -gt 0) { $r1 / $risk } else { 0 }
$rr2 = if ($risk -gt 0) { $r2 / $risk } else { 0 }

$avgVol30 = ($vols[-30..-1] | Measure-Object -Average).Average
$lastVol = $vols[-1]
$volRatio = $lastVol / $avgVol30

Write-Host "===========================================" -ForegroundColor Magenta
Write-Host "  $Coin ANALYSIS - $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -ForegroundColor Magenta
Write-Host "===========================================" -ForegroundColor Magenta
Write-Host "Price:      $([Math]::Round($curPrice,5))"
Write-Host "RSI(14):    $rsi"
Write-Host "ATR(14):    $([Math]::Round($atr,6))"
Write-Host "`nTrend:" -ForegroundColor Cyan
Write-Host "  SMA20:    $([Math]::Round($curSma,5)) ($([Math]::Round($pctSma,2))%)" -ForegroundColor $(if($pctSma -gt 0){'Green'}else{'Red'})
Write-Host "  SMA50:    $([Math]::Round($curSma50,5)) ($([Math]::Round($pctSma50,2))%)" -ForegroundColor $(if($pctSma50 -gt 0){'Green'}else{'Red'})
Write-Host "  30d High: $([Math]::Round($monthHigh,5))"
Write-Host "  30d Low:  $([Math]::Round($monthLow,5))"
Write-Host "`nVolume:" -ForegroundColor Cyan
Write-Host "  Avg 30d:  $($avgVol30.ToString('N0'))"
Write-Host "  Last:     $($lastVol.ToString('N0')) ($([Math]::Round($volRatio,2))x avg)"

Write-Host "`n=== KEY LEVELS ===" -ForegroundColor Magenta
Write-Host "STOP LOSS:  $([Math]::Round($stopPrice,5)) (-$([Math]::Round($risk,2))%)" -ForegroundColor Red
Write-Host "TARGET 1:   $([Math]::Round($t1,5)) (+$([Math]::Round($r1,2))%) [R:R = $([Math]::Round($rr1,2))]" -ForegroundColor Green
Write-Host "TARGET 2:   $([Math]::Round($t2,5)) (+$([Math]::Round($r2,2))%) [R:R = $([Math]::Round($rr2,2))]" -ForegroundColor Yellow

# Support levels below
$supports = $swingLows | Where-Object { $_ -lt $curPrice } | Sort-Object -Descending | Select-Object -First 3
if ($supports.Count -gt 0) {
    Write-Host "`nSupport levels:" -ForegroundColor Green
    $supports | ForEach-Object { Write-Host "  $([Math]::Round($_,5))" }
}
# Resistance levels above
$resAbove = $resistances | Select-Object -First 3
if ($resAbove.Count -gt 0) {
    Write-Host "Resistance levels:" -ForegroundColor Red
    $resAbove | ForEach-Object { Write-Host "  $([Math]::Round($_,5))" }
}
