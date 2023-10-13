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
  const removedArtDict = {};
  (
    await prisma.tagged.findMany({
      where: {
        OR: [
          {
            tag: {
              name: {
                in: ['R18', '安科', 'AA'],
              },
            },
          },
          {
            tag: {
              type: {
                in: [3, 4],
              },
            },
          },
        ],
      },
      include: {
        tag: true,
      },
    })
  ).forEach(e => (removedArtDict[e.artId] = true));
  console.log(`unselect ${Object.keys(removedArtDict).length} articles`);
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
        name: true,
        translator: true,
      },
    })
  )
    .filter(e => !removedArtDict[e.id])
    .map(e => {
      return {
        translator: e.translator,
        title: e.name,
        wordCounts: e.content
          .replace(/<[^>]*>/g, '')
          .replace(
            /[。？！，、；：“”‘’「」（）[\]〔〕【】『』—…·~～《》〈〉_/.?!,;:"'<>()@#$%^&*+=\\`\s]/g,
            '',
          ).length,
      };
    })
    .filter(e => e.wordCounts > 0);

  const cdfData = {};
  artList.forEach(
    e => (cdfData[e.wordCounts] = (cdfData[e.wordCounts] || 0) + 1),
  );
  writeFileSync('./result/transCDF.json', JSON.stringify(cdfData));

  const transDict = {};
  artList.forEach(e => {
    if (!transDict[e.translator]) {
      transDict[e.translator] = { short: 0, medium: 0, long: 0, len: 0 };
    }
    if (e.wordCounts >= 5000) {
      transDict[e.translator].long++;
      transDict[e.translator].len += e.wordCounts;
    } else if (e.wordCounts >= 2000) {
      transDict[e.translator].medium++;
      transDict[e.translator].len += e.wordCounts;
    } else if (e.wordCounts >= 300) {
      transDict[e.translator].short++;
      transDict[e.translator].len += e.wordCounts;
    }
  });

  const buffer = Object.keys(transDict)
    .map(e => {
      transDict[e].translator = e;
      return transDict[e];
    })
    .filter(e => e.len)
    .sort((a, b) => {
      if (a.len === b.len) {
        if (b.long === a.long) {
          if (b.medium === a.medium) {
            if (b.short === a.short) {
              return a.translator > b.translator ? 1 : -1;
            }
            return b.short - a.short;
          }
          return b.medium - a.medium;
        }
        return b.long - a.long;
      }
      return b.len - a.len;
    })
    .map(e => {
      const all = e.long + e.medium + e.short;
      return `${e.translator},${all},${e.len},${e.long},${e.medium},${
        e.short
      },${(e.len / all).toFixed(2)}`;
    })
    .join('\n');
  writeFileSync(
    './result/reward.csv',
    `\ufeffTranslator,All,WordCount,Long,Medium,Short,AverageWordCount\n${buffer}`,
  );

  await prisma.$disconnect();
}

task().then(() => logger.info('task done!'));
