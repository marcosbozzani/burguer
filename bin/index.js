#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const Burguer = require('./burguer')

async function start() {
    const script = loadScript()
    const burguer = new Burguer(script.config)

    for (const command of script.commands) {
        let name = ''
        let args = []
        if (typeof command === 'string') {
            name = command
        }
        else {
            name = Object.keys(command)[0]
            args = command[name]
            if (!Array.isArray(args)) {
                args = [ args ]
            }
        } 

        if (name === 'local') {
            await burguer.local(...args)
        }
        else if (name === 'remote') {
            await burguer.remote(...args)
        }
        else if (name === 'push') {
            await burguer.push(...args)
        }
        else if (name === 'pull') {
            await burguer.pull(...args)
        }
        else if (name === 'connect') {
            await burguer.connect()
        }
        else if (name === 'disconnect') {
            burguer.disconnect()
        }
        else {
            console.error(`command not found: ${name}`)
        }
    }    
}

function loadScript() {
    const script = path.resolve(process.argv[2])
    if (!fs.existsSync(script)) {
        console.error(`file not found: ${script}`)
        process.exit(-1)    
    }
    return yaml.safeLoad(fs.readFileSync(script, 'utf8'))
}

function errorHandler(error) {
    console.error(error)
    process.exit(-1)
}

process.on('uncaughtException', errorHandler)
process.on('unhandledRejection', errorHandler)

start()
