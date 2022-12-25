const { PrismaClient } = require('@prisma/client');
const { join, resolve } = require('path');
const { alignCenterImg, path } = require('./config.js');
const logger = require('log4js').getLogger('cleaner');
logger.level = 'info';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${join(resolve(path))}`,
    },
  },
});

function cleaner(content) {
  for (
    let tmp = content.replace(/<p>\s*<br>\s*<\/p>/g, '\n');
    tmp.indexOf('</p><p>') === -1 && tmp.substring(3).indexOf('<p>') !== -1;
    tmp = content.replace(/<p>\s*<br>\s*<\/p>/g, '\n')
  ) {
    content = content.replace(/<\/p>\s*<p>\s*<br>\s*<\/p>/g, '</p>');
  }
  return content;
}

function cleanBlank(src) {
  return src.replace(/^\s*/, '').replace(/\s*$/, '');
}

logger.info(`cleaning db ${path}`);

async function task() {
  const articles = await prisma.article.findMany();
  for (const art of articles) {
    let content = art.content;
    if (
      art.note.indexOf('字符画') === -1 &&
      art.note.indexOf('AA漫画') === -1
    ) {
      content = content.replace(
        /\s*background-color:\s*(transparent|rgb\(255,\s*248,\s*231\)|rgb\(245,\s*232,\s*203\)|rgb\(255,\s*240,\s*205\));\s*/g,
        '',
      );
      content = content.replace(
        /\s*color:\s*(black|rgb\(51,\s*51,\s*51\)|rgb\(16,\s*39,\s*63\));\s*/g,
        '',
      );
      content = content.replace(/\s+style="\s*"\s*/g, '');
      content = content
        .replace(/^\s*(<p>\s*<br>\s*<\/p>\s*)*\s*/, '')
        .replace(/\s*(\s*<p>\s*<br>\s*<\/p>)*\s*$/, '');
      content = content.replace(/<\/p>\s*<p>/g, '</p><p>');
      content = cleaner(content);
      if (art.name.indexOf('两人三足') === -1 && alignCenterImg) {
        content = content.replace(
          /<p>\s*<img\s+/g,
          '<p class="ql-align-center"><img ',
        );
      }
    }
    const author = cleanBlank(art.author);
    const translator = cleanBlank(art.translator);
    const name = cleanBlank(art.name);
    const note = cleanBlank(art.note);
    let source = cleanBlank(art.source);
    if (source.startsWith('[')) {
      source = source.substring(1);
    }
    if (source.endsWith(']')) {
      source = source.substring(0, source.length - 1);
    }
    if (
      source.startsWith('tsumanne.net') ||
      source.startsWith('www.pixiv.net')
    ) {
      source = 'https://' + source;
    }
    if (source.startsWith('pixiv.net')) {
      source = 'https://www.' + source;
    }
    if (source.startsWith('PIXIV ID：')) {
      source = 'https://www.pixiv.net/novel/show.php?id=' + source.substring(9);
    }
    if (source.startsWith('Pid=')) {
      source = 'https://www.pixiv.net/novel/show.php?id=' + source.substring(4);
    }
    if (source.startsWith('PIXIV ID=')) {
      source = 'https://www.pixiv.net/novel/show.php?id=' + source.substring(9);
    }
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
  await prisma.tagged.deleteMany({
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
}

task().then(async () => {
  logger.info('clean done!');
  await prisma.$queryRaw`vacuum;`;
  logger.info('vacuum done!');
  await prisma.$disconnect();
  logger.info('task done!');
});
