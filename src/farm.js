const { getData, getDevices, render, blenderOutput, parseBlenderOutputLine } = require('./blender')

// build the devices list
const numDevices = getDevices()

/**
 * @type {{activeNodes: typeof number[]}}
 */
const jobType = null

/**
 * @type {{id: number, jobList: typeof }}
 */
const renderNodeType = null

/**
 * @type {typeof renderNodeType[]}
 */
const renderNodes = new Array(numDevices).fill(null).map(id =>
{
  return {
    id,
    jobList: {}
  }
})
