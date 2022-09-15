const { PrismaClient } = require('@prisma/client');
const { readFileSync } = require('fs');
const { join, resolve } = require('path');
const { imgPath, path } = require('./config.js');
const MD5 = new (require('jshashes').MD5)();
const logger = require('log4js').getLogger('modifier');
logger.level = 'info';

const prisma = new PrismaClient({
  datasources: { db: { url: `file:${join(resolve(path))}` } },
});

const md5dict = {};

function removeBase64(content) {
  const result =
    content.match(/<img\s+src="data:image\/\w+;base64,[^"]+"[^>]*>/g) || [];
  let ret = content;
  let count = 0;
  result.forEach(reg => {
    const base64 = reg.match(/base64,[^"]+/)[0].substring(7);
    const hex = MD5.hex(base64);
    if (md5dict[hex]) {
      count++;
      ret = ret.replace(
        reg.match(/data:image\/\w+;base64,[^"]+/)[0],
        md5dict[hex],
      );
    }
  });
  return { ret, count };
}

async function task() {
  const csv = readFileSync(`${imgPath}/dict.csv`)
    .toString()
    .split('\r\n');
  const tag2Id = {};
  (await prisma.tag.findMany({ where: { type: 3 } })).forEach(
    tag => (tag2Id[tag.name] = tag.id),
  );
  for (const line of csv) {
    const lineArr = line.split(',');
    if (lineArr.length < 3) {
      continue;
    }
    const name = lineArr[0],
      hash = lineArr[1],
      url = lineArr[2];
    if (url.startsWith('http')) {
      if (name.indexOf('Image ') !== -1) {
        md5dict[hash] = url;
      } else {
        logger.info(name, url);
        await prisma.tag.update({
          data: { cover: url },
          where: { id: tag2Id[name] },
        });
      }
    }
  }
  const artList = await prisma.article.findMany();
  for (const art of artList) {
    const content = removeBase64(art.content);
    if (art.content.length !== content.ret.length) {
      await prisma.article.update({
        data: { content: content.ret },
        where: { id: art.id },
      });
      logger.info(
        `[${art.id}] ${art.name}: remove ${content.count} base64 files`,
      );
    }
  }
  logger.info('clean done');
}

task().then(async () => {
  await prisma.$queryRaw`vacuum`;
  logger.info('vacuum done');
  await prisma.$disconnect();
  logger.info('task done');
});
