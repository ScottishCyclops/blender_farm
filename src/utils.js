const crypto = require('crypto')
const moment = require('moment')

/**
 * Output a list of strings as a log to the stdout
 *
 * @param  {...string} args the strings to output
 * @returns {void} nothing
 * @unpure
 */
function log(...args)
{
  process.stdout.write(`[?] ${args.join(' ')}`)
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
  process.stdout.write(`[!] ${args.join(' ')}`)
}

/**
 * Output a list of strings as an error to the stderr
 *
 * @param  {...string} args the strings to output
 * @returns {void} nothing
 * @unpure
 */
function err(...args)
{
  process.stderr.write(`[x] ${args.join(' ')}`)
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
 * Get the MD5 hash of the given strings
 *
 * @param {...string} strings a list of strings
 * @returns {string} an hexadecimal hash string
 * @pure
 */
function md5Hash(...strings)
{
  const md5sum = crypto.createHash('md5')
  md5sum.update(strings.join(''))
  return md5sum.digest('hex')
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

module.exports = {
  log,
  warn,
  err,
  assert,
  md5Hash,
  parseTimeString
}
