const fs = require('fs')
const os = require('os')
const path = require('path')
const ssh2 = require('ssh2')
const { spawn } = require('child_process')
const { promisify } = require('util')

module.exports = function (config) {

  initConfig()

  let ssh = null
  let sftp = null
  let init = {
    connect: false,
    disconnect: false,
    local: false,
    remote: false,
    push: false,
    pull: false
  }
  
  this.connect = function () {
    return new Promise((resolve, reject) => {
      writeOut(`CONNECT`)
      beforeConnect()
      ssh = new ssh2.Client()
      ssh.on('ready', async () => {
        sftp = await promisify(ssh.sftp).call(ssh)
        resolve()
      })
      ssh.on('error', reject)
      ssh.connect({
        host: config.host,
        username: config.username,
        privateKey: config.privateKeyBytes
      })
    })
  }

  function beforeConnect() {
    if (!init.connect) {
      if (!config.hasOwnProperty('host')) {
        throw burguerConfigError('property "host" is missing')
      }
  
      if (!config.hasOwnProperty('username')) {
        throw burguerConfigError('property "username" is missing')
      }
  
      if (!config.hasOwnProperty('privateKey')) {
        throw burguerConfigError('property "privateKey" is missing')
      }

      config.privateKeyBytes = parsePrivateKey(config.privateKey)
      init.connect = true
    }

    if (ssh !== null) {
      throw burguerRuntimeError("Already connected")
    }
  }

  this.disconnect = function () {
    writeOut('DISCONNECT')
    beforeDisconnect()
    ssh.end()
    ssh = null
  }

  function beforeDisconnect() {
    if (!init.disconnect) {
      init.disconnect = true
    }
    if (ssh === null) {
      throw burguerRuntimeError("Not connected")
    }
  }

  this.local = function (command, { cwd = null, exitCode = 0 } = {}) {
    return new Promise((resolve, reject) => {
      writeOut(`LOCAL ${command}`)
      beforeLocal()
      if (cwd === null) cwd = config.local
      let process = null
      if (config.localShell === null) {
        process = spawn(command, [], { cwd, shell: true })
      }
      else {
        const args = ['-c', `"${command}"`]
        process = spawn(config.localShell, args, { cwd, shell: true })
      }
      const result = {
        stdout: '',
        stderr: ''
      }
      process.stdout.on('data', (data) => {
        data = parseData(data)
        writeOut(data)
        result.stdout += data
      })
      process.stderr.on('data', (data) => {
        data = parseData(data)
        writeError(data)
        result.stderr += data
      })
      process.on('error', reject)
      process.on('close', (code) => {
        if (code != exitCode) {
          throw burguerRuntimeError(`Exit code: expected '${exitCode}', actual '${code}'`)
        }
        result.code = code
        resolve(result)
      })
    })
  }

  function beforeLocal() {
    if (!init.disconnect) {
      if (!config.hasOwnProperty('local')) {
        throw burguerConfigError('property "local" is missing')
      }
  
      if (!config.hasOwnProperty('localShell')) {
        config.localShell = null // use default
      }

      config.local = parseLocalPath(config.local)
      init.disconnect = true
    }
  }

  this.remote = function (command, { cwd = null, exitCode = 0 } = {}) {
    return new Promise((resolve, reject) => {
      writeOut(`REMOTE ${command}`)
      beforeRemote()
      if (cwd === null) cwd = config.remote
      let _command = null
      if (config.remoteShell === null) {
        _command = `cd ${cwd}; ${command}`
      }
      else {
        const shell = config.remoteShell
        _command = `${shell} -c "cd ${cwd}; ${command}"`
      }
      ssh.exec(_command, (error, stream) => {
        if (error) {
          reject(error)
          return
        }
        const result = {
          stdout: '',
          stderr: ''
        }
        stream.stdout.on('data', (data) => {
          data = parseData(data)
          writeOut(data)
          result.stdout += data
        })
        stream.stderr.on('data', (data) => {
          data = parseData(data)
          writeError(data)
          result.stderr += data
        })
        stream.on('error', reject)
        stream.on('close', (code) => {
          if (code != exitCode) {
            throw burguerRuntimeError(`Exit code: expected '${exitCode}', actual '${code}'`)
          }
          result.code = code
          resolve(result)
        })
        stream.end()
      })
    })
  }

  function beforeRemote() {
    if (!init.remote) {
      if (!config.hasOwnProperty('remote')) {
        throw burguerConfigError('property "remote" is missing')
      }
  
      if (!config.hasOwnProperty('remoteShell')) {
        config.remoteShell = null // use default
      }

      init.remote = true
    }

    if (ssh === null) {
      throw burguerRuntimeError("Not connected")
    }
  }

  this.push = function (local, remote = '') {
    return new Promise((resolve, reject) => {
      if (!remote) remote = local
      writeOut(`PUSH ${local} => ${remote}`)
      beforePush()
      local = path.join(config.local, local)
      remote = path.posix.join(config.remote, remote)
      sftp.fastPut(local, remote, (error) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
  }

  function beforePush() {
    if (!init.push) {
      if (!config.hasOwnProperty('local')) {
        throw burguerConfigError('property "local" is missing')
      }

      if (!config.hasOwnProperty('remote')) {
        throw burguerConfigError('property "remote" is missing')
      }

      init.push = true
    }

    if (ssh === null) {
      throw burguerRuntimeError("Not connected")
    }
  }

  this.pull = function (remote, local = '') {
    return new Promise((resolve, reject) => {
      if (!local) local = remote
      writeOut(`PULL ${remote} => ${local}`)
      beforePull()
      local = path.join(config.local, local)
      remote = path.posix.join(config.remote, remote)
      sftp.fastGet(remote, local, (error) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
  }

  function beforePull() {
    if (!init.pull) {
      if (!config.hasOwnProperty('local')) {
        throw burguerConfigError('property "local" is missing')
      }

      if (!config.hasOwnProperty('remote')) {
        throw burguerConfigError('property "remote" is missing')
      }

      init.pull = true
    }

    if (ssh === null) {
      throw burguerRuntimeError("Not connected")
    }
  }

  function initConfig() {    
    if (!config.hasOwnProperty('stdout')) {
      config.stdout = console.log
    }

    if (!config.hasOwnProperty('stderr')) {
      config.stderr = console.error
    }
  }

  function writeOut(text) {
    if (config.stdout) {
      config.stdout(text)
    }
  }

  function writeError(text) {
    if (config.stderr) {
      config.stderr(text)
    }
  }

  function parseData(data) {
    return data.toString().replace(/^\s+|\s+$/g, '')
  }

  function parsePrivateKey(privateKey) {
    privateKey = parseLocalPath(privateKey)

    if (!fs.existsSync(privateKey)) {
      throw burguerConfigError(`"privateKey" (${privateKey}) not found`)
    }

    return fs.readFileSync(privateKey)
  }

  function parseLocalPath(localPath) {
    if (typeof localPath === 'string') {
      if (localPath.startsWith('~')) {
        localPath = path.join(os.homedir(), localPath.slice(1))
      }
    }

    return path.resolve(localPath)
  }

  function burguerConfigError(message) {
    return {
      name: 'Burguer configuration error',
      message: message,
      toString() {
        return this.name + ': ' + this.message
      }
    }
  }

  function burguerRuntimeError(message) {
    return {
      name: 'Burguer runtime error',
      message: message,
      toString() {
        return this.name + ': ' + this.message
      }
    }
  }

  return this

}
