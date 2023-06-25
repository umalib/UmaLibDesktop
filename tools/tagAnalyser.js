const { PrismaClient } = require('@prisma/client');
const { writeFileSync } = require('fs');
const { join, resolve } = require('path');
const { path } = require('./config.js');
const logger = require('log4js').getLogger('analyser');
logger.level = 'info';

logger.info(`analyze article data in db ${path}`);

function comparator(a, b) {
  if (a.count === b.count) {
    return a.name > b.name ? 1 : -1;
  }
  return b.count - a.count;
}

function stringifyCreators(sta) {
  const creators = sta.creators;
  const temp = [];
  for (const k in creators) {
    temp.push({
      creator: k,
      count: creators[k],
    });
  }
  temp.sort((a, b) => {
    if (b.count === a.count) {
      return a.creator > b.creator ? 1 : -1;
    }
    return b.count - a.count;
  });
  sta.creators = temp;
  return temp.map(x => `${x.creator}(${x.count})`).join(' ');
}

function print(x, cb) {
  cb(
    `${x.name},${x.count}${
      x.creators ? '/' + x.all + ',' + stringifyCreators(x) : ''
    }`,
  );
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${join(resolve(path))}`,
    },
  },
});

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
  const r18arts = {},
    r15arts = {};
  tags
    .filter(x => x.name === 'R18')[0]
    .taggedList.forEach(x => (r18arts[x.artId] = true));
  tags
    .filter(x => x.name === 'R15')[0]
    .taggedList.forEach(x => (r15arts[x.artId] = true));
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
          let tag = 'R18';
          if (r18arts[tagged.artId]) {
            if (!creators[tag]) {
              creators[tag] = 1;
            } else {
              creators[tag]++;
            }
          }
          tag = 'R15';
          if (r15arts[tagged.artId]) {
            if (!creators[tag]) {
              creators[tag] = 1;
            } else {
              creators[tag]++;
            }
          }
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
    .filter(x => !x.type)
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
      count: creatorCount[c] || tempList.reduce((p, c) => p + c.count, 0),
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
  cb('\nCharacter,R18,Count,Ratio');
  characters
    .map(x => {
      let r18 = x.creators.filter(x => x.creator === 'R18');
      if (r18.length) {
        r18 = r18[0].count;
      } else {
        r18 = 0;
      }
      return {
        name: x.name,
        count: x.count,
        r18,
        ratio: ((r18 || 0) * 100) / x.count,
      };
    })
    .filter(x => x.r18)
    .sort((a, b) => b.ratio - a.ratio)
    .forEach(x => {
      cb(`${x.name},${x.r18},${x.count},${x.ratio.toFixed(2)}%`);
    });
  cb('\nCharacter,R15,Count,Ratio');
  characters
    .map(x => {
      let r15 = x.creators.filter(x => x.creator === 'R15');
      if (r15.length) {
        r15 = r15[0].count;
      } else {
        r15 = 0;
      }
      return {
        name: x.name,
        count: x.count,
        r15,
        ratio: ((r15 || 0) * 100) / x.count,
      };
    })
    .filter(x => x.r15)
    .sort((a, b) => b.ratio - a.ratio)
    .forEach(x => {
      cb(`${x.name},${x.r15},${x.count},${x.ratio.toFixed(2)}%`);
    });
  const date = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  writeFileSync(
    `result/analysis-${date.getFullYear()}${month < 10 ? '0' + month : month}${
      day < 10 ? '0' + day : day
    }.csv`,
    `\uFEFF${output}`,
  );
  const R18TagSta = others.filter(x => x.name === 'R18')[0],
    R15TagSta = others.filter(x => x.name === 'R15')[0];
  writeFileSync(
    'result/output-pie.json',
    JSON.stringify({
      R18: {
        all: R18TagSta.count,
        creators: R18TagSta.creators.map(x => x.creator),
        counts: R18TagSta.creators.map(x => x.count),
      },
      R15: {
        all: R15TagSta.count,
        creators: R15TagSta.creators.map(x => x.creator),
        counts: R15TagSta.creators.map(x => x.count),
      },
    }),
  );
  await prisma.$disconnect();
}

task().then(() => logger.info('task done!'));
