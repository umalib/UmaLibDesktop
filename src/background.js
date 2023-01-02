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
const dbManage = require('@/db-manage');
const { titles, themes } = require('@/main-config');

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
const userDbPath = join(app.getPath('userData'), './main.db');
if (isDevelopment) {
  logger.level = 'debug';
  dbLogger.level = 'debug';
  copyFileSync(join(resolve('./prisma/main.db')), userDbPath);
}

if (!existsSync(userDbPath)) {
  copyFileSync(join(process.resourcesPath, './prisma/main.db'), userDbPath);
}
dbManage.config(dbLogger, userDbPath);

const configStore = new (require('electron-store'))();
logger.debug(`use config path: ${configStore.path}`);

function getBackgroundColor() {
  return configStore.get('background-color');
}

function setBackgroundColor(color) {
  configStore.set('background-color', color);
  return color;
}

if (!getBackgroundColor()) {
  logger.info('write default background-color into config');
  setBackgroundColor(themes[0].color);
} else {
  logger.info('read background-color: ' + getBackgroundColor());
}

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
  return titles.origin;
}
const storeEvents = {
  pathConf: MD5.hex(dbManage.getPath()),
  getOrCreateConfig() {
    const defaultConf = {
      favorites: [],
      dbVersion: 0,
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

  getFavorites() {
    return this.getOrCreateConfig().favorites;
  },
  setFavorites(favorites) {
    const ret = configStore.get(this.pathConf);
    ret.favorites = favorites.filter((v, i, l) => l.indexOf(v) === i);
    configStore.set(this.pathConf, ret);
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
  async importFavorites() {
    const path = await dialog['showOpenDialog']({
      multiSelections: false,
      openDirectory: false,
    });
    if (path.filePaths.length) {
      try {
        const favList = this.getFavorites().concat(
          await dbManage.getIdsByFav(
            JSON.parse(readFileSync(path.filePaths[0], 'utf-8')),
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
    const path = (
      await dialog['showSaveDialog']({
        title: '导出收藏夹配置到……',
        defaultPath: `./${this.pathConf}.json`,
      })
    ).filePath;
    writeFileSync(
      path,
      JSON.stringify(await dbManage.listAllFav(this.getFavorites())),
    );
    return path;
  },

  saveMeFlag: -2,
  password: '',
  async saveMe() {
    if (this.saveMeFlag === -2) {
      this.password = await dbManage.getPassword();
      if (this.password) {
        this.password = MD5.hex(this.password);
        this.password = this.password.substring(this.password.length - 8);
      }
      this.saveMeFlag = this.password ? await dbManage.checkR18() : -1;
      logger.debug(`R18 id=${this.saveMeFlag}, pwd=${this.password}`);
    }
    return this.saveMeFlag;
  },
  isSafe() {
    this.saveMeFlag = -3;
  },
  getPwd() {
    return this.password;
  },

  resetConfig() {
    this.pathConf = MD5.hex(dbManage.getPath());
    this.saveMeFlag = -2;
  },

  checkVersion() {
    return { app: app.getVersion(), db: this.getOrCreateConfig().dbVersion };
  },

  titles: chooseTitles(),
  getTitles() {
    return this.titles;
  },
};

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

function getDefaultFullScreen() {
  return configStore.get('full-screen');
}

function setDefaultFullScreen(isFullScreen) {
  configStore.set('full-screen', isFullScreen);
  return isFullScreen;
}

if (getDefaultFullScreen() === undefined) {
  setDefaultFullScreen(true);
}

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

  function setRendererBackgroundColor(color) {
    color && setBackgroundColor(color);
    mainWindow.webContents.send('colorEvent', getBackgroundColor());
  }

  logger.info('clean old listeners');
  ipcMain.removeAllListeners();

  ipcMain.on('artChannel', async (_, msg) => {
    let result;
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
  if (getDefaultFullScreen()) {
    logger.info('set full screen');
    mainWindow.maximize();
  }
  mainWindow.show();

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
        accelerator: process.platform === 'darwin' ? 'Cmd+1' : 'Ctrl+1',
        click() {
          mainWindow.webContents.send('menuEvent', '/list');
        },
      },
      {
        label: storeEvents.titles.menu,
        sublabel: '长篇/合集目录',
        toolTip: '长篇/合集目录',
        accelerator: process.platform === 'darwin' ? 'Cmd+2' : 'Ctrl+2',
        click() {
          mainWindow.webContents.send('menuEvent', '/menu/m');
        },
      },
      {
        label: storeEvents.titles.favorite,
        sublabel: '收藏夹',
        toolTip: '收藏夹',
        accelerator: process.platform === 'darwin' ? 'Cmd+3' : 'Ctrl+3',
        click() {
          mainWindow.webContents.send('menuEvent', '/favorites');
        },
      },
      {
        label: storeEvents.titles.history,
        sublabel: '阅读历史',
        toolTip: '阅读历史',
        accelerator: process.platform === 'darwin' ? 'Cmd+4' : 'Ctrl+4',
        click() {
          mainWindow.webContents.send('menuEvent', '/history');
        },
      },
      {
        label: storeEvents.titles.manage,
        sublabel: '管理',
        toolTip: '管理',
        accelerator: process.platform === 'darwin' ? 'Cmd+5' : 'Ctrl+5',
        click() {
          mainWindow.webContents.send('menuEvent', '/manage');
        },
      },
      {
        label: storeEvents.titles.copyright,
        sublabel: '鸣谢',
        toolTip: '鸣谢',
        accelerator: process.platform === 'darwin' ? 'Cmd+6' : 'Ctrl+6',
        click() {
          mainWindow.webContents.send('menuEvent', '/copyright');
        },
      },
      { type: 'separator' },
      {
        label: '选择数据库',
        async click() {
          const path = await dialog['showOpenDialog']({
            multiSelections: false,
            openDirectory: false,
          });
          if (path.filePaths.length) {
            logger.info(`dbManage.changeDb("${path.filePaths[0]}")`);
            const result = await dbManage.changeDb(path.filePaths[0]);
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
          mainWindow.webContents.send('refreshPage', '');
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
        checked: getDefaultFullScreen(),
        click(event) {
          setDefaultFullScreen(event.checked);
        },
      },
    ],
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  setRendererBackgroundColor();
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
  if (BrowserWindow.getAllWindows().length === 0) {
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
