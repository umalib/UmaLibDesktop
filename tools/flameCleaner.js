const { PrismaClient } = require('@prisma/client');
const { join, resolve } = require('path');
const { path } = require('./config.js');
const logger = require('log4js').getLogger('cleaner');
logger.level = 'info';

const prisma = new PrismaClient({
  datasources: { db: { url: `file:${join(resolve(path))}` } },
});

async function task() {
  const artList = await prisma.article.findMany();
  for (const art of artList) {
    if (art.name.indexOf('两人三足') !== -1) {
      await prisma.article.update({
        data: {
          content: art.content.replace(/\s+class="ql-align-center"/g, ''),
        },
        where: {
          id: art.id,
        },
      });
    }
  }
  logger.info('clean done');
}

task().then(async () => {
  await prisma.$queryRaw`vacuum`;
  logger.info('vacuum done');
  await prisma.$disconnect();
  logger.info('task done');
});
