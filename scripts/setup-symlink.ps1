param (
    [Parameter(Mandatory=$true)]
    [string]$ObsidianVaultPath,

    [Parameter(Mandatory=$false)]
    [string]$BlogContentFolderName = "Blog"
)

# Requires Admin privileges to create symlinks in Windows
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "Creating symlinks on Windows usually requires Administrator privileges."
    Write-Warning "If this script fails, please right-click PowerShell, select 'Run as Administrator', and try again."
}

$CurrentDir = (Get-Item -Path ".\").FullName
$TargetContentDir = Join-Path -Path $CurrentDir -ChildPath "content"

# Ensure the content directory exists
if (-not (Test-Path -Path $TargetContentDir)) {
    New-Item -ItemType Directory -Path $TargetContentDir | Out-Null
    Write-Host "Created missing directory: $TargetContentDir"
}

$SourcePath = Join-Path -Path $ObsidianVaultPath -ChildPath $BlogContentFolderName

# Check if Obsidian folder exists
if (-not (Test-Path -Path $SourcePath)) {
    Write-Host "The specified Obsidian folder does not exist: $SourcePath"
    Write-Host "Creating it now..."
    New-Item -ItemType Directory -Path $SourcePath | Out-Null
}

$PostsTarget = Join-Path -Path $TargetContentDir -ChildPath "posts"
$IdeasTarget = Join-Path -Path $TargetContentDir -ChildPath "ideas"

$SourcePosts = Join-Path -Path $SourcePath -ChildPath "posts"
$SourceIdeas = Join-Path -Path $SourcePath -ChildPath "ideas"

if (-not (Test-Path -Path $SourcePosts)) {
    New-Item -ItemType Directory -Path $SourcePosts | Out-Null
}
if (-not (Test-Path -Path $SourceIdeas)) {
    New-Item -ItemType Directory -Path $SourceIdeas | Out-Null
}

# Function to create junction (directory symlink)
function Create-Junction {
    param (
        [string]$Link,
        [string]$Target
    )

    if (Test-Path -Path $Link) {
        Write-Host "Removing existing folder/link at: $Link"
        Remove-Item -Path $Link -Recurse -Force
    }

    Write-Host "Creating symlink (Junction) from $Link to $Target"
    cmd /c mklink /J "`"$Link`"" "`"$Target`""
}

Create-Junction -Link $PostsTarget -Target $SourcePosts
Create-Junction -Link $IdeasTarget -Target $SourceIdeas

Write-Host "========================================================"
Write-Host "Symlink Setup Complete!"
Write-Host "Obsidian Folder: $SourcePath"
Write-Host "Blog Content Folder: $TargetContentDir"
Write-Host "Any files you add to ObsidianVault\$BlogContentFolderName\posts or ideas will now appear in your blog."
Write-Host "========================================================"
