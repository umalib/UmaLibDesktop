const { PrismaClient } = require('@prisma/client');
const { writeFileSync } = require('fs');
const { join, resolve } = require('path');
const { coverPath, imgPath, path } = require('./config.js');
const MD5 = new (require('jshashes').MD5)();
const logger = require('log4js').getLogger('exporter');
logger.level = 'info';

const prisma = new PrismaClient({
  datasources: { db: { url: `file:${join(resolve(path))}` } },
});

function countBase64(content) {
  const result = content.match(
    /<img\s+src="data:image\/\w+;base64,[^"]+"[^>]*>/g,
  );
  return result ? result : [];
}

const md5dict = {};

function saveFile(src, name, path) {
  const suffix = src.match(/image\/\w+/)[0].substring(6);
  const base64 = src.match(/base64,[^"]+/)[0].substring(7);
  const hex = MD5.hex(base64);
  if (md5dict[hex]) {
    return { hex, file: md5dict[hex] };
  } else {
    const dataBuffer = Buffer.from(base64, 'base64');
    const fileName = `${path}${name}.${suffix}`;
    md5dict[hex] = fileName;
    writeFileSync(fileName, dataBuffer);
    return { hex, file: fileName };
  }
}

async function task() {
  let count = 0;
  const artList = await prisma.article.findMany();
  let csv = '';
  for (const art of artList) {
    const imageArr = countBase64(art.content);
    if (imageArr.length > 0) {
      count += imageArr.length;
      logger.info(`${art.id} [${art.name}]\t${imageArr.length}`);
      for (let i = 0; i < imageArr.length; ++i) {
        const imgStr = imageArr[i];
        const outFile = saveFile(imgStr, `${art.id}-${i + 1}`, imgPath);
        csv += `"Image ${art.id}-${i + 1}","${outFile.hex}","${
          outFile.file
        }"\n`;
        logger.info(`image ${art.id}-${i + 1}: ${outFile.file}`);
      }
    }
  }
  (await prisma.tag.findMany()).forEach(tag => {
    if (tag.cover && tag.cover.startsWith('data:image')) {
      const outFile = saveFile(tag.cover, tag.name, coverPath);
      csv += `"Image ${tag.name}","${outFile.hex}","${outFile.file}"\n`;
      logger.info(`image ${tag.name}: ${outFile.file}`);
    }
  });
  writeFileSync(`${imgPath}/dict.csv`, csv);
  logger.info(`all: ${count}`);
}

task().then(async () => {
  await prisma.$disconnect();
  logger.info('task done');
});
