/**
 * Gamification playoff processor service.
 */

const Joi = require('joi')
const config = require('config')
const logger = require('../common/logger')
const helper = require('../common/helper')

/**
 * Process Kafka message of F2F challenge completed
 * @param {Object} message the F2F challenge completed message
 */
async function processMessage (message) {
  const challengeId = message.payload.projectId
  logger.info(`Challenge of id ${challengeId} is completed`)

  // get all submissions of the challenge, there may be multiple pages to query
  const submissions = await helper.getChallengeSubmissions(challengeId)
  // get iterative reivew type id
  const typeId = await helper.getIterativeReviewTypeId()
  // find winning submission
  let winSubmission
  for (let i = 0; i < submissions.length; i += 1) {
    // check if there is winning review
    // directly getting reviews with winning score to improve performance
    const winReviews = await helper.getReviews(submissions[i].id, typeId, config.WIN_SCORE)
    if (winReviews.length > 0) {
      winSubmission = submissions[i]
      break
    }
  }
  if (!winSubmission) {
    throw new Error(`There is no winning submission found for challenge ${challengeId}`)
  }
  const winMemberId = winSubmission.memberId
  logger.info(`TopCoder member ${winMemberId} is winner of challenge ${challengeId}`)

  // get playoff access token
  const playoffToken = await helper.getPlayoffToken()
  // check whether member exists in playoff
  const playoffMemberId = `${config.PLAYOFF_ID_PREFIX}${winMemberId}`
  const exists = await helper.memberExistsInPlayoff(playoffMemberId, playoffToken)
  logger.info(`TopCoder member ${winMemberId} ${exists ? 'exists' : 'does not exist'} in playoff`)

  if (!exists) {
    // get handle
    const handle = await helper.getHandleById(winMemberId)
    // create playoff member
    await helper.createPlayoffMember(playoffMemberId, handle, playoffToken)
    logger.info(`Created player of id ${playoffMemberId} with alias ${handle} in playoff`)
  }
  // play action
  await helper.playAction(playoffMemberId, playoffToken)
  logger.info(`Playoff member ${playoffMemberId} played an action to win F2F challenge ${challengeId}`)
}

processMessage.schema = {
  message: Joi.object().keys({
    topic: Joi.string().required(),
    originator: Joi.string().required(),
    timestamp: Joi.date().required(),
    'mime-type': Joi.string().required(),
    payload: Joi.object().keys({
      date: Joi.date().required(),
      projectId: Joi.number().integer().positive().required(),
      phaseId: Joi.number().integer().positive().required(),
      phaseTypeName: Joi.string().required(),
      state: Joi.string().required(),
      operator: Joi.string().required(),
      projectStatus: Joi.string().required()
    }).required()
  }).required()
}

// Exports
module.exports = {
  processMessage
}

logger.buildService(module.exports)
