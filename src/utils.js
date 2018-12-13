const crypto = require('crypto')

function log(...args)
{
  console.log(...args)
}

function warn(...args)
{
  console.warn(...args)
}

function err(...args)
{
  console.error(...args)
}

/**
 *
 * @param {boolean} x the expression to assert
 * @param {number} code the exit code in case of failure
 * @param  {...string} error the error message in case of failure
 * @returns {never | void} never returns in case of failure, or returns nothing
 */
function assert(x, code, ...error)
{
  if (x) return

  err(...error)
  process.exit(code)
}

/**
 * Get the MD5 hash of the given strings
 *
 * @param {...string} strings a list of stringd
 * @returns {string} an hexadecimal hash string
 * @pure
 */
function md5Hash(...strings)
{
  const md5sum = crypto.createHash('md5')
  md5sum.update(strings.join(''))
  return md5sum.digest('hex')
}

module.exports = {
  log,
  warn,
  err,
  assert,
  md5Hash
}
