const { PrismaClient } = require('@prisma/client');
const { join, resolve } = require('path');
const { path } = require('./config.js');
const logger = require('log4js').getLogger('checker');
logger.level = 'info';

logger.info(`check sources from ${path}`);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${join(resolve(path))}`,
    },
  },
});

prisma.article.findMany().then(async r => {
  const dict = {};
  for (const art of r) {
    if (art.source && !art.source.startsWith('http')) {
      if (!dict[art.source]) {
        dict[art.source] = 1;
      } else {
        dict[art.source] += 1;
      }
    }
  }
  for (const key in dict) {
    logger.info(key, dict[key]);
  }
  await prisma.$disconnect();
});
