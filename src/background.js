'use strict';

let { app } = require('electron');
const {
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  protocol,
  remote,
  session,
  shell,
} = require('electron');
const { createProtocol } = require('vue-cli-plugin-electron-builder/lib');
const {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
} = require('fs');
const MD5 = new (require('jshashes').MD5)();
const log4js = require('log4js');
const { homedir } = require('os');
const { resolve, join } = require('path');

const dbManage = require('@/db-manage');
const { titles, themes } = require('@/main-config');

const isDevelopment = process.env.NODE_ENV !== 'production';

if (!app) {
  app = remote.app;
}

log4js.configure({
  appenders: {
    console: { type: 'console' },
    file: {
      filename: join(app.getPath('userData'), './logs/main.log'),
      keepFileExt: true,
      pattern: 'yyMMdd',
      type: 'dateFile',
    },
  },
  categories: {
    default: { appenders: ['console', 'file'], level: 'info' },
  },
});
const logger = log4js.getLogger('background');
const dbLogger = log4js.getLogger('db-manage');
const appLogger = log4js.getLogger('app');
const userDbPath = join(app.getPath('userData'), './main.db');
if (isDevelopment) {
  logger.level = 'debug';
  dbLogger.level = 'debug';
}

if (!existsSync(userDbPath)) {
  copyFileSync(
    isDevelopment
      ? join(resolve('./prisma/main.db'))
      : join(process.resourcesPath, './prisma/main.db'),
    userDbPath,
  );
  logger.info(`copy default database to user data folder: ${userDbPath}`);
}
dbManage.config(dbLogger, app.getPath('userData'), userDbPath);

const configStore = new (require('electron-store'))();
logger.debug(`use config path: ${configStore.path}`);

function chooseTitles() {
  let rand = Math.random();
  rand -= 0.04;
  if (rand < 0) {
    return titles.mejiro;
  }
  rand -= 0.04;
  if (rand < 0) {
    return titles.agnes;
  }
  rand -= 0.04;
  if (rand < 0) {
    return titles.satono;
  }
  rand -= 0.04;
  if (rand < 0) {
    return titles.traincen;
  }
  rand -= 0.04;
  if (rand < 0) {
    return titles.oguri;
  }
  rand -= 0.01;
  if (rand < 0) {
    return titles.cemetery;
  }
  return titles.origin;
}

const storeEvents = {
  pathConf: MD5.hex(dbManage.getPath()),
  getOrCreateConfig() {
    const defaultConf = {
      favorites: [],
      password: '',
    };
    let ret = configStore.get(this.pathConf);
    if (!ret) {
      ret = configStore.get(dbManage.getPath());
      if (!ret) {
        configStore.set(this.pathConf, defaultConf);
        return defaultConf;
      }
      configStore.set(this.pathConf, ret);
    }
    return ret;
  },
  resetConfig() {
    this.pathConf = MD5.hex(dbManage.getPath());
    this.saveMeFlag = -2;
  },

  checkVersion() {
    return {
      app: app.getVersion(),
      db: configStore.get('db-version'),
      dbUpdate: this.getCheckDbUpdate(),
    };
  },
  setDbVersion(version) {
    configStore.set('db-version', version);
    this.resetConfig();
    dbManage.cleanBackupDb();
  },

  getCheckDbUpdate() {
    return configStore.get('db-update');
  },
  setCheckDbUpdate(dbUpdate) {
    configStore.set('db-update', dbUpdate);
    return dbUpdate;
  },

  getDefaultFullScreen() {
    return configStore.get('full-screen');
  },
  setDefaultFullScreen(isFullScreen) {
    configStore.set('full-screen', isFullScreen);
    return isFullScreen;
  },

  backgroundColor: undefined,
  getBackgroundColor() {
    if (!this.backgroundColor) {
      this.backgroundColor = configStore.get('background-color');
    }
    return this.backgroundColor;
  },
  setBackgroundColor(color) {
    this.backgroundColor = color;
    configStore.set('background-color', this.backgroundColor);
    return color;
  },

  saveMeFlag: -2,
  password: '',
  getPwd() {
    return this.password;
  },
  isSafe(isSet) {
    this.saveMeFlag = -3;
    if (isSet) {
      const config = this.getOrCreateConfig();
      config.password = MD5.hex(this.password);
      configStore.set(this.pathConf, config);
    }
  },
  async saveMe() {
    if (this.saveMeFlag === -2) {
      this.password = await dbManage.getPassword();
      if (this.password) {
        this.password = MD5.hex(this.password);
        this.password = this.password.substring(this.password.length - 8);
      }
      if (
        !this.password ||
        MD5.hex(this.password) === this.getOrCreateConfig().password
      ) {
        this.saveMeFlag = -1;
      } else {
        this.saveMeFlag = await dbManage.checkR18();
      }
      logger.debug(`R18 id=${this.saveMeFlag}, pwd=${this.password}`);
    }
    return this.saveMeFlag;
  },

  addFavorite(id) {
    const list = this.getFavorites();
    list.push(id);
    this.setFavorites(list);
    return list;
  },
  removeFavorite(id) {
    const list = this.getFavorites().filter(x => x !== id);
    this.setFavorites(list);
    return list;
  },
  getFavorites() {
    return this.getOrCreateConfig().favorites;
  },
  setFavorites(favorites) {
    const ret = configStore.get(this.pathConf);
    ret.favorites = favorites.filter((v, i, l) => l.indexOf(v) === i);
    configStore.set(this.pathConf, ret);
  },
  async importFavorites() {
    const paths = dialog['showOpenDialogSync']({
      filters: [{ name: 'json', extensions: ['json'] }],
      multiSelections: false,
      openDirectory: false,
    });
    if (paths && paths.length) {
      try {
        const favList = this.getFavorites().concat(
          await dbManage.getIdsByFav(
            JSON.parse(readFileSync(paths[0], 'utf-8')),
          ),
        );
        this.setFavorites(favList);
        return this.getFavorites();
      } catch (ignored) {
        return true;
      }
    }
  },
  async exportFavorites() {
    const path = dialog['showSaveDialogSync']({
      title: '导出收藏夹配置到……',
      defaultPath: `./${this.pathConf}.json`,
    });
    if (path) {
      writeFileSync(
        path,
        JSON.stringify(await dbManage.listAllFav(this.getFavorites())),
      );
    }
    return path;
  },

  titles: chooseTitles(),
  getTitles() {
    return this.titles;
  },

  log(args) {
    appLogger[args.level](args.info);
  },

  keyword: '',
};

if (storeEvents.getCheckDbUpdate() === undefined) {
  logger.info('write default check-db-update into config');
  storeEvents.setCheckDbUpdate(true);
}

if (storeEvents.getDefaultFullScreen() === undefined) {
  logger.info('write default full-screen into config');
  storeEvents.setDefaultFullScreen(true);
}

if (!storeEvents.getBackgroundColor()) {
  logger.info('write default background-color into config');
  storeEvents.setBackgroundColor(themes[0].color);
}

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

async function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 720,
    minHeight: 480,
    show: false,
    title: '赛马娘同人集中楼大书库',
    webPreferences: {
      contextIsolation: false,
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
    },
  });

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      callback({ requestHeaders: { Origin: '*', ...details.requestHeaders } });
    },
  );

  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      const headerKey = 'Access-Control-Allow-Origin';
      if (
        !details.responseHeaders[headerKey] &&
        !details.responseHeaders[headerKey.toLowerCase()]
      ) {
        details.responseHeaders[headerKey.toLowerCase()] = ['*'];
      }
      callback(details);
    },
  );

  function setRendererBackgroundColor(color) {
    color && storeEvents.setBackgroundColor(color);
    mainWindow.webContents.send('colorEvent', storeEvents.getBackgroundColor());
  }

  logger.info('clean old listeners');
  ipcMain.removeAllListeners();

  ipcMain.on('artChannel', async (_, msg) => {
    let result = undefined;
    const start = new Date().getTime();
    try {
      if (dbManage[msg.action]) {
        logger.debug(`dbManage.${msg.action}(${JSON.stringify(msg.args)})`);
        result = await dbManage[msg.action](msg.args);
        if (msg.action === 'changeDb') {
          logger.info(`change db to ${msg.args}`);
          storeEvents.resetConfig();
        }
      } else {
        result = await storeEvents[msg.action](msg.args);
        logger.debug(`storeEvents.${msg.action}: ${JSON.stringify(result)}`);
      }
    } catch (e) {
      logger.error(e.toString());
    }
    logger.info(
      `${dbManage[msg.action] ? 'dbManage' : 'storeEvents'}.${
        msg.action
      }: ${new Date().getTime() - start} ms`,
    );
    mainWindow.webContents.send('artChannel', {
      id: msg.id,
      data: result,
    });
  });

  ipcMain.on('colorEvent', () => setRendererBackgroundColor());

  ipcMain.on('findInPage', (_, keyword) => {
    if (keyword) {
      mainWindow.webContents.findInPage(keyword, {
        findNext: keyword !== storeEvents.keyword,
      });
    } else {
      mainWindow.webContents.stopFindInPage('clearSelection');
    }
  });

  logger.info('register new listeners');

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) {
      mainWindow.webContents.openDevTools();
    }
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    await mainWindow.loadURL('app://./index.html');
  }

  const template = [];
  if (process.platform === 'darwin') {
    template.push({
      role: 'appMenu',
    });
  }
  template.push({
    label: '功能',
    submenu: [
      {
        label: storeEvents.titles.list,
        sublabel: '文章列表',
        toolTip: '文章列表',
        accelerator: 'CmdOrCtrl+1',
        click() {
          mainWindow.webContents.send('menuEvent', '/list');
        },
      },
      {
        label: storeEvents.titles.menu,
        sublabel: '长篇/合集目录',
        toolTip: '长篇/合集目录',
        accelerator: 'CmdOrCtrl+2',
        click() {
          mainWindow.webContents.send('menuEvent', '/menu/m');
        },
      },
      {
        label: storeEvents.titles.favorite,
        sublabel: '收藏夹',
        toolTip: '收藏夹',
        accelerator: 'CmdOrCtrl+3',
        click() {
          mainWindow.webContents.send('menuEvent', '/favorites');
        },
      },
      {
        label: storeEvents.titles.history,
        sublabel: '阅读历史',
        toolTip: '阅读历史',
        accelerator: 'CmdOrCtrl+4',
        click() {
          mainWindow.webContents.send('menuEvent', '/history');
        },
      },
      {
        label: storeEvents.titles.manage,
        sublabel: '管理',
        toolTip: '管理',
        accelerator: 'CmdOrCtrl+5',
        click() {
          mainWindow.webContents.send('menuEvent', '/manage');
        },
      },
      {
        label: storeEvents.titles.copyright,
        sublabel: '鸣谢',
        toolTip: '鸣谢',
        accelerator: 'CmdOrCtrl+6',
        click() {
          mainWindow.webContents.send('menuEvent', '/copyright');
        },
      },
      { type: 'separator' },
      {
        label: '选择数据库',
        async click() {
          const paths = dialog['showOpenDialogSync']({
            filters: [{ name: 'db', extensions: ['db'] }],
            multiSelections: false,
            openDirectory: false,
          });
          if (paths && paths.length) {
            logger.info(`dbManage.changeDb("${paths[0]}")`);
            const result = await dbManage.changeDb(paths[0]);
            storeEvents.resetConfig();
            mainWindow.webContents.send('refreshPage', result);
          }
        },
      },
      {
        label: '切换到内置数据库',
        async click() {
          logger.info('dbManage.resetDb()');
          await dbManage.resetDb();
          storeEvents.resetConfig();
          mainWindow.webContents.send('refreshPage', {
            current: userDbPath,
            isEmbedded: true,
          });
        },
      },
      {
        label: '重载数据库',
        sublabel: '从云端拉取内置数据库',
        toolTip: '从云端拉取内置数据库',
        click() {
          mainWindow.webContents.send('getOnlineDb', '');
        },
      },
      {
        label: '安装本地数据库',
        sublabel: '从本地安装内置数据库',
        toolTip: '从本地安装内置数据库',
        async click() {
          const paths = dialog['showOpenDialogSync']({
            filters: [{ name: 'zip', extensions: ['zip'] }],
            multiSelections: false,
            openDirectory: false,
          });
          if (paths && paths.length) {
            try {
              logger.info(`dbManage.changeDb("${paths[0]}")`);
              const result = await dbManage.saveOnlineDb(paths[0]);
              await dbManage.checkR18();
              storeEvents.setDbVersion(result.dbVersion);
              mainWindow.webContents.send('refreshPage', result);
            } catch (_) {
              logger.error('zip is corrupted!');
              await dbManage.rollbackDb();
              mainWindow.webContents.send('refreshPage', {
                current: userDbPath,
                isEmbedded: true,
              });
            }
          }
        },
      },
      {
        label: '启动时检查数据库',
        sublabel: '启动时是否检查数据库更新',
        toolTip: '启动时是否检查数据库更新',
        type: 'checkbox',
        checked: storeEvents.getCheckDbUpdate(),
        click(event) {
          storeEvents.setCheckDbUpdate(event.checked);
        },
      },
      { type: 'separator' },
      { label: '退出', role: 'quit' },
    ],
  });
  template.push({
    label: '编辑',
    submenu: [
      {
        label: '撤销',
        role: 'undo',
      },
      {
        label: '重复',
        role: 'redo',
      },
      { type: 'separator' },
      { label: '剪切', role: 'cut' },
      { label: '复制', role: 'copy' },
      { label: '粘贴', role: 'paste' },
      { label: '符合格式粘贴', role: 'pasteAndMatchStyle' },
      { label: '全选', role: 'selectAll' },
      {
        label: '查找',
        accelerator: 'CmdOrCtrl+F',
        click() {
          mainWindow.webContents.send('findInPage', '');
        },
      },
    ],
  });
  template.push({
    label: '界面',
    submenu: [
      {
        label: '主题',
        submenu: themes.map(c => {
          return {
            label: c.label,
            type: 'radio',
            checked: c.color === storeEvents.getBackgroundColor(),
            click() {
              setRendererBackgroundColor(c.color);
            },
          };
        }),
      },
      { label: '刷新', role: 'reload' },
      { type: 'separator' },
      { label: '全屏', role: 'togglefullscreen' },
      { label: '最小化', role: 'minimize' },
      { label: '重置', role: 'resetzoom' },
      {
        label: '启动时最大化',
        sublabel: '是/否',
        toolTip: '是/否',
        type: 'checkbox',
        checked: storeEvents.getDefaultFullScreen(),
        click(event) {
          storeEvents.setDefaultFullScreen(event.checked);
        },
      },
    ],
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  setRendererBackgroundColor();

  if (storeEvents.getDefaultFullScreen()) {
    logger.info('set full screen');
    mainWindow.maximize();
  }
  mainWindow.show();
}

// Quit when all windows are closed.
app.on('window-all-closed', async () => {
  // On macOS, it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    await dbManage.disconnect();
    app.quit();
  }
});

app.on('activate', async () => {
  // On macOS, it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (!BrowserWindow.getAllWindows().length) {
    await createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      const vueDevToolsPath = join(
        homedir(),
        '/Library/Application Support/Microsoft Edge/Default/Extensions/nhdogjmejiglipccpnnnanhbledajbpd',
      );
      await session.defaultSession.loadExtension(
        `${vueDevToolsPath}/${readdirSync(vueDevToolsPath)[0]}`,
      );
    } catch (e) {
      logger.error('Vue Devtools failed to install:', e.toString());
    }
  }
  await dbManage.resetDb();
  await createWindow();
});

app.on('web-contents-created', (_, webContents) => {
  webContents.setWindowOpenHandler(detail => {
    shell.openExternal(detail.url).then();
    return { action: 'deny' };
  });
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', async data => {
      if (data === 'graceful-exit') {
        await dbManage.disconnect();
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', async () => {
      await dbManage.disconnect();
      app.quit();
    });
  }
}
