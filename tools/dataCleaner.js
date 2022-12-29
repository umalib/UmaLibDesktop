const { PrismaClient } = require('@prisma/client');
const { join, resolve } = require('path');
const { path } = require('./config.js');
const logger = require('log4js').getLogger('cleaner');
logger.level = 'info';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${join(resolve(path))}`,
    },
  },
});

logger.info(`cleaning db ${path}`);

async function task() {
  const articles = (
    await prisma.article.findMany({
      select: {
        id: true,
      },
    })
  ).map(x => x.id);
  await prisma['tagged'].deleteMany({
    where: {
      NOT: {
        artId: {
          in: articles,
        },
      },
    },
  });
  const taggedList = (await prisma['tagged'].findMany())
    .map(x => x.tagId)
    .filter((x, i, l) => i === l.indexOf(x));
  await prisma.tag.deleteMany({
    where: {
      NOT: {
        id: {
          in: taggedList,
        },
      },
    },
  });
}

task().then(async () => {
  logger.info('clean done!');
  await prisma.$queryRaw`vacuum;`;
  logger.info('vacuum done!');
  await prisma.$disconnect();
  logger.info('task done!');
});
