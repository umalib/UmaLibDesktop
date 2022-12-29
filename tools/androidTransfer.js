const { PrismaClient } = require('@prisma/client');
const { copyFileSync } = require('fs');
const { join, resolve } = require('path');
const { path } = require('./config.js');
const logger = require('log4js').getLogger('transfer');
logger.level = 'info';

const android = path.replace('data/', 'data/android/');
logger.info(`transfer ${path} to ${android}`);
copyFileSync(path, android);
logger.info('copy done');

const prisma = new PrismaClient({
  datasources: { db: { url: `file:${join(resolve(android))}` } },
});

function countBase64(content) {
  const result = content.match(/<img\s+src="data:image\/\w+;base64,[^<>]*">/g);
  return result ? result.length : 0;
}

async function task() {
  const tagList = (
    await prisma.tag.findMany({
      where: {
        OR: [
          {
            name: {
              in: ['R18', 'AA', '两人三足，目标是星光闪耀的舞台！', '十八禁'],
            },
          },
          {
            type: 4,
          },
        ],
      },
    })
  ).map(tag => tag.id);
  logger.info(`tags to be removed: ${tagList.join(', ')}`);
  const toRmList = (
    await prisma['tagged'].findMany({ where: { tagId: { in: tagList } } })
  ).map(tagged => tagged.artId);
  logger.info(`articles to be removed: ${toRmList.join(', ')}`);
  await prisma['tagged'].deleteMany({
    where: { OR: [{ artId: { in: toRmList } }, { tagId: { in: tagList } }] },
  });
  await prisma.article.deleteMany({ where: { id: { in: toRmList } } });
  await prisma.tag.deleteMany({ where: { id: { in: tagList } } });
  await prisma.tag.deleteMany({
    where: {
      taggedList: {
        none: {},
      },
    },
  });
  await prisma.tag.updateMany({
    data: {
      cover: '',
      description: '',
    },
  });
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
  logger.info(`art count: ${artList.length}; base64 count: ${count}`);
  logger.info('clean done');
  await prisma.$queryRaw`vacuum;`;
  logger.info('vacuum done');
}

task().then(async () => {
  await prisma.$disconnect();
  logger.info('task done');
});
