const https = require('https')
const e = require('express')
const { jobsList, cancelJob, registerNewJob, retrieveJob, fileName, setBroadcast } = require('./job')
const { err, md5Hash } =  require('./utils')
const consts = require('./consts')
const { normalize } = require('path')
const { existsSync, statSync, writeFileSync } = require('fs')
const multer = require('multer')
const WebSocket = require('ws')

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

    cancelJob(jobsList[req.query.id])

    return res.json({ log: `Job ${req.query.id} got Canceled`})
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

    const path = `${consts.ROOT_DIR}/public/blendfiles/${req.query.blendFile}`
    // path is absolute and leading to a potential blend file
    if (!req.query.blendFile.startsWith('/') || !req.query.blendFile.endsWith('.blend') || path.indexOf('..') !== -1) return res.status(400).json({ err: 'Bad Request. Invalid "blendFile". Must be an absolute path starting with "/" and ending with ".blend"' })
    // path exists and is a file
    if (!existsSync(path) || !statSync(path).isFile()) return res.status(400).json({ err: 'Bad Request. Invalid "blendFile". File does not exist' })

    // TYPE
    // field exists
    if (!req.query.hasOwnProperty('type')) return res.status(400).json({ err: 'Bad Request. Missing parameter "type".' })
    // type is still or animation
    if (req.query.type !== 'still' && req.query.type !== 'animation') return res.status(400).json({ err: 'Bad Request. Invalid "type". Must be either "still" or "animation".' })

    const id = registerNewJob(req.query.name, normalize(path), req.query.type)
    return res.json({ id })
  })

  app.get('/retrieve', async (req, res) =>
  {
    // field exists
    if (!req.query.hasOwnProperty('id')) return res.status(400).json({ err: 'Bad Request. Missing parameter "id".' })

    // job exists
    if (!jobsList.hasOwnProperty(req.query.id)) return res.status(404).json({ err: `Not Found. No job matching "${req.query.id}".`})

    const job = jobsList[req.query.id]

    if (job.status !== 'Finished') return res.status(400).json({ err: `Job is not finished. Job is "${job.status}".`})

    const path = await retrieveJob(jobsList[req.query.id])


    // rename the download
    const name = fileName(job) + (job.type === 'animation' ? '.tar.gz' : '.png')
    res.set({ 'Content-Disposition': `attachment; filename="${name}"` })

    res.sendFile(path, e =>
    {
      if (!e) return

      // give a proper error message in case of failure
      err(e)
      return res.status(500).json({ err: `Output should be ready but wasn't found on the server.`})
    })
  })


  app.post('/render', multer({ storage: multer.memoryStorage() }).single('blendFile'), (req, res) =>
  {
    // https://github.com/expressjs/express/issues/3264
    req.body = JSON.parse(JSON.stringify(req.body))
    // NAME
    // field exists
    if (!req.body.hasOwnProperty('name')) return res.status(400).json({ err: 'Bad Request. Missing parameter "name".' })
    // name matches the regexp
    if (!req.body.name.match(nameRegexp)) return res.status(400).json({ err: 'Bad Request. Invalid "name". Can contain: "a-z", "A-Z", "0-9", "_", or "-".' })

    // TYPE
    // field exists
    if (!req.body.hasOwnProperty('type')) return res.status(400).json({ err: 'Bad Request. Missing parameter "type".' })
    // type is still or animation
    if (req.body.type !== 'still' && req.body.type !== 'animation') return res.status(400).json({ err: 'Bad Request. Invalid "type". Must be either "still" or "animation".' })

    // BLENDFILE
    // file exists
    if (!req.file) return res.status(400).json({ err: 'Bad Request. Missing file "blendFile".' })

    // write the file
    const hash = md5Hash(req.file.buffer)
    const path = normalize(`${consts.ROOT_DIR}/public/blendfiles/${req.body.name}_${hash}.blend`)
    // no need to check if the file already exists
    // it's more intense to check everytime than it is to rewrite the file once in a while
    writeFileSync(path, req.file.buffer, { encoding: 'binary' })

    const id = registerNewJob(req.body.name, path, req.body.type)
    return res.json({ id })
  })

  const wss = new WebSocket.Server({ server })

  // Relay informations from the job logic to the websocket clients
  setBroadcast(data =>
  {
    wss.clients.forEach(client =>
    {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data), e => e && err(e))
      }
    })
  })

  wss.on('connection', (ws, req) =>
  {
    log('New WebSocket client:', req.connection.remoteAddress)
  })

  return { server, app }
}

module.exports = makeExpressServer
