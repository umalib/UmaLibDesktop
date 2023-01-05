const { PrismaClient } = require('@prisma/client');
const { join, resolve } = require('path');
const { path } = require('./config.js');
const logger = require('log4js').getLogger('checker');
logger.level = 'info';

logger.info(`check creators in ${path}`);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${join(resolve(path))}`,
    },
  },
});

async function task() {
  const creators = {};
  const articles = await prisma.article.findMany({
    select: {
      author: true,
      translator: true,
    },
  });
  function updateMap(creator) {
    if (!creators[creator]) {
      creators[creator] = 1;
    } else {
      creators[creator] += 1;
    }
  }
  articles.forEach(x => {
    const creator = x.translator ? x.translator : x.author;
    const creatorArr = creator.split('/');
    creatorArr.forEach(updateMap);
  });
  const creatorArr = [];
  for (const c in creators) {
    creatorArr.push({ name: c, count: creators[c] });
  }
  creatorArr.sort((a, b) => {
    if (a.count === b.count) {
      return a.name > b.name ? 1 : -1;
    }
    return b.count - a.count;
  });
  creatorArr.forEach(x => logger.info(`${x.name}\t${x.count}`));
  await prisma.$disconnect();
}

task().then(() => logger.info('task done!'));
