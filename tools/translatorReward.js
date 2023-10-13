const { PrismaClient } = require('@prisma/client');
const { writeFileSync } = require('fs');
const { resolve } = require('path');
const { path } = require('./config.js');
const logger = require('log4js').getLogger('reward');
logger.level = 'info';

logger.info(`analyze article and translator data in db ${path}`);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${resolve(path)}`,
    },
  },
});

async function task() {
  const removedArts = (
    await prisma.tagged.findMany({
      where: {
        tag: {
          OR: [
            {
              name: {
                in: ['R18', '安科', 'AA'],
              },
            },
            {
              type: {
                in: [3, 4],
              },
            },
          ],
        },
      },
      include: {
        tag: true,
      },
    })
  ).map(e => e.artId);
  console.log(`unselect ${removedArts.length} articles`);
  const removedArtDict = {};
  removedArts.forEach(e => (removedArtDict[e] = true));
  const artList = (
    await prisma.article.findMany({
      where: {
        translator: {
          not: '',
        },
      },
      select: {
        id: true,
        content: true,
        translator: true,
      },
    })
  )
    .filter(e => !removedArts[e.id])
    .map(e => {
      return {
        translator: e.translator,
        wordCounts: e.content
          .replace(/<[^>]*>/g, '')
          .replace(
            /[。？！，、；：“”‘’「」（）[\]〔〕【】『』—…·~～《》〈〉_/.?!,;:"'<>()@#$%^&*+=\\`\s]/g,
            '',
          ).length,
      };
    });
  const cdfData = {};
  artList.forEach(
    e => (cdfData[e.wordCounts] = (cdfData[e.wordCounts] || 0) + 1),
  );
  writeFileSync('./result/transCDF.json', JSON.stringify(cdfData));
  await prisma.$disconnect();
}

task().then(() => logger.info('task done!'));
