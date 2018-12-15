const { join } = require('path')
const { EventEmitter } = require('events')
const { existsSync } = require('fs')

const { getData, getDevices, render, parseBlenderOutputLine } = require('./blender')
const { jobType, deviceType, renderNodeType } = require('./types')
const consts = require('./consts')
const { log, err, md5Hash, tarFolder } = require('./utils')

/**
 * Create the devices list
 *
 * @returns {{[x: string]: typeof deviceType}}
 * @unpure
 */
function makeDevicesList()
{
  const numDevices = getDevices()
  const devicesList = {}
  for (let id = 0; id < numDevices; ++id) {
    devicesList[id] = {
      id,
      running: false,
      pendingJobs: [],
      events: new EventEmitter
    }
  }
  return devicesList
}

/**
 * Get the output folder for a job
 *
 * @param {typeof jobType} job the job
 * @returns {string} the full path to the output for a job
 * @pure
 */
function outputFolder(job)
{
  return `${consts.ROOT_DIR}/public/${job.name}_${job.id}`
}

/**
 * Get the file name for a job
 *
 * @param {typeof jobType} job the job
 * @returns {string} the name of the output file
 * @pure
 */
function fileName(job)
{
  return `${job.name}_${job.id}`
}

/**
 * The list of devices that are avaiable for 3D Rendering
 */
const devicesList = makeDevicesList()

/**
 * The list of jobs registered by the user
 *
 * @type {{[x: string]: typeof jobType}}
 */
const jobsList = {}

/**
 * List of all running nodes indexed by PID
 *
 * @type {{[x: string]: ChildProcess}}
 */
const nodesList = {}

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

    // change the status
    if (job.status === 'Pending') job.status = 'Rendering'

    const child = render(job.blendFile, { type: job.type, devices, outputFolder: outputFolder(job), fileName: fileName(job) })

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

      // check if the job is finished
      // we might be done, but more frames might still be rendered by other nodes !

      // job is done if all nodes that rendered it say they are finished
      const jobIsDone = Object.values(job.nodes).every(node => node.information === 'Finished')

      if (jobIsDone) {
        // tell all nodes that potentially haven't started this job to forget it
        for (const device in devicesList) {
          devicesList[device].events.emit('removeJob', job.id)
        }

        // if the status is canceled, don't overwrite it
        if (job.status !== 'Canceled') job.status = 'Finished'
        log(`finished job "${job.name}"`)
      }

      return resolve()
    })
  })
}

/**
 * Gather the data for a job then notify all devices that a new job is ready
 *
 * @param {typeof jobType} job the job to prepare
 * @returns {Promise<void>} nothing
 * @unpure
 */
async function prepareJob(job)
{
  log(`preparing job "${job.name}"`)

  job.status = 'Gathering data'
  job.data = await getData(job.blendFile)
  job.status = 'Pending'

  // queue the job on every device
  for (const device in devicesList) {
    devicesList[device].events.emit('newJob', job.id)
  }
}

/**
 * Register a new job and get it's id
 *
 * @param {string} name the name of the job
 * @param {string} blendFile relative path to the blendFile in the public directory
 * @param {typeof jobType.type} type the type of job. still or animation
 * @returns {string} the unique id of the job
 * @unpure
 */
function registerNewJob(name, blendFile, type)
{
  const id = md5Hash(blendFile + Date.now())

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

  prepareJob(job).catch(err)

  return id
}

/**
 * Kill all nodes associated with a job and remove it from the pending jobs on all devices
 *
 * @param {typeof jobType} job the job to cancel
 * @returns {void} nothing
 * @unpure
 */
function cancelJob(job)
{
  job.status = 'Canceled'

  // kill the nodes that are already rendering this job (there might be none)
  for (const pid in job.nodes) {
    nodesList[pid].kill()
  }

  // tell all nodes that potentially haven't started this job to forget it
  for (const device in devicesList) {
    devicesList[device].events.emit('removeJob', job.id)
  }
}

/**
 * Retrieve the path to the output of a job that has finished.
 * If job is an animation, creates a tar.gz archive file containing all the frames
 *
 * @param {typeof jobType} job the job to retrieve
 * @returns {Promise<string>} the path of the output file or archive
 * @unpure
 */
async function retrieveJob(job)
{
  const folder = outputFolder(job)
  if (job.type === 'still') {
    return join(folder, `${fileName(job)}.png`)
  }

  const archive = `${folder}.tar.gz`

  // don't recreate the archive if the output is retrieved multiple times
  if (existsSync(archive)) return archive

  return tarFolder(folder)
}

function startFarm()
{
  /**
   * @type {typeof deviceType[]}
   */
  const devices = Object.values(devicesList)

  devices.forEach(device =>
  {
    device.events.on('newJob', id =>
    {
      device.pendingJobs.push(id)

      // try restarting on new jobs
      if (device.running) return
      run().catch(err)
    })

    device.events.on('removeJob', id =>
    {
      const index = device.pendingJobs.indexOf(id)
      if (index === -1) return

      device.pendingJobs.splice(index, 1)
    })

    /**
     * Run this node until there are no more jobs
     */
    async function run()
    {
      device.running = true

      let currentJob = null

      while (true) {
        currentJob = device.pendingJobs.shift()

        // stop if there are no more jobs to render
        if (!currentJob) break

        await startJobNode(jobsList[currentJob], [ device.id ])
        device.events.emit('jobDone', currentJob)
      }

      device.running = false
    }

    run().catch(err)
  })
}

startFarm()

module.exports = {
  jobsList,
  registerNewJob,
  cancelJob,
  retrieveJob,
  fileName,
}
