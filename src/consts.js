const { resolve } = require('path')

module.exports = Object.freeze({
  /**
   * The project root directory where `package.json` lies
   */
  ROOT_DIR: resolve(__dirname + '/..'),
  CODING: 'utf-8',
})
