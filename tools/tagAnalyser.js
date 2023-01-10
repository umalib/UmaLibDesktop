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

function comparator(a, b) {
  if (a.count === b.count) {
    return a.name > b.name ? 1 : -1;
  }
  return b.count - a.count;
}

function stringifyCreators(creators) {
  const temp = [];
  for (const k in creators) {
    temp.push({
      c: k,
      a: creators[k],
    });
  }
  temp.sort((a, b) => {
    if (b.a === a.a) {
      return a.c > b.c ? 1 : -1;
    }
    return b.a - a.a;
  });
  return temp.map(x => `${x.c}(${x.a})`).join(' ');
}

function print(x, cb) {
  cb(
    `${x.name},${x.count}${
      x.creators ? '/' + x.all + ',' + stringifyCreators(x.creators) : ''
    }`,
  );
}

async function task() {
  const id2creator = {};
  const creatorCount = {};
  (
    await prisma.article.findMany({
      select: {
        id: true,
        author: true,
        translator: true,
      },
    })
  ).forEach(x => {
    const creator = x.translator ? x.translator : x.author;
    id2creator[x.id] = creator.split('/');
    for (const c of id2creator[x.id]) {
      if (creatorCount[c] === undefined) {
        creatorCount[c] = 1;
      } else {
        creatorCount[c] += 1;
      }
    }
  });
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
  const characters = [],
    series = [],
    others = [];
  tags
    .filter(x => x.type === 1)
    .forEach(x => {
      let count = 0;
      const creators = {};
      x.taggedList
        .filter(tagged => !longNovels[tagged.artId])
        .forEach(tagged => {
          count++;
          id2creator[tagged.artId].forEach(creator => {
            if (!creators[creator]) {
              creators[creator] = 1;
            } else {
              creators[creator]++;
            }
          });
        });
      characters.push({
        name: x.name,
        count,
        all: x.taggedList.length,
        creators,
      });
    });
  characters.sort(comparator);
  tags
    .filter(x => x.type === 2)
    .forEach(x => series.push({ name: x.name, count: x.taggedList.length }));
  series.sort(comparator);
  tags
    .filter(x => x.type === 0)
    .forEach(x => {
      let creators = undefined;
      if (x.name === 'R18' || x.name === 'R15') {
        creators = {};
        x.taggedList.forEach(tagged => {
          id2creator[tagged.artId].forEach(creator => {
            if (!creators[creator]) {
              creators[creator] = 1;
            } else {
              creators[creator]++;
            }
          });
        });
      }
      others.push({
        name: x.name,
        count: x.taggedList.length,
        all: x.taggedList.length,
        creators,
      });
    });
  others.sort(comparator);
  const creators = {};
  characters.forEach(x => {
    if (x.creators) {
      for (const c in x.creators) {
        if (!creators[c]) {
          creators[c] = {};
        }
        creators[c][x.name] = x.creators[c];
      }
    }
  });
  const creatorSta = [];
  for (const c in creators) {
    const tempList = [];
    for (const ch in creators[c]) {
      tempList.push({ name: ch, count: creators[c][ch] });
    }
    creatorSta.push({
      name: c,
      count: creatorCount[c],
      val: tempList.sort((a, b) => {
        if (a.count === b.count) {
          return a.name > b.name ? 1 : -1;
        }
        return b.count - a.count;
      }),
    });
  }
  creatorSta.sort((a, b) => {
    if (a.count === b.count) {
      return a.name > b.name ? 1 : -1;
    }
    return b.count - a.count;
  });

  // const cb = console.log;
  // characters.forEach(x => print(x, cb));
  // cb();
  // series.forEach(x => print(x, cb));
  // cb();
  // others.forEach(x => print(x, cb));

  let output = '';

  function cb(s) {
    output += s + '\n';
  }

  cb('Character,Short/All,Creators');
  characters.forEach(x => print(x, cb));
  cb('\nSeries,Count');
  series.forEach(x => print(x, cb));
  cb('\nTag,Count');
  others.forEach(x => print(x, cb));
  cb('\nCreator,Count,Tags');
  cb(
    creatorSta
      .map(
        x =>
          `${x.name},${x.count},${x.val
            .map(v => `${v.name}(${v.count})`)
            .join(' ')}`,
      )
      .join('\n'),
  );
  const date = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  writeFileSync(
    `result/analysis-${date.getFullYear()}${month < 10 ? '0' + month : month}${
      day < 10 ? '0' + day : day
    }.csv`,
    `\uFEFF${output}`,
  );
  await prisma.$disconnect();
}

task().then(() => logger.info('task done!'));
