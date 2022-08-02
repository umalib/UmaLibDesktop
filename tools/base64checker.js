const { PrismaClient } = require('@prisma/client');
const { join, resolve } = require('path');
const { android } = require('./config.js');
const logger = require('log4js').getLogger('checker');
logger.level = 'info';

const prisma = new PrismaClient({
  datasources: { db: { url: `file:${join(resolve(android))}` } },
});

function countBase64(content) {
  let index = 0,
    count = 0;
  while ((index = content.indexOf('src="data:image')) !== -1) {
    count += 1;
    content = content.substring(index + 1);
  }
  return count;
}

async function task() {
  let count = 0;
  const artList = await prisma.article.findMany();
  for (const art of artList) {
    const tmpCount = countBase64(art.content);
    if (tmpCount > 0) {
      count += tmpCount;
      logger.info(`${art.id} [${art.name}]\t${tmpCount}`);
      art.content = art.content.replace(
        /<img\s+src="data:image[^"]+"[^>]*>/g,
        '[图片]',
      );
      await prisma.article.update({
        data: { content: art.content },
        where: { id: art.id },
      });
    }
  }
  logger.info(`all: ${count}`);
  await prisma.$queryRaw`vacuum;`;
  logger.info('vacuum done');
}

task().then(async () => {
  await prisma.$disconnect();
  logger.info('task done');
});
