# Burguer - deployment tool

[![Build Status](https://travis-ci.org/marcosbozzani/burguer.svg?branch=master)](https://travis-ci.org/marcosbozzani/burguer)
[![npm version](https://badge.fury.io/js/burguer.svg)](https://badge.fury.io/js/burguer)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)


## Install

Install with `yarn`
``` sh
yarn add -D burguer
```

Install with `npm`
``` sh
npm install -D burguer
```

## Example (cli)

Create `deploy.yml`
``` yml
config:
  local: .
  remote: /var/www
  host: hostname
  username: www-data
  privateKey: ~/.ssh/private-key

commands:
  - connect
  - push: index.js
  - push: package.json
  - remote: yarn install
  - disconnect
```

Run with `yarn`
``` sh
yarn burguer deploy.yml
```

Run with `npx`
``` sh
npx burguer deploy.yml
```

## Example (library)

Create `deploy.js`
``` js
const Burguer = require('burguer')

async function start() {

  const burguer = new Burguer({
    local: '.',
    remote: '/var/www',
    host: 'hostname',
    username: 'www-data',
    privateKey: '~/.ssh/private-key'
  })

  await burguer.connect()
  await burguer.push('index.js')
  await burguer.push('package.json')
  await burguer.remote('yarn install')
  burguer.disconnect()

}

start()
```

Run with `node`
``` sh
node deploy.js
```

## API

``` js
Burguer(config: BuguerConfig): Burguer

Burguer.connect(): Promise

Burguer.disconnect()

Burguer.push(local: String, remote?: String): Promise

Burguer.pull(remote: String, local?: String): Promise

Burguer.local(command: String, cwd?: String): Promise<BurguerResult>

Burguer.remote(command: String, cwd?: String): Promise<BurguerResult>

BuguerConfig = {
  local: String,
  remote: String,
  host: String,
  username: String,
  privateKey: String,
  stdout?: Function,
  stderr?: Function,
  localShell?: String,
  remoteShell?: String
}

BurguerResult = {
  code: Number,
  stdout: String,
  stderr: String
}
```
