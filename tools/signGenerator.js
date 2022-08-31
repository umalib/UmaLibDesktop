const { sm2 } = require('sm-crypto');
const { keyPair } = require('./config');
const logger = require('log4js').getLogger('generator');
const embeddedData = require('../src/renderer/utils/data');
logger.level = 'info';

const msg = embeddedData.signInfo.content;
logger.info(msg);
logger.info(keyPair.publicKey);
logger.info(
  sm2.doSignature(msg, keyPair.privateKey, {
    der: true,
    hash: true,
    publicKey: keyPair.publicKey,
  }),
);
logger.info(
  sm2.doSignature(msg, keyPair.privateKey, {
    der: true,
    hash: true,
    publicKey: keyPair.publicKey,
  }),
);
