#!/usr/bin/env pwsh
# Deploy Syndicate swarm to Render.com
# Usage: .\scripts\deploy-render.ps1
# Requires: RENDER_API_KEY env var (from https://dashboard.render.com/u/settings#api-keys)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$envFile = Join-Path $Root ".env"
$agentConfig = Join-Path $Root "agent_config.yaml"

if (-not (Test-Path $envFile)) { throw ".env not found at $envFile" }
if (-not (Test-Path $agentConfig)) { throw "agent_config.yaml not found at $agentConfig" }

# Parse .env (simple key=value, skip comments)
$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    if ($_ -match '^([^=]+)=(.*)$') {
        $envVars[$Matches[1].Trim()] = $Matches[2].Trim()
    }
}

$agentYaml = Get-Content $agentConfig -Raw

$required = @(
    "GOOGLE_API_KEY", "SUPABASE_URL", "SUPABASE_KEY",
    "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY"
)
foreach ($key in $required) {
    if (-not $envVars[$key]) { throw "Missing $key in .env" }
}

$renderApiKey = $env:RENDER_API_KEY
if (-not $renderApiKey) {
    Write-Host ""
    Write-Host "=== Render Blueprint Deploy ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Push render.yaml to GitHub (main branch)"
    Write-Host "2. Open: https://dashboard.render.com/select-repo?type=blueprint"
    Write-Host "3. Connect repo: Adit-Jain-srm/Vibe-Syndicate"
    Write-Host "4. When prompted for secret env vars, paste these values:"
    Write-Host ""
    Write-Host "   AGENT_CONFIG_YAML = (full contents of agent_config.yaml)"
    Write-Host "   GOOGLE_API_KEY    = $($envVars['GOOGLE_API_KEY'].Substring(0, [Math]::Min(8, $envVars['GOOGLE_API_KEY'].Length)))..."
    Write-Host "   SUPABASE_URL      = $($envVars['SUPABASE_URL'])"
    Write-Host "   SUPABASE_KEY      = (service_role key from .env)"
    Write-Host "   AZURE_OPENAI_*    = (from .env)"
    Write-Host ""
    Write-Host "5. After deploy, ping the service URL every 10 min to prevent spin-down:"
    Write-Host "   https://cron-job.org (free) -> GET https://syndicate-swarm.onrender.com/"
    Write-Host ""
    Write-Host "Optional: set RENDER_API_KEY and re-run for automated deploy."
    Write-Host ""

    # Write env bundle for easy copy (local only, gitignored)
    $bundlePath = Join-Path $Root "render-env-bundle.txt"
    @"
# Paste these into Render dashboard Environment tab
# DO NOT COMMIT THIS FILE

AGENT_CONFIG_YAML<<EOF
$agentYaml
EOF

GOOGLE_API_KEY=$($envVars['GOOGLE_API_KEY'])
SUPABASE_URL=$($envVars['SUPABASE_URL'])
SUPABASE_KEY=$($envVars['SUPABASE_KEY'])
AZURE_OPENAI_ENDPOINT=$($envVars['AZURE_OPENAI_ENDPOINT'])
AZURE_OPENAI_API_KEY=$($envVars['AZURE_OPENAI_API_KEY'])
AZURE_OPENAI_DEPLOYMENT=$($envVars['AZURE_OPENAI_DEPLOYMENT'])
AZURE_OPENAI_API_VERSION=$($envVars['AZURE_OPENAI_API_VERSION'])
"@ | Set-Content $bundlePath -Encoding UTF8
    Write-Host "Env reference written to render-env-bundle.txt (gitignored)" -ForegroundColor Green
    exit 0
}

# Automated deploy via Render API
$headers = @{
    Authorization = "Bearer $renderApiKey"
    "Content-Type" = "application/json"
}

Write-Host "Creating Render blueprint deploy..." -ForegroundColor Cyan

$body = @{
    repo = "https://github.com/Adit-Jain-srm/Vibe-Syndicate"
    branch = "main"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.render.com/v1/blueprints" -Method POST -Headers $headers -Body $body
    Write-Host "Blueprint created: $($response | ConvertTo-Json -Depth 5)"
} catch {
    Write-Host "Blueprint API failed (may already exist). Use dashboard: https://dashboard.render.com/select-repo?type=blueprint"
    Write-Host $_.Exception.Message
}

Write-Host "Done." -ForegroundColor Green
