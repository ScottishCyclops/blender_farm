const { getData, getDevices, render, blenderOutput } = require('./blender')
const crypto = require('crypto')
const consts = require('./consts')
const { log } = require('./utils')

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
function startJobNode(job, devices)
{
  return render(job.blendFile, { type: job.type, devices, outputFolder: outputFolder(job) }, status =>
  {
    // TODO: handle different nodes status and don't overwrite
    job.status = status
    // console.log(job.status.information, job.status.extra_information || '')
  })
}

async function startNewJob(name, blendFile, type)
{
  log('starting job', name)
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

  job.data = await getData(job.blendFile)

  const availableDevices = Object.values(devicesList).filter(x => !x.busy)

  // start a node for every available device
  await Promise.all(availableDevices.map(device =>
  {
    device.busy = true
    // TODO: queue jobs and as soon as device is ready, assign the new job
    return startJobNode(job, [ device.id ]).then(() => device.busy = false)
  }))

  log('job done', name)
}

module.exports = {
  getJobStatus,
  errors,
  startNewJob,
}
