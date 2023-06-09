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

async function task() {
  const dict = await prisma.dict.findMany();
  for (const entry of dict) {
    const data = {};
    if (entry['refId']) {
      const key = entry.key.replace(/[【】]/g, '');
      const ref = await prisma.tag.findFirst({
        where: { name: key },
        select: {
          id: true,
        },
      });
      if (!ref || !ref.id) {
        logger.error(entry.key);
      } else if (entry['refId'] !== ref.id) {
        logger.info(`fix: tag ${entry.key}, id ${entry['refId']} -> ${ref.id}`);
        data['refId'] = ref.id;
      }

      if (entry['relatedId']) {
        const art = await prisma.article.findFirst({
          where: { name: entry.related },
          select: {
            id: true,
          },
        });
        if (!art) {
          logger.error(entry.related);
        } else if (entry['relatedId'] !== art.id) {
          logger.info(
            `fix: article ${entry.related}, id ${entry['relatedId']} -> ${art.id}`,
          );
          data['relatedId'] = art.id;
        }
      }

      if (Object.keys(data).length) {
        await prisma.dict.update({ where: { id: entry.id }, data });
      }
    }
  }
  logger.info('fix dict done!');

  const recs = await prisma['rec'].findMany();
  for (const rec of recs) {
    const data = {};
    switch (rec.type) {
      case 2:
      case 3:
      case 4:
        {
          const others = JSON.parse(rec.others || '{}');
          const obj = await prisma.tag.findFirst({
            where: {
              name: rec.title,
            },
            select: { id: true, name: true },
          });
          if (!obj) {
            logger.error(rec);
          } else if (rec.refId !== obj.id) {
            logger.info(
              `fix: tag ${rec.title}, id ${rec['refId']} -> ${obj.id}`,
            );
            data.refId = obj.id;
          }
          const tags = await prisma.tag.findMany({
            where: {
              name: {
                in: Object.values(others).filter(x => typeof x === 'string'),
              },
            },
            select: { id: true, name: true },
          });
          if (tags.length) {
            const newOthers = {};
            tags.forEach(t => (newOthers[t.id] = t.name));
            data.others = JSON.stringify(newOthers);
            logger.info(
              `fix: tag ${rec.title}, others ${rec.others} -> ${data.others}`,
            );
          }
        }
        break;
      case 5:
        {
          const others = JSON.parse(rec.others || '{}');
          const art = await prisma.article.findFirst({
            where: { name: rec.title },
            select: { id: true, name: true },
          });
          if (!art) {
            logger.error(rec);
          } else if (rec.refId !== art.id) {
            logger.info(
              `fix: article ${rec.title}, id ${rec['refId']} -> ${art.id}`,
            );
            data.refId = art.id;
          }
          const articles = await prisma.article.findMany({
            where: {
              name: {
                in: Object.values(others).filter(x => typeof x === 'string'),
              },
            },
            select: { id: true, name: true },
          });
          if (articles.length) {
            const newOthers = {};
            articles.forEach(t => (newOthers[t.id] = t.name));
            data.others = JSON.stringify(newOthers);
            logger.info(
              `fix: article ${rec.title}, others ${rec.others} -> ${data.others}`,
            );
          }
        }
        break;
      default:
        break;
    }
    if (Object.keys(data).length) {
      await prisma['rec'].update({
        where: { id: rec.id },
        data,
      });
    }
  }
  logger.info('fix rec done!');
}

task().then(() => logger.info('task done!'));
