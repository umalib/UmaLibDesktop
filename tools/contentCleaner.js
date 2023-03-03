const { PrismaClient } = require('@prisma/client');
const { join, resolve } = require('path');
const { alignCenterImg, path } = require('./config.js');
const logger = require('log4js').getLogger('cleaner');
logger.level = 'info';

logger.info(`clean ${path}, set image align to center? ${alignCenterImg}`);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${join(resolve(path))}`,
    },
  },
});

function cleanDuplicateLineBreak(content) {
  for (
    let tmp = content.replace(/<p>\s*<br\s*\/?\s*>\s*<\/p>/g, '\n');
    tmp.indexOf('</p><p>') === -1 && tmp.substring(3).indexOf('<p>') !== -1;
    tmp = content.replace(/<p>\s*<br\s*\/?\s*>\s*<\/p>/g, '\n')
  ) {
    content = content.replace(/<\/p>\s*<p>\s*<br\s*\/?\s*>\s*<\/p>/g, '</p>');
  }
  return content;
}

function cleanBlank(src) {
  return src
    .replace(/^\s*/, '')
    .replace(/\s*$/, '')
    .replace(/[\u200b-\u200f\uFEFF\u202a-\u202e]/g, '');
}

async function task() {
  const articles = await prisma.article.findMany();
  for (const art of articles) {
    let content = art.content;
    if (
      art.note.indexOf('字符画') === -1 &&
      art.note.indexOf('AA漫画') === -1
    ) {
      content = content.replace(/&nbsp;/g, ' ');
      content = content.replace(
        /\s*color:\s*(black|rgb\(51,\s*51,\s*51\)|rgb\(16,\s*39,\s*63\));\s*/g,
        '',
      );
      content = content.replace(/\s+style="\s*"\s*/g, '');
      content = content
        .replace(/^\s*(<p>\s*<br\s*\/?\s*>\s*<\/p>\s*)*\s*/, '')
        .replace(/\s*(\s*<p>\s*<br\s*\/?\s*>\s*<\/p>)*\s*$/, '')
        .replace(/\s*<p>\s*<br\s*\/?\s*>\s*<\/p>\s*/g, '<p><br></p>');
      content = content.replace(/<\/p>\s*<p>/g, '</p><p>');
      content = cleanDuplicateLineBreak(content);
      content = content.replace(/\.(thumb|medium).jpg"/g, '"');
      content = content.replace(/[\u200b-\u200f\uFEFF\u202a-\u202e]/g, '');
      if (alignCenterImg) {
        let alignCenterImg = '<p class="ql-align-center"><';
        alignCenterImg += 'img ';
        content = content.replace(/<p>\s*<img\s+/g, alignCenterImg);
      }
    }
    const author = cleanBlank(art.author);
    const translator = cleanBlank(art.translator);
    const name = cleanBlank(art.name);
    const note = cleanBlank(art.note);
    const source = cleanBlank(art.source).replace(/\s{2,}/g, ' ');
    const flags = [];
    if (art.name.length !== name.length) {
      flags.push('name');
    }
    if (art.author.length !== author.length) {
      flags.push('author');
    }
    if (art.translator.length !== translator.length) {
      flags.push('translator');
    }
    if (art.content.length !== content.length) {
      flags.push('content');
    }
    if (art.source.length !== source.length) {
      flags.push('source');
    }
    if (art.note.length !== note.length) {
      flags.push('note');
    }
    if (flags.length) {
      logger.info(
        `update ${flags.join(', ')} of article ${art.id} [${art.name}]`,
      );
      await prisma.article.update({
        data: {
          name,
          author,
          translator,
          note,
          source,
          content,
        },
        where: {
          id: art.id,
        },
      });
    }
  }
  logger.info('cleaning articles done!');
  const tags = await prisma.tag.findMany();
  for (const tag of tags) {
    const name = tag.name.replace(/^\s*/, '').replace(/\s*$/, '');
    if (tag.name.length !== name.length) {
      logger.info(`update name of tag ${tag.id} [${tag.name} -> ${name}]`);
      await prisma.tag.update({
        data: {
          name,
        },
        where: {
          id: tag.id,
        },
      });
    }
  }
  logger.info('cleaning tags done!');
  await prisma['tagged'].deleteMany({
    where: {
      OR: [
        {
          NOT: {
            artId: {
              in: articles.map(x => x.id),
            },
          },
        },
        {
          NOT: {
            tagId: {
              in: tags.map(x => x.id),
            },
          },
        },
      ],
    },
  });
  logger.info('cleaning tagged done!');
  logger.info('clean done!');
  await prisma.$queryRaw`vacuum;`;
  logger.info('vacuum done!');
  await prisma.$disconnect();
}

task().then(() => logger.info('task done!'));
