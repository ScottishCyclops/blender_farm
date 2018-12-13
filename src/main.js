const { readFileSync, existsSync } = require('fs')
const makeExpressServer = require('./server')
const consts = require('./consts')
const { log, assert } = require('./utils')

/**
 * Application entry point for worker threads
 *
 * @returns {never} never
 * @unpure
 */
const main = () =>
{
  /**
   * @type {{port: number, certPath: string, keyPath: string}}
   */
  const config = require(consts.ROOT_DIR + '/config.json')

  assert(config.hasOwnProperty('port'),     1, 'Invalid config file: missing "port"')
  assert(config.hasOwnProperty('certPath'), 1, 'Invalid config file: missing "certPath"')
  assert(config.hasOwnProperty('keyPath'),  1, 'Invalid config file: missing "keyPath"')

  assert(existsSync(consts.ROOT_DIR + config.certPath), 2, `"${consts.ROOT_DIR + config.certPath}" does not exist`)
  assert(existsSync(consts.ROOT_DIR + config.keyPath), 2, `"${consts.ROOT_DIR + config.keyPath}" does not exist`)

  const credentials = {
    cert: readFileSync(consts.ROOT_DIR + config.certPath, consts.CODING),
    key:  readFileSync(consts.ROOT_DIR + config.keyPath, consts.CODING)
  }

  const { server } = makeExpressServer(credentials)

  const HOST = '0.0.0.0'

  server.listen(config.port, HOST, () =>
  {
    log(`listening on https://${HOST}:${config.port}`)
  })
}

main()
