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
      <el-row :class="`ql-snow ${fontSize}`">
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
      <el-col :offset="6" :span="4" style="float: right">
        <el-button-group>
          <el-button
            @click="
              fontSize = '';
              descriptionSize = 'mini';
            "
            size="mini"
          >
            小
          </el-button>
          <el-button
            @click="
              fontSize = 'normal-font';
              descriptionSize = 'small';
            "
            size="mini"
          >
            中
          </el-button>
          <el-button
            @click="
              fontSize = 'large-font';
              descriptionSize = 'medium';
            "
            size="mini"
          >
            大
          </el-button>
        </el-button-group>
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
      fontSize: 'normal-font',
      descriptionSize: 'small',
    };
  },
  props: ['content', 'visible', 'selectedArt'],
  methods: {
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
    }

    h2 {
      font-size: 27px;
    }

    p {
      font-size: 20px;
      line-height: 2;
      margin-bottom: 5px;
    }

    span.ql-size-large {
      font-size: 24px;
    }

    span.ql-size-small {
      font-size: 16px;
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
