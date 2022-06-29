const { sm2 } = require('sm-crypto');
const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'info';

const keyPair = {
  privateKey:
    'fbaeb961ed7a123cc7051ae779ea5669c0e979e9e50a247e1272fc4f4541bcda',
  publicKey:
    '0449135290bbd43022a4abfbc415aa61bd2b5a4ff66f3a59bc31da1f9e5d0803c8b0be48f25399a6c6a4b214f9f4994144cf6cf081ca93b2da7301dadb6863fbfd',
};

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
