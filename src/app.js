/**
 * The application entry point
 */

global.Promise = require('bluebird')
const _ = require('lodash')
const config = require('config')
const logger = require('./common/logger')
const Kafka = require('no-kafka')
const ProcessorService = require('./services/ProcessorService')
const healthcheck = require('topcoder-healthcheck-dropin')

// create consumer
const options = { connectionString: config.KAFKA_URL, handlerConcurrency: 1, groupId: config.KAFKA_GROUP_ID }
if (config.KAFKA_CLIENT_CERT && config.KAFKA_CLIENT_CERT_KEY) {
  options.ssl = { cert: config.KAFKA_CLIENT_CERT, key: config.KAFKA_CLIENT_CERT_KEY }
}
const consumer = new Kafka.GroupConsumer(options)

// data handler
const dataHandler = (messageSet, topic, partition) => Promise.each(messageSet, (m) => {
  const message = m.message.value.toString('utf8')
  logger.info(`Handle Kafka event message; Topic: ${topic}; Partition: ${partition}; Offset: ${
    m.offset}; Message: ${message}.`)
  let messageJSON
  try {
    messageJSON = JSON.parse(message)
  } catch (e) {
    logger.error('Invalid message JSON.')
    logger.logFullError(e)
    // ignore the message
    return
  }
  if (messageJSON.topic !== topic) {
    logger.error(`The message topic ${messageJSON.topic} doesn't match the Kafka topic ${topic}.`)
    // ignore the message
    return
  }
  const phaseTypeName = _.get(messageJSON, 'payload.phaseTypeName')
  if (phaseTypeName !== config.PHASE_TYPE_NAME) {
    logger.error(`The message phaseTypeName "${
      phaseTypeName}" doesn't match the configured value "${config.PHASE_TYPE_NAME}".`)
    // ignore the message
    return
  }
  const state = _.get(messageJSON, 'payload.state')
  if (state !== config.STATE) {
    logger.error(`The message state "${state}" doesn't match the configured value "${config.STATE}".`)
    // ignore the message
    return
  }
  const projectStatus = _.get(messageJSON, 'payload.projectStatus')
  if (projectStatus !== config.PROJECT_STATUS) {
    logger.error(`The message projectStatus "${
      projectStatus}" doesn't match the configured value "${config.PROJECT_STATUS}".`)
    // ignore the message
    return
  }

  return (async () => {
    await ProcessorService.processMessage(messageJSON)
  })()
    // commit offset
    .then(() => consumer.commitOffset({ topic, partition, offset: m.offset }))
    .catch((err) => logger.logFullError(err))
})

// check if there is kafka connection alive
function check () {
  if (!consumer.client.initialBrokers && !consumer.client.initialBrokers.length) {
    return false
  }
  let connected = true
  consumer.client.initialBrokers.forEach(conn => {
    logger.debug(`url ${conn.server()} - connected=${conn.connected}`)
    connected = conn.connected & connected
  })
  return connected
}

logger.info('Starting kafka consumer')
consumer
  .init([{
    subscriptions: [config.KAFKA_TOPIC],
    handler: dataHandler
  }])
  .then(() => {
    healthcheck.init([check])
    logger.info('Kafka consumer initialized successfully')
  })
  .catch(logger.logFullError)
