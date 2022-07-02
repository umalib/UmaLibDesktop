const { PrismaClient } = require('@prisma/client');
const { join, resolve } = require('path');
const log4js = require('log4js');

const { path } = require('./config.js');
const logger = log4js.getLogger();
logger.level = 'debug';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${join(resolve(path))}`,
    },
  },
});

logger.info(`checking db ${path}`);

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
  tags
    .filter(x => x.type === 1)
    .forEach(x => {
      let count = 0;
      x.taggedList
        .filter(tagged => !longNovels[tagged.artId])
        .forEach(() => count++);
      console.log(`${x.name}\t${count}`);
    });
  console.log();
  tags
    .filter(x => x.type === 2)
    .forEach(x => console.log(`${x.name}\t${x.taggedList.length}`));
  console.log();
  tags
    .filter(x => x.type === 0)
    .forEach(x => console.log(`${x.name}\t${x.taggedList.length}`));
}

task().then(async () => {
  await prisma.$disconnect();
  logger.info('task done!');
});
