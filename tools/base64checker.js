const { PrismaClient } = require('@prisma/client');
const { join, resolve } = require('path');
const { android } = require('./config.js');
const logger = require('log4js').getLogger('checker');
logger.level = 'info';

const prisma = new PrismaClient({
  datasources: { db: { url: `file:${join(resolve(android))}` } },
});

function countBase64(content) {
  const result = content.match(/<img\s+src="data:image\/\w+;base64,[^<>]*">/g);
  return result ? result.length : 0;
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
