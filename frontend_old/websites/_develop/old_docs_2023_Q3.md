storyteller-frontend
====================

This repository is a frontend [monorepo](https://en.wikipedia.org/wiki/Monorepo), containing all of our websites
and shared library code. Each website can be built and run independently of one another, but they share the same
API backend.

Here are the websites contained: 

- [FakeYou.com](https://fakeyou.com), our social deepfaking website
- [storyteller.io](https://storyteller.io), our investor relations website and eventual home of our production software
- [power.stream](https://power.stream), our Twitch TTS platform
  - [dash.power.stream](https://dash.power.stream), a subdomain for the dashboard.
  - [obs.power.stream](https://obs.power.stream), a subdomain for streamers to integrate with OBS.

Here are some static websites contained:

- [FakeYou API Docs](https://docs.fakeyou.com), API documentation for the core TTS feature. This does not document our complete API.
- [the.storyteller.company](https://the.storyteller.company), DEPRECATED investor website. Used to get into *Founder Friendly Labs*.


TODO: In the future, it will be worth updating this structure to match Netlify's recommended monorepo practices: 
https://docs.netlify.com/configure-builds/monorepos/


Development
-----------

### Development environment setup

```
# Install Yarn if not present (Linux/Mac)
sudo npm install --global yarn

# We might need a newer node (Linux/Mac)
sudo install n -g
sudo n stable

# Install project deps (Linux/Mac)
yarn install

# Start one or more of the several frontends (Linux/Mac)
yarn start-fakeyou
yarn start-storyteller-home
```

### Develop locally without CORS:

Launch Chrome without CORS enforcement, which will allow targeting against FakeYou.com's API directly:

```
chromium-browser --disable-web-security --user-data-dir=~/chrome
```

Or Mac,

```
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-web-security --user-data-dir=~/chrome
```

### Monorepo design

The React monorepo build pattern we're using is based on 
[this blog post](https://medium.com/geekculture/setting-up-monorepo-with-create-react-app-cb2cfa763b96),
which while lacking in some respects, still works for our purposes.

Library code is exported in the library's index.tsx (not very pretty)


### Good Code Examples

* `storyteller/src/pages/tts_configs/TtsConfigsEditRulePage.tsx` - Tree of components that handle a very complicated update API


Site-specific docs
------------------

### API Documentation Site

docs.fakeyou.com is generated from `./docs` using [Docsify](https://docsify.js.org/).

To run and test locally,

```bash
sudo npm i docsify-cli -g
docsify serve docs
```

Deployment
----------

Our websites are deployed on Netlify.

### Netlify notes

The `.node-version` file controls which version of node Netlify uses to build!

Design and brand notes
----------------------

### FakeYou design / brand

FakeYou (formerly vo.codes) uses the following:

* Font: fugaz one, 110, #209CEE
* Favicon: https://favicon.io/favicon-generator/

Social icons are paid from the subscription service [FlatIcon](https://www.flaticon.com), 
and in particular [this pack](https://www.flaticon.com/packs/social-logo-1)


Video thumbnails are generated with [https://ezgif.com/](ezgif) at the following settings:

* webp, 500x300px (~100kb each)

Reverse clips are generated with ffmpeg:

```
ffmpeg -i input.mp4 -vf reverse reversed.mp4
```

If node becomes a zombie process and you want to find/kill it, `ps aux | grep node`.

