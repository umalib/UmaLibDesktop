const { PrismaClient } = require('@prisma/client');
const { writeFileSync } = require('fs');
const { join, resolve } = require('path');
const { path } = require('./config.js');
const logger = require('log4js').getLogger('analyser');
logger.level = 'info';

logger.info(`analyze article data in db ${path}`);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${join(resolve(path))}`,
    },
  },
});

async function task() {
  const articles = (
    await prisma.article.findMany({
      select: {
        id: true,
        author: true,
        translator: true,
        uploadTime: true,
      },
    })
  ).map(x => {
    return {
      id: x.id,
      creator: x.translator || x.author,
      uploadTime: Math.floor((x.uploadTime + 8 * 3600) / 86400),
    };
  });

  let creatorDict = {};
  articles.forEach(x => {
    if (!creatorDict[x.creator]) {
      creatorDict[x.creator] = 1;
    } else {
      creatorDict[x.creator] += 1;
    }
  });
  creatorDict = Object.keys(creatorDict).map(x => {
    return {
      n: x,
      c: creatorDict[x],
    };
  });
  creatorDict.sort((a, b) => {
    if (b.c === a.c) {
      return a.n > b.n ? 1 : -1;
    }
    return b.c - a.c;
  });
  creatorDict = creatorDict.slice(0, 10).map(x => x.n);

  const novelDict = {};
  const tags = await prisma.tag.findMany({
    include: {
      taggedList: true,
    },
  });
  tags
    .filter(x => x.type === 3)
    .forEach(x => x.taggedList.forEach(y => (novelDict[y.artId] = true)));

  let tagDict = tags
    .filter(x => x.type === 1)
    .map(x => {
      return {
        n: x.name,
        c: x.taggedList.filter(y => !novelDict[y.artId]).length,
      };
    });
  tagDict.sort((a, b) => {
    if (b.c === a.c) {
      return a.n > b.n ? 1 : -1;
    }
    return b.c - a.c;
  });
  tagDict = tagDict.slice(0, 10).map(x => x.n);
  tagDict = [...tagDict, 'R18', 'R15'];

  const artDict = {};
  tags
    .filter(x => tagDict.indexOf(x.name) !== -1)
    .forEach(x => {
      const tagIndex = tagDict.indexOf(x.name);
      x.taggedList.forEach(y => {
        if (!novelDict[y.artId] || tagIndex > 9) {
          if (!artDict[y.artId]) {
            artDict[y.artId] = [];
            for (let i = 0; i < tagDict.length; ++i) {
              artDict[y.artId].push(0);
            }
          }
          artDict[y.artId][tagIndex] = 1;
        }
      });
    });

  const day2count = {};
  for (const art of articles) {
    const key = art.uploadTime;
    if (!day2count[key]) {
      day2count[key] = {
        all: 1,
        delta: 1,
        creators: [],
        tags: [],
      };
      for (let i = 0; i < creatorDict.length; ++i) {
        day2count[key].creators.push(0);
      }
      for (let i = 0; i < tagDict.length; ++i) {
        day2count[key].tags.push(0);
      }
    } else {
      day2count[key].delta += 1;
    }
    const creatorIndex = creatorDict.indexOf(art.creator);
    if (creatorIndex >= 0) {
      day2count[key].creators[creatorIndex] += 1;
    }
    if (artDict[art.id]) {
      for (let i = 0; i < tagDict.length; ++i) {
        day2count[key].tags[i] += artDict[art.id][i];
      }
    }
  }
  const days = Object.keys(day2count).map(x => Number(x));
  days.sort();
  for (let i = 0; i < days.length; ++i) {
    if (i === 0) {
      day2count[days[i]].all = day2count[days[i]].delta;
    } else {
      day2count[days[i]].all =
        day2count[days[i]].delta + day2count[days[i - 1]].all;
      for (let j = 0; j < creatorDict.length; ++j) {
        day2count[days[i]].creators[j] += day2count[days[i - 1]].creators[j];
      }
      for (let j = 0; j < tagDict.length; ++j) {
        day2count[days[i]].tags[j] += day2count[days[i - 1]].tags[j];
      }
    }
  }
  const all = [],
    delta = [],
    creators = [],
    tagOutput = [];
  for (let i = 0; i < creatorDict.length; ++i) {
    creators.push([]);
  }
  for (let i = 0; i < tagDict.length; ++i) {
    tagOutput.push([]);
  }
  for (const key of days) {
    all.push(day2count[key].all);
    delta.push(day2count[key].delta);
    for (let i = 0; i < creatorDict.length; ++i) {
      creators[i].push(day2count[key].creators[i]);
    }
    for (let i = 0; i < tagDict.length; ++i) {
      tagOutput[i].push(day2count[key].tags[i]);
    }
  }
  writeFileSync(
    resolve('./result/output-plot.json'),
    JSON.stringify({
      days,
      all,
      delta,
      creators,
      tags: tagOutput,
      dict: {
        creators: creatorDict,
        tags: tagDict,
      },
    }),
  );
  await prisma.$disconnect();
}

task().then(() => logger.info('task done!'));
