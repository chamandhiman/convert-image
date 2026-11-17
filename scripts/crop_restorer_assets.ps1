Add-Type -AssemblyName System.Drawing

$mockupPath = "C:/Users/chaman.dhiman/.gemini/antigravity/brain/d3f36d29-6193-4d9f-9b49-bfc11ad62f9e/.user_uploaded/media_1794761593404_4f9589a6.jpg"
$bmp = [System.Drawing.Bitmap]::new($mockupPath)

Write-Host "Mockup dimensions: $($bmp.Width) x $($bmp.Height)"

# In 1024x512:
# Left column girl comparison preview:
# x: ~90 to ~470, y: ~165 to ~420
# Let's crop the girl photo container
$girlRect = [System.Drawing.Rectangle]::new(89, 163, 382, 258)
$girlCrop = $bmp.Clone($girlRect, $bmp.PixelFormat)
$girlCrop.Save("public/sample-restore-girl.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
Write-Host "Saved public/sample-restore-girl.jpg $($girlCrop.Width)x$($girlCrop.Height)"

# Sample thumbnails (below dashed box in right column):
# In 1024x512:
# y is roughly ~380, height ~40, width ~60
# Let's crop the 4 sample thumbnails:
# Sample 1: group
$s1Rect = [System.Drawing.Rectangle]::new(615, 380, 62, 40)
$s1Crop = $bmp.Clone($s1Rect, $bmp.PixelFormat)
$s1Crop.Save("public/sample-restore-1.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)

# Sample 2: man
$s2Rect = [System.Drawing.Rectangle]::new(690, 380, 62, 40)
$s2Crop = $bmp.Clone($s2Rect, $bmp.PixelFormat)
$s2Crop.Save("public/sample-restore-2.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)

# Sample 3: car
$s3Rect = [System.Drawing.Rectangle]::new(765, 380, 62, 40)
$s3Crop = $bmp.Clone($s3Rect, $bmp.PixelFormat)
$s3Crop.Save("public/sample-restore-3.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)

# Sample 4: building
$s4Rect = [System.Drawing.Rectangle]::new(840, 380, 62, 40)
$s4Crop = $bmp.Clone($s4Rect, $bmp.PixelFormat)
$s4Crop.Save("public/sample-restore-4.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)

Write-Host "Saved 4 sample images to public/"

$bmp.Dispose()

