@echo off
REM ==============================================================================
REM CCS CONNECT ERP — SAFE POSTGRESQL BACKUP SCRIPT (Windows)
REM ==============================================================================
setlocal enabledelayedexpansion

set PG_HOST=127.0.0.1
set PG_PORT=5432
set PG_DB=ccs
set PG_USER=ccs_user

if "%PGPASSWORD%"=="" (
    echo [WARNING] PGPASSWORD environment variable is not set.
    echo Please set PGPASSWORD before running this script for non-interactive backup.
)

REM Create backups directory if not exists
if not exist "backups" mkdir "backups"

REM Timestamp YYYYMMDD_HHMMSS
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%
set BACKUP_FILE=backups\ccs_backup_%TIMESTAMP%.dump
set BACKUP_SQL=backups\ccs_backup_%TIMESTAMP%.sql

echo ==============================================================================
echo [BACKUP START] Backing up PostgreSQL database: %PG_DB%
echo Destination: %BACKUP_FILE%
echo ==============================================================================

pg_dump -h %PG_HOST% -p %PG_PORT% -U %PG_USER% -d %PG_DB% -F c -b -v -f "%BACKUP_FILE%"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PostgreSQL custom-format backup failed with code %ERRORLEVEL%!
    exit /b %ERRORLEVEL%
)

pg_dump -h %PG_HOST% -p %PG_PORT% -U %PG_USER% -d %PG_DB% -f "%BACKUP_SQL%"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PostgreSQL SQL-format backup failed with code %ERRORLEVEL%!
    exit /b %ERRORLEVEL%
)

echo ==============================================================================
echo [BACKUP SUCCESS] Verified backups created:
echo 1. %BACKUP_FILE% (Compressed Custom format for pg_restore)
echo 2. %BACKUP_SQL% (Plain SQL text format for disaster recovery)
echo ==============================================================================
