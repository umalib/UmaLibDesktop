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
const { themes } = require('@/main-config');

const { readFileSync, writeFileSync } = require('fs');
const MD5 = new (require('jshashes').MD5)();
const log4js = require('log4js');
const { homedir } = require('os');
const { join } = require('path');

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
if (isDevelopment) {
  logger.level = 'debug';
}
dbManage.config(isDevelopment, log4js.getLogger('db-manage'));

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

const storeEvents = {
  pathConf: MD5.hex(dbManage.getPath()),
  getOrCreateConfig() {
    const defaultConf = {
      favorites: [],
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
};

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

async function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    show: false,
    title: '赛马娘同人集中楼大书库',
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: false,
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
  mainWindow.maximize();
  mainWindow.show();

  const template = [];
  if (process.platform === 'darwin') {
    template.push({
      role: 'appMenu',
    });
  }
  template.push({
    label: '文件',
    submenu: [
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
      { label: '刷新', role: 'reload' },
      { role: 'quit', label: '退出' },
    ],
  });
  template.push({
    label: '功能',
    submenu: [
      {
        label: '大书库',
        click() {
          mainWindow.webContents.send('menuEvent', '/list');
        },
      },
      {
        label: '管理处',
        click() {
          mainWindow.webContents.send('menuEvent', '/manage');
        },
      },
      {
        label: '总目表',
        click() {
          mainWindow.webContents.send('menuEvent', '/menu/m');
        },
      },
      {
        label: '收藏夹',
        click() {
          mainWindow.webContents.send('menuEvent', '/favorites');
        },
      },
      {
        label: '鸣谢',
        click() {
          mainWindow.webContents.send('menuEvent', '/copyright');
        },
      },
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
  const colorSubMenu = [];
  themes.forEach(c => {
    colorSubMenu.push({
      label: c.label,
      click() {
        setRendererBackgroundColor(c.color);
      },
    });
  });
  template.push({
    label: '主题',
    submenu: colorSubMenu,
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
      const reactDevToolsPath = join(
        homedir(),
        '/Library/Application Support/Microsoft Edge/Default/Extensions/nhdogjmejiglipccpnnnanhbledajbpd/6.2.1_0',
      );
      await session.defaultSession.loadExtension(reactDevToolsPath);
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
