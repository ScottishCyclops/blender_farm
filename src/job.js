const { getData, render } = require('./blender')
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
 * @type {{status: 'pending' | 'rendering' | 'done', name: string, id: string, type: 'still' | 'animation', blendFile: string}}
 */
const jobType = null

const errors = {
  INVALID_ID: 0,
}

/**
 * @type {{[x: string]: typeof jobType}}
 */
const jobsList = {
}

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

async function startNewJob(name, blendFile, type)
{
  const id = getId(blendFile, Date.now())
  /**
   * @type {typeof jobType}
   */
  const job = {
    id,
    name,
    status: 'pending',
    type,
    blendFile
  }

  const outputFolder = `${consts.ROOT_DIR}/public/${name}_${id}`

  jobsList[id] = job

  const data = await getData(job.blendFile)
  await render(job.blendFile, job.type, outputFolder, status =>
  {
    job.status = status
  })

  job.status = 'done'
}

module.exports = {
  getJobStatus,
  errors,
  startNewJob,
}
