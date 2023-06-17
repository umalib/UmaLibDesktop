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
        content: true,
        author: true,
        translator: true,
        uploadTime: true,
      },
    })
  ).map(x => {
    return {
      id: x.id,
      creator: x.translator || x.author,
      content: x.content
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, '')
        .replace(
          /[。？！，、；：“”‘’「」（）[\]〔〕【】『』—…·~～《》〈〉_/.?!,;:"'<>()@#$%^&*+=\\`]/g,
          '',
        ).length,
      uploadTime: Math.floor((x.uploadTime + 8 * 3600) / 86400),
    };
  });

  const tags = await prisma.tag.findMany({
    include: {
      taggedList: true,
    },
  });

  const lengthFilter = {};
  tags
    .filter(x => x.name === 'AA' || x.name === '安科')
    .forEach(x => x.taggedList.forEach(y => (lengthFilter[y.artId] = 1)));

  let creatorDict = {};
  articles.forEach(x => {
    if (!creatorDict[x.creator]) {
      creatorDict[x.creator] = {
        count: 0,
        length: 0,
      };
    }
    creatorDict[x.creator].count += 1;
    creatorDict[x.creator].length += lengthFilter[x.id] ? 0 : x.content;
  });
  creatorDict = Object.keys(creatorDict).map(x => {
    return {
      name: x,
      count: creatorDict[x].count,
      length: creatorDict[x].length,
    };
  });
  creatorDict.sort((a, b) => {
    if (b.count === a.count) {
      if (b.length === a.length) {
        return a.name > b.name ? 1 : -1;
      }
      return b.length - a.length;
    }
    return b.count - a.count;
  });
  const creatorDictCount = creatorDict.slice(0, 10).map(x => x.name);

  creatorDict.sort((a, b) => {
    if (b.length === a.length) {
      if (b.count === a.count) {
        return a.name > b.name ? 1 : -1;
      }
      return a.count - b.count;
    }
    return b.length - a.length;
  });
  const creatorDictLen = creatorDict.slice(0, 10).map(x => x.name);

  const novelDict = {};
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
        count: {
          all: 0,
          delta: 0,
          creators: [],
          tags: [],
        },
        len: {
          all: 0,
          delta: 0,
          creators: [],
          tags: [],
        },
      };
      for (let i = 0; i < creatorDictCount.length; ++i) {
        day2count[key].count.creators.push(0);
        day2count[key].len.creators.push(0);
      }
      for (let i = 0; i < tagDict.length; ++i) {
        day2count[key].count.tags.push(0);
        day2count[key].len.tags.push(0);
      }
    }
    day2count[key].count.delta += 1;
    day2count[key].len.delta += lengthFilter[art.id] ? 0 : art.content;
    art.creator.split('/').forEach(x => {
      const creatorCountIndex = creatorDictCount.indexOf(x);
      if (creatorCountIndex >= 0) {
        day2count[key].count.creators[creatorCountIndex] += 1;
      }
      if (!lengthFilter[art.id]) {
        const creatorLenIndex = creatorDictLen.indexOf(x);
        if (creatorLenIndex >= 0) {
          day2count[key].len.creators[creatorLenIndex] += art.content;
        }
      }
    });
    if (artDict[art.id]) {
      for (let i = 0; i < tagDict.length; ++i) {
        day2count[key].count.tags[i] += artDict[art.id][i];
        day2count[key].len.tags[i] +=
          artDict[art.id][i] && !lengthFilter[art.id] ? art.content : 0;
      }
    }
  }

  const days = Object.keys(day2count).map(x => Number(x));
  days.sort();
  for (let i = 0; i < days.length; ++i) {
    if (i) {
      day2count[days[i]].count.all =
        day2count[days[i]].count.delta + day2count[days[i - 1]].count.all;
      for (let j = 0; j < creatorDictCount.length; ++j) {
        day2count[days[i]].count.creators[j] +=
          day2count[days[i - 1]].count.creators[j];
      }
      for (let j = 0; j < tagDict.length; ++j) {
        day2count[days[i]].count.tags[j] +=
          day2count[days[i - 1]].count.tags[j];
      }
      day2count[days[i]].len.all =
        day2count[days[i]].len.delta + day2count[days[i - 1]].len.all;
      for (let j = 0; j < creatorDictCount.length; ++j) {
        day2count[days[i]].len.creators[j] +=
          day2count[days[i - 1]].len.creators[j];
      }
      for (let j = 0; j < tagDict.length; ++j) {
        day2count[days[i]].len.tags[j] += day2count[days[i - 1]].len.tags[j];
      }
    } else {
      day2count[days[i]].count.all = day2count[days[i]].count.delta;
      day2count[days[i]].len.all = day2count[days[i]].len.delta;
    }
  }

  const out = {
    count: {
      all: [],
      delta: [],
      creators: [],
      tags: [],
    },
    len: {
      all: [],
      delta: [],
      creators: [],
      tags: [],
    },
  };
  for (let i = 0; i < creatorDictCount.length; ++i) {
    out.count.creators.push([]);
    out.len.creators.push([]);
  }
  for (let i = 0; i < tagDict.length; ++i) {
    out.count.tags.push([]);
    out.len.tags.push([]);
  }
  for (const key of days) {
    out.count.all.push(day2count[key].count.all);
    out.count.delta.push(day2count[key].count.delta);
    for (let i = 0; i < creatorDictCount.length; ++i) {
      out.count.creators[i].push(day2count[key].count.creators[i]);
    }
    for (let i = 0; i < tagDict.length; ++i) {
      out.count.tags[i].push(day2count[key].count.tags[i]);
    }
    out.len.all.push(day2count[key].len.all);
    out.len.delta.push(day2count[key].len.delta);
    for (let i = 0; i < creatorDictCount.length; ++i) {
      out.len.creators[i].push(day2count[key].len.creators[i]);
    }
    for (let i = 0; i < tagDict.length; ++i) {
      out.len.tags[i].push(day2count[key].len.tags[i]);
    }
  }
  writeFileSync(
    resolve('./result/output-plot-count.json'),
    JSON.stringify({
      days,
      all: out.count.all,
      delta: out.count.delta,
      creators: out.count.creators,
      tags: out.count.tags,
      dict: {
        creators: creatorDictCount,
        tags: tagDict,
      },
    }),
  );
  writeFileSync(
    resolve('./result/output-plot-len.json'),
    JSON.stringify({
      days,
      all: out.len.all,
      delta: out.len.delta,
      creators: out.len.creators,
      tags: out.len.tags,
      dict: {
        creators: creatorDictLen,
        tags: tagDict,
      },
    }),
  );
  await prisma.$disconnect();
}

task().then(() => logger.info('task done!'));
