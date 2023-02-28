const { PrismaClient } = require('@prisma/client');
const { copyFileSync } = require('fs');
const { join, resolve } = require('path');
const { path } = require('./config.js');
const logger = require('log4js').getLogger('transfer');
logger.level = 'info';

const android = path.replace(/data\/(slib\/)?/, 'data/android/');
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
  let tagList = (
    await prisma.tag.findMany({
      where: {
        OR: [
          {
            name: {
              in: ['R18', 'AA', '安科', '十八禁'],
            },
          },
          {
            type: 4,
          },
        ],
      },
    })
  ).map(tag => tag.id);
  const artList = (
    await prisma['tagged'].findMany({ where: { tagId: { in: tagList } } })
  )
    .map(tagged => tagged.artId)
    .filter((x, i, l) => i === l.indexOf(x));
  await prisma['tagged'].deleteMany({
    where: { OR: [{ artId: { in: artList } }, { tagId: { in: tagList } }] },
  });

  await prisma.article.deleteMany({ where: { id: { in: artList } } });
  logger.info(`remove ${artList.length} articles: ${artList.join(', ')}`);

  tagList = (
    await prisma.tag.findMany({
      where: {
        taggedList: {
          none: {},
        },
      },
    })
  ).map(tag => tag.id);
  await prisma.tag.deleteMany({ where: { id: { in: tagList } } });
  logger.info(`remove ${tagList.length} tags: ${tagList.join(', ')}`);
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
  const articles = await prisma.article.findMany();
  for (const art of articles) {
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
  logger.info(`art count: ${articles.length}; base64 count: ${count}`);
  logger.info('clean done');
  await prisma.$queryRaw`vacuum;`;
  logger.info('vacuum done');
  await prisma.$disconnect();
}

task().then(() => logger.info('task done!'));
