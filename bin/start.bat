@echo off
set ENV_PATH="%~dp0..\.env"

rem creating .env if not exist
if not exist "%ENV_PATH%" (
    echo .env not found
    echo Creating .env file at "%ENV_PATH%"...
    echo PORT=6969 > "%ENV_PATH%"
    echo DB_USER="root" >> "%ENV_PATH%"
    echo DB_PASSWORD="root" >> "%ENV_PATH%"
    echo DB_NAME="practice" >> "%ENV_PATH%"
    echo DB_HOST="localhost" >> "%ENV_PATH%"
    echo .env file created successfully.

) else (
    echo File "%ENV_PATH%" already exists.
)

rem creating required dir
call %~dp0make-dirs.bat

rem create database and tables
rem TODO: make-database.bat

type %~dp0server-ready.txt

exit /b 0
