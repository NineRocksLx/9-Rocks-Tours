# git_check_changes.ps1

Write-Host "`n🔍 Verificando alterações no repositório Git..." -ForegroundColor Cyan

# Confirma se estás num repositório Git
if (-not (Test-Path ".git")) {
    Write-Host "❌ Esta pasta não é um repositório Git." -ForegroundColor Red
    exit
}

# Mostra o branch atual
$branch = git rev-parse --abbrev-ref HEAD
Write-Host "`n📌 Branch atual: $branch" -ForegroundColor Yellow

# Verifica se há alterações não salvas
$status = git status --short

if ($status) {
    Write-Host "`n⚠️  Foram detectadas as seguintes alterações pendentes:" -ForegroundColor Yellow
    Write-Host "$status" -ForegroundColor White
    Write-Host "`n✅ Está pronto para 'git add', 'git commit' e 'git push'." -ForegroundColor Green
} else {
    Write-Host "`n✅ Não foram encontradas alterações locais pendentes. Tudo está sincronizado." -ForegroundColor Green
}

# Mostra os últimos 3 commits para referência rápida
Write-Host "`n🕑 Últimos 3 commits:" -ForegroundColor Cyan
git log --oneline -n 3
