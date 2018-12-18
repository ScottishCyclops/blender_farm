import m from 'mithril'
import moment from 'moment'
import * as types from '../src/types'

let status = []

/**
 * @returns {{[x: string]: typeof types.jobType}}
 */
async function getStatus()
{
  return Object.values(await m.request(location.origin + '/status')).sort((a, b) => b.initTime - a.initTime)
}

/**
 *
 * @param {typeof types.jobType} job
 */
function retrieveJob(job)
{
  location.assign(location.origin + '/retrieve?id=' + job.id)
}

/**
 *
 * @param {typeof types.jobType} job
 */
function cancelJob(job)
{
  return m.request(location.origin + '/cancel?id=' + job.id)
}

/**
 *
 * @param {typeof types.jobType} job
 */
function deleteJob(job)
{
  return m.request(location.origin + '/delete?id=' + job.id)
}

/**
 *
 * @param {typeof types.jobType} job
 */
function jobToRow(job)
{
  return m('tr',
    m('td', job.name),
    m('td', moment(job.initTime, 'X').toLocaleString()),
    m('td', job.status),
    m('td', (jobProgress(job) * 100).toFixed(1) + '%'),
    m('td', job.type),
    m('td', { onclick: () => retrieveJob(job) }, m('i.material-icons', 'archive')),
    m('td', { onclick: () => cancelJob(job) }, m('i.material-icons', 'cancel')),
    m('td', { onclick: () => deleteJob(job) }, m('i.material-icons', 'delete')),
  )
}

/**
 *
 * @param {typeof types.jobType} job
 */
function jobProgress(job)
{

  if (job.status === 'Finished') return 1

  /**
   * @type {typeof types.blenderOutputType[]}
   */
  const nodes = Object.values(job.nodes)
  if (nodes.length === 0) return 0

  if (job.type === 'still') {
    if (nodes[0].remaining_time === undefined) return 0

    const totalTime = nodes[0].render_time + nodes[0].remaining_time

    return 1 - nodes[0].remaining_time / totalTime
  }

  const numFrames = job.data.endFrame - job.data.startFrame + 1

  const averageFrame = nodes.map(node => node.frame).reduce((previous, current) => previous + current) / nodes.length

  const framesDone = averageFrame - job.data.startFrame

  return framesDone / numFrames
}

export default {
  async oncreate()
  {
    status = await getStatus()
  },
  view: () => m('table.table.table-bordered.table-hover',
    m('thead',
      m('tr',
        m('th', 'Name'),
        m('th', 'Init time'),
        m('th', 'Status'),
        m('th', 'Progress'),
        m('th', 'Type'),
        m('th.small-col', 'Retrieve'),
        m('th.small-col', 'Cancel'),
        m('th.small-col', 'Delete'))
    ),
    m('tbody',
      status.map(jobToRow)
    )
  )
}
