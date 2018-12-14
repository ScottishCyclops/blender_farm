const { tarFolder } = require('../utils')

const folder = __dirname + '/../../public/test_04c1f236ea349b8d170c72d56efbcd41'

tarFolder(folder).then(console.log, console.log)
