const https = require('https')
const e = require('express')

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

  app.get('/', (req, res) =>
  {
    // req.query
    res.json({ 'hello': 'world' })
  })

  app.post('/', (req, res) =>
  {
    // req.body
    res.json({ 'hello': 'world' })
  })

  return { server, app }
}

module.exports = makeExpressServer
