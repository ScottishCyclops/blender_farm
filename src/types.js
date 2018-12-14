/**
 * @type {{frame: number, memory_global: number, render_time: number, remaining_time?: number, memory_current: number, memory_current_peak: number, scene: string, render_layer: string, information: string, extra_information?: string}}
 */
const blenderOutputType = null

/**
 * @type {'Pending' | 'Gathering data' | 'Rendering' | 'Canceled' | 'Finished' }
 */
const statusType = null

/**
 * @type {{status: typeof statusType, nodes: {[x:string]: typeof blenderOutputType}, name: string, id: string, type: 'still' | 'animation', blendFile: string, data: {startFrane: number, endFrame: number}}}
 */
const jobType = null

/**
 * @type {{id: number, busy: boolean}}
 */
const deviceType = null

/**
 * @type {{id: number, jobList: typeof jobType }}
 */
const renderNodeType = null

module.exports = {
  blenderOutputType,
  jobType,
  deviceType,
  renderNodeType,
}
