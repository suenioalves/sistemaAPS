@echo off
REM =========================================================================
REM Script BAT para refresh da Materialized View mv_domicilios_resumo
REM Programar no Task Scheduler para executar 1x por dia
REM =========================================================================

cd /d "C:\Users\Pichau\Desktop\SISTEMA APS\sistemaAPS"

echo Executando refresh da Materialized View...
python refresh_materialized_view.py

if %ERRORLEVEL% EQU 0 (
    echo Refresh concluido com sucesso!
) else (
    echo Erro no refresh! Codigo: %ERRORLEVEL%
)

REM Manter janela aberta se executar manualmente (remover em producao)
REM pause
