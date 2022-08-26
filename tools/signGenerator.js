const { sm2 } = require('sm-crypto');
const { keyPair } = require('./config');
const logger = require('log4js').getLogger('generator');
logger.level = 'info';

const msg = '内容：NGA赛马娘翻译交流群 开发：风之低吟（NGA） 版本：1.9.0';
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
