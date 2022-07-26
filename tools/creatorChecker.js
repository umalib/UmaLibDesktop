const { PrismaClient } = require('@prisma/client');
const { join, resolve } = require('path');
const { path } = require('./config.js');
const logger = require('log4js').getLogger('checker');
logger.level = 'info';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${join(resolve(path))}`,
    },
  },
});

logger.info(`checking db ${path}`);

async function task() {
  const creators = {};
  const articles = await prisma.article.findMany({
    select: {
      author: true,
      translator: true,
    },
  });
  articles.forEach(x => {
    const creator = x.translator ? x.translator : x.author;
    if (!creators[creator]) {
      creators[creator] = 1;
    } else {
      creators[creator] += 1;
    }
  });
  for (const c in creators) {
    logger.info(`${c}\t${creators[c]}`);
  }
  await prisma.$disconnect();
}

task().then(async () => {
  logger.info('task done!');
});
