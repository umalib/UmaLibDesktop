const { PrismaClient } = require('@prisma/client');
const { copyFileSync } = require('fs');
const { resolve } = require('path');
const { path } = require('./config.js');
const logger = require('log4js').getLogger('transfer');
logger.level = 'info';

const android = resolve(
  path.replace(/data[/|\\](slib[/|\\])?/, 'data/android/'),
);
logger.info(`transfer ${path} to ${android}`);
copyFileSync(path, android);
logger.info('copy done');

const prisma = new PrismaClient({
  datasources: { db: { url: `file:${resolve(android)}` } },
});

function countBase64(content) {
  const result = content.match(/<img\s+src="data:image\/\w+;base64,[^<>]*">/g);
  return result ? result.length : 0;
}

async function task() {
  await prisma.$queryRaw`vacuum`;
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
  let artList = (
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
  artList = await prisma.article.findMany();
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

  artList = (await prisma.article.findMany({ select: { id: true } })).map(
    x => x.id,
  );
  tagList = (await prisma.tag.findMany({ select: { id: true } })).map(
    x => x.id,
  );
  const dict = await prisma.dict.findMany();
  const toRemoveDictList = [];
  for (const entry of dict) {
    if (entry.refId && tagList.indexOf(entry.refId) === -1) {
      toRemoveDictList.push(entry.id);
    } else if (entry.relatedId && artList.indexOf(entry.relatedId) === -1) {
      await prisma.dict.update({
        where: { id: entry.id },
        data: {
          related: '',
          relatedId: 0,
        },
      });
    }
  }
  await prisma.dict.deleteMany({
    where: {
      id: {
        in: toRemoveDictList,
      },
    },
  });

  const recs = await prisma['rec'].findMany();
  const toRemovedRecList = recs
    .filter(
      rec =>
        rec.r ||
        (rec.type >= 2 && rec.type <= 4 && tagList.indexOf(rec.refId) === -1) ||
        (rec.type === 5 && artList.indexOf(rec.refId) === -1),
    )
    .map(rec => rec.id);
  await prisma['rec'].deleteMany({
    where: {
      id: {
        in: toRemovedRecList,
      },
    },
  });
  logger.info(`art count: ${artList.length}; base64 count: ${count}`);
  logger.info('clean done');
  await prisma.$queryRaw`vacuum;`;
  logger.info('vacuum done');
  await prisma.$disconnect();
}

task().then(() => logger.info('task done!'));
