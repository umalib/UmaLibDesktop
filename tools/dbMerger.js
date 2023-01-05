const { PrismaClient } = require('@prisma/client');
const { join, resolve } = require('path');
const dbManage = require('../src/db-manage');
const { path, srcPath } = require('./config.js');
const logger = require('log4js').getLogger('merger');
logger.level = 'info';

logger.info(`merge ${srcPath} into ${path}`);

async function task() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${join(resolve(srcPath))}`,
      },
    },
  });
  const id2Tag = {};
  (await prisma.tag.findMany()).forEach(tag => (id2Tag[tag.id] = tag.name));
  const artList = await prisma.article.findMany({
    include: {
      taggedList: true,
    },
  });
  await prisma.$disconnect();
  logger.info(`get ${artList.length} articles from source db`);
  await dbManage.changeDb(path);
  for (const art of artList) {
    await dbManage.pubArticle({
      name: art.name,
      author: art.author,
      translator: art.translator,
      note: art.note,
      content: art.content,
      source: art.source,
      uploadTime: art.uploadTime * 1000,
      tags: art.taggedList.map(tagged => id2Tag[tagged.tagId]),
    });
  }
  await dbManage.disconnect();
}

task().then(() => logger.info('task done!'));
