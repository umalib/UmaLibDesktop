const { PrismaClient } = require('@prisma/client');
const { join, resolve } = require('path');
const log4js = require('log4js');

const { path } = require('./config.js');
const logger = log4js.getLogger();
logger.level = 'debug';

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
    creators[creator] = true;
  });
  for (const c in creators) {
    logger.info(c);
  }
  await prisma.$disconnect();
}

task().then(async () => {
  logger.info('task done!');
});
