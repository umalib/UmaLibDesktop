const { PrismaClient } = require('@prisma/client');
const { join, resolve } = require('path');
const { path, srcPath } = require('./config.js');
const logger = require('log4js').getLogger('transfer');
logger.level = 'info';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${join(resolve(srcPath))}`,
    },
  },
});

async function task() {
  const tagList = await prisma.tag.findMany({
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });
  const creators = await prisma.creator.findUnique({
    where: { id: 1 },
  });
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
  if (creators) {
    await prisma.creator.create({
      data: {
        names: creators.names,
      },
    });
  }
}

task().then(async () => {
  await prisma.$disconnect();
  logger.info('task done');
});
