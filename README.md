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

// requires: BuguerConfig.host, BuguerConfig.username, BuguerConfig.privateKey 
Burguer.connect(): Promise

// requires: Buguer.connect()
Burguer.disconnect()

// requires: Buguer.connect(), BurguerConfig.local, BurguerConfig.remote
Burguer.push(local: String, remote?: String): Promise

// requires: Buguer.connect(), BurguerConfig.local, BurguerConfig.remote
Burguer.pull(remote: String, local?: String): Promise

// requires: BurguerConfig.local
// optional: BurguerConfig.localShell, BurguerConfig.localShellArgs
Burguer.local(command: String, options?: { cwd?: String, exitCode?: Number }): Promise<BurguerResult>

// requires: Buguer.connect(), BurguerConfig.remote
// optional: BurguerConfig.remoteShell, BurguerConfig.remoteShellArgs
Burguer.remote(command: String, options?: { cwd?: String, exitCode?: Number }): Promise<BurguerResult>

BuguerConfig = {
  // absolute or relative local project root path. e.g.: c:\project or ~/project or .
  local: String, 
  // absolute remote project root path. e.g.: /var/www/project
  remote: String, 
  // hostname or ip. e.g.: my-hostname.com or 192.168.0.100
  host: String, 
  // ssh username to access the remote
  username: String, 
  // absolute or relative path to the ssh private key. e.g.: c:\privatekey or ~/.ssh/privatekey
  privateKey: String, 
  // function called when an output is available. default: console.log
  stdout: Function,
  // function called when an error is available. default: console.error
  stderr: Function,
  // shell for local commands. e.g.: powershell.exe or /bin/bash.
  localShell: String,
  // arguments for the local shell. e.g.: '-c' or [ '/s', '/k' ]
  localShellArgs: String | String[],
  // shell for remote commands. e.g.: powershell.exe or /bin/bash.
  remoteShell: String
  // arguments for the remote shell. e.g.: '-c' or [ '/s', '/k' ]
  remoteShellArgs: String | String[]
}

BurguerResult = {
  code: Number,
  stdout: String,
  stderr: String
}
```
