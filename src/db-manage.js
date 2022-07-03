const { PrismaClient } = require('@prisma/client');
const { join, resolve } = require('path');
const log4js = require('log4js');
const logger = log4js.getLogger();

const isDevelopment = process.env.NODE_ENV !== 'production';

let prisma = null;
logger.level = isDevelopment ? 'debug' : 'info';
const embeddedDbPath = isDevelopment
  ? join(resolve('./prisma/main.db'))
  : join(process.resourcesPath, './prisma/main.db');
let dbPath = embeddedDbPath;

async function changeDb(path) {
  logger.info('change db to ' + path);
  if (prisma) {
    await prisma.$disconnect();
  }
  dbPath = path;
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${path}`,
      },
    },
  });
  return dbPath === embeddedDbPath ? '' : dbPath;
}

async function getArts(findManyOptions, param) {
  if (param.sortBy && Object.keys(param.sortBy).length !== 0) {
    findManyOptions.orderBy.push(param.sortBy);
    findManyOptions.orderBy.push({
      id: param.sortBy[Object.keys(param.sortBy)[0]],
    });
  } else {
    findManyOptions.orderBy.push({ id: 'asc' });
  }
  if (param.offset) {
    findManyOptions.skip = (param.page - 1) * param.offset;
    findManyOptions.take = param.offset;
  } else {
    findManyOptions.skip = 0;
    findManyOptions.take = 10;
  }
  findManyOptions.include = { taggedList: true };
  logger.debug(JSON.stringify(findManyOptions));
  return (await prisma.article.findMany(findManyOptions)).map(art => {
    return {
      id: art.id,
      name: art.name,
      author: art.author,
      translator: art.translator,
      uploadTime: art.uploadTime * 1000,
      note: art.note,
      content: '',
      source: art.source,
      tags: art.taggedList.map(tagged => {
        return tagged.tagId;
      }),
    };
  });
}

async function updateTags(artId, tags) {
  const tagDict = {};
  for (const i in tags) {
    let tag = await prisma.tag.findFirst({
      where: {
        name: tags[i],
      },
    });
    if (!tag) {
      tag = await prisma.tag.create({
        data: {
          name: tags[i],
          type: 0,
        },
        select: {
          id: true,
        },
      });
    }
    tagDict[tag.id] = 1;
  }
  const taggedList = await prisma.tagged.findMany({
    where: {
      artId,
    },
  });
  const deleteData = [];
  for (const i in taggedList) {
    const tagged = taggedList[i];
    if (tagDict[tagged.tagId]) {
      delete tagDict[tagged.tagId];
    } else {
      deleteData.push(tagged.id);
    }
  }
  await prisma.tagged.deleteMany({
    where: {
      id: {
        in: deleteData,
      },
    },
  });
  for (const tagId in tagDict) {
    await prisma.tagged.create({
      data: {
        artId,
        tagId: Number(tagId),
      },
    });
  }
}

module.exports = {
  changeDb,
  checkDb() {
    return dbPath === embeddedDbPath;
  },
  async checkR18() {
    const tag = await prisma.tag.findFirst({
      where: {
        name: 'R18',
      },
    });
    return tag ? tag.id : -1;
  },
  async copyright() {
    return JSON.parse(
      (
        await prisma.creator.findUnique({
          where: {
            id: 1,
          },
          select: {
            names: true,
          },
        })
      ).names,
    );
  },
  async deleteArt(artId) {
    await prisma.tagged.deleteMany({
      where: {
        artId,
      },
    });
    await prisma.article.deleteMany({
      where: {
        id: artId,
      },
    });
  },
  async deleteTags(param) {
    await prisma.tagged.deleteMany({
      where: {
        tagId: {
          in: param.tagIds,
        },
      },
    });
    await prisma.tag.deleteMany({
      where: {
        id: {
          in: param.tagIds,
        },
      },
    });
  },
  async getAuthors() {
    const articles = await prisma.article.findMany({
      select: {
        author: true,
        translator: true,
      },
      distinct: ['author', 'translator'],
    });
    const ret = { authors: {}, translators: {}, double: {} };
    articles.forEach(art => {
      if (art.author) {
        ret.authors[art.author] = 1;
      }
      if (art.translator) {
        ret.translators[art.translator] = 1;
      }
    });
    for (const _author in ret.authors) {
      if (ret.translators[_author]) {
        ret.double[_author] = 1;
      }
    }
    for (const _author in ret.double) {
      delete ret.authors[_author];
      delete ret.translators[_author];
    }
    ret.authors = Object.keys(ret.authors);
    ret.translators = Object.keys(ret.translators);
    ret.double = Object.keys(ret.double);
    ret.authors.sort();
    ret.translators.sort();
    ret.double.sort();
    return ret;
  },
  async disconnect() {
    await prisma.$disconnect();
  },
  async getArt(artId) {
    const art = await prisma.article.findUnique({
      where: { id: artId },
      include: {
        taggedList: true,
      },
    });
    art.uploadTime *= 1000;
    art.tags = art.taggedList.map(tagged => {
      return tagged.tagId;
    });
    delete art.taggedList;
    return art;
  },
  async getArtContent(artId) {
    return (
      await prisma.article.findUnique({
        where: { id: artId },
        select: {
          content: true,
        },
      })
    ).content;
  },
  async getRandomArt(param) {
    function fillArt(art) {
      return {
        id: art.id,
        name: art.name,
        author: art.author,
        translator: art.translator,
        uploadTime: art.uploadTime * 1000,
        tags: art.taggedList.map(tagged => {
          return tagged.tagId;
        }),
      };
    }

    let condition = [];
    if (param.noTagIds.length) {
      condition = (
        await prisma.tagged.findMany({
          where: {
            tagId: {
              in: param.noTagIds,
            },
          },
        })
      ).map(tagged => tagged.artId);
    }
    const artList = await prisma.article.findMany({
      where: {
        NOT: {
          id: { in: condition },
        },
      },
      select: {
        id: true,
      },
    });
    if (param.count) {
      if (artList.length) {
        let retList = [];
        if (artList.length < param.count) {
          return (
            await prisma.article.findMany({ include: { taggedList: true } })
          )
            .map(fillArt)
            .sort(() => {
              return Math.random() - 0.5;
            });
        } else {
          const tmpMap = {};
          while (Object.keys(tmpMap).length < param.count) {
            const artId =
              artList[Math.floor(Math.random() * artList.length)].id;
            tmpMap[artId] = true;
            retList.push(artId);
          }
          retList = retList.filter((v, i, s) => {
            return s.indexOf(v) === i;
          });
          logger.debug(retList);
          for (let i = 0; i < retList.length; ++i) {
            tmpMap[retList[i]] = i;
          }
          (
            await prisma.article.findMany({
              where: {
                id: {
                  in: retList,
                },
              },
              include: { taggedList: true },
            })
          )
            .map(fillArt)
            .forEach(art => {
              retList[tmpMap[art.id]] = art;
            });
          return retList;
        }
      } else {
        return [];
      }
    } else if (artList.length) {
      const art = await prisma.article.findUnique({
        where: artList[Math.floor(Math.random() * artList.length)],
        include: { taggedList: true },
      });
      art.tags = art.taggedList.map(tagged => {
        return tagged.tagId;
      });
      delete art.taggedList;
      art.uploadTime *= 1000;
      return art;
    } else {
      return {};
    }
  },
  async getTags() {
    const tags = await prisma.tag.findMany({
      orderBy: [
        {
          name: 'asc',
        },
        { id: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        type: true,
      },
    });
    const ret = {
      tags: {},
      typeMap: {},
    };
    tags.forEach(tag => {
      ret.tags[tag.id] = { name: tag.name, type: tag.type };
      if (!ret.typeMap[tag.type]) {
        ret.typeMap[tag.type] = [];
      }
      ret.typeMap[tag.type].push(tag.id);
    });
    return ret;
  },
  async getLongNovelTags() {
    const tags = await prisma.tag.findMany({
      orderBy: [
        {
          name: 'asc',
        },
        { id: 'asc' },
      ],
      include: {
        taggedList: true,
      },
    });
    const ret = {
      tags: {},
      novels: [],
    };
    const artIds = [];
    tags.forEach(tag => {
      if (tag.type === 3 && tag.taggedList.length) {
        tag.author = tag.taggedList[0].artId;
        artIds.push(tag.author);
        ret.novels.push(tag.id);
      }
      delete tag.taggedList;
      ret.tags[tag.id] = tag;
    });
    const artMap = {};
    (
      await prisma.article.findMany({
        where: {
          id: {
            in: artIds,
          },
        },
        select: {
          id: true,
          author: true,
        },
      })
    ).forEach(art => {
      artMap[art.id] = art.author;
    });
    tags.forEach(tag => {
      if (tag.author) {
        tag.author = artMap[tag.author];
      }
    });
    return ret;
  },
  async listArt(param) {
    const findManyOptions = {
      where: { AND: [] },
      orderBy: [],
    };
    if (param.tagIds && param.tagIds.length !== 0) {
      const artDict = {};
      const artIds = [];
      const requiredTagLength = param.tagIds.length;
      param.noTagIds.forEach(tagId => {
        param.tagIds.push(tagId);
      });
      const taggedList = await prisma.tagged.findMany({
        where: { tagId: { in: param.tagIds } },
      });
      taggedList.forEach(tagged => {
        if (param.noTagIds.indexOf(tagged.tagId) !== -1) {
          artDict[tagged.artId] = false;
          return;
        }
        if (artDict[tagged.artId]) {
          artDict[tagged.artId]++;
        } else if (artDict[tagged.artId] === undefined) {
          artDict[tagged.artId] = 1;
        }
      });
      for (const id in artDict) {
        if (artDict[id] && artDict[id] === requiredTagLength) {
          artIds.push(Number(id));
        }
      }
      findManyOptions.where.AND.push({ id: { in: artIds } });
    } else if (param.noTagIds && param.noTagIds.length !== 0) {
      const taggedList = await prisma.tagged.findMany({
        where: {
          tagId: {
            in: param.noTagIds,
          },
        },
      });
      if (taggedList.length) {
        findManyOptions.where.AND.push({
          NOT: {
            id: {
              in: taggedList.map(tagged => tagged.artId),
            },
          },
        });
      }
    }
    if (param.keyword) {
      findManyOptions.where.AND.push({
        OR: [
          {
            name: {
              contains: param.keyword,
            },
          },
          {
            note: {
              contains: param.keyword,
            },
          },
          {
            source: {
              contains: param.keyword,
            },
          },
        ],
      });
    }
    if (param.someone) {
      findManyOptions.where.AND.push({
        OR: [{ author: param.someone }, { translator: param.someone }],
      });
    }
    return {
      count: await prisma.article.count(findManyOptions),
      list: await getArts(findManyOptions, param),
    };
  },
  async listFavorites(param) {
    if (param.noTagIds.length) {
      const noArtList = (
        await prisma.tagged.findMany({
          where: {
            tagId: {
              in: param.noTagIds,
            },
          },
        })
      ).map(x => x.artId);
      param.ids = param.ids.filter(x => noArtList.indexOf(x) === -1);
    }
    const count = param.ids.length;
    if (!param.sortBy || Object.keys(param.sortBy).length === 0) {
      if (param.page) {
        param.ids.splice(param.page * param.offset);
        if (param.page > 1) {
          param.ids.splice(0, (param.page - 1) * param.offset);
        }
      } else {
        param.ids.splice(10);
      }
      param.page = 1;
    }
    return {
      count,
      list: await getArts(
        {
          where: {
            id: {
              in: param.ids,
            },
          },
          orderBy: [],
        },
        param,
      ),
    };
  },
  async mergeAuthors(param) {
    if (!param.finalAuthor) {
      param.finalAuthor = param.toMergedAuthors[0];
    }
    for (const i in param.toMergedAuthors) {
      const author = param.toMergedAuthors[i];
      await prisma.article.updateMany({
        data: { author: param.finalAuthor },
        where: { author },
      });
      await prisma.article.updateMany({
        data: { translator: param.finalAuthor },
        where: { translator: author },
      });
    }
  },
  async mergeTags(param) {
    param.toMergedTags.sort();
    const finalTagId = param.toMergedTags[0];
    for (let i = 1; i < param.toMergedTags.length; ++i) {
      const tagId = param.toMergedTags[i];
      const taggedList = await prisma.tagged.findMany({ where: { tagId } });
      for (const i in taggedList) {
        const tagged = taggedList[i];
        const data = {
          artId: tagged.artId,
          tagId: finalTagId,
        };
        const count = await prisma.tagged.count({ where: data });
        if (!count || count === 0) {
          await prisma.tagged.create({ data });
        }
      }
      await prisma.tagged.deleteMany({ where: { tagId } });
      await prisma.tag.deleteMany({ where: { id: tagId } });
    }
    if (param['tagLabel']) {
      await prisma.tag.update({
        data: {
          name: param['tagLabel'],
        },
        where: {
          id: finalTagId,
        },
      });
    }
  },
  async getPassword() {
    const pwd = await prisma.creator.findUnique({
      where: {
        id: 2,
      },
    });
    return pwd ? pwd.names : '';
  },
  getPath() {
    return dbPath;
  },
  async pubArticle(data) {
    let id = data.id;
    delete data.id;
    const tags = data.tags;
    delete data.tags;
    if (!data.note || !data.note.replace(/\s+/, '')) {
      data.note = data.content
        .replace(/<\/p>/g, ' ')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ');
      if (data.note.length > 100) {
        data.note = data.note.substring(0, 100);
      }
    }
    data.uploadTime = Math.floor(data.uploadTime / 1000);
    if (id) {
      await prisma.article.update({
        data,
        where: {
          id,
        },
      });
    } else {
      id = (await prisma.article.create({ data })).id;
    }
    await updateTags(id, tags);
  },
  async resetDb() {
    await changeDb(embeddedDbPath);
  },
  async setTags(param) {
    await prisma.tag.updateMany({
      data: { type: param.type },
      where: { id: { in: param.tagIds } },
    });
  },
};
