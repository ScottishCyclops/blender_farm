const crypto = require('crypto')
const moment = require('moment')
const { spawnSync } = require('child_process')
const { normalize, dirname, basename } = require('path')
const { lstatSync } = require('fs')

/**
 * Output a list of strings as a log to the stdout
 *
 * @param  {...string} args the strings to output
 * @returns {void} nothing
 * @unpure
 */
function log(...args)
{
  process.stdout.write(`[?] ${args.join(' ')}\n`)
}

/**
 * Output a list of strings as a warning to the stdout
 *
 * @param  {...string} args the strings to output
 * @returns {void} nothing
 * @unpure
 */
function warn(...args)
{
  process.stdout.write(`[!] ${args.join(' ')}\n`)
}

/**
 * Output a list of strings as an error to the stdout
 *
 * @param  {...string} args the strings to output
 * @returns {void} nothing
 * @unpure
 */
function err(...args)
{
  process.stdout.write(`[x] ${args.join(' ')}\n`)
}

/**
 * Assert an expression is true. If not, exit the program with an optional code and error message
 *
 * @param {boolean} x the expression to assert
 * @param {number} code the optional exit code in case of failure
 * @param  {...string} error the optional error message in case of failure
 * @returns {never | void} never returns in case of failure, or returns nothing
 * @unpure
 */
function assert(x, code, ...error)
{
  if (Boolean(x) === true) return

  if (error.length > 0) err(...error)

  process.exit(code || 1)
}

/**
 * Get the MD5 hash of the data (string or buffer)
 *
 * @param {string | Buffer} data a string or buffer
 * @returns {string} an hexadecimal hash string
 * @pure
 */
function md5Hash(data)
{
  const hash = crypto.createHash('md5')

  hash.setEncoding('hex')

  hash.write(data)

  hash.end()

  return hash.read()
}

/**
 * Turn a time string of format "00:00.00" into a number of milliseconds
 *
 * @param {string} timeString the time string
 * @returns {number} the number of milliseconds
 * @pure
 */
function parseTimeString(timeString)
{
  return moment.duration(`00:${timeString}`).asMilliseconds()
}

/**
 * Create a tar.gz archive from the given folder
 *
 * @param {string} folderPath a path to an existing folder
 * @param {string} archivePath the full path of the archive to create
 * @returns {Promise<void>} nothing
 * @unpure
 */
function tarFolder(folderPath, archivePath)
{
  return new Promise((resolve, reject) =>
  {
    const isDir = lstatSync(folderPath).isDirectory()

    if (!isDir) return reject(`"${folderPath}" is not a directory`)

    const normalized = normalize(folderPath)

    const parentDir = dirname(normalized)
    const folderName = basename(normalized)

    // tar
    // -z : Compress archive using gzip program
    // -c: Create archive
    // -f: Archive File name
    // -C: change directory
    // last param: name of folder to archive
    // this method was used to produce an archive with a single folder inside, with the original name
    const process = spawnSync('tar', [ '-zcf', normalize(archivePath), '-C', parentDir, folderName ])

    if (process.error) return reject(process.error)

    resolve()
  })
}

module.exports = {
  log,
  warn,
  err,
  assert,
  md5Hash,
  parseTimeString,
  tarFolder,
}
