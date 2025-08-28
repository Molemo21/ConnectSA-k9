Write-Host "Fixing ChunkLoadError and JWT issues..." -ForegroundColor Green

Write-Host "`nStep 1: Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "Cache cleared." -ForegroundColor Green
} else {
    Write-Host "No cache to clear." -ForegroundColor Green
}

Write-Host "`nStep 2: Clearing node_modules cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "Node modules cache cleared." -ForegroundColor Green
} else {
    Write-Host "No node_modules cache to clear." -ForegroundColor Green
}

Write-Host "`nStep 3: Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "`nStep 4: Building the project..." -ForegroundColor Yellow
npm run build

Write-Host "`nStep 5: Ready to start development server..." -ForegroundColor Green
Write-Host "IMPORTANT: Please clear your browser cookies for localhost:3000 before accessing the site." -ForegroundColor Red
Write-Host "This will resolve the JWT signature verification issues." -ForegroundColor Red
Write-Host "`nRun 'npm run dev' to start the development server." -ForegroundColor Green