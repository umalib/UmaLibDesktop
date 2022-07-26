const { PrismaClient } = require('@prisma/client');
const { join, resolve } = require('path');
const { path } = require('./config.js');
const logger = require('log4js').getLogger('cleaner');
logger.level = 'info';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${join(resolve(path))}`,
    },
  },
});

prisma.article.findMany().then(async r => {
  for (const art of r) {
    let source = art.source;
    if (source.startsWith(' ')) {
      source = source.replace(/^\s+/, '');
    }
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
    if (source && !source.startsWith('http')) {
      logger.info(art.name, source);
    }
    if (art.source !== source) {
      logger.info('update article', art.id, art.name, art.source, source);
      await prisma.article.update({
        data: {
          source,
        },
        where: {
          id: art.id,
        },
      });
    }
  }
  await prisma.$disconnect();
});
