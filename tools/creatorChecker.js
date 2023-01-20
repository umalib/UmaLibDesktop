const { PrismaClient } = require('@prisma/client');
const { join, resolve } = require('path');
const { path } = require('./config.js');
const { creatorSortBy } = require('./config');
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

  const lengthFilter = {};
  (
    await prisma.tag.findMany({
      where: {
        name: {
          in: ['AA', '安科'],
        },
      },
      include: {
        taggedList: true,
      },
    })
  ).forEach(x => x.taggedList.forEach(y => (lengthFilter[y.artId] = 1)));

  const articles = await prisma.article.findMany({
    select: {
      id: true,
      author: true,
      translator: true,
      content: true,
    },
  });
  articles.forEach(x => {
    const creator = x.translator ? x.translator : x.author;
    const creatorArr = creator.split('/');
    const content = x.content.replace(/<[^>]*>/g, '').replace(/\s+/g, '')
      .length;
    creatorArr.forEach(c => {
      if (!creators[c]) {
        creators[c] = {
          count: 0,
          content: 0,
        };
      }
      creators[c].count += 1;
      creators[c].content += lengthFilter[x.id] ? 0 : content;
    });
  });
  const creatorArr = Object.keys(creators).map(x => {
    return {
      name: x,
      count: creators[x].count,
      content: creators[x].content,
    };
  });
  if (creatorSortBy === 'count') {
    creatorArr.sort((a, b) => {
      if (a.count === b.count) {
        if (a.content === b.content) {
          return a.name > b.name ? 1 : -1;
        }
        return b.content - a.content;
      }
      return b.count - a.count;
    });
  } else {
    creatorArr.sort((a, b) => {
      if (a.content === b.content) {
        if (a.count === b.count) {
          return a.name > b.name ? 1 : -1;
        }
        return a.count - b.count;
      }
      return b.content - a.content;
    });
  }
  creatorArr.forEach(x => logger.info(`${x.name}\t${x.count}\t${x.content}`));
  await prisma.$disconnect();
}

task().then(() => logger.info('task done!'));
