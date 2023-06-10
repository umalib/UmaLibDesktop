const { PrismaClient } = require('@prisma/client');
const {
  existsSync,
  renameSync,
  rmSync,
  mkdirSync,
  rmdirSync,
  readdirSync,
} = require('fs');
const { zip } = require('compressing');
const { join } = require('path');

let logger = null;
let prisma = null;
let embeddedDbPath = null;
let backupPath = null;
let dbPath = null;
let userDataPath = null;

const recTypeArr = [
  'creators',
  'creators',
  'novels',
  'novels',
  'series',
  'articles',
];

async function changeDb(path) {
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
  return { current: dbPath, isEmbedded: dbPath === embeddedDbPath };
}

async function getArts(findManyOptions, param) {
  if (param.sortBy && Object.keys(param.sortBy).length) {
    findManyOptions.orderBy.push(param.sortBy);
    findManyOptions.orderBy.push({
      id: Object.values(param.sortBy)[0],
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
      source: art.source.split(' ').map(src => {
        return { val: src };
      }),
      tags: art.taggedList.map(tagged => {
        return tagged.tagId;
      }),
    };
  });
}

/**
 * @param {number} artId
 * @param {string[]} tags
 */
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
  const taggedList = await prisma['tagged'].findMany({
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
  if (deleteData.length) {
    await prisma['tagged'].deleteMany({
      where: {
        id: {
          in: deleteData,
        },
      },
    });
  }
  for (const tagId in tagDict) {
    await prisma['tagged'].create({
      data: {
        artId,
        tagId: Number(tagId),
      },
    });
  }
}

function compatibleRmSync(path) {
  if (rmSync) {
    rmSync(path, { force: true });
  } else if (existsSync(path)) {
    const rmPath = join(userDataPath, 'toRm');
    mkdirSync(rmPath);
    renameSync(path, join(rmPath, 'trash.dat'));
    rmdirSync(rmPath, { recursive: true });
  }
}

module.exports = {
  changeDb,
  checkDb() {
    return { current: dbPath, isEmbedded: dbPath === embeddedDbPath };
  },
  /**
   * @returns {Promise<number>}
   */
  async checkR18() {
    const tag = await prisma.tag.findFirst({
      where: {
        name: 'R18',
      },
    });
    return tag ? tag.id : -1;
  },
  cleanBackupDb() {
    compatibleRmSync(backupPath);
  },
  config(_logger, _userPath, _dbPath) {
    logger = _logger;
    userDataPath = _userPath;
    embeddedDbPath = _dbPath;
    backupPath = embeddedDbPath + '.backup';
    dbPath = embeddedDbPath;
    logger.info('initialized');
  },
  /**
   * @returns {Promise<string[]>}
   */
  async copyright() {
    return JSON.parse(
      (
        await prisma.creator.findFirst({
          select: {
            names: true,
          },
        })
      ).names,
    );
  },
  async deleteArt(artId) {
    await prisma['tagged'].deleteMany({
      where: {
        artId,
      },
    });
    await prisma.article.delete({
      where: {
        id: artId,
      },
    });
  },
  async deleteTags(param) {
    await prisma['tagged'].deleteMany({
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
    art.source = art.source.split(' ').map(src => {
      return { val: src };
    });
    delete art.taggedList;
    return art;
  },
  /**
   * @param {number} artId
   * @returns {Promise<string>}
   */
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
  /**
   * @param {number} artId
   * @returns {Promise<string>}
   */
  async getArtName(artId) {
    return (
      await prisma.article.findUnique({
        where: { id: artId },
        select: { content: true },
      })
    ).name;
  },
  async getAuthors() {
    const articles = await prisma.article.findMany({
      select: {
        author: true,
        translator: true,
      },
      distinct: ['author', 'translator'],
    });
    const ret = {
      'co-authors': [],
      'co-translators': [],
      authors: [],
      translators: [],
      double: [],
    };
    const authorDict = {},
      transDict = {},
      doubleDict = {};
    articles.forEach(art => {
      if (art.author) {
        authorDict[art.author] = true;
      }
      if (art.translator) {
        transDict[art.translator] = true;
      }
    });
    for (const _author in authorDict) {
      if (transDict[_author]) {
        doubleDict[_author] = true;
      }
    }
    for (const _author in doubleDict) {
      delete authorDict[_author];
      delete transDict[_author];
    }
    Object.keys(authorDict).forEach(a =>
      (a.indexOf('/') === -1 ? ret.authors : ret['co-authors']).push(a),
    );
    Object.keys(transDict).forEach(t =>
      (t.indexOf('/') === -1 ? ret.translators : ret['co-translators']).push(t),
    );
    ret.double = Object.keys(doubleDict);

    Object.values(ret).forEach(arr => arr.sort());

    return ret;
  },
  async getDict() {
    return (await prisma.dict.findMany())
      .map(entry => {
        entry.desc = entry.desc.split('\n');
        return entry;
      })
      .reduce((group, entry) => {
        const _class = entry.class;
        delete entry.class;
        group[_class] = group[_class] || [];
        group[_class].push(entry);
        return group;
      }, {});
  },
  /**
   * @param {{name: string, author:string, translator: string}[]} favList
   * @returns {Promise<number[]>}
   */
  async getIdsByFav(favList) {
    return (
      await prisma.article.findMany({
        where: {
          OR: favList.map(fav => {
            return {
              name: fav.name,
              author: fav.author,
              translator: fav.translator,
            };
          }),
        },
      })
    ).map(art => art.id);
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
        tag.author = tag.taggedList[0]['artId'];
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
  /**
   * @returns {Promise<string>}
   */
  async getPassword() {
    const pwd = await prisma.creator.findUnique({
      where: {
        id: 2,
      },
      select: {
        names: true,
      },
    });
    return pwd ? pwd.names : '';
  },
  /**
   * @returns {string}
   */
  getPath() {
    return dbPath;
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

    const artList = await prisma.article.findMany({
      where: {
        taggedList: {
          none: {
            tagId: {
              in: param.noTagIds,
            },
          },
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
            .sort(() => Math.random() - 0.5);
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
      art.source = art.source.split(' ').map(src => {
        return { val: src };
      });
      delete art.taggedList;
      art.uploadTime *= 1000;
      return art;
    } else {
      return {};
    }
  },
  async getRecData() {
    const recData = await prisma['rec'].findMany();
    let ret = recData.reduce((group, entry) => {
      const type = recTypeArr[entry.type];
      group[type] = group[type] || [];
      group[type].push(entry);
      return group;
    }, {});
    Object.keys(ret).forEach(k => {
      ret[k] = ret[k].reduce((group, entry) => {
        const refId = entry['refId'];
        group[refId] = group[refId] || [];
        group[refId].push(entry);
        return group;
      }, {});
      Object.values(ret[k]).forEach(recs => {
        recs.sort((a, b) => {
          if (a.reason.length === b.reason.length) {
            return a.name > b.name ? 1 : -1;
          }
          return a.reason.length - b.reason.length;
        });
        recs.forEach(e => (e.reason = e.reason.split('\n')));
      });
      ret[k] = Object.values(ret[k]).map(rec => {
        rec[0].others = JSON.parse(rec[0].others || '{}');
        return rec;
      });
    });
    ret.creators.sort((aRecs, bRecs) => {
      const a = aRecs[0],
        b = bRecs[0];
      if (a.r === b.r) {
        if (aRecs.length === bRecs.length) {
          if (a.type === b.type) {
            return a.title > b.title ? 1 : -1;
          }
          return a.type - b.type;
        }
        return bRecs.length - aRecs.length;
      }
      return a.r - b.r;
    });
    ret.novels.sort((aRecs, bRecs) => {
      const a = aRecs[0],
        b = bRecs[0];
      if (a.r === b.r) {
        if (aRecs.length === bRecs.length) {
          if (a.type === b.type) {
            return a.title > b.title ? 1 : -1;
          }
          return b.type - a.type;
        }
        return bRecs.length - aRecs.length;
      }
      return a.r - b.r;
    });
    function tagArtComparator(aRecs, bRecs) {
      const a = aRecs[0],
        b = bRecs[0];
      if (a.r === b.r) {
        if (aRecs.length === bRecs.length) {
          const lenA = Object.keys(a.others).length,
            lenB = Object.keys(b.others).length;
          if (lenA === lenB) {
            return a.id - b.id;
          }
          return lenB - lenA;
        }
        return bRecs.length - aRecs.length;
      }
      return a.r - b.r;
    }
    ret.series.sort(tagArtComparator);
    ret.articles.sort(tagArtComparator);
    return ret;
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
  async listAllFav(favList) {
    const articles = await prisma.article.findMany({
      where: {
        id: {
          in: favList,
        },
      },
      include: {
        taggedList: true,
      },
    });
    const tagMap = {};
    articles.forEach(art =>
      art.taggedList.forEach(tagged => (tagMap[tagged.tagId] = true)),
    );
    (
      await prisma.tag.findMany({
        where: {
          id: {
            in: Object.keys(tagMap).map(id => Number(id)),
          },
        },
      })
    ).forEach(tag => (tagMap[tag.id] = tag.name));
    articles.sort((a, b) => favList.indexOf(a.id) - favList.indexOf(b.id));
    return articles.map(art => {
      return {
        name: art.name,
        author: art.author,
        translator: art.translator,
        tags: art.taggedList.map(tagged => tagMap[tagged.tagId]),
      };
    });
  },
  async listArt(param) {
    const findManyOptions = {
      where: { AND: [] },
      orderBy: [],
    };
    if (param.tagIds) {
      param.tagIds.forEach(tagId =>
        findManyOptions.where.AND.push({
          taggedList: { some: { tagId } },
        }),
      );
    }
    if (param.noTagIds && param.noTagIds.length) {
      findManyOptions.where.AND.push({
        taggedList: {
          none: {
            tagId: {
              in: param.noTagIds,
            },
          },
        },
      });
    }
    if (param.keyword) {
      const keys = param.keyword.split(/\s/).filter(c => c.length > 0);
      findManyOptions.where.AND.push({
        OR: [
          {
            AND: keys.map(c => {
              return {
                name: {
                  contains: c,
                },
              };
            }),
          },
          {
            AND: keys.map(c => {
              return {
                note: {
                  contains: c,
                },
              };
            }),
          },
          {
            OR: keys.map(c => {
              return {
                source: {
                  contains: c,
                },
              };
            }),
          },
        ],
      });
    }
    if (param.someone) {
      if (param.someone.indexOf('/') === -1) {
        findManyOptions.where.AND.push({
          OR: [
            { author: param.someone },
            { author: { contains: `/${param.someone}` } },
            { author: { contains: `${param.someone}/` } },
            { translator: param.someone },
            { translator: { contains: `/${param.someone}` } },
            { translator: { contains: `${param.someone}/` } },
          ],
        });
      } else {
        findManyOptions.where.AND.push({
          OR: [{ author: param.someone }, { translator: param.someone }],
        });
      }
    }
    return {
      count: await prisma.article.count(findManyOptions),
      list: await getArts(findManyOptions, param),
    };
  },
  async listFavorites(param) {
    if (param.noTagIds.length) {
      const noArtList = (
        await prisma['tagged'].findMany({
          where: {
            tagId: {
              in: param.noTagIds,
            },
          },
        })
      ).map(tagged => tagged['artId']);
      param.ids = param.ids.filter(x => noArtList.indexOf(x) === -1);
    }
    const count = param.ids.length;
    if (!param.sortBy || !Object.keys(param.sortBy).length) {
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
      const taggedList = await prisma['tagged'].findMany({ where: { tagId } });
      for (const i in taggedList) {
        const tagged = taggedList[i];
        const data = {
          artId: tagged['artId'],
          tagId: finalTagId,
        };
        const count = await prisma['tagged'].count({ where: data });
        if (!count || count === 0) {
          await prisma['tagged'].create({ data });
        }
      }
      await prisma['tagged'].deleteMany({ where: { tagId } });
      await prisma.tag.delete({ where: { id: tagId } });
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
  async pubArticle(data) {
    let id = data.id;
    delete data.id;
    if (!data.author) {
      data.author = '匿名';
    }
    data.uploadTime = data.uploadTime ? data.uploadTime : new Date().getTime();
    data.uploadTime = Math.round(data.uploadTime / 1000);
    data.source.forEach(src => {
      if (src.val.startsWith('[')) {
        src.val = src.val.substring(1);
      }
      if (src.val.endsWith(']')) {
        src.val = src.val.substring(0, src.val.length - 1);
      }
      if (
        src.val.startsWith('tsumanne.net') ||
        src.val.startsWith('www.pixiv.net')
      ) {
        src.val = 'https://' + src.val;
      }
      if (src.val.startsWith('pixiv.net')) {
        src.val = 'https://www.' + src.val;
      }
    });
    data.source = data.source
      .map(src => src.val)
      .filter(src => src)
      .join(' ');
    if (!data.note || !data.note.replace(/\s+/, '')) {
      data.note = data.content
        .replace(/<p>\s*——+\s*<\/p>/g, '')
        .replace(/<\/p>/g, ' ')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ');
      if (data.note.length > 100) {
        data.note =
          data.note
            .substring(0, 98)
            .replace(
              /[,\\."':;!?{}+\-*/()<>，。“”‘’：；！？、【】「」—（）… ]+$/,
              '',
            ) + '……';
      }
    }
    const tags = data.tags;
    delete data.tags;
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
    return true;
  },
  async resetDb() {
    await changeDb(embeddedDbPath);
  },
  async rollbackDb() {
    if (existsSync(backupPath)) {
      await this.disconnect();
      renameSync(backupPath, embeddedDbPath);
      await changeDb(embeddedDbPath);
    }
  },
  async saveOnlineDb(dbData) {
    await this.disconnect();
    renameSync(embeddedDbPath, backupPath);
    let newDbPath = undefined;
    let dbVersion = undefined;
    await zip.uncompress(
      dbData.buffer ? Buffer.from(dbData.buffer) : dbData,
      userDataPath,
    );
    if (dbData.buffer) {
      newDbPath = join(userDataPath, `${dbData.version}.db`);
    } else {
      dbVersion = readdirSync(userDataPath).filter(
        x => x.startsWith('20') && x.endsWith('.db'),
      )[0];
      newDbPath = join(userDataPath, dbVersion);
    }
    logger.debug(
      `unzip ${newDbPath} success? ${existsSync(
        newDbPath,
      )}. move it to ${embeddedDbPath}`,
    );
    renameSync(newDbPath, embeddedDbPath);
    const result = await changeDb(embeddedDbPath);
    if (dbVersion) {
      result.dbVersion = Number(dbVersion.substring(0, dbVersion.length - 3));
    }
    return result;
  },
  async setTags(param) {
    await prisma.tag.updateMany({
      data: { type: param.type },
      where: { id: { in: param.tagIds } },
    });
  },
};
