<template>
  <el-row>
    <el-col :offset="2" :span="20" style="text-align: center">
      <el-row>
        <h1>{{ titles.history }}</h1>
      </el-row>

      <article-table
        :articles="articles"
        :count="count"
        :el-tag-map="search.tagType2ElTagType"
        :id2-tag="search.id2Tag"
        :layout="'history'"
        :loading="articleLoading"
        :param="param"
        @art-show="
          $emit('history-add', $event);
          showArticle($event);
        "
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
        @sort-change="handleSortChange"
      />
      <el-backtop />

      <show-article
        :content="content"
        :selected-art="selectedArt"
        :visible="contentVisible"
        @art-close="
          content = '';
          contentVisible = false;
        "
      />
    </el-col>
  </el-row>
</template>

<script>
import connector from '@/renderer/utils/connector';
import { initSelectedArtObj } from '@/renderer/utils/renderer-utils';
import ArticleTable from '@/renderer/views/sub-components/article-table';
import ShowArticle from '@/renderer/views/sub-components/show-article';

async function fillArticles(_vue, param) {
  _vue.articleLoading = true;
  param.noTagIds = _vue.saveMe > 0 ? [_vue.saveMe] : [];
  const data = await connector.get('listFavorites', param);
  _vue.contentVisible = false;
  _vue.articles = [];
  _vue.id2Art = {};
  _vue.count = data.count;
  if (!Object.keys(_vue.param.sortBy).length) {
    data.list.sort(
      (a, b) => _vue.favorites.indexOf(a.id) - _vue.favorites.indexOf(b.id),
    );
  }
  data.list.forEach(x => {
    x.tags = x.tags.filter(id => id !== _vue.param.tagId);
    x.tags.sort(_vue.tagComparator);
    _vue.id2Art[x.id] = _vue.articles.length;
    _vue.articles.push(x);
  });
  _vue.articleLoading = false;
}

export default {
  name: 'history',
  components: { ArticleTable, ShowArticle },
  props: ['history', 'saveMe', 'titles'],
  data() {
    return {
      articleLoading: true,
      articles: [],
      content: '',
      contentVisible: false,
      count: 0,
      id2Art: {},
      param: {
        offset: 10,
        pageNum: 1,
        sortBy: {},
        tagId: '',
      },
      search: {
        id2Tag: {},
      },
      selectedArt: initSelectedArtObj(),
    };
  },
  emits: ['history-add'],
  async created() {
    const data = await connector.get('getTags', {});
    this.search.id2Tag = data.tags;
    this.favorites = this.history
      .filter((e, i, l) => i === l.lastIndexOf(e))
      .filter((_, i, r) => i >= r.length - 50);
    this.$emit('history-update', this.favorites);
    await fillArticles(this, {
      ids: this.favorites.reverse(),
    });
  },
  methods: {
    fillArticleTags(art) {
      if (!art.tagLabels) {
        art.tagLabels = [];
      }
      if (!art.tagLabels.length) {
        art.tags.forEach(tagId =>
          art.tagLabels.push(this.search.id2Tag[tagId]),
        );
      }
    },
    handleCurrentChange(val) {
      this.param.pageNum = val;
      this.searchArticle();
    },
    handleSizeChange(val) {
      this.param.offset = val;
      this.param.pageNum = 1;
      this.searchArticle();
    },
    handleSortChange(column) {
      let val = column.order;
      this.param.sortBy = {};
      if (null !== val) {
        val = val.substring(0, 3);
        if (val === 'des') {
          val = 'desc';
        }
        this.param.sortBy[column.prop] = val;
      }
      this.searchArticle();
    },
    searchArticle() {
      window.scrollTo(0, 0);
      this.contentVisible = false;
      fillArticles(this, {
        ids: this.favorites.reverse(),
        sortBy: this.param.sortBy,
        page: this.param.pageNum,
        offset: this.param.offset,
      });
    },
    async showArticle(id) {
      this.selectedArt = this.articles[this.id2Art[id]];
      this.fillArticleTags(this.selectedArt);
      this.content = await connector.get('getArtContent', id);
      this.contentVisible = true;
    },
    tagComparator(a, b) {
      const aTagInfo = this.search.id2Tag[a],
        bTagInfo = this.search.id2Tag[b];
      if (aTagInfo.type === bTagInfo.type) {
        return aTagInfo.name > bTagInfo.name ? 1 : -1;
      }
      return bTagInfo.type - aTagInfo.type;
    },
  },
};
</script>

<style scoped></style>
