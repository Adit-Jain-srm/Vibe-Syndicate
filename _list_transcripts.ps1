$base = "C:\Users\aditj\.cursor\projects\c-Users-aditj-New-Projects-Vibe-Syndicate\agent-transcripts\"
foreach($f in (Get-ChildItem $base -Recurse -Filter "*.jsonl")) {
    $rel = $f.FullName.Substring($base.Length) -replace "\\","/"
    $mt = $f.LastWriteTimeUtc.ToString("o")
    Write-Host "$rel|$mt"
}
