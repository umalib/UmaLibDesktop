const { PrismaClient } = require('@prisma/client');
const { join, resolve } = require('path');
const { path, srcPath, transferringCreators } = require('./config.js');
const logger = require('log4js').getLogger('transfer');
logger.level = 'info';

logger.info(`transfer meta data from ${srcPath} into ${path}`);

async function task() {
  let prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${join(resolve(srcPath))}`,
      },
    },
  });
  const tagList = (
    await prisma.tag.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })
  ).filter(x => x.type !== 3);
  let creators = null;
  if (transferringCreators) {
    creators = await prisma.creator.findUnique({
      where: { id: 1 },
    });
  }
  await prisma.$disconnect();
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${join(resolve(path))}`,
      },
    },
  });
  for (const tag of tagList) {
    await prisma.tag.create({
      data: {
        name: tag.name,
        type: tag.type,
      },
    });
  }
  logger.info(`transferred ${tagList.length} tags`);
  if (creators) {
    if ((await prisma.creator.count()) > 0) {
      await prisma.creator.update({
        where: {
          id: 1,
        },
        data: {
          names: creators.names,
        },
      });
    } else {
      await prisma.creator.create({
        data: {
          names: creators.names,
        },
      });
    }
    logger.info('transferring creators done');
  }
  await prisma.$queryRaw`vacuum;`;
  await prisma.$disconnect();
}

task().then(() => logger.info('task done!'));
