const { PrismaClient } = require('@prisma/client');
const { resolve } = require('path');
const { path, duplicateKey } = require('./config.js');
const MD5 = new (require('jshashes').MD5)();
const logger = require('log4js').getLogger('checker');
const { formatTimeStamp } = require('../src/renderer/utils/renderer-utils');
const { duplicateFilter } = require('./config');
logger.level = 'info';

logger.info(`check duplicate contents on article.${duplicateKey} in ${path}`);

const prisma = new PrismaClient({
  datasources: { db: { url: `file:${resolve(path)}` } },
});

async function task() {
  const duplicateDict = {};
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
    const hash = MD5.hex(art[duplicateKey]);
    if (!duplicateDict[hash]) {
      duplicateDict[hash] = [];
    }
    duplicateDict[hash].push({
      id: art.id,
      name: art.name,
      content: MD5.hex(art.content),
      source: art.source,
      uploadTime: art.uploadTime,
    });
  });
  for (const key in duplicateDict) {
    if (duplicateDict[key].length > 1) {
      logger.info(key);
      duplicateDict[key].forEach(x => {
        if (
          duplicateKey !== 'source' ||
          (x.source && duplicateFilter.indexOf(x.source) === -1)
        ) {
          logger.info(
            `${x.id}\t${x.name}\t${x.content}\t${x.source}\t${formatTimeStamp(
              x.uploadTime * 1000,
            )}`,
          );
        }
      });
    }
  }
  await prisma.$disconnect();
}

task().then(() => logger.info('task done!'));
