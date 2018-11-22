const consts = require('./consts')
const { existsSync } = require('fs')
const { spawn } = require('child_process')
/**
 * @type {{blenderExec: string}}
 */
const config = require(consts.ROOT_DIR + '/config.json')

const { log, assert } = require('./utils')

assert(config.hasOwnProperty('blenderExec'), 1, 'Invalid config file: missing "blenderExec"')
assert(existsSync(config.blenderExec), 2, `"${config.blenderExec}" does not exist`)

const getDataScript = consts.ROOT_DIR + '/python/get_data.py'
const renderScript = consts.ROOT_DIR + '/python/render.py'

const getDataScriptPrefix = 'render_farm_data='

/**
 * Get data about the blend file
 *
 * @param {string} blendFile path to the blend file to retrieve data from
 * @returns {Promise<{startFrame: number, endFrame: number}>} some data about the blend file
 * @unpure
 */
function getData(blendFile)
{
  return new Promise((resolve, reject) =>
  {
    log('executing blender for data')
    const child = spawn(config.blenderExec, [ '-b', blendFile, '-P', getDataScript ])

    child.stdout.on('data', data =>
    {
      const lines = data.toString().split('\n')

      for (const line of lines) {
        if (!line.startsWith(getDataScriptPrefix)) continue

        const json = JSON.parse(line.split(getDataScriptPrefix)[1])
        child.kill()
        return resolve(json)
      }
    })

    child.on('error', reject)
  })
}

/**
 * Render the given blend file
 *
 * @param {string} blendFile path to the blend file to render
 * @param {'still' | 'animation'} type the type of render to performe
 * @param {string} outputFolder path to the folder in which to write the frames
 * @param {(progress: {frame: number}) => void} onprogress a callback executed when the blend file yields progress
 * @returns {Promise<void>} nothing
 * @unpure
 */
function render(blendFile, type, outputFolder, onprogress)
{
  return new Promise((resolve, reject) =>
  {
    log('executing blender for render')

    const params = {
      type,
      devices: [ 0 ],
      outputFolder,
    }

    const child = spawn(config.blenderExec, [ '-b', blendFile, '-P', renderScript, '--', JSON.stringify(params) ])

    child.stdout.on('data', data =>
    {
      onprogress(data.toString())
    })

    child.on('error', reject)

    child.on('close', (code, signal) =>
    {
      log('render done')
      if (code !== 0) return reject(signal)
      return resolve()
    })
  })
}

module.exports = {
  getData,
  render,
}
