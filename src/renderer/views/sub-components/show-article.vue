<template>
  <el-dialog
    :close-on-click-modal="false"
    :title="convertLan(selectedArt.name)"
    :visible="visible"
    center
    class="uma-article"
    width="80%"
    @close="
      $refs.artContent && ($refs.artContent.wrap.scrollTop = 0);
      $emit('art-close');
    "
  >
    <el-scrollbar ref="artContent" style="height: 100%">
      <el-row>
        <el-col :offset="2" :span="20">
          <el-descriptions :column="2" :size="descriptionSize" border title="">
            <el-descriptions-item :span="2" label="标题">
              {{ convertLan(selectedArt.name) }}
            </el-descriptions-item>
            <el-descriptions-item label="作者">
              {{ convertLan(selectedArt.author) }}
            </el-descriptions-item>
            <el-descriptions-item label="译者">
              {{ convertLan(selectedArt.translator) }}
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
                v-for="tagLabel in selectedArt.tagLabels"
                :key="tagLabel.name"
                :type="elTypeMap[tagLabel.type]"
                size="mini"
              >
                {{ convertLan(tagLabel.name) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item :span="2" label="备注">
              {{ convertLan(selectedArt.note) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-col>
      </el-row>
      <el-row :class="['ql-snow', `${fontSize}-font`, `${segmentSpace}-space`]">
        <el-col
          :class="[
            'ql-editor',
            {
              Saitamaar:
                selectedArt.tagLabels.filter(x => x.name === 'AA').length > 0,
            },
          ]"
          :offset="2"
          :span="20"
          v-html="convertLan(content)"
        />
      </el-row>
      <el-backtop
        style="right: 11%; bottom: 12%;"
        target=".uma-article .el-scrollbar__wrap"
      />
    </el-scrollbar>
    <span slot="footer" class="dialog-footer">
      <el-col :offset="10" :span="4">
        <el-button @click="$emit('art-close')">
          关闭
        </el-button>
      </el-col>
      <el-col :offset="7" :span="3" style="float: right">
        <el-dropdown
          :hide-on-click="false"
          placement="top-start"
          size="small"
          @command="handleCommand"
        >
          <el-button size="small">
            界面设置<i class="el-icon-arrow-up el-icon--right" />
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item
              :disabled="fontSize === 'small'"
              command="font:small"
            >
              字号：小
            </el-dropdown-item>
            <el-dropdown-item
              :disabled="fontSize === 'normal'"
              command="font:normal"
            >
              字号：中
            </el-dropdown-item>
            <el-dropdown-item
              :disabled="fontSize === 'large'"
              command="font:large"
            >
              字号：大
            </el-dropdown-item>
            <el-dropdown-item
              :disabled="segmentSpace === 'normal'"
              command="space:normal"
              divided
            >
              段间距：标准
            </el-dropdown-item>
            <el-dropdown-item
              :disabled="segmentSpace === 'wider'"
              command="space:wider"
            >
              段间距：大
            </el-dropdown-item>
            <el-dropdown-item
              :disabled="language === 'no'"
              command="converter:no"
              divided
            >
              繁简转换：关闭
            </el-dropdown-item>
            <el-dropdown-item
              :disabled="language === 'cn'"
              command="converter:cn"
            >
              繁简转换：简体
            </el-dropdown-item>
            <el-dropdown-item
              :disabled="language === 'hk'"
              command="converter:hk"
            >
              繁简转换：繁体
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </el-col>
    </span>
  </el-dialog>
</template>

<script>
import { Converter } from 'opencc-js';
import { formatTimeStamp } from '@/renderer/utils/renderer-utils';
import EmbeddedData from '@/renderer/utils/data';

const converters = {
  cn: Converter({ from: 'hk', to: 'cn' }),
  hk: Converter({ from: 'cn', to: 'hk' }),
  no: undefined,
};

export default {
  name: 'ShowArticle',
  props: ['content', 'visible', 'selectedArt'],
  data() {
    return {
      aaFont: '',
      converter: undefined,
      descriptionSize: 'small',
      elTypeMap: EmbeddedData.elTagTypes,
      fontSize: 'normal',
      language: 'no',
      segmentSpace: 'normal',
    };
  },
  emits: ['art-close'],
  methods: {
    convertLan(_content) {
      if (!this.converter) {
        return _content;
      }
      return this.converter(_content);
    },
    handleCommand(command) {
      const commandArr = command.split(':');
      switch (commandArr[0]) {
        case 'converter':
          this.language = commandArr[1];
          this.converter = converters[this.language];
          break;
        case 'font':
          this.fontSize = commandArr[1];
          switch (this.fontSize) {
            case 'large':
              this.descriptionSize = 'medium';
              break;
            case 'normal':
              this.descriptionSize = 'small';
              break;
            case 'small':
              this.descriptionSize = 'mini';
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

  .ql-editor.Saitamaar {
    font-family: 'Saitamaar', sans-serif;
    p {
      white-space: pre;
      font-weight: 400;
      line-height: 1.125;
    }
  }
}
</style>
