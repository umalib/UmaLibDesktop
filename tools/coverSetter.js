const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const { join, resolve } = require('path');
const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'info';
const { path, coverPath } = require('./config.js');

async function task() {
  let prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${join(resolve(path))}`,
      },
    },
  });
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
  await prisma.$disconnect();
}

task().then(() => logger.info('task done'));
