# Topcoder Gamification Playoff Processor

## Dependencies

- nodejs (v10)
- Kafka

## Configuration

Configuration for the processor is at `config/default.js` and `config/production.js`.
The following parameters can be set in config files or in env variables:

- DISABLE_LOGGING: whether to disable logging, default is false
- LOG_LEVEL: the log level, default value: 'debug'
- AUTH0_URL: AUTH0 URL, used to get M2M token
- AUTH0_AUDIENCE: AUTH0 audience, used to get M2M token, default value is `https://www.topcoder-dev.com`
- TOKEN_CACHE_TIME: AUTH0 token cache time, used to get M2M token
- AUTH0_PROXY_SERVER_URL: Auth0 proxy server url, used to get TC M2M token
- AUTH0_CLIENT_ID: AUTH0 client id, used to get M2M token
- AUTH0_CLIENT_SECRET: AUTH0 client secret, used to get M2M token
- KAFKA_URL: comma separated Kafka hosts, default value: 'localhost:9092'
- KAFKA_GROUP_ID: the Kafka group id, default value: 'gamification-playoff-processor'
- KAFKA_CLIENT_CERT: Kafka connection certificate, optional, default value is undefined;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to certificate file or certificate content
- KAFKA_CLIENT_CERT_KEY: Kafka connection private key, optional, default value is undefined;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to private key file or private key content
- KAFKA_TOPIC: Kafka topic to listen, default value is 'notification.autopilot.events'
- REQUEST_TIMEOUT: superagent request timeout in milliseconds, default value is 20000
- PHASE_TYPE_NAME: phase type name to match message, default value is 'Iterative Review'
- STATE: state to match message, default value is 'END'
- PROJECT_STATUS: project status to match message, default value is 'Completed'
- ITERATIVE_REVIEW_NAME: iterative review name to find iterative review type id,
    it is configured to 'Virus Scan' for testing, in production it should be 'Iterative Review'
- WIN_SCORE: winner score, default value is 100
- PAGE_SIZE: page size to list submissions, default value is 100
- TC_V3_API_BASE: TC V3 API base, default value is `https://api.topcoder-dev.com/v3`
- TC_V5_API_BASE: TC V5 API base, default value is `https://api.topcoder-dev.com/v5`
- PLAYOFF_API_BASE: Playoff API base, default value is `https://api.playoffgamification.io/v2`
- PLAYOFF_ACTION_ID: Playoff action id, default value is 'f2_f_hero'
- PLAYOFF_CLIENT_ID: Playoff client id to get access token
- PLAYOFF_CLIENT_SECRET: Playoff client secret to get access token
- PLAYOFF_AUTH_TOKEN_HOST: Playoff auth token host, default value is `https://playoffgamification.io`
- PLAYOFF_AUTH_TOKEN_PATH: Playoff auth token path, default value is '/auth/token'
- PLAYOFF_ID_PREFIX: Playoff id prefix, default value is 'tc_'

Set the following environment variables so that the app can get TC M2M token (use 'set' insted of 'export' for Windows OS):

```bash
export AUTH0_CLIENT_ID=
export AUTH0_CLIENT_SECRET=
export AUTH0_URL=
export AUTH0_AUDIENCE=
```

Also note that there is a `/health` endpoint that checks for the health of the app. This sets up an expressjs server and listens on the environment variable `PORT`. It's not part of the configuration file and needs to be passed as an environment variable

## Local Kafka setup

- `http://kafka.apache.org/quickstart` contains details to setup and manage Kafka server,
  below provides details to setup Kafka server in Mac, Windows will use bat commands in bin/windows instead
- download kafka at `https://www.apache.org/dyn/closer.cgi?path=/kafka/1.1.0/kafka_2.11-1.1.0.tgz`
- extract out the doanlowded tgz file
- go to extracted directory kafka_2.11-0.11.0.1
- start ZooKeeper server:
  `bin/zookeeper-server-start.sh config/zookeeper.properties`
- use another terminal, go to same directory, start the Kafka server:
  `bin/kafka-server-start.sh config/server.properties`
- note that the zookeeper server is at localhost:2181, and Kafka server is at localhost:9092
- use another terminal, go to same directory, create topic:
  `bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic notification.autopilot.events`
- verify that the topics are created:
  `bin/kafka-topics.sh --list --zookeeper localhost:2181`,
  it should list out the created topic
- run the producer and then write some message into the console to send to the `notification.autopilot.events` topic:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic notification.autopilot.events`
  in the console, write message, one message per line:
  `{ "topic": "notification.autopilot.events", "originator": "some-originator", "timestamp": "2019-02-16T00:00:00", "mime-type": "application/json", "payload": { "date": "2019-02-16T00:00:00", "projectId": 30055214, "phaseId": 123456, "phaseTypeName": "Iterative Review", "state": "END", "operator": "22841596", "projectStatus": "Completed" } }`
- optionally, use another terminal, go to same directory, start a consumer to view the messages:
  `bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic notification.autopilot.events --from-beginning`

## Local deployment

- install dependencies `npm i`
- run code lint check `npm run lint`, running `npm run lint:fix` can fix some lint errors if any
- start processor app `npm start`

## Verification

- setup and start kafka server, start processor app
- start kafka-console-producer to write messages to `notification.autopilot.events` topic:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic notification.autopilot.events`
- write message:
  `{ "topic": "notification.autopilot.events", "originator": "some-originator", "timestamp": "2019-02-16T00:00:00", "mime-type": "application/json", "payload": { "date": "2019-02-16T00:00:00", "projectId": 30055214, "phaseId": 123456, "phaseTypeName": "Iterative Review", "state": "END", "operator": "22841596", "projectStatus": "Completed" } }`
- you will see app logging:

```bash
info: Challenge of id 30055214 is completed
info: TopCoder member 305384 is winner of challenge 30055214
info: TopCoder member 305384 exists in playoff
info: Playoff member tc_305384 played an action to win F2F challenge 30055214
```

- note the above logged playoff member id `tc_305384`, we may view playoff player details by running
  `npm run view-player tc_305384`, you will see output:

```bash
info: Player details:
info: {
    "id": "tc_305384",
    "alias": "mess",
    "enabled": true,
    "created": "2019-07-12T16:42:29.279Z",
    "scores": [
        {
            "metric": {
                "id": "f2_f_hero",
                "name": "F2F Hero",
                "type": "set"
            },
            "value": [
                {
                    "name": "F2F Hero",
                    "description": "You have won 5 F2F challenges, Well done!",
                    "count": "1"
                }
            ]
        }
    ],
    "teams": []
}
info: Done!
```

- to test the processing to create playoff player, you may run `npm run remove-player tc_305384` to remove the player,
  then redo above verification, app logging is like:

```bash
info: Challenge of id 30055214 is completed
info: TopCoder member 305384 is winner of challenge 30055214
info: TopCoder member 305384 does not exist in playoff
info: Created player of id tc_305384 with alias mess in playoff
info: Playoff member tc_305384 played an action to win F2F challenge 30055214
```

- you may write invalid message like:
  `{ "topic": "notification.autopilot.events", "originator": "some-originator", "timestamp": "2019-02-16T00:00:00", "mime-type": "application/json", "payload": { "date": "2019-02-16T00:00:00", "projectId": 30055214, "phaseId": 123456, "phaseTypeName": "Iterative Review", "state": "Running", "operator": "22841596", "projectStatus": "Incomplete" } }`

  `{ "topic": "notification.autopilot.events", "originator": "some-originator", "timestamp": "2019-02-16T00:00:00", "mime-type": "application/json", "payload": { "date": "abc", "projectId": 30055214, "phaseId": 123456, "phaseTypeName": "Iterative Review", "state": "END", "operator": "22841596", "projectStatus": "Completed" } }`

  `{ [ { abc`
- then in the app console, you will see error messages

- to test the health check API, run `export PORT=5000`, start the processor, then browse `http://localhost:5000/health` in a browser,
  and you will see result `{"checksRun":1}`

## Notes

- This submission provides scripts to view/remove/list playoff players
- The testing Playoff account allows at most 10 players, if player count exceeds 10, you will see 'player_limit_exceeded' error
- If you see above error, you may run `npm run list-players` to list players, then run `npm run remove-player {player-id}` to remove some players,
  to get space to create new players
- This submission properly handles pagination when listing challenge submissions
- Sometimes if internet connection is not stable, there may be error accessing TC API or Playoff API,
  in such case, please re-try
