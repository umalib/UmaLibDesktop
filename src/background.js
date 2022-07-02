'use strict';

let { app } = require('electron');
import {
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  protocol,
  remote,
  session,
  shell,
} from 'electron';
const Store = require('electron-store');
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import dbManage from '@/db-manage';
import { themes } from '@/main-config';

const MD5 = new (require('jshashes').MD5)();
const log4js = require('log4js');
const os = require('os');
const path = require('path');

const isDevelopment = process.env.NODE_ENV !== 'production';
const logger = log4js.getLogger();
logger.level = isDevelopment ? 'debug' : 'info';
const store = new Store();

if (!app) {
  app = remote.app;
}

function getBackgroundColor() {
  return store.get('background-color');
}

function setBackgroundColor(color) {
  store.set('background-color', color);
  return color;
}

if (!getBackgroundColor()) {
  logger.info('write default background-color into config');
  setBackgroundColor(themes[0].color);
} else {
  logger.info('read background-color: ' + getBackgroundColor());
}

function createConfig() {
  store.set(dbManage.getPath(), {
    favorites: [],
  });
}

const storeEvents = {
  getFavorites() {
    let ret = store.get(dbManage.getPath());
    if (!ret) {
      createConfig();
      return [];
    }
    const b = ret.favorites.filter((v, i, l) => l.indexOf(v) === i);
    if (b.length !== ret.favorites.length) {
      ret.favorites = b;
      store.set('favorites', ret);
      return b;
    }
    return ret.favorites;
  },
  setFavorites(favorites) {
    const ret = store.get(dbManage.getPath());
    ret.favorites = favorites;
    store.set(dbManage.getPath(), ret);
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
  saveMeFlag: -2,
  password: '',
  async saveMe() {
    if (this.saveMeFlag === -2) {
      this.password = await dbManage.getPassword();
      if (this.password) {
        this.password = await MD5.hex(this.password);
        this.password = this.password.substring(this.password.length - 8);
      }
      this.saveMeFlag = this.password ? await dbManage.checkR18() : -1;
      logger.info('R18 id:' + this.saveMeFlag);
      logger.debug(`R18 id=${this.saveMeFlag}, pwd=${this.password}`);
    }
    return this.saveMeFlag;
  },
  clearSaveMe() {
    this.saveMeFlag = -2;
  },
  isSafe() {
    this.saveMeFlag = -3;
  },
  getPwd() {
    return this.password;
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
    },
  });

  function setRendererBackgroundColor(color) {
    if (color) {
      setBackgroundColor(color);
    }
    try {
      mainWindow.webContents.send('colorEvent', getBackgroundColor());
    } catch (e) {
      logger.warn(e);
    }
  }

  const timestamp = {};
  ipcMain.on('artChannel', async (_, msg) => {
    let result;
    if (dbManage[msg.action]) {
      timestamp[msg.id] = new Date().getTime();
      logger.debug(`dbManage.${msg.action}(${JSON.stringify(msg.args)})`);
      if (msg.action === 'changeDb') {
        storeEvents.clearSaveMe();
      }
      result = await dbManage[msg.action](msg.args);
      logger.info(
        `dbManage.${msg.action}: ${new Date().getTime() -
          timestamp[msg.id]} ms`,
      );
      delete timestamp[msg.id];
    } else {
      logger.info(`storeEvents.${msg.action}`);
      result = storeEvents[msg.action](msg.args);
      if (result instanceof Promise) {
        result = await result;
      }
    }
    mainWindow.webContents.send('artChannel', {
      id: msg.id,
      data: result,
    });
  });

  ipcMain.on('colorEvent', () => setRendererBackgroundColor());

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
          const path = await dialog.showOpenDialog();
          if (path.filePaths.length) {
            logger.info(`dbManage.changeDb("${path.filePaths[0]}")`);
            storeEvents.clearSaveMe();
            mainWindow.webContents.send(
              'refreshPage',
              await dbManage.changeDb(path.filePaths[0]),
            );
          }
        },
      },
      {
        label: '切换到内置数据库',
        async click() {
          storeEvents.clearSaveMe();
          await dbManage.resetDb();
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
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    await dbManage.disconnect();
    app.quit();
  }
});

app.on('activate', async () => {
  // On macOS it's common to re-create a window in the app when the
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
      // installExtension(VUEJS_DEVTOOLS);
      const reactDevToolsPath = path.join(
        os.homedir(),
        '/Library/Application Support/Microsoft Edge/Default/Extensions/nhdogjmejiglipccpnnnanhbledajbpd/6.1.4_0',
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
  webContents.on('new-window', async (event, url) => {
    event.preventDefault();
    await shell.openExternal(url);
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
