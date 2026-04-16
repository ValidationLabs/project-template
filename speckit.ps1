# SpecKit CLI - ValidationLabs Project Template
# Universal entrypoint for all ValidationLabs applications.
#
# Copy this file to your project root and configure .env with:
#   PLAYWRIGHT_BASE_URL=https://your-app.run.app
#   CLOUD_RUN_SERVICE=your-service-name
#   GCP_PROJECT_ID=your-project-id
#   GCP_REGION=us-central1
#
# Usage: .\speckit.ps1 [command] [options]

param(
    [Parameter(Position=0)]
    [string]$Command,
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Arguments
)

# ------------------------------------------------
# Load .env file into current shell session
# ------------------------------------------------
function Load-Env {
    $envFile = ".env"
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
                $key = $Matches[1].Trim()
                $val = $Matches[2].Trim().Trim('"').Trim("'")
                [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
            }
        }
    }
}

# ------------------------------------------------
# Node resolver: bootstrap Node.js via fnm
# ------------------------------------------------
function Enable-Node {
    $fnmExe = "$env:LOCALAPPDATA\fnm\fnm.exe"
    if (Test-Path $fnmExe) {
        & $fnmExe env --shell power-shell | Invoke-Expression | Out-Null
    } else {
        Write-Error "speckit: fnm not found. Install from https://github.com/Schniz/fnm"
        exit 1
    }
}

# ------------------------------------------------
# Command: setup
# First-time project setup
# ------------------------------------------------
function Invoke-Setup {
    Write-Host ""
    Write-Host "  [speckit] Running first-time project setup..." -ForegroundColor Cyan
    Load-Env
    Enable-Node
    Write-Host "  [speckit] Installing Playwright browsers..." -ForegroundColor DarkGray
    npx playwright install chromium --with-deps
    Write-Host ""
    Write-Host "  [speckit] Setup complete." -ForegroundColor Green
    Write-Host "  Run '.\speckit.ps1 e2e' to validate your deployment." -ForegroundColor DarkGray
    Write-Host ""
}

# ------------------------------------------------
# Command: e2e / test
# Runs Playwright E2E suite against production.
# Reads PLAYWRIGHT_BASE_URL from .env
# ------------------------------------------------
function Invoke-E2E {
    Load-Env

    $target = $env:PLAYWRIGHT_BASE_URL
    if (-not $target) { $target = "http://localhost:3000" }

    Write-Host ""
    Write-Host "  ==============================================" -ForegroundColor Cyan
    Write-Host "  ValidationLabs E2E Test Suite" -ForegroundColor Cyan
    Write-Host "  Target: $target" -ForegroundColor Cyan
    Write-Host "  ==============================================" -ForegroundColor Cyan
    Write-Host ""

    Enable-Node

    $playwrightArgs = @("playwright", "test") + $Arguments
    npx @playwrightArgs
}

# ------------------------------------------------
# Command: lint
# Run TypeScript typecheck
# ------------------------------------------------
function Invoke-Lint {
    Load-Env
    Enable-Node
    Write-Host "  [speckit] Running TypeScript lint..." -ForegroundColor Cyan
    npx tsc --noEmit
}

# ------------------------------------------------
# Command: deploy
# Deploy to Google Cloud Run
# ------------------------------------------------
function Invoke-Deploy {
    Load-Env
    $service = $env:CLOUD_RUN_SERVICE
    $project = $env:GCP_PROJECT_ID
    $region  = if ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" }

    if (-not $service -or -not $project) {
        Write-Error "speckit deploy: CLOUD_RUN_SERVICE and GCP_PROJECT_ID must be set in .env"
        exit 1
    }

    Write-Host ""
    Write-Host "  [speckit] Deploying to Cloud Run..." -ForegroundColor Cyan
    Write-Host "  Service : $service" -ForegroundColor DarkGray
    Write-Host "  Project : $project" -ForegroundColor DarkGray
    Write-Host "  Region  : $region" -ForegroundColor DarkGray
    Write-Host ""

    gcloud run deploy $service `
        --source . `
        --project $project `
        --region $region `
        --allow-unauthenticated `
        @Arguments
}

# ------------------------------------------------
# Command: help
# ------------------------------------------------
function Show-Help {
    Write-Host ""
    Write-Host "  SpecKit CLI - ValidationLabs" -ForegroundColor Cyan
    Write-Host "  -------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "  Usage: .\speckit.ps1 [command] [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "  Commands:" -ForegroundColor Yellow
    Write-Host "    setup              First-time project setup (installs browsers)"
    Write-Host "    e2e                Run Playwright E2E suite against PLAYWRIGHT_BASE_URL"
    Write-Host "    test               Alias for e2e"
    Write-Host "    e2e --headed       Run in headed (visible) browser mode"
    Write-Host "    e2e --ui           Open Playwright interactive UI"
    Write-Host "    e2e --grep name    Run only tests matching a name pattern"
    Write-Host "    lint               Run TypeScript typecheck (tsc --noEmit)"
    Write-Host "    deploy             Deploy to Google Cloud Run (reads .env)"
    Write-Host "    analyze [args]     Run Speckit specification analysis"
    Write-Host "    tasks [args]       Run Speckit task management"
    Write-Host "    help               Show this help"
    Write-Host ""
    Write-Host "  Configuration (.env):" -ForegroundColor Yellow
    Write-Host "    PLAYWRIGHT_BASE_URL   Live deployment URL for E2E tests"
    Write-Host "    CLOUD_RUN_SERVICE     Cloud Run service name"
    Write-Host "    GCP_PROJECT_ID        Google Cloud project ID"
    Write-Host "    GCP_REGION            Deployment region (default: us-central1)"
    Write-Host ""
    Write-Host "  Examples:" -ForegroundColor Yellow
    Write-Host "    .\speckit.ps1 setup"
    Write-Host "    .\speckit.ps1 e2e"
    Write-Host "    .\speckit.ps1 e2e --headed"
    Write-Host "    .\speckit.ps1 e2e --grep 'Smoke'"
    Write-Host "    .\speckit.ps1 deploy"
    Write-Host "    .\speckit.ps1 analyze"
    Write-Host ""
}

# ------------------------------------------------
# Router
# ------------------------------------------------
switch ($Command) {
    "setup"    { Invoke-Setup }
    "e2e"      { Invoke-E2E }
    "test"     { Invoke-E2E }
    "lint"     { Invoke-Lint }
    "deploy"   { Invoke-Deploy }
    "help"     { Show-Help }
    ""         { uv run specify --here @Arguments }
    default    { uv run specify --here $Command @Arguments }
}
