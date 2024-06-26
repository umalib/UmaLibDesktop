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
              <span
                v-for="(src, index) in selectedArt.source.map(s => s.val)"
                :key="index"
              >
                <br v-if="index" />
                <el-link
                  v-if="src.startsWith('http')"
                  :href="src"
                  style="font-size: inherit;"
                  target="_blank"
                  type="primary"
                >
                  {{ src }}
                </el-link>
                <span v-else>
                  {{ src }}
                </span>
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
          v-html="convertContent(content)"
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
          <template #dropdown>
            <el-dropdown-menu>
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
          </template>
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
    convertContent(_content) {
      let output = _content;
      let result = [];
      const dict = {};
      do {
        result = output.match(/<p>\[[^\]]+][^<]*<\/p>$/);
        if (result) {
          output = output.substring(0, result.index);
          const a = result[0].replace(/<[^>]*>/g, '').split(']');
          const value = a.slice(-1)[0];
          for (const key of a) {
            dict[key.substring(1)] = value;
          }
        }
      } while (result);
      if (Object.keys(dict).length) {
        output = output.replace(/(<p>\s*<br\s*\/?\s*>\s*<\/p>)+$/g, '');
        for (const key of Object.keys(dict)) {
          output = output.replaceAll(
            `[${key}]`,
            ' <span onclick=\'if(this.className){this.className=""}else{this.className="key"}\'>' +
              `[<a href='javascript:void(0)'>${key}</a>]</span><span class="annotation">${dict[key]}</span> `,
          );
        }
        output = output.replace(/ +/g, ' ');
      }
      return this.convertLan(output);
    },
    formatTimeStamp,
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
  },
  name: 'ShowArticle',
  props: ['content', 'visible', 'selectedArt', 'vue'],
};
</script>

<style lang="scss">
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
    span.annotation,
    blockquote {
      font-size: 16px;
    }
  }

  .small-font .ql-editor {
    span.annotation,
    blockquote {
      font-size: 0.75em;
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

  span + span.annotation {
    display: none;
  }

  span.key + span.annotation {
    display: block;
    border-left: 4px solid #ccc;
    margin-bottom: 5px;
    margin-top: 5px;
    padding-left: 16px;
  }
}
</style>
