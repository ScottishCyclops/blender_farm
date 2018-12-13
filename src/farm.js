const { getData, getDevices, render, blenderOutput, parseBlenderOutputLine } = require('./blender')
const { renderNodeType } = require('./types')

// build the devices list
const numDevices = getDevices()

/**
 * @type {{activeNodes: number[]}}
 */
const jobType = null

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
