@echo off
echo ==============================================
echo Installing LocaSpec Requirements...
echo ==============================================
pip install -r requirements.txt

echo.
echo ==============================================
echo Starting LocaSpec Server...
echo ==============================================
python app.py
pause
