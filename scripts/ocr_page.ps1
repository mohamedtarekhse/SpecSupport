param([Parameter(Mandatory=$true)][string]$ImagePath)

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile,Microsoft.Windows.SDK.NET,ContentType=WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine,Microsoft.Windows.SDK.NET,ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder,Microsoft.Windows.SDK.NET,ContentType=WindowsRuntime]

function Await($WinRtTask, $ResultType) {
  $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
  $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
  $netTask = $asTask.Invoke($null, @($WinRtTask))
  $netTask.Wait(-1) | Out-Null
  $netTask.Result
}

try {
  $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($ImagePath)) ([Windows.Storage.StorageFile])
  $stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
  $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
  if (-not $engine) {
    [Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages | ForEach-Object { Write-Error "Available lang: $($_.LanguageTag)" }
    exit 2
  }
  $result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
  $result.Lines | ForEach-Object { $_.Text }
  exit 0
} catch {
  Write-Error $_.Exception.Message
  exit 3
}