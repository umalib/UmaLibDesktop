const { PrismaClient } = require('@prisma/client');
const { join, resolve } = require('path');
const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'info';
const { path, srcPath } = require('./config.js');

async function task() {
  let prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${join(resolve(srcPath))}`,
      },
    },
  });
  const tagList = await prisma.tag.findMany();
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
  await prisma.$disconnect();
}

task().then(() => logger.info('task done'));
