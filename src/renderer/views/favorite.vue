<template>
  <el-row>
    <el-col :offset="2" :span="20" style="text-align: center">
      <el-row>
        <h1>{{ titles.favorite }}</h1>
      </el-row>
      <el-row style="margin: 10px auto;">
        <el-button-group>
          <el-button type="primary" @click="importFavorites">
            导入
          </el-button>
          <el-button type="primary" @click="exportFavorites">
            导出
          </el-button>
        </el-button-group>
      </el-row>

      <article-table
        :articles="articles"
        :count="count"
        :id2-tag="search.id2Tag"
        :layout="'favorite'"
        :loading="articleLoading"
        :param="param"
        @art-show="
          $emit('history-add', $event);
          showArticle($event);
        "
        @current-change="handleCurrentChange"
        @favorite-delete="removeFavorite($event)"
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
  if (Object.keys(_vue.param.sortBy).length === 0) {
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
  name: 'FavoriteView',
  components: { ArticleTable, ShowArticle },
  data() {
    return {
      articleLoading: true,
      articles: [],
      content: '',
      contentVisible: false,
      count: 0,
      favorites: [],
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
      selectedArt: {
        author: '',
        id: -1,
        name: '',
        note: '',
        tagLabels: [],
        tags: [],
        translator: '',
      },
    };
  },
  props: ['saveMe', 'titles'],
  async created() {
    const data = await connector.get('getTags', {});
    this.search.id2Tag = data.tags;
    this.favorites = await connector.get('getFavorites', {});
    await fillArticles(this, {
      ids: this.favorites,
    });
  },
  methods: {
    async exportFavorites() {
      const path = await connector.get('exportFavorites', {});
      if (path) {
        this.$notify({
          message: `${path}`,
          title: '收藏夹导出成功！',
          type: 'success',
        });
      } else {
        this.$notify({
          message: '',
          title: '导出收藏夹已取消',
          type: 'warning',
        });
      }
    },
    fillArticleTags(art) {
      if (!art.tagLabels) {
        art.tagLabels = [];
      }
      if (art.tagLabels.length === 0) {
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
    async importFavorites() {
      const favList = await connector.get('importFavorites', {});
      if (!favList) {
        this.$notify({
          message: '',
          title: '导入收藏夹已取消',
          type: 'warning',
        });
      } else if (favList.length !== undefined) {
        this.favorites = favList;
        this.$notify({
          message: '',
          title: '收藏夹导入成功！',
          type: 'success',
        });
        this.searchArticle();
      } else {
        this.$notify({
          message: '',
          title: '请选取正确的导出文件！',
          type: 'error',
        });
      }
    },
    searchArticle() {
      window.scrollTo(0, 0);
      this.contentVisible = false;
      fillArticles(this, {
        ids: this.favorites,
        sortBy: this.param.sortBy,
        page: this.param.pageNum,
        offset: this.param.offset,
      });
    },
    async removeFavorite(id) {
      this.favorites = await connector.get('removeFavorite', id);
      this.searchArticle();
      this.$message({
        message: `取消收藏 ${this.articles[this.id2Art[id]].name}`,
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
