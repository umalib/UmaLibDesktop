const { PrismaClient } = require('@prisma/client');
const { resolve } = require('path');
const MD5 = new (require('jshashes').MD5)();
const logger = require('log4js').getLogger('checker');
const { path, duplicateFilter, duplicateKey } = require('./config');
const { formatTimeStamp } = require('../src/renderer/utils/renderer-utils');

logger.level = 'info';

logger.info(`check duplicate contents on article.${duplicateKey} in ${path}`);

const prisma = new PrismaClient({
  datasources: { db: { url: `file:${resolve(path)}` } },
});

async function task() {
  const duplicateDict = {};
  const hashSrcDict = {};
  (
    await prisma.article.findMany({
      select: {
        id: true,
        name: true,
        content: true,
        source: true,
        uploadTime: true,
      },
      orderBy: {
        uploadTime: 'asc',
      },
    })
  ).forEach(art => {
    let hashSrcArr = [art[duplicateKey]];
    if (duplicateKey === 'source') {
      hashSrcArr = art[duplicateKey].split(' ');
    }
    for (const hashSrc of hashSrcArr) {
      const hash = MD5.hex(hashSrc);
      if (!duplicateDict[hash]) {
        duplicateDict[hash] = [];
        hashSrcDict[hash] = hashSrc;
      }
      duplicateDict[hash].push({
        id: art.id,
        name: art.name,
        content: MD5.hex(art.content),
        source: art.source,
        uploadTime: art.uploadTime,
      });
    }
  });
  duplicateFilter.sort();
  const outDict = Object.keys(duplicateDict);
  outDict.sort((a, b) => {
    const sA = hashSrcDict[a],
      sB = hashSrcDict[b];
    const dA = duplicateDict[a].length,
      dB = duplicateDict[b].length;
    const fA = duplicateFilter.indexOf(sA),
      fB = duplicateFilter.indexOf(sB);
    if (fA > -1 || fB > -1) {
      return fA - fB;
    }
    if (dA === dB) {
      return sA > sB ? 1 : -1;
    }
    return dB - dA;
  });
  for (const key of outDict) {
    if (
      duplicateDict[key].length > 1 &&
      (duplicateKey !== 'source' ||
        duplicateFilter.indexOf(hashSrcDict[key]) === -1)
    ) {
      logger.info(
        `${key}${duplicateKey === 'source' ? '\t' + hashSrcDict[key] : ''}${
          duplicateDict[key].length > 1 ? '\t' + duplicateDict[key].length : ''
        }`,
      );
      duplicateDict[key].forEach(x => {
        logger.info(
          `\t${x.id}\t${x.name}\t${x.content}${
            duplicateKey === 'source' ? '' : '\t' + x.source
          }\t${formatTimeStamp(x.uploadTime * 1000)}`,
        );
      });
    }
    if (
      duplicateKey === 'source' &&
      duplicateFilter.indexOf(hashSrcDict[key]) !== -1
    ) {
      logger.info(`${key}\t${hashSrcDict[key]}\t${duplicateDict[key].length}`);
    }
  }
  await prisma.$disconnect();
}

task().then(() => logger.info('task done!'));
