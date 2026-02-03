$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$workbook = $excel.Workbooks.Open("C:\Users\Dell\Desktop\adamus\ARL Contact 2025 November.xlsx")
$worksheet = $workbook.Sheets.Item(1)
$csvPath = "C:\Users\Dell\intranet\contacts_import.csv"
$worksheet.SaveAs($csvPath, 6)
$workbook.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
Write-Host "CSV saved to: $csvPath"
Get-Content $csvPath
