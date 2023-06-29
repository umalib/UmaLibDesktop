const { PrismaClient } = require('@prisma/client');
const { resolve } = require('path');
const { path } = require('./config.js');
const { staffs, editors } = require('../src/renderer/utils/data');
const logger = require('log4js').getLogger('generator');
logger.level = 'info';

logger.info(`check creators in ${path}`);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${resolve(path)}`,
    },
  },
});

async function task() {
  const creators = {};
  const articles = await prisma.article.findMany({
    select: {
      id: true,
      author: true,
      translator: true,
      content: true,
    },
  });
  await prisma.$disconnect();
  articles.forEach(x => {
    const creator = x.translator ? x.translator : x.author;
    creator.split('/').forEach(c => (creators[c] = true));
  });
  staffs.forEach(c => delete creators[c]);
  editors.forEach(c => delete creators[c]);
  delete creators['我就是雷gay的化身'];
  delete creators['匿名'];
  delete creators['超合金魂DX紅美鈴'];
  delete creators['南村群童'];
  delete creators['亚岚'];
  delete creators['Nils'];
  delete creators['ken'];
  delete creators['病娇的芙兰'];
  delete creators['风拂云默'];
  delete creators['RiverOfCrystals'];
  creators['起啥不是个名字（病娇的芙兰）'] = true;
  creators['文甄心（风拂云默）'] = true;
  creators['RiverOfCrystals（BPK5uQqUk）'] = true;
  logger.info(Object.keys(creators).length);
  for (const k in creators) {
    console.log(k);
  }
}

task().then(() => logger.info('task done!'));
