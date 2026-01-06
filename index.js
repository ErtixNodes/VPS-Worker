require('dotenv').config();

const BullMQ = require('bullmq');
const path = require('path');

const { NODE_ID } = process.env;
const { REDIS_HOST, REDIS_USERNAME, REDIS_PASSWORD, REDIS_PORT, OS } = process.env;

if (!OS) {
    console.error(`> OS is required for worker to start`);
    process.exit(1);
}

const NodeID = NODE_ID;

console.log('> Connected as ' + NodeID);

const processorFile = path.join(__dirname, 'create.js');
const opsFile = path.join(__dirname, 'ops.js');
const worker = new BullMQ.Worker(
    `${NodeID}_create`,
    processorFile,
    {
        connection: {
            host: REDIS_HOST,
            username: REDIS_USERNAME,
            password: REDIS_PASSWORD,
            port: REDIS_PORT
        },
        concurrency: 1
    }
);

const OPSworker = new BullMQ.Worker(
    `${NodeID}_ops`,
    opsFile,
    {
        connection: {
            host: REDIS_HOST,
            username: REDIS_USERNAME,
            password: REDIS_PASSWORD,
            port: REDIS_PORT
        },
        concurrency: 1
    }
);
