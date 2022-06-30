const { sm2 } = require('sm-crypto');
const log4js = require('log4js');
const logger = log4js.getLogger();
const { keyPair } = require('./config');

logger.level = 'info';

const msg = '内容：NGA赛马娘翻译交流群 开发：风之低吟（NGA） 版本：1.6.0';
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
