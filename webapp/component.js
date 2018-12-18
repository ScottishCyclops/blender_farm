import m from 'mithril'
import * as types from '../src/types'

let status = []

/**
 * @returns {{[x: string]: typeof types.jobType}}
 */
function getStatus()
{
  return m.request(location.origin + '/status')
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
  return m.request(location.origin + '/cancel?id=' + job.id)
}

/**
 *
 * @param {typeof types.jobType} job
 */
function jobToRow(job)
{
  return m('tr',
    m('td', job.name),
    m('td', job.status),
    m('td', job.type),
    m('td', { onclick: () => retrieveJob(job) }, m('i.material-icons', 'archive')),
    m('td', { onclick: () => cancelJob(job) }, m('i.material-icons', 'cancel')),
    m('td', { onclick: () => deleteJob(job) }, m('i.material-icons', 'delete')),
  )
}

export default {
  async oncreate()
  {
    status = Object.values(await getStatus())
  },
  view: () => m('table.table.table-bordered.table-hover',
    m('thead',
      m('tr',
        m('th', 'Name'),
        m('th', 'Status'),
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
