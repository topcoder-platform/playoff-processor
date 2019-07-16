/**
 * This script is used to list playoff players.
 * Usage:
 * node src/list-players // default limit count is 10
 * node src/list-players {limit-count}
 */

global.Promise = require('bluebird')
const logger = require('./common/logger')
const helper = require('./common/helper')

if (process.argv.length !== 2 && process.argv.length !== 3) {
  logger.error('Usage:')
  logger.error('node src/list-players // default limit count is 10')
  logger.error('node src/list-players {limit-count}')
  process.exit()
}

const listPlayers = async () => {
  // get playoff access token
  const playoffToken = await helper.getPlayoffToken()
  // get limit
  let limit = 10
  if (process.argv.length === 3) {
    limit = Number(process.argv[2])
  }
  // get players
  const res = await helper.listPlayoffMembers(limit, playoffToken)
  logger.info('Players:')
  logger.info(JSON.stringify(res, null, 4))
}

listPlayers().then(() => {
  logger.info('Done!')
  process.exit()
}).catch((e) => {
  logger.logFullError(e)
  process.exit()
})
