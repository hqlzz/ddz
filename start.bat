@echo off
chcp 65001 >nul
cls

echo ================================
echo    欢乐斗地主 - 启动中...     
echo ================================
echo.

REM 检查Python
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set PYTHON_CMD=python
    goto :start_server
)

where python3 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set PYTHON_CMD=python3
    goto :start_server
)

echo ❌ 错误: 未找到Python
echo 请安装Python 3.x后再试
echo.
echo 下载地址: https://www.python.org/downloads/
pause
exit /b 1

:start_server
echo ✅ Python已找到: %PYTHON_CMD%
echo.

REM 获取本机IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :got_ip
)
:got_ip
set IP=%IP: =%

echo 📡 服务器信息:
echo    本地访问: http://localhost:8000
echo    局域网访问: http://%IP%:8000
echo.
echo 🎮 游戏已启动！
echo    在浏览器中打开上述地址即可开始游戏
echo.
echo 💡 提示:
echo    - 按 Ctrl+C 停止服务器
echo    - 手机可在同一WiFi下访问局域网地址
echo.
echo ================================
echo.

REM 启动浏览器
timeout /t 2 /nobreak >nul
start http://localhost:8000

REM 启动HTTP服务器
%PYTHON_CMD% -m http.server 8000
