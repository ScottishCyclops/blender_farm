const { getData, getDevices, render, blenderOutput } = require('./blender')
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
 * @type {{status: typeof blenderOutput, name: string, id: string, type: 'still' | 'animation', blendFile: string, data: {startFrane: number, endFrame: number}}}
 */
const jobType = null

/**
 * @type {{id: number, busy: boolean}}
 */
const deviceType = null

const errors = {
  INVALID_ID: 0,
}

/**
 * @type {{[x: string]: typeof jobType}}
 */
const jobsList = {
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
 * Get the status of the given job by id
 *
 * @param {string} id the id of the job to check
 * @returns {typeof jobType}
 * @throws if the job id is invalid
 */
function getJobStatus(id)
{
  if (jobsList.hasOwnProperty(id)) return jobsList[id]

  throw errors.INVALID_ID
}

/**
 * Starts a node for the given job with the given devices
 *
 * @param {typeof jobType} job the job object
 * @param {number[]} devices the devices to use
 * @returns {Promise<void>} nothing
 * @unpure
 */
async function startJobNode(job, devices)
{
  log(`starting job node for "${job.name}"`)
  await render(job.blendFile, { type: job.type, devices, outputFolder: outputFolder(job) }, status =>
  {
    // TODO: handle different nodes status and don't overwrite
    job.status = status
    // console.log(job.status.information, job.status.extra_information || '')
  })
  log(`finished job node for "${job.name}"`)
}

/**
 *
 * @param {typeof jobType} job
 */
async function doJobAsync(job)
{
  log(`starting job "${job.name}"`)
  job.data = await getData(job.blendFile)

  const availableDevices = Object.values(devicesList).filter(x => !x.busy)
  availableDevices.forEach(device => device.busy = true)

  const numFrames = job.data.endFrame - job.data.startFrane + 1

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
    status: {
      frame: 0,
      memory_global: 0,
      render_time: 0,
      memory_current: 0,
      memory_current_peak: 0,
      scene: 'Unknown',
      render_layer: 'Unknown',
      information: 'Pending'
    },
    data: { startFrame: 0, endFrame: 0 },
    type,
    blendFile
  }

  jobsList[id] = job

  doJobAsync(job).catch(err)
  return id
}

module.exports = {
  getJobStatus,
  errors,
  startNewJob,
}
