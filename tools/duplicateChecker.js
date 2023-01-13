const { PrismaClient } = require('@prisma/client');
const { resolve } = require('path');
const { path, duplicateKey } = require('./config.js');
const MD5 = new (require('jshashes').MD5)();
const logger = require('log4js').getLogger('checker');
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
    });
  });
  for (const key in duplicateDict) {
    if (duplicateDict[key].length > 1) {
      logger.info(key);
      duplicateDict[key].forEach(x =>
        logger.info(`\t${x.id}\t${x.name}\t${x.content}\t${x.source}`),
      );
    }
  }
  await prisma.$disconnect();
}

task().then(() => logger.info('task done!'));
