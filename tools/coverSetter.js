const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const { join, resolve } = require('path');
const { path, coverPath } = require('./config.js');
const logger = require('log4js').getLogger('setter');
logger.level = 'info';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${join(resolve(path))}`,
    },
  },
});

async function task() {
  const id2Tag = {};
  (await prisma.tag.findMany()).forEach(tag => (id2Tag[tag.name] = tag.id));
  const fileList = fs.readdirSync(coverPath);
  for (const fileName of fileList) {
    const fileNameArr = fileName.split('.');
    const name = fileNameArr[0],
      suffix = fileNameArr[1];
    if (id2Tag[name]) {
      const buffer = Buffer.from(
        fs.readFileSync(coverPath + fileName, 'binary'),
        'binary',
      );
      const coverData = `data:image/${suffix};base64,${buffer.toString(
        'base64',
      )}`;
      await prisma.tag.update({
        data: {
          cover: coverData,
        },
        where: {
          id: id2Tag[name],
        },
      });
      logger.info(`${id2Tag[name]}/${name}: ${coverData.length}`);
    } else {
      logger.error(fileName);
    }
  }
}

task().then(async () => {
  await prisma.$disconnect();
  logger.info('task done');
});
