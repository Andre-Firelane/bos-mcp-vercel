@echo off
:: BOS KPI Importer – called by Windows Task Scheduler
:: Update IMPORTER_DIR to match your actual path before registering the task

SET IMPORTER_DIR=C:\Users\Andre\Documents\Claude\Projects\MCP Dashboard Test\importer

:: Create logs directory if it doesn't exist
IF NOT EXIST "%IMPORTER_DIR%\logs" MKDIR "%IMPORTER_DIR%\logs"

cd /d "%IMPORTER_DIR%"

:: Run the importer and append output to log file
npx tsx src/index.ts >> "%IMPORTER_DIR%\logs\import.log" 2>&1
