const fs = require('fs')
const os = require('os')
const path = require('path')
const ssh2 = require('ssh2')
const { spawn } = require('child_process')
const { promisify } = require('util')

module.exports = function (config) {

  let ssh = null
  let sftp = null
  config = parseConfig(config)

  this.connect = function () {
    return new Promise((resolve, reject) => {
      writeOut(`CONNECT ${config.host}`)
      ssh = new ssh2.Client()
      ssh.on('ready', async () => {
        sftp = await promisify(ssh.sftp).call(ssh)
        resolve()
      })
      ssh.on('error', reject)
      ssh.connect({
        host: config.host,
        username: config.username,
        privateKey: config.privateKey
      })
    })
  }

  this.disconnect = function () {
    writeOut('DISCONNECT')
    ssh.end()
  }

  this.local = function (command, cwd = null) {
    return new Promise((resolve, reject) => {
      if (cwd === null) cwd = config.local
      writeOut(`LOCAL ${command}`)
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
        result.code = code
        resolve(result)
      })
    })
  }

  this.remote = function (command, cwd = null) {
    return new Promise((resolve, reject) => {
      if (cwd === null) cwd = config.remote
      writeOut(`REMOTE ${command}`)
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
          result.code = code
          resolve(result)
        })
        stream.end()
      })
    })
  }

  this.push = function (local, remote = '') {
    return new Promise((resolve, reject) => {
      if (!remote) remote = local
      local = path.join(config.local, local)
      remote = path.posix.join(config.remote, remote)
      writeOut(`PUSH ${local} => ${remote}`)
      sftp.fastPut(local, remote, (error) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
  }

  this.pull = function (remote, local = '') {
    return new Promise((resolve, reject) => {
      if (!local) local = remote
      local = path.join(config.local, local)
      remote = path.posix.join(config.remote, remote)
      writeOut(`PULL ${remote} => ${local}`)
      sftp.fastGet(remote, local, (error) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
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

  function parseConfig(config) {
    if (!config.hasOwnProperty('local')) {
      throw burguerConfigError('property "local" is missing')
    }

    if (!config.hasOwnProperty('localShell')) {
      config.localShell = null // default
    }

    if (!config.hasOwnProperty('remote')) {
      throw burguerConfigError('property "remote" is missing')
    }

    if (!config.hasOwnProperty('remoteShell')) {
      config.remoteShell = null // default
    }

    if (!config.hasOwnProperty('host')) {
      throw burguerConfigError('property "host" is missing')
    }

    if (!config.hasOwnProperty('username')) {
      throw burguerConfigError('property "username" is missing')
    }

    if (!config.hasOwnProperty('privateKey')) {
      throw burguerConfigError('property "privateKey" is missing')
    }

    if (!config.hasOwnProperty('stdout')) {
      config.stdout = console.log
    }

    if (!config.hasOwnProperty('stderr')) {
      config.stderr = console.error
    }

    config.local = parseLocalPath(config.local)
    config.privateKey = parsePrivateKey(config.privateKey)

    return config
  }

  function parsePrivateKey(privateKey) {
    privateKey = parseLocalPath(privateKey)

    if (!fs.existsSync(privateKey)) {
      throw burguerConfigError(`"privateKey" (${privateKey}) not found`)
    }

    privateKey = fs.readFileSync(privateKey)
    return privateKey
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

  return this

}
