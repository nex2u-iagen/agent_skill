# setup_whisper.ps1
# Script to setup local Whisper environment

Write-Host "Iniciando configuração do Whisper Local..." -ForegroundColor Cyan

# 1. Check Python
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Python não encontrado. Por favor, instale o Python 3.10+."
    exit 1
}
Write-Host "Detectado: $pythonVersion" -ForegroundColor Green

# 2. Install faster-whisper
Write-Host "Instalando faster-whisper..." -ForegroundColor Yellow
pip install faster-whisper
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao instalar faster-whisper."
    exit 1
}

# 3. Check ffmpeg
ffmpeg -version 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "AVISO: ffmpeg não encontrado no PATH. O Whisper pode falhar ao processar certos formatos de áudio." -ForegroundColor Red
    Write-Host "Sugestão: Instale o ffmpeg via 'choco install ffmpeg' ou baixe em https://ffmpeg.org/" -ForegroundColor Yellow
} else {
    Write-Host "ffmpeg detectado com sucesso." -ForegroundColor Green
}

Write-Host "Configuração concluída! O Mordomo Claw agora pode usar o Whisper Local." -ForegroundColor Cyan
