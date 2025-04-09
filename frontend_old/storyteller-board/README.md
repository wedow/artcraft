# Memeboard

## Installation & Dev

```sh
npm install
npm run dev
```

or

```sh
yarn      # this installs the node packages
yarn dev  # this runs the vite dev server
```

You may need to turn off browser security to get around CORS restrictions:

### Windows 11

from your powershell

```sh
# Chrome
Start "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList '--user-data-dir="C://chrome-dev-disabled-security" --disable-web-security --disable-site-isolation-trials'
```

### on MAC

form your terminal

```sh
# Chrome
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-web-security --user-data-dir=~/chrome
```

### Inspecting the Shared Workers

on chrome, type `chrome://inspect/#workers` into the url field
