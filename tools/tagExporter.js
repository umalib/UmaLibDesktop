const { PrismaClient } = require('@prisma/client');
const { join, resolve } = require('path');
const { path } = require('./config.js');
const logger = require('log4js').getLogger('exporter');
logger.level = 'info';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${join(resolve(path))}`,
    },
  },
});

logger.info(`checking db ${path}`);

function comparator(a, b) {
  if (a.count === b.count) {
    return a.name > b.name ? 1 : -1;
  }
  return b.count - a.count;
}

function print(x) {
  console.log(`${x.name}\t${x.count}`);
}

async function task() {
  const tags = await prisma.tag.findMany({
    include: {
      taggedList: true,
    },
  });
  const longNovels = {};
  tags
    .filter(x => x.type === 3)
    .forEach(x =>
      x.taggedList.forEach(tagged => (longNovels[tagged.artId] = true)),
    );
  const characters = [],
    series = [],
    others = [];
  tags
    .filter(x => x.type === 1)
    .forEach(x => {
      let count = 0;
      x.taggedList
        .filter(tagged => !longNovels[tagged.artId])
        .forEach(() => count++);
      characters.push({ name: x.name, count });
    });
  characters.sort(comparator);
  tags
    .filter(x => x.type === 2)
    .forEach(x => series.push({ name: x.name, count: x.taggedList.length }));
  series.sort(comparator);
  tags
    .filter(x => x.type === 0)
    .forEach(x => others.push({ name: x.name, count: x.taggedList.length }));
  others.sort(comparator);

  characters.forEach(print);
  console.log();
  series.forEach(print);
  console.log();
  others.forEach(print);
}

task().then(async () => {
  await prisma.$disconnect();
  logger.info('task done!');
});
