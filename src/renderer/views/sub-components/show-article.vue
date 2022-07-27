<template>
  <el-dialog
    @close="
      $refs.artContent && ($refs.artContent.wrap.scrollTop = 0);
      $emit('close-art');
    "
    :close-on-click-modal="false"
    :visible="visible"
    :title="selectedArt.name"
    center
    class="uma-article"
    width="80%"
  >
    <el-scrollbar ref="artContent" style="height: 100%">
      <el-row>
        <el-col :offset="2" :span="20">
          <el-descriptions :column="2" :size="descriptionSize" title="" border>
            <el-descriptions-item :span="2" label="标题">
              {{ selectedArt.name }}
            </el-descriptions-item>
            <el-descriptions-item label="作者">
              {{ selectedArt.author }}
            </el-descriptions-item>
            <el-descriptions-item label="译者">
              {{ selectedArt.translator }}
            </el-descriptions-item>
            <el-descriptions-item label="上传">
              {{ formatTimeStamp(selectedArt.uploadTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="来源">
              <el-link
                v-if="
                  selectedArt.source && selectedArt.source.startsWith('http')
                "
                :href="selectedArt.source"
                style="font-size: inherit;"
                target="_blank"
                type="primary"
              >
                {{ selectedArt.source }}
              </el-link>
              <span v-else>
                {{ selectedArt.source ? selectedArt.source.toUpperCase() : '' }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item :span="2" label="标签">
              <el-tag
                :key="tagLabel"
                size="mini"
                v-for="tagLabel in selectedArt.tagLabels"
              >
                {{ tagLabel }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item :span="2" label="备注">
              {{ selectedArt.note }}
            </el-descriptions-item>
          </el-descriptions>
        </el-col>
      </el-row>
      <el-row :class="`ql-snow ${fontSize}-font ${segmentSpace}-space`">
        <el-col
          :offset="2"
          :span="20"
          :class="
            `ql-editor ${
              selectedArt.tagLabels.indexOf('AA') !== -1 ? 'Saitamaar' : ''
            }`
          "
          v-html="content"
        />
      </el-row>
      <el-backtop
        target=".uma-article .el-scrollbar__wrap"
        style="right: 11%; bottom: 12%;"
      />
    </el-scrollbar>
    <span slot="footer" class="dialog-footer">
      <el-col :offset="10" :span="4">
        <el-button @click="$emit('close-art')">
          关闭
        </el-button>
      </el-col>
      <el-col :offset="7" :span="3" style="float: right">
        <el-dropdown
          @command="handleCommand"
          :hide-on-click="false"
          placement="top-start"
          size="small"
        >
          <el-button size="small">
            界面设置<i class="el-icon-arrow-up el-icon--right" />
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item
              command="font:small"
              :disabled="fontSize === 'small'"
            >
              字号：小
            </el-dropdown-item>
            <el-dropdown-item
              command="font:normal"
              :disabled="fontSize === 'normal'"
            >
              字号：中
            </el-dropdown-item>
            <el-dropdown-item
              command="font:large"
              :disabled="fontSize === 'large'"
            >
              字号：大
            </el-dropdown-item>
            <el-dropdown-item
              command="space:normal"
              :disabled="segmentSpace === 'normal'"
              divided
            >
              段间距：标准
            </el-dropdown-item>
            <el-dropdown-item
              command="space:wider"
              :disabled="segmentSpace === 'wider'"
            >
              段间距：大
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </el-col>
    </span>
  </el-dialog>
</template>

<script>
import { formatTimeStamp } from '@/renderer/utils/renderer-utils';

export default {
  name: 'ShowArticle',
  data() {
    return {
      aaFont: '',
      fontSize: 'normal',
      segmentSpace: 'normal',
      descriptionSize: 'small',
    };
  },
  props: ['content', 'visible', 'selectedArt'],
  methods: {
    handleCommand(command) {
      const commandArr = command.split(':');
      switch (commandArr[0]) {
        case 'font':
          this.fontSize = commandArr[1];
          switch (this.fontSize) {
            case 'small':
              this.descriptionSize = 'mini';
              break;
            case 'normal':
              this.descriptionSize = 'small';
              break;
            case 'large':
              this.descriptionSize = 'medium';
              break;
          }
          break;
        case 'space':
          this.segmentSpace = commandArr[1];
      }
    },
    formatTimeStamp,
  },
};
</script>

<style lang="scss">
@font-face {
  font-family: 'Saitamaar';
  src: url('../../fonts/Saitamaar.woff2') format('woff2'),
    url('../../fonts/Saitamaar.woff') format('woff'),
    url('../../fonts/Saitamaar.ttf') format('ttf');
  font-display: swap;
}

div.uma-article div.el-dialog__body {
  padding: 0;

  .large-font .ql-editor {
    h1 {
      font-size: 32px;
      line-height: 2;
    }

    h2 {
      font-size: 27px;
      line-height: 2;
    }

    p,
    li {
      font-size: 20px;
      line-height: 2;
    }

    span.ql-size-large {
      font-size: 24px;
    }

    span.ql-size-small,
    blockquote {
      font-size: 16px;
    }
  }

  .wider-space .ql-editor {
    p,
    h1,
    h2 {
      margin-bottom: 5px;
    }
  }

  .ql-editor.Saitamaar p {
    font-family: 'Saitamaar', sans-serif;
    white-space: pre;
    font-weight: 400;
    line-height: 1.125;
  }
}
</style>
