/**
 * This script is used to remove playoff player.
 * Usage:
 * node src/remove-player {player-id}
 */

global.Promise = require('bluebird')
const logger = require('./common/logger')
const helper = require('./common/helper')

if (process.argv.length !== 3) {
  logger.error('Usage: node src/remove-player {player-id}')
  process.exit()
}

const removePlayer = async () => {
  // get playoff access token
  const playoffToken = await helper.getPlayoffToken()
  // player id
  const playoffMemberId = process.argv[2]
  // remove player
  await helper.removePlayoffMember(playoffMemberId, playoffToken)
}

removePlayer().then(() => {
  logger.info('Done!')
  process.exit()
}).catch((e) => {
  logger.logFullError(e)
  process.exit()
})
