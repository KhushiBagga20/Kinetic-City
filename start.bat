@echo off
setlocal
echo.
echo   ===============================
echo      KINETIC - Starting up...    
echo   ===============================
echo.

echo -^> Clearing ports 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

timeout /t 1 /nobreak >nul

echo -^> Starting backend on http://localhost:8000 ...
cd backend
start "Kinetic Backend" cmd /c "python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
cd ..

timeout /t 2 /nobreak >nul

echo -^> Starting frontend on http://localhost:5173 ...
cd frontend
start "Kinetic Frontend" cmd /c "npm run dev"
cd ..

echo.
echo   ========================================
echo     Backend  -^>  http://localhost:8000     
echo     Frontend -^>  http://localhost:5173     
echo                                        
echo     Close the command prompts to stop  
echo   ========================================
echo.
pause
