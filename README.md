# Burguer - deployment tool

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![travis](https://img.shields.io/travis/marcosbozzani/burguer?logo=travis)](https://travis-ci.org/marcosbozzani/burguer)
[![npm](https://img.shields.io/npm/v/burguer?logo=npm)](https://www.npmjs.com/package/burguer)
[![github](https://img.shields.io/github/v/release/marcosbozzani/burguer?logo=github)](https://github.com/marcosbozzani/burguer/releases/latest)
[![license](https://img.shields.io/github/license/marcosbozzani/burguer)](LICENSE)

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
// description: create a new Burguer instance
Burguer(config: BuguerConfig): Burguer

// description: connect to the ssh server
// requires: BuguerConfig.host, BuguerConfig.username, BuguerConfig.privateKey 
Burguer.connect(): Promise

// description: disconnect from the ssh server
// requires: Buguer.connect()
Burguer.disconnect()

// description: push a file from the local cwd to the remote cwd
// requires: Buguer.connect(), BurguerConfig.local, BurguerConfig.remote
// params:
//  - local: path relative to the local cwd (current working directory)
//  - remote: path relative to the remote cwd (current working directory). Same as local, if not set
Burguer.push(local: String, remote?: String): Promise

// description: pull a file from the remote cwd to the local cwd
// requires: Buguer.connect(), BurguerConfig.local, BurguerConfig.remote
// params:
//  - remote: path relative to the remote cwd (current working directory)
//  - local: path relative to the local cwd (current working directory). Same as remote, if not set
Burguer.pull(remote: String, local?: String): Promise

// description: execute a command in the local shell
// requires: BurguerConfig.local
// optional: BurguerConfig.localShell, BurguerConfig.localShellArgs
// params:
//  - command: the command path and arguments. e.g. echo hello world
//  - options:
//    - cwd: current working directory
//    - exitCode: the command expected exit code. default: 0
// returns: stdout, stderr and exit code from the command
Burguer.local(command: String, options?: { cwd?: String, exitCode?: Number }): Promise<BurguerResult>

// description: change the local cwd (current working directory)
Burguer.local.cd(path: String)

// description: execute a command in the remote shell
// requires: Buguer.connect(), BurguerConfig.remote
// optional: BurguerConfig.remoteShell, BurguerConfig.remoteShellArgs
// params:
//  - command: the command path and arguments. e.g. echo hello world
//  - options:
//    - cwd: current working directory
//    - exitCode: the command expected exit code. default: 0
// returns: stdout, stderr and exit code from the command
Burguer.remote(command: String, options?: { cwd?: String, exitCode?: Number }): Promise<BurguerResult>

// description: change the remote cwd (current working directory)
Burguer.remote.cd(path: String)

BuguerConfig = {
  // absolute or relative local project root path. e.g.: c:\project or ~/project or .
  local: String, 
  // absolute or relative remote project root path. e.g.: /var/www/project or ~/project or .
  remote: String, 
  // hostname or ip. e.g.: my-hostname.com or 192.168.0.100
  host: String, 
  // ssh username to access the remote. Must be used with password or privateKey, not both
  username: String, 
  // ssh password to access the remote
  password: String, 
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
