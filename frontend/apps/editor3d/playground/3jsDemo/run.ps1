# Run the TypeScript build
npm run build

# Check if the build was successful
if ($?) {
    # Open the index.html file in the default web browser
    Start-Process "index.html"
} else {
    Write-Host "Build failed. Please check the errors above."
}