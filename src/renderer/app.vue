<template>
  <div id="app">
    <router-view
      :built-in-db="builtInDb"
      :save-me="saveMeId"
      @is-safe="isSafe"
    />
    <el-divider />
    <el-row style="text-align: center">
      <small>
        {{ signInfo.content }}
        <el-tooltip placement="top" effect="light">
          <div slot="content">
            <el-descriptions :column="1" border size="mini">
              <el-descriptions-item label="签名">
                {{ signInfo.sign[0] }}
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
  </div>
</template>

<script>
const { ipcRenderer } = require('electron');

import connector from '@/renderer/utils/connector';
import EmbeddedData from '@/renderer/utils/data';

document.title = '赛马娘同人集中楼大书库';

export default {
  data() {
    return {
      colorClz: '',
      builtInDb: true,
      saveMeId: -1,
      signInfo: EmbeddedData.signInfo,
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

    this.builtInDb = await connector.get('checkDb', {});
    this.saveMeId = await connector.get('saveMe', {});
  },
  methods: {
    isSafe() {
      this.saveMeId = -3;
    },
    async refreshPage(path) {
      await this.$router.push('/empty');
      await this.$notify({
        message: `使用数据库：${path || '内置'}`,
        title: '',
        type: 'success',
      });
      this.builtInDb = !path;
      this.saveMeId = await connector.get('saveMe', {});
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
