const { EventEmitter } = require('events')

/**
 * @type {{frame: number, memory_global: number, render_time: number, remaining_time?: number, memory_current: number, memory_current_peak: number, scene: string, render_layer: string, information: string, extra_information?: string}}
 */
const blenderOutputType = null

/**
 * @type {'Pending' | 'Gathering data' | 'Rendering' | 'Canceled' | 'Finished' }
 */
const statusType = null

/**
 * @type {{initTime: number, completeTime?: number, status: typeof statusType, nodes: {[x:string]: typeof blenderOutputType}, name: string, id: string, type: 'still' | 'animation', blendFile: string, data: {startFrame: number, endFrame: number}, blender28: boolean}}
 */
const jobType = null

/**
 * @type {{id: number, running: boolean, pendingJobs: string[], events: EventEmitter}}
 */
const deviceType = null

module.exports = {
  blenderOutputType,
  jobType,
  deviceType,
}
