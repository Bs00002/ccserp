@echo off
REM ==============================================================================
REM CCS CONNECT ERP — SAFE POSTGRESQL RESTORE SCRIPT (Windows)
REM ==============================================================================
setlocal enabledelayedexpansion

if "%~1"=="" (
    echo [USAGE] %0 path\to\backup_file.dump
    exit /b 1
)

set BACKUP_FILE=%~1
set PG_HOST=127.0.0.1
set PG_PORT=5432
set PG_DB=ccs
set PG_USER=ccs_user

if not exist "%BACKUP_FILE%" (
    echo [ERROR] Backup file does not exist: %BACKUP_FILE%
    exit /b 1
)

echo ==============================================================================
echo [WARNING] You are about to restore database '%PG_DB%' from:
echo %BACKUP_FILE%
echo This will overwrite existing schema/tables!
echo ==============================================================================
set /p CONFIRM="Are you sure you want to proceed? (Type YES to confirm): "
if not "%CONFIRM%"=="YES" (
    echo [CANCELLED] Restore aborted by user.
    exit /b 0
)

echo [RESTORING] Running pg_restore...
pg_restore -h %PG_HOST% -p %PG_PORT% -U %PG_USER% -d %PG_DB% --clean --if-exists -v "%BACKUP_FILE%"
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] pg_restore completed with warnings or code %ERRORLEVEL%. Please inspect output.
) else (
    echo [SUCCESS] Database restored successfully from %BACKUP_FILE%.
)
