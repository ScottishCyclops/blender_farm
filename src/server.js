const https = require('https')
const e = require('express')
const { jobsList, cancelJob, startNewJob } = require('./job')
const { err } =  require('./utils')
const consts = require('./consts')
const { normalize } = require('path')
const { existsSync, statSync } = require('fs')

const nameRegexp = new RegExp(/^[a-zA-Z0-9_-]+$/g)

/**
 * Create a new Express HTTPS server
 *
 * @param {{key: string, cert: string}} credentials a key-certificate credentials object
 * @returns {{server: https.Server, app: e.Express}} a new HTTPS server and Express app
 * @unpure
 */
const makeExpressServer = credentials =>
{
  const app = e()
  app.use(require('helmet')())
  app.use(require('body-parser').json())
  // secure the files under hierarchy

  const server = https.createServer(credentials, app)

  app.get('/status', (req, res) =>
  {
    // field exists
    if (!req.query.hasOwnProperty('id')) return res.status(400).json({ err: 'Bad Request. Missing parameter "id".' })

    // job exists
    if (!jobsList.hasOwnProperty(req.query.id)) return res.status(404).json({ err: `Not Found. No job matching "${req.query.id}".`})

    return res.json(jobsList[req.query.id])
  })

  app.get('/cancel', (req, res) =>
  {
    // field exists
    if (!req.query.hasOwnProperty('id')) return res.status(400).json({ err: 'Bad Request. Missing parameter "id".' })

    // job exists
    if (!jobsList.hasOwnProperty(req.query.id)) return res.status(404).json({ err: `Not Found. No job matching "${req.query.id}".`})

    const result = cancelJob(jobsList[req.query.id])

    return res.json({ log: `Job ${req.query.id}: ${result}`})
  })

  app.get('/render', (req, res) =>
  {
    // NAME
    // field exists
    if (!req.query.hasOwnProperty('name')) return res.status(400).json({ err: 'Bad Request. Missing parameter "name".' })
    // name matches the regexp
    if (!req.query.name.match(nameRegexp)) return res.status(400).json({ err: 'Bad Request. Invalid "name". Can contain: "a-z", "A-Z", "0-9", "_", or "-".' })

    // BLENDFILE
    // field exists
    if (!req.query.hasOwnProperty('blendFile')) return res.status(400).json({ err: 'Bad Request. Missing parameter "blendFile".' })

    const path = `${consts.ROOT_DIR}/public${req.query.blendFile}`
    // path is absolute and leading to a potential blend file
    if (!req.query.blendFile.startsWith('/') || !req.query.blendFile.endsWith('.blend') || path.indexOf('..') !== -1) return res.status(400).json({ err: 'Bad Request. Invalid "blendFile". Must be an absolute path starting with "/" and ending with ".blend"' })
    // path exists and is a file
    if (!existsSync(path) || !statSync(path).isFile()) return res.status(400).json({ err: 'Bad Request. Invalid "blendFile". File does not exist' })

    // TYPE
    // field exists
    if (!req.query.hasOwnProperty('type')) return res.status(400).json({ err: 'Bad Request. Missing parameter "type".' })
    // type is still or animation
    if (req.query.type !== 'still' && req.query.type !== 'animation') return res.status(400).json({ err: 'Bad Request. Invalid "type". Must be either "still" or "animation".' })

    const id = startNewJob(req.query.name, normalize(path), req.query.type)
    return res.json({ id })
  })

  /*
  app.post('/still', (req, res) =>
  {
    // req.body
  })
  */

  // TODO: socket for realtime info

  return { server, app }
}

module.exports = makeExpressServer
