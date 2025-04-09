Windows-specific notes
======================

Setting up the development environment
--------------------------------------

### Install NVM, NPM, and Yarn

1. Install [Windows nvm](https://github.com/coreybutler/nvm-windows/releases)
2. Run `nvm install 14.15.0` (newer versions such as "18.6.0" are broken at time of writing)
3. Run `nvm use 14.15.0` from an Administrator console. 
   To enable admin rights, right click and run the terminal as administrator.
4. Run `npm i -g corepack` from an Administrator console. (This installs `yarn`.)

Running the project
--------------------

1. Run `yarn install`
2. Run `yarn start-fakeyou-w`

(You may need to run one or both of these commands *twice* for it to work.)

Setting up the hosts file
-------------------------

Just like Linux and Mac, Windows too has a concept of a "hosts file". This file lets you point any 
domain name or host name to any IP address you choose. (Note that this doesn't resolve browser 
protection issues with SSL or CORS).

Edit `C:\Windows\System32\drivers\etc\hosts`. You will need to open and edit this file as an 
administrator, otherwise you will not be able to save your changes.

Running `notepad.exe` is slightly tricky. Right click, and "run as administrator". Then open the 
file manually from File > Open.

You will have to make sure "Text Files (\*.txt)" is set to "All Files (\*.\*) since the hosts file
does not end with the ".txt" extension.

Add the following lines:

```
127.0.0.1       jungle.horse 
34.102.242.35   api.jungle.horse 
```

Running chrome without SSL and CORS protection
----------------------------------------------

DO NOT USE THIS FOR YOUR NORMAL BROWSING! IT IS UNSAFE! (ie. Don't use this for mail, banking, etc.!)

Run the following command under the "run" dialog. You can also set this up as a windows shortcut to 
make launching it easy.

```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-web-security --ignore-certificate-errors --user-data-dir=~/chromeTemp
```

Or on 32 bit, 

```
"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --disable-web-security --ignore-certificate-errors --user-data-dir=~/chromeTemp
```

Final steps
-----------

Edit `packages\components\src\api\ApiConfig.ts` to set SSL to true in development (but don't commit it):

```typescript
    } else if (document.location.host.includes("jungle.horse")) {
      // NB: Local dev.
      domain = Domain.JungleHorse;
      useSsl = document.location.protocol === 'https:';
      useSsl = true; // ***OVERRIDE HERE***
```

We'll come up with a better long-term solution.

You will then be able to access the website at http://jungle.horse:3000 (or :7000, or whatever yarn 
development port you use) and load data from production.

Note that audio files and spectrogram files will not load from Google due to certificate issues, 
but we will also fix this issue.

You can also set cookie flags by accessing the flag API, eg.

https://api.jungle.horse/flags/design_refresh/enable

Or toggle cookies manually, eg.

```javascript
let flagValue=(document.cookie.split(";").find(f => f.includes("refresh")) || "").trim().split("=")[1] === "true"; document.cookie = `refresh=${!flagValue}`; document.location.reload();
```

Where "refresh" is the name of the cookie flag to toggle.

Force SSL in development
------------------------

Development won't allow login against production since they differ in terms of scheme (`http` in dev 
vs. `https` in production). There's a way to force HTTPS/SSL in development.

You can force the development server to run SSL by creating a `.env` file in the appropriate project, eg.
`packages/fakeyou/.env` is the name of the file for FakeYou.

The contents should be set to the following:

```
BROWSER=none
HTTPS=true
```

When you start the server, it'll run on `https:` instead of `http:`, which will fix the login issue. 
Don't commit this file to the repo, though, as it will affect the Linux development setup. We'll work to 
consolidate these soon.

Fixing common errors
--------------------

> Node Sass does not yet support your current environment: Windows 64-bit with Unsupported runtime (108)

Install an older version of npm. (You probably won't have to mess with SASS.)
https://stackoverflow.com/a/64645028
