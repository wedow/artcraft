local development setup
=======================

Ubuntu 22.04
------------

### Development setup

Install NPM and Yarn

```bash
sudo apt install npm
sudo npm install --global yarn
```

Add the following to your hosts file (`/etc/hosts`) : 

```
127.0.0.1    dev.fakeyou.com
127.0.0.1    api.dev.fakeyou.com
127.0.0.1    devproxy.fakeyou.com

127.0.0.1    dev.storyteller.ai
127.0.0.1    api.dev.storyteller.ai
127.0.0.1    devproxy.storyteller.ai
```

### Run locally

Install dependencies

```bash
yarn install
```

Start development server for FakeYou

```bash
yarn start-fakeyou
```

MacOS
-----

### Development setup

Install NPM and Yarn

```bash
sudo apt install npm
sudo npm install --global yarn
```

Add the following to your hosts file (`/etc/hosts`) : 

```
127.0.0.1    dev.fakeyou.com
127.0.0.1    api.dev.fakeyou.com
127.0.0.1    dev.storyteller.ai
127.0.0.1    api.dev.storyteller.ai
```

### Run locally

Install dependencies

```bash
yarn install
```

Start development server for FakeYou

```bash
yarn start-fakeyou
```

Windows
-------

See [windows.md](./windows.md)


