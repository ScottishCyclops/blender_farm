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

module.exports = {
  log,
  warn,
  err,
  assert
}
