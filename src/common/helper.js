/**
 * Contains generic helper methods
 */

const _ = require('lodash')
const config = require('config')
const simpleOAuth2 = require('simple-oauth2')
const m2mAuth = require('tc-core-library-js').auth.m2m
const m2m = m2mAuth(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME', 'AUTH0_PROXY_SERVER_URL']))
const superagent = require('superagent')

/**
 * Get M2M token.
 * @return {String} the M2M token
 */
async function getM2MToken () {
  return m2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
}

/**
 * Get all challenge submissions. There may be multiple pages, because there may be more than 100 submissions
 * for a F2F challenge, get all of them.
 * @param {Number} challengeId the challenge id
 * @return {Array} all submissions of the challenge
 */
async function getChallengeSubmissions (challengeId) {
  // related submission API source code:
  // https://github.com/topcoder-platform/submissions-api/blob/aadc62b3b943dc21778723995618966eddecfe84/src/services/SubmissionService.js#L184

  // for submissions API, default page size is 20, we pass max page size 100 in order to reduce API calls,
  // see API page size details:
  // https://github.com/topcoder-platform/submissions-api/blob/aadc62b3b943dc21778723995618966eddecfe84/config/default.js#L36
  // https://github.com/topcoder-platform/submissions-api/blob/aadc62b3b943dc21778723995618966eddecfe84/config/default.js#L37

  // M2M token is cached by 'tc-core-library-js' lib
  const token = await getM2MToken()
  const url = `${config.TC_V5_API_BASE}/submissions`
  let items = []

  // get all pages
  let page = 1
  while (true) {
    const res = await superagent
      .get(url)
      .set('Authorization', `Bearer ${token}`)
      .query({ challengeId, page, perPage: config.PAGE_SIZE })
      .timeout(config.REQUEST_TIMEOUT)
    if (res.body.length > 0) {
      items = items.concat(res.body)
    }
    if (res.body.length < config.PAGE_SIZE) {
      break
    }
    // increment page
    page += 1
  }
  return items
}

/**
 * Get iterative review type id.
 * @return {String} iterative review type id
 */
async function getIterativeReviewTypeId () {
  // M2M token is cached by 'tc-core-library-js' lib
  const token = await getM2MToken()
  const url = `${config.TC_V5_API_BASE}/reviewTypes`
  const res = await superagent
    .get(url)
    .set('Authorization', `Bearer ${token}`)
    .query({ name: config.ITERATIVE_REVIEW_NAME })
    .timeout(config.REQUEST_TIMEOUT)
  if (res.body.length === 0) {
    throw new Error(`There is no review type: ${config.ITERATIVE_REVIEW_NAME}`)
  }
  return res.body[0].id
}

/**
 * Get reviews of given submission id, review type id and score.
 * @param {String} submissionId the submission id
 * @param {String} typeId the review type id
 * @param {Number} score the review score
 * @return {Array} reviews of given submission id, review type id and score
 */
async function getReviews (submissionId, typeId, score) {
  // M2M token is cached by 'tc-core-library-js' lib
  const token = await getM2MToken()
  const url = `${config.TC_V5_API_BASE}/reviews`
  const res = await superagent
    .get(url)
    .set('Authorization', `Bearer ${token}`)
    .query({ submissionId, typeId, score })
    .timeout(config.REQUEST_TIMEOUT)
  return res.body
}

/**
 * Get member handle by member id
 * @param {String|Number} memberId the member id
 * @return {String} handle of the member
 */
async function getHandleById (memberId) {
  // M2M token is cached by 'tc-core-library-js' lib
  const token = await getM2MToken()
  const url = `${config.TC_V3_API_BASE}/users?filter=id=${memberId}`
  const res = await superagent
    .get(url)
    .set('Authorization', `Bearer ${token}`)
    .timeout(config.REQUEST_TIMEOUT)
  const success = _.get(res.body, 'result.success')
  const status = _.get(res.body, 'result.status')
  if (!success || !status || status < 200 || status >= 300) {
    throw new Error(`Failed to get member of id ${memberId}: ${_.get(res.body, 'result.content')}`)
  }
  const handle = _.get(res.body, 'result.content[0].handle')
  if (!handle) {
    throw new Error(`Failed to get handle of member ${memberId}`)
  }
  return handle
}

/**
 * Get playoff API access token
 * @return {String} playoff API access token
 */
async function getPlayoffToken () {
  const credentials = {
    client: {
      id: config.PLAYOFF_CLIENT_ID,
      secret: config.PLAYOFF_CLIENT_SECRET
    },
    auth: {
      tokenHost: config.PLAYOFF_AUTH_TOKEN_HOST,
      tokenPath: config.PLAYOFF_AUTH_TOKEN_PATH
    },
    options: {
      authorizationMethod: 'body'
    }
  }

  const oauth2 = simpleOAuth2.create(credentials)
  const result = await oauth2.clientCredentials.getToken()
  const tokenRes = await oauth2.accessToken.create(result)
  const token = _.get(tokenRes, 'token.access_token')
  if (!token) {
    throw new Error('Failed to get playoff access token')
  }
  return token
}

/**
 * Check whether member exists in playoff
 * @param {String} playoffMemberId the playoff member id
 * @param {String} token the playoff access token
 * @return {Boolean} whether it exists
 */
async function memberExistsInPlayoff (playoffMemberId, token) {
  const url = `${config.PLAYOFF_API_BASE}/admin/validation/player/available`
  let body
  try {
    const res = await superagent
      .get(url)
      .set('Authorization', `Bearer ${token}`)
      .query({ value: playoffMemberId })
      .timeout(config.REQUEST_TIMEOUT)
    body = res.body
  } catch (e) {
    if (e.status === 409) {
      // exists
      return true
    } else {
      // re-throw other error
      throw e
    }
  }
  if (body.ok === 1) {
    // not exist
    return false
  } else {
    throw new Error(`Invalid response for playoff member exists validation: ${JSON.stringify(body, null, 4)}`)
  }
}

/**
 * Create playoff member
 * @param {String} playoffMemberId the playoff member id
 * @param {String} handle the member handle
 * @param {String} token the playoff access token
 */
async function createPlayoffMember (playoffMemberId, handle, token) {
  const url = `${config.PLAYOFF_API_BASE}/admin/players`
  await superagent
    .post(url)
    .set('Authorization', `Bearer ${token}`)
    .send({ id: playoffMemberId, alias: handle })
    .timeout(config.REQUEST_TIMEOUT)
}

/**
 * Play action in playoff
 * @param {String} playoffMemberId the playoff member id
 * @param {String} token the playoff access token
 */
async function playAction (playoffMemberId, token) {
  const url = `${config.PLAYOFF_API_BASE}/runtime/actions/${config.PLAYOFF_ACTION_ID}/play`
  await superagent
    .post(url)
    .set('Authorization', `Bearer ${token}`)
    .query({ player_id: playoffMemberId })
    .send({ count: 1 })
    .timeout(config.REQUEST_TIMEOUT)
}

/**
 * Get playoff member details
 * @param {String} playoffMemberId the playoff member id
 * @param {String} token the playoff access token
 * @return {Object} player details
 */
async function getPlayoffMemberDetails (playoffMemberId, token) {
  const url = `${config.PLAYOFF_API_BASE}/admin/players/${playoffMemberId}`
  const res = await superagent
    .get(url)
    .set('Authorization', `Bearer ${token}`)
    .timeout(config.REQUEST_TIMEOUT)
  return res.body
}

/**
 * Remove playoff member
 * @param {String} playoffMemberId the playoff member id
 * @param {String} token the playoff access token
 */
async function removePlayoffMember (playoffMemberId, token) {
  const url = `${config.PLAYOFF_API_BASE}/admin/players/${playoffMemberId}`
  await superagent
    .delete(url)
    .set('Authorization', `Bearer ${token}`)
    .timeout(config.REQUEST_TIMEOUT)
}

/**
 * List playoff members.
 * @param {Number} limit the limit count
 * @param {String} token the playoff access token
 * @return {Object} players result
 */
async function listPlayoffMembers (limit, token) {
  const url = `${config.PLAYOFF_API_BASE}/admin/players`
  const res = await superagent
    .get(url)
    .set('Authorization', `Bearer ${token}`)
    .query({ limit })
    .timeout(config.REQUEST_TIMEOUT)
  return res.body
}

module.exports = {
  getChallengeSubmissions,
  getIterativeReviewTypeId,
  getReviews,
  getHandleById,
  getPlayoffToken,
  memberExistsInPlayoff,
  createPlayoffMember,
  playAction,
  getPlayoffMemberDetails,
  removePlayoffMember,
  listPlayoffMembers
}
