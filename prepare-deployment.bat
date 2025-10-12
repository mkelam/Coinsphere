@echo off
REM Coinsphere - Prepare Deployment Package for Hostinger VPS
REM This script creates a clean deployment package ready for VPS upload

echo ============================================
echo Coinsphere Deployment Package Preparation
echo ============================================
echo.

REM Create deployment package directory
echo [1/6] Creating deployment package directory...
if not exist "deployment-package" mkdir "deployment-package"
cd deployment-package

REM Copy backend files
echo [2/6] Copying backend files...
if not exist "backend" mkdir "backend"
xcopy /E /I /Y "..\backend\src" "backend\src"
xcopy /E /I /Y "..\backend\prisma" "backend\prisma"
copy "..\backend\package.json" "backend\"
copy "..\backend\tsconfig.json" "backend\"
copy "..\backend\.env.example" "backend\.env.example"

REM Copy frontend files
echo [3/6] Copying frontend files...
if not exist "frontend" mkdir "frontend"
xcopy /E /I /Y "..\frontend\src" "frontend\src"
xcopy /E /I /Y "..\frontend\public" "frontend\public"
copy "..\frontend\package.json" "frontend\"
copy "..\frontend\vite.config.ts" "frontend\"
copy "..\frontend\tsconfig.json" "frontend\"
copy "..\frontend\tailwind.config.js" "frontend\"
copy "..\frontend\index.html" "frontend\"
copy "..\frontend\.env.example" "frontend\.env.example"

REM Copy ML service files
echo [4/6] Copying ML service files...
if not exist "ml-service" mkdir "ml-service"
xcopy /E /I /Y "..\ml-service\app" "ml-service\app"
xcopy /E /I /Y "..\ml-service\scripts" "ml-service\scripts"
copy "..\ml-service\requirements.txt" "ml-service\"
copy "..\ml-service\.env.example" "ml-service\.env.example"

REM Copy deployment documentation
echo [5/6] Copying deployment documentation...
if not exist "Documentation" mkdir "Documentation"
copy "..\DEPLOY_TO_VPS.md" "Documentation\"
copy "..\Documentation\HOSTINGER_QUICK_START.md" "Documentation\"
copy "..\Documentation\PRODUCTION_READINESS_ASSESSMENT.md" "Documentation\"

REM Copy root files
echo [6/6] Copying root files...
copy "..\README.md" "."
copy "..\package.json" "."

echo.
echo ============================================
echo Deployment package created successfully!
echo ============================================
echo.
echo Package location: %CD%
echo.
echo Next steps:
echo 1. Open WinSCP or FileZilla
echo 2. Connect to your VPS (credentials in Hostinger.txt)
echo 3. Upload this entire "deployment-package" folder to /var/www/coinsphere
echo 4. Follow DEPLOY_TO_VPS.md guide starting at Phase 4.3
echo.
pause
