const https = require('https')
const e = require('express')
const { getJobStatus, errors, startNewJob } = require('./job')
const { err } =  require('./utils')
const consts = require('./consts')

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
    if (!req.query.hasOwnProperty('id')) return res.status(400).json({ err: 'Bad Request. Missing parameter "id".' })

    try {
      const status = getJobStatus(req.query['id'])
      return res.json(status)

    } catch (e) {
      if (e === errors.INVALID_ID) return res.status(404).json({ err: `Not Found. No job matching "${req.query['id']}".`})
      err(e)
      return res.status(500).json({ err: 'Internal Server Error. Something unexpected happened.'})
    }
  })

  app.post('/still', (req, res) =>
  {
    // req.body
    res.json({ 'hello': 'world' })
  })

  startNewJob('test', consts.ROOT_DIR + '/public/test.blend', 'animation')

  return { server, app }
}

module.exports = makeExpressServer
