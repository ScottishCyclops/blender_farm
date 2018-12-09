const { getData, getDevices, render, blenderOutput, parseBlenderOutputLine } = require('./blender')
const crypto = require('crypto')
const consts = require('./consts')
const { log, err } = require('./utils')

/**
 * Get a unique ID by hashing the file name and the current time
 *
 * @param {string} blendFile the file name
 * @param {number} t the current time in ms
 * @returns {string} an pseudo-unique hexadecimal string
 * @pure
 */
function getId(blendFile, t)
{
  const md5sum = crypto.createHash('md5')
  md5sum.update(blendFile + t)
  return md5sum.digest('hex')
}

/**
 * @type {{status: string, nodes: { [x:string]: typeof blenderOutput }, name: string, id: string, type: 'still' | 'animation', blendFile: string, data: {startFrane: number, endFrame: number}}}
 */
const jobType = null

/**
 * @type {{id: number, busy: boolean}}
 */
const deviceType = null

/**
 * @type {{[x: string]: typeof jobType}}
 */
const jobsList = {
}

/**
 * List of all running nodes indexed by PID
 * @type {{[x: string]: ChildProcess}}
 */
const nodesList = {

}


// build the devices list
const numDevices = getDevices()
/**
 * @type {{[x: number]: typeof deviceType}}
 */
const devicesList = {}
for (let id = 0; id < numDevices; ++id) {
  devicesList[id] = { id, busy: false }
}

/**
 * Get the output folder for a job
 *
 * @param {typeof jobType} job the job
 * @returns {string} the full path to the output for a job
 * @pure
 */
const outputFolder = job => `${consts.ROOT_DIR}/public/${job.name}_${job.id}`

/**
 * Starts a node for the given job with the given devices
 *
 * @param {typeof jobType} job the job object
 * @param {number[]} devices the devices to use
 * @returns {Promise<void>} nothing
 * @unpure
 */
function startJobNode(job, devices)
{
  return new Promise((resolve, reject) =>
  {
    log(`starting job node for "${job.name}"`)
    const child = render(job.blendFile, { type: job.type, devices, outputFolder: outputFolder(job) })

    // save the child to be able to cancel the render
    const pid = child.pid
    nodesList[pid] = child

    const onprogress = status =>
    {
      job.nodes[pid] = status
    }

    child.stdout.on('data', data =>
    {
      const lines = data.toString().split('\n').filter(Boolean)

      lines.forEach(line =>
      {
        const output = parseBlenderOutputLine(line)
        if (output !== null) onprogress(output)
      })
    })

    child.on('error', reject)

    child.on('close', (code, signal) =>
    {
      // ignore SIGTERM, because it means the job got canceled
      if (code !== 0 && signal !== 'SIGTERM') return reject(signal)
      log(`finished job node for "${job.name}"`)
      delete nodesList[pid]
      return resolve()
    })
  })
}

/**
 *
 * @param {typeof jobType} job
 */
async function doJobAsync(job)
{
  log(`starting job "${job.name}"`)

  job.status = 'Gathering data'
  job.data = await getData(job.blendFile)

  const availableDevices = Object.values(devicesList).filter(x => !x.busy)
  availableDevices.forEach(device => device.busy = true)

  const numFrames = job.data.endFrame - job.data.startFrane + 1

  job.status = 'Rendering'
  if(job.type === 'animation' && availableDevices.length >= numFrames) {
    // if it is an animation and there are as much or more available devices than frames to render it is always faster to render multiple frames at a time
    // -> spawn multiple, nodes each with one device

    // start a node for every available device
    await Promise.all(availableDevices.map(device =>
    {
      // TODO: queue jobs and as soon as device is ready, assign the new job
      return startJobNode(job, [ device.id ]).then(() => device.busy = false)
    }))
  } else {
    // if it is a still or an animation with less frames than devices, it is always faster to render with multiple devices
    // -> spawn a single node with all the available devices
    await startJobNode(job, availableDevices.map(device => device.id))
    availableDevices.forEach(device => device.busy = false)
  }

  // don't overwrite the "canceled" state
  if (job.status !== 'Canceled') job.status = 'Finished'

  log(`finished job "${job.name}"`)
}

/**
 * Start a new job in async and get it's id
 * @param {string} name the name of the job
 * @param {string} blendFile relative path to the blendFile in the public directory
 * @param {typeof jobType.type} type the type of job. still or animation
 */
function startNewJob(name, blendFile, type)
{
  const id = getId(blendFile, Date.now())
  /**
   * @type {typeof jobType}
   */
  const job = {
    id,
    name,
    status: 'Pending',
    nodes: {},
    type,
    blendFile,
    data: { startFrame: 0, endFrame: 0 },
  }

  jobsList[id] = job

  doJobAsync(job).catch(e => err('Rendering error:', e))
  return id
}

/**
 * Kill all nodes associated with a job
 *
 * @param {typeof jobType} job the job to cancel
 * @returns {string} a message saying what happened
 */
function cancelJob(job)
{
  if (job.status !== 'Rendering') return `Cannot be canceled. Job is currently ${job.status}`
  job.status = 'Canceled'

  for (const pid in job.nodes) {
    nodesList[pid].kill()
  }

  return 'Canceled'
}

module.exports = {
  jobsList,
  startNewJob,
  cancelJob,
}
