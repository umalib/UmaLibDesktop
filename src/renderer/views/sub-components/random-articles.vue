<template>
  <el-dialog
    :close-on-click-modal="false"
    :visible="visible"
    center
    class="random-article"
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
        :favorites="favorites"
        :id2-tag="id2Tag"
        :layout="'random'"
        :loading="false"
        @art-show="$emit('art-show', $event)"
        @favorite-change="$emit('favorite-change', $event)"
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
  components: {
    ArticleTable,
  },
  emits: ['art-show', 'random-close'],
  name: 'random-articles',
  props: ['favorites', 'id2Tag', 'randomList', 'visible'],
};
</script>

<style></style>
