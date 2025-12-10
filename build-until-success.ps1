# Script to build until success

//code powershell -ExecutionPolicy Bypass -File build-until-success.ps1

$maxAttempts = 10
$attempt = 0
$success = $false

Write-Host "Starting build process..." -ForegroundColor Cyan
Write-Host "Maximum attempts: $maxAttempts" -ForegroundColor Yellow
Write-Host ""

while ($attempt -lt $maxAttempts -and -not $success) {
    $attempt++
    Write-Host "Attempt $attempt of $maxAttempts" -ForegroundColor Cyan
    Write-Host "Running: npm run build" -ForegroundColor Gray
    Write-Host ""
    
    $buildOutput = npm run build 2>&1
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "[SUCCESS] Build successful!" -ForegroundColor Green
        Write-Host "Total attempts: $attempt" -ForegroundColor Green
        $success = $true
    } else {
        Write-Host ""
        Write-Host "[FAILED] Build failed with exit code: $exitCode" -ForegroundColor Red
        Write-Host ""
        Write-Host "Build output:" -ForegroundColor Yellow
        Write-Host $buildOutput
        Write-Host ""
        
        if ($attempt -lt $maxAttempts) {
            Write-Host "Waiting 2 seconds before retry..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
}

if (-not $success) {
    Write-Host ""
    Write-Host "[FAILED] Build failed after $maxAttempts attempts" -ForegroundColor Red
    exit 1
}

exit 0
