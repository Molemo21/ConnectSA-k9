@echo off
echo Fixing ChunkLoadError and JWT issues...

echo.
echo Step 1: Clearing Next.js cache...
if exist .next rmdir /s /q .next
echo Cache cleared.

echo.
echo Step 2: Clearing node_modules cache...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo Node modules cache cleared.

echo.
echo Step 3: Installing dependencies...
npm install

echo.
echo Step 4: Building the project...
npm run build

echo.
echo Step 5: Starting development server...
echo Please clear your browser cookies for localhost:3000 before accessing the site.
echo.
npm run dev