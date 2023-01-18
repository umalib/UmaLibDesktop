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
    for (const src of (art.source || '').split(' ')) {
      if (!dict[src]) {
        dict[src] = 1;
      } else {
        dict[src] += 1;
      }
    }
  }
  const outDict = Object.keys(dict).map(x => {
    return { k: x, v: dict[x] };
  });
  outDict.sort((a, b) => (a.k > b.k ? 1 : -1));
  for (const entry of outDict) {
    if (entry.k && entry.v > 1) {
      logger.info(entry.k, entry.v);
    }
  }
  await prisma.$disconnect();
});
