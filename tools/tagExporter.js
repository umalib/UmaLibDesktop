const { PrismaClient } = require('@prisma/client');
const { writeFileSync } = require('fs');
const { join, resolve } = require('path');
const { path } = require('./config.js');
const logger = require('log4js').getLogger('exporter');
logger.level = 'info';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${join(resolve(path))}`,
    },
  },
});

logger.info(`checking db ${path}`);

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
  return temp.map(x => `${x.c}:${x.a}`).join(', ');
}

function print(x, cb) {
  cb(
    `${x.name}\t${x.count}${
      x.creators ? '/' + x.all + '\t' + stringifyCreators(x.creators) : ''
    }`,
  );
}

async function task() {
  const id2creator = {};
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
    .forEach(x => others.push({ name: x.name, count: x.taggedList.length }));
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
      val: tempList.sort((a, b) => {
        if (a.count === b.count) {
          return a.name > b.name ? 1 : -1;
        }
        return b.count - a.count;
      }),
    });
  }
  creatorSta.sort((a, b) => (a.name > b.name ? 1 : -1));

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
  characters.forEach(x => print(x, cb));
  cb('');
  series.forEach(x => print(x, cb));
  cb('');
  others.forEach(x => print(x, cb));
  cb('');
  cb(
    creatorSta
      .map(
        x => `${x.name}\t${x.val.map(v => v.name + ':' + v.count).join(', ')}`,
      )
      .join('\n'),
  );
  writeFileSync('temp.out', output);
}

task().then(async () => {
  await prisma.$disconnect();
  logger.info('task done!');
});
