param(
    [string]$RepositoryUrl = "https://github.com/fmehrabi/bpmn-decision-lab.git"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "Git was not found. Install Git for Windows, reopen PowerShell, and run this script again."
}

if (-not (Test-Path "index.html")) {
    throw "Run this script from the extracted bpmn-decision-lab project root (the folder containing index.html)."
}

if (-not (Test-Path ".git")) {
    git init
    if ($LASTEXITCODE -ne 0) { throw "git init failed." }
}

git add --all
if ($LASTEXITCODE -ne 0) { throw "git add failed." }

git diff --cached --quiet
$hasStagedChanges = ($LASTEXITCODE -ne 0)
if ($hasStagedChanges) {
    git commit -m "Initial release: BPMN Decision Lab 0.4.1"
    if ($LASTEXITCODE -ne 0) { throw "git commit failed. Check your Git name and email configuration." }
} else {
    Write-Host "No staged changes; the existing local commit will be pushed."
}

git branch -M main
if ($LASTEXITCODE -ne 0) { throw "Could not set the main branch." }

$existingRemote = git remote
if ($LASTEXITCODE -ne 0) { throw "Could not inspect Git remotes." }
if ($existingRemote -contains "origin") {
    git remote set-url origin $RepositoryUrl
} else {
    git remote add origin $RepositoryUrl
}
if ($LASTEXITCODE -ne 0) { throw "Could not configure the origin remote." }

git push -u origin main
if ($LASTEXITCODE -ne 0) {
    throw "Push failed. Confirm that the empty GitHub repository exists, the URL is correct, and you are authenticated to GitHub."
}

Write-Host "Repository pushed successfully to $RepositoryUrl" -ForegroundColor Green
