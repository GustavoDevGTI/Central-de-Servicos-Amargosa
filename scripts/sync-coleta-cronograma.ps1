$ErrorActionPreference = 'Stop'

$sourceUrl = 'https://acesso.amargosa.ba.gov.br/coletalixo'
$shortPage = (Invoke-WebRequest -Uri $sourceUrl -UseBasicParsing).Content
$shareMatch = [regex]::Match($shortPage, '"originalUrl"\s*:\s*"([^"]+)"|originalUrl\\":\\"([^\\"]+)\\"')
if (-not $shareMatch.Success) { throw 'O link municipal não apontou para o cronograma esperado.' }
$encodedShare = if ($shareMatch.Groups[1].Success) { $shareMatch.Groups[1].Value } else { $shareMatch.Groups[2].Value }
$shareUrl = ConvertFrom-Json ('"' + $encodedShare + '"')
if (-not $shareUrl.StartsWith('https://prodeboffice365-my.sharepoint.com/')) { throw 'Destino inesperado do link municipal.' }

$sharePage = (Invoke-WebRequest -Uri $shareUrl -UseBasicParsing).Content
$downloadMatch = [regex]::Match($sharePage, '"\.downloadUrl"\s*:\s*"([^"]+)"')
if (-not $downloadMatch.Success) { throw 'O documento público não ofereceu um link para leitura.' }
$downloadUrl = ConvertFrom-Json ('"' + $downloadMatch.Groups[1].Value + '"')
if (-not $downloadUrl.StartsWith('https://prodeboffice365-my.sharepoint.com/')) { throw 'Destino inesperado do documento.' }

$downloadResponse = Invoke-WebRequest -Uri $downloadUrl -UseBasicParsing
$html = [System.Text.Encoding]::UTF8.GetString($downloadResponse.RawContentStream.ToArray())
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$inputPath = Join-Path $root 'tmp/coleta-source.html'
$directory = Split-Path -Parent $inputPath
if (-not (Test-Path -LiteralPath $directory)) { New-Item -ItemType Directory -Path $directory | Out-Null }
[System.IO.File]::WriteAllText($inputPath, $html, [System.Text.UTF8Encoding]::new($false))
& node (Join-Path $PSScriptRoot 'sync-coleta-cronograma.mjs') $inputPath
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
