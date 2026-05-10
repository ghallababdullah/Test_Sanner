param(
    [string]$IpAddress = "",
    [string]$DnsName = "localhost"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$certDir = Join-Path $projectRoot ".cert"
$pfxPath = Join-Path $certDir "dev-server.pfx"
$cerPath = Join-Path $certDir "dev-root-ca.cer"
$passphrasePath = Join-Path $certDir "dev-server.passphrase"

if (-not (Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir | Out-Null
}

if (-not $IpAddress) {
    $IpAddress = (
        Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object {
            $_.IPAddress -notlike "127.*" -and
            $_.IPAddress -notlike "169.254.*" -and
            $_.PrefixOrigin -ne "WellKnown"
        } |
        Select-Object -First 1 -ExpandProperty IPAddress
    )
}

if (-not $IpAddress) {
    throw "Could not detect a local IPv4 address automatically. Pass it explicitly: -IpAddress 192.168.x.x"
}

$rootSubject = "CN=TestScanner Local Dev Root CA"
$serverSubject = "CN=$DnsName"

$rootCert = Get-ChildItem Cert:\CurrentUser\My |
    Where-Object { $_.Subject -eq $rootSubject } |
    Sort-Object NotAfter -Descending |
    Select-Object -First 1

if (-not $rootCert) {
    $rootCert = New-SelfSignedCertificate `
        -Type Custom `
        -Subject $rootSubject `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -KeyExportPolicy Exportable `
        -KeyUsageProperty Sign `
        -KeyUsage CertSign, CRLSign, DigitalSignature `
        -KeyLength 2048 `
        -HashAlgorithm sha256 `
        -NotAfter (Get-Date).AddYears(5) `
        -TextExtension @("2.5.29.19={critical}{text}CA=true")
}

$serverCert = New-SelfSignedCertificate `
    -Type Custom `
    -Subject $serverSubject `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -KeyExportPolicy Exportable `
    -KeyLength 2048 `
    -HashAlgorithm sha256 `
    -Signer $rootCert `
    -NotAfter (Get-Date).AddYears(2) `
    -TextExtension @(
        "2.5.29.17={text}DNS=$DnsName&DNS=$($env:COMPUTERNAME)&IPAddress=$IpAddress&IPAddress=127.0.0.1"
    )

$passphrase = [Guid]::NewGuid().ToString("N") + [Guid]::NewGuid().ToString("N")
$securePassphrase = ConvertTo-SecureString -String $passphrase -AsPlainText -Force

Export-PfxCertificate `
    -Cert $serverCert `
    -FilePath $pfxPath `
    -Password $securePassphrase | Out-Null

Export-Certificate `
    -Cert $rootCert `
    -FilePath $cerPath | Out-Null

Set-Content -Path $passphrasePath -Value $passphrase -NoNewline

Write-Host ""
Write-Host "HTTPS certificates created."
Write-Host "LAN IP: $IpAddress"
Write-Host "PFX: $pfxPath"
Write-Host "Root CA: $cerPath"
Write-Host ""
Write-Host "Next:"
Write-Host "1. Install dev-root-ca.cer on your phone as a trusted certificate."
Write-Host "2. Start the frontend: npm run dev"
Write-Host ("3. Open on the phone: https://{0}:5173" -f $IpAddress)
