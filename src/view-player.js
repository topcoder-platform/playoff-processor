/**
 * This script is used to view playoff player details.
 * Usage:
 * node src/view-player {player-id}
 */

global.Promise = require('bluebird')
const logger = require('./common/logger')
const helper = require('./common/helper')

if (process.argv.length !== 3) {
  logger.error('Usage: node src/view-player {player-id}')
  process.exit()
}

const viewData = async () => {
  // get playoff access token
  const playoffToken = await helper.getPlayoffToken()
  // player id
  const playoffMemberId = process.argv[2]
  // get player details
  const data = await helper.getPlayoffMemberDetails(playoffMemberId, playoffToken)
  logger.info('Player details:')
  logger.info(JSON.stringify(data, null, 4))
}

viewData().then(() => {
  logger.info('Done!')
  process.exit()
}).catch((e) => {
  logger.logFullError(e)
  process.exit()
})
