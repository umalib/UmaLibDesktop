<template>
  <div id="app">
    <router-view
      v-if="saveMeId > -4"
      :built-in-db="builtInDb"
      :cue="cue"
      :history="history"
      :save-me="saveMeId"
      :titles="titles"
      @is-safe="isSafe"
      @history-add="history.push($event)"
      @history-update="history = $event"
    />
    <el-divider />
    <el-row style="text-align: center">
      <small
        :style="{ 'font-weight': cue >= 10 ? 'bold' : 'initial' }"
        @click="cue++"
      >
        {{ signInfo.content }}
        <el-tooltip effect="light" placement="top">
          <div slot="content">
            <el-descriptions :column="1" border size="mini">
              <el-descriptions-item label="签名">
                {{ signInfo.sign }}
              </el-descriptions-item>
              <el-descriptions-item label="参数">
                sm2 {der,hash,publicKey}
              </el-descriptions-item>
              <el-descriptions-item label="公钥">
                {{ signInfo.pubKey }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
          <i class="el-icon-info" />
        </el-tooltip>
      </small>
      <p>
        <small>
          当前数据库位置：{{ currentDbPath }}
          <span v-if="builtInDb">（内置数据库 版本：{{ appVersion.db }}）</span>
        </small>
      </p>
    </el-row>
    <el-row>
      <el-col :offset="4" :span="16">
        <p>
          <el-alert
            title="本数据库中的所有原创内容版权归其作者所有，翻译内容版权归原作者与译者所有，请在非商业使用前征得对应版权所有者的同意。"
            type="error"
          />
        </p>
        <p>
          <el-alert
            title="除版权所有者外，任何人不得将本程序与数据库中的任何内容用于任何商业用途或盈利行为！"
            type="error"
          />
        </p>
      </el-col>
    </el-row>
    <el-dialog
      class="show-info"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      :title="downloadDialog.title"
      :visible="downloadDialog.visible"
      center
      width="40%"
    >
      <p>{{ downloadDialog.size }}</p>
      <p>{{ downloadDialog.speed }}</p>
      <p>等待文件下载完成前请勿进行任何操作！否则将导致软件损坏！</p>
      <el-progress :percentage="downloadDialog.progress" />
    </el-dialog>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';

import connector from '@/renderer/utils/connector';
import EmbeddedData from '@/renderer/utils/data';
import axios from 'axios';

export default {
  data() {
    return {
      appVersion: {
        app: '',
        db: 'loading...',
      },
      builtInDb: true,
      colorClz: '',
      cue: 0,
      currentDbPath: '',
      downloadDialog: {
        aimVersion: -1,
        size: '',
        loaded: 0,
        progress: 0,
        timeStamp: 0,
        title: '数据库下载中……',
        visible: false,
      },
      history: [],
      saveMeId: -4,
      signInfo: EmbeddedData.signInfo,
      titles: {},
    };
  },

  async created() {
    const _vue = this;
    ipcRenderer.on('menuEvent', (_, link) => {
      if (this.$route.path !== link) {
        this.$router.push(link);
      }
    });

    ipcRenderer.on('colorEvent', (_, color) => {
      if (_vue.colorClz) {
        document.body.classList.remove(_vue.colorClz);
      }
      _vue.colorClz = `${color}-background`;
      document.body.classList.add(_vue.colorClz);
    });

    ipcRenderer.send('colorEvent');

    const dragWrapper = document.getElementsByTagName('body')[0];
    dragWrapper.addEventListener('drop', async e => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const path = files[0].path;
        await _vue.refreshPage(await connector.get('changeDb', path));
      }
    });

    dragWrapper.addEventListener('dragover', e => {
      e.preventDefault();
    });

    ipcRenderer.on('refreshPage', (_, path) => {
      _vue.refreshPage(path);
    });

    ipcRenderer.on('reloadDb', async () => {
      try {
        await _vue.$confirm(
          `即将从云端重新拉取数据库！该操作耗时较长，中断可能导致数据损坏！内置数据库将被覆盖且原数据库无法找回！是否继续？`,
          '即将重载数据库！',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          },
        );
        await _vue.downloadDb();
        // eslint-disable-next-line no-empty
      } catch (_) {}
    });

    this.appVersion = await connector.get('checkVersion', {});
    try {
      const remoteVer = (
        await axios.get(
          `https://umalib.github.io/UmaLibDesktop/update-info.json?${new Date().getTime()}`,
        )
      ).data;
      const appVerArr = [
        Number(this.appVersion.app.substring(0, 1)),
        Number(this.appVersion.app.substring(2)),
      ];
      const remoteVerArr = [
        Number(remoteVer.version.substring(0, 1)),
        Number(remoteVer.version.substring(2)),
      ];
      let notifyFlag = true;
      if (
        appVerArr[0] < remoteVerArr[0] ||
        (appVerArr[0] === remoteVerArr[0] && appVerArr[1] < remoteVerArr[1])
      ) {
        this.$notify({
          title: '发现新版本',
          message: `发现新版本 v${remoteVer.version}！请前往下载：<a href='${remoteVer.url}' target='_blank'>下载地址</a>`,
          dangerouslyUseHTMLString: true,
          type: 'warning',
          duration: 0,
        });
        notifyFlag = false;
      }
      this.downloadDialog.aimVersion = remoteVer['db_version'];
      if (
        !this.appVersion.db ||
        Number(this.appVersion.db) < this.downloadDialog.aimVersion
      ) {
        try {
          await this.$confirm(
            `发现新数据库版本 ${this.downloadDialog.aimVersion}！是否下载？`,
            '发现新数据库！',
            {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning',
            },
          );
          await this.downloadDb();
          // eslint-disable-next-line no-empty
        } catch (_) {}
        notifyFlag = false;
      }
      if (notifyFlag) {
        this.$notify({
          title: '已更新到最新版本',
          message: '',
          type: 'success',
        });
      }
    } catch (_) {
      this.$notify({
        title: '版本检查失败！',
        message: '请检查网络连接！',
        type: 'warning',
      });
    }
    const dbInfo = await connector.get('checkDb', {});
    this.builtInDb = dbInfo.isEmbedded;
    this.currentDbPath = dbInfo.current;
    this.saveMeId = await connector.get('saveMe', {});
    this.titles = await connector.get('getTitles', {});
    document.title = this.titles.name;
  },
  methods: {
    isSafe() {
      this.saveMeId = -3;
    },
    async refreshPage(path) {
      await this.$router.push('/empty');
      this.builtInDb = path.isEmbedded;
      this.currentDbPath = path.current;
      this.appVersion = await connector.get('checkVersion', {});
      this.$notify({
        title: '切换数据库',
        message: `${this.builtInDb ? '内置' : this.currentDbPath}`,
        type: 'success',
      });
      this.saveMeId = await connector.get('saveMe', {});
    },
    async downloadDb() {
      if (this.downloadDialog.aimVersion === 0) {
        try {
          const remoteVer = (
            await axios.get(
              `https://umalib.github.io/UmaLibDesktop/update-info.json?${new Date().getTime()}`,
            )
          ).data;
          this.downloadDialog.aimVersion = remoteVer['db_version'];
        } catch (_) {
          this.$notify({
            title: '数据库更新失败！',
            message: '请检查网络连接！',
            type: 'error',
          });
          return;
        }
      }
      this.downloadDialog.visible = true;
      this.downloadDialog.progress = 0;
      const _vue = this;
      const B2M = 1024 * 1024;
      try {
        const ret = await axios.get(
          `https://umalib.github.io/UmaLibDesktop/${
            this.downloadDialog.aimVersion
          }.zip?${new Date().getTime()}`,
          {
            responseType: 'blob',
            params: {},
            onDownloadProgress(e) {
              if (e.total !== 0) {
                const percentage = Math.round((e.loaded * 100) / e.total);
                _vue.downloadDialog.progress =
                  percentage - 99 > 0 ? 99 : percentage;
                _vue.downloadDialog.size = `已下载：${(e.loaded / B2M).toFixed(
                  2,
                )}/${(e.total / B2M).toFixed(2)} MB`;

                let speed =
                  ((e.loaded - _vue.downloadDialog.loaded) * 1000) /
                  (e.timeStamp - _vue.downloadDialog.timeStamp);
                _vue.downloadDialog.loaded = e.loaded;
                _vue.downloadDialog.timeStamp = e.timeStamp;
                if (speed - 1024 < 0) {
                  _vue.downloadDialog.speed = `下载速度：${speed.toFixed(
                    2,
                  )} Bps`;
                } else {
                  speed /= 1024;
                  if (speed - 768 < 0) {
                    _vue.downloadDialog.speed = `下载速度：${speed.toFixed(
                      2,
                    )} KBps`;
                  } else {
                    _vue.downloadDialog.speed = `下载速度：${(
                      speed / 1024
                    ).toFixed(2)} MBps`;
                  }
                }
              }
            },
          },
        );
        this.downloadDialog.info = '下载完成！即将切换到下载数据库……';
        this.downloadDialog.progress = 100;
        await connector.get('saveOnlineDb', {
          version: this.downloadDialog.aimVersion,
          buffer: await new Promise(resolve => {
            const fileReader = new FileReader();
            fileReader.onload = function() {
              resolve(this.result);
            };
            fileReader.readAsArrayBuffer(ret.data);
          }),
        });
        const flag = await connector.get('checkR18', {});
        if (flag !== undefined) {
          await connector.get('setDbVersion', this.downloadDialog.aimVersion);
          this.$notify({
            title: `已启用内置主数据库，版本：${this.downloadDialog.aimVersion}`,
            message: '数据库在线更新完成',
            type: 'success',
            duration: 0,
          });
        } else {
          this.downloadDialog.info = '下载数据库失败，请检查网络！';
          await connector.get('rollbackDb', {});
          this.$notify({
            title: '数据库更新失败！',
            message: '数据库更新文件损坏！',
            type: 'error',
            duration: 0,
          });
        }
      } catch (e) {
        this.downloadDialog.info = '下载数据库失败，请检查网络！';
        await connector.get('rollbackDb', {});
        this.$notify({
          title: '数据库更新失败！',
          message: '请检查网络连接！',
          type: 'error',
          duration: 0,
        });
      }
      setTimeout(async () => {
        this.downloadDialog.visible = false;
        await this.refreshPage(await connector.get('checkDb', {}));
      }, 1500);
    },
  },
};
</script>

<style lang="scss">
#app {
  font-family: 'Times New Roman', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', '微软雅黑', system-ui, Arial, sans-serif;
}

@mixin themedColor($backColor, $headerColor, $cellColor, $fontColor) {
  $hoverColor: #409eff;
  background-color: $backColor;
  color: nth($fontColor, 1);

  .el-cascader-menu,
  .el-cascader__suggestion-list {
    color: nth($fontColor, 1);

    .is-active {
      color: $hoverColor;
    }

    li:focus {
      background-color: nth($cellColor, 4);
    }

    li:hover {
      color: nth($fontColor, 2);
      background-color: $headerColor;
    }
  }

  input,
  .el-message-box,
  .el-notification,
  .el-popper,
  .el-tooltip__popper.is-light {
    color: nth($fontColor, 1);
    background-color: nth($cellColor, 2);
  }

  .el-input-group__prepend {
    color: nth($fontColor, 2);
    background-color: $headerColor;
  }

  .el-message-box__title,
  .el-notification__content,
  .el-select-dropdown__item {
    color: nth($fontColor, 1);
  }

  .el-select-dropdown__item.hover {
    background-color: nth($cellColor, 4);
  }

  .el-select-dropdown__item:hover {
    color: nth($fontColor, 2);
    background-color: $headerColor;
  }

  .el-tooltip__popper.is-dark {
    color: nth($fontColor, 2);
    background-color: $headerColor;
    border: 1px solid nth($cellColor, 3);
  }

  .el-button.el-button--default,
  .el-backtop {
    color: nth($fontColor, 1);
    background-color: nth($cellColor, 2);
  }

  .el-button.el-button--default:hover,
  .el-backtop:hover {
    background-color: nth($cellColor, 4);
  }

  .el-button.el-button--default.el-button--primary {
    color: nth($fontColor, 2);
    background-color: $headerColor;
  }

  .el-button.el-button--default.el-button--primary:hover {
    opacity: 0.8;
  }

  .el-checkbox {
    color: nth($fontColor, 1);
  }

  div.el-pagination {
    .el-pagination__total,
    .el-pagination__jump,
    button,
    li {
      color: nth($fontColor, 1);
      background-color: $backColor;
    }

    li.number:hover,
    li.active {
      color: $hoverColor;
    }
  }

  .el-table {
    color: nth($fontColor, 1);
  }

  th.el-table__cell {
    color: nth($fontColor, 2);
    background-color: $headerColor;
  }

  .el-table__empty-block {
    background-color: nth($cellColor, 2);
  }

  tr.el-table__row {
    td:nth-child(2n + 1) {
      background-color: nth($cellColor, 1);
    }

    td:nth-child(2n + 2) {
      background-color: nth($cellColor, 2);
    }
  }

  tr.el-table__row.el-table__row--striped {
    td:nth-child(2n + 1) {
      background-color: nth($cellColor, 3);
    }

    td:nth-child(2n + 2) {
      background-color: nth($cellColor, 4);
    }
  }

  tr.el-table__row.hover-row,
  tr.el-table__row.el-table__row--striped.hover-row {
    td {
      background-color: nth($cellColor, 2);
    }
  }

  span.el-link--inner > span.el-tag:hover {
    background-color: white;
    color: navy;
  }

  .el-dialog {
    background-color: nth($cellColor, 2);

    .el-dialog__title {
      color: nth($fontColor, 1);
    }

    .el-dialog__body {
      color: nth($fontColor, 1);
    }
  }

  .ql-snow {
    .ql-picker-label {
      color: nth($fontColor, 1);
    }

    .ql-picker-options {
      color: nth($fontColor, 1);
      background-color: $backColor;
    }

    .ql-stroke {
      stroke: nth($fontColor, 1);
    }

    .ql-fill {
      fill: nth($fontColor, 1);
    }
  }

  .el-descriptions {
    color: nth($fontColor, 1);

    .is-bordered .el-descriptions-item__cell {
      color: nth($fontColor, 1);
    }

    .el-descriptions-item__label {
      background-color: nth($cellColor, 3);
      min-width: 50px;
    }

    .el-descriptions-item__content {
      background-color: nth($cellColor, 4);
    }
  }

  .el-tabs__item {
    color: nth($fontColor, 1);
  }

  .el-tabs__item.is-active {
    color: $hoverColor;
  }

  div.el-transfer div.el-transfer-panel {
    background-color: nth($cellColor, 1);

    .el-transfer-panel__header {
      background-color: $headerColor;

      .el-checkbox__label {
        color: nth($fontColor, 2);
      }
    }

    .el-transfer-panel__item.el-checkbox .el-checkbox__label {
      color: nth($fontColor, 1);
    }

    .el-transfer-panel__footer {
      background-color: nth($cellColor, 1);
    }
  }

  .el-card {
    color: nth($fontColor, 1);
    background-color: $backColor;
  }

  span.el-breadcrumb__inner,
  span.el-breadcrumb__item:last-child span.el-breadcrumb__inner {
    color: nth($fontColor, 1);
  }
}

body.nga-background {
  @include themedColor(
    #f5e8cb,
    #591804,
    [#fff6df,
    #fff8e7,
    #ffedc3,
    #fff0cd],
    [#10273f,
    white]
  );
}

body.elui-background {
}

body.cyan-background {
  @include themedColor(
    #d3dedb,
    #274349,
    [#ecf5f3,
    #f0f7f5,
    #dcece7,
    #e1efeb],
    [#10273f,
    white]
  );
}

body.teio-background {
  @include themedColor(
    #d0daff,
    royalblue,
    [lightcyan,
    azure,
    #c0ffff,
    #d0ffff],
    [navy,
    aliceblue]
  );
}

body.purple-background {
  @include themedColor(
    #ded1d4,
    #4a2731,
    [#f4e9ec,
    #f7eff1,
    #ebd6dc,
    #efdde2],
    [#10273f,
    white]
  );
}

body.black-background {
  @include themedColor(
    #34312e,
    #fbdbb7,
    [#201e1b,
    #181614,
    #3c3833,
    #322f2b],
    [#ddedf5,
    black]
  );
}

body.green-background {
  @include themedColor(
    #dde9dd,
    #003a00,
    [#f0fff0,
    #f5fffa,
    #e7ffe7,
    #eefaee],
    [black,
    white]
  );
}

body.exhentai-background {
  @include themedColor(
    #3e424a,
    #34353b,
    [#3c414b,
    #4f535b,
    #363940,
    #3c414b],
    [#f1f1f1,
    #dddddd]
  );
}

body.pink-background {
  @include themedColor(
    #700070,
    lavender,
    [darkmagenta,
    purple,
    darkorchid,
    #9400d3],
    [lightpink,
    deeppink]
  );
}

body.porn-background {
  @include themedColor(
    black,
    #ff9000,
    [#3d3d3d,
    #2c2c2c,
    #5f5f5f,
    #4e4e4e],
    [#e4e4e4,
    #1b1b1b]
  );
}

.el-notification {
  word-wrap: anywhere;
}
</style>
