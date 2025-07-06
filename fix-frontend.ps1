# fix-frontend.ps1 - Script PowerShell para Windows

Write-Host "🔧 Corrigindo frontend do 9 Rocks Tours..." -ForegroundColor Green

# Vai para a pasta frontend
Set-Location frontend

Write-Host "📦 Limpando e reinstalando dependências..." -ForegroundColor Yellow
if (Test-Path "node_modules") { Remove-Item -Recurse -Force node_modules }
if (Test-Path "package-lock.json") { Remove-Item -Force package-lock.json }
npm install

Write-Host "🔍 Verificando imports incorretos..." -ForegroundColor Cyan

# Procura por imports incorretos do Firebase
Write-Host "Verificando imports problemáticos..."

$incorrectImports1 = Select-String -Path "src\**\*.js", "src\**\*.jsx" -Pattern "from '../firebase'" -ErrorAction SilentlyContinue
$incorrectImports2 = Select-String -Path "src\**\*.js", "src\**\*.jsx" -Pattern 'from "../firebase"' -ErrorAction SilentlyContinue

if ($incorrectImports1 -or $incorrectImports2) {
    Write-Host "❌ Encontrados imports incorretos!" -ForegroundColor Red
    $incorrectImports1 | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
    $incorrectImports2 | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
} else {
    Write-Host "✅ Nenhum import '../firebase' encontrado" -ForegroundColor Green
}

Write-Host "✅ Verificando imports corretos..."
$correctImports = Select-String -Path "src\**\*.js", "src\**\*.jsx" -Pattern "from '../config/firebase'" -ErrorAction SilentlyContinue

if ($correctImports) {
    Write-Host "✅ Imports corretos encontrados:" -ForegroundColor Green
    $correctImports | ForEach-Object { Write-Host "   $_" -ForegroundColor Green }
} else {
    Write-Host "⚠️ Nenhum import correto encontrado" -ForegroundColor Yellow
}

Write-Host "🔥 Verificando configuração do Firebase..."
if (Test-Path "src\config\firebase.js") {
    Write-Host "✅ Arquivo firebase.js existe" -ForegroundColor Green
} else {
    Write-Host "❌ Arquivo firebase.js não encontrado!" -ForegroundColor Red
}

Write-Host "🚀 Próximos passos:" -ForegroundColor Magenta
Write-Host "1. Se encontrou imports incorretos, corrija-os manualmente"
Write-Host "2. Execute: npm start"
Write-Host "3. Acesse: http://localhost:3000"