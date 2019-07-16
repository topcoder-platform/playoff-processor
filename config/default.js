/**
 * The default configuration file.
 */

module.exports = {
  DISABLE_LOGGING: process.env.DISABLE_LOGGING
    ? process.env.DISABLE_LOGGING.toLowerCase() === 'true' : false, // If true, logging will be disabled
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',

  // used to get M2M token
  AUTH0_URL: process.env.AUTH0_URL,
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || 'https://www.topcoder-dev.com',
  TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME,
  AUTH0_PROXY_SERVER_URL: process.env.AUTH0_PROXY_SERVER_URL,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,

  KAFKA_URL: process.env.KAFKA_URL || 'localhost:9092',
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'gamification-playoff-processor',
  // below are used for secure Kafka connection, they are optional
  // for the local Kafka, they are not needed
  KAFKA_CLIENT_CERT: process.env.KAFKA_CLIENT_CERT,
  KAFKA_CLIENT_CERT_KEY: process.env.KAFKA_CLIENT_CERT_KEY,
  KAFKA_TOPIC: process.env.KAFKA_TOPIC || 'notification.autopilot.events',

  // superagent request timeout in milliseconds
  REQUEST_TIMEOUT: process.env.REQUEST_TIMEOUT ? Number(process.env.REQUEST_TIMEOUT) : 30000,

  // fields to match Kafka messages
  PHASE_TYPE_NAME: process.env.PHASE_TYPE_NAME || 'Iterative Review',
  STATE: process.env.STATE || 'END',
  PROJECT_STATUS: process.env.PROJECT_STATUS || 'Completed',

  // used to find iterative review type by this name,
  // it is configured as 'Virus Scan' for testing with TC dev environment
  // to avoid the duplicate iterative review types issue,
  // in production it should be 'Iterative Review',
  // see https://apps.topcoder.com/forums/?module=Thread&threadID=940285&start=0
  ITERATIVE_REVIEW_NAME: process.env.ITERATIVE_REVIEW_NAME || 'Virus Scan',

  // used to find winner
  WIN_SCORE: process.env.WIN_SCORE ? Number(process.env.WIN_SCORE) : 100,
  // page size to list submissions
  PAGE_SIZE: process.env.PAGE_SIZE ? Number(process.env.PAGE_SIZE) : 100,

  TC_V3_API_BASE: process.env.TC_V3_API_BASE || 'https://api.topcoder-dev.com/v3',
  TC_V5_API_BASE: process.env.TC_V5_API_BASE || 'https://api.topcoder-dev.com/v5',
  PLAYOFF_API_BASE: process.env.PLAYOFF_API_BASE || 'https://api.playoffgamification.io/v2',
  PLAYOFF_ACTION_ID: process.env.PLAYOFF_ACTION_ID || 'f2_f_hero',
  PLAYOFF_CLIENT_ID: process.env.PLAYOFF_CLIENT_ID,
  PLAYOFF_CLIENT_SECRET: process.env.PLAYOFF_CLIENT_SECRET,
  PLAYOFF_AUTH_TOKEN_HOST: process.env.PLAYOFF_AUTH_TOKEN_HOST || 'https://playoffgamification.io',
  PLAYOFF_AUTH_TOKEN_PATH: process.env.PLAYOFF_AUTH_TOKEN_PATH || '/auth/token',
  // alpha numeric string, it should not start with a number
  PLAYOFF_ID_PREFIX: process.env.PLAYOFF_ID_PREFIX || 'tc_'
}
