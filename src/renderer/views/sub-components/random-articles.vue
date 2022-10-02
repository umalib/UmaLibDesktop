<template>
  <el-dialog
    :close-on-click-modal="false"
    :visible="visible"
    center
    title="手气不错！"
    width="80%"
    @close="
      $refs.randomContent && ($refs.randomContent.wrap.scrollTop = 0);
      $emit('random-close');
    "
  >
    <el-scrollbar ref="randomContent" style="height: 100%">
      <article-table
        :articles="randomList"
        :count="randomList.length"
        :id2-tag="id2Tag"
        :layout="'random'"
        :loading="false"
        @art-show="$emit('art-show', $event)"
      />
    </el-scrollbar>
    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('random-close')">
        关闭
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import ArticleTable from '@/renderer/views/sub-components/article-table';

export default {
  name: 'random-articles',
  props: ['id2Tag', 'randomList', 'visible'],
  components: {
    ArticleTable,
  },
  emits: ['art-show', 'random-close'],
};
</script>

<style></style>
