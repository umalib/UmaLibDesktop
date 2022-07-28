<template>
  <el-row>
    <el-col :offset="2" :span="20" style="text-align: center">
      <el-row>
        <h1>收藏夹</h1>
      </el-row>
      <el-row style="margin: 10px auto;">
        <el-button-group>
          <el-button @click="importFavorites" type="primary">
            导入
          </el-button>
          <el-button @click="exportFavorites" type="primary">
            导出
          </el-button>
        </el-button-group>
      </el-row>

      <div class="block">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="param.pageNum"
          :hide-on-single-page="count <= param.offset"
          :page-sizes="[10, 20, 25, 50]"
          :page-size="param.offset"
          :total="count"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
      <el-table
        @sort-change="handleSortChange"
        :data="articles"
        class="article-table"
        row-key="id"
        stripe
        style="width: 100%"
        v-loading="articleLoading"
      >
        <el-table-column
          :index="param.offset * (param.pageNum - 1) + 1"
          fixed
          type="index"
          width="54"
        />
        <el-table-column
          fixed
          label="标题"
          prop="name"
          sortable="custom"
          width="160"
        >
          <template v-slot="cell">
            <el-link
              @click="showArticle(cell.row['id'])"
              :underline="false"
              type="primary"
            >
              {{ cell.row['name'] ? cell.row['name'] : '「无题」' }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="标签" width="150">
          <template v-slot="cell">
            <span :key="tagId" v-for="tagId in cell.row['tags']">
              <el-tooltip
                v-if="search.id2Tag[tagId].name.length > 9"
                :content="search.id2Tag[tagId].name"
              >
                <el-tag size="mini">
                  {{ search.id2Tag[tagId].name.substring(0, 4) }}…{{
                    search.id2Tag[tagId].name.substring(
                      search.id2Tag[tagId].name.length - 4,
                    )
                  }}
                </el-tag>
              </el-tooltip>
              <el-tag v-else size="mini">
                {{ search.id2Tag[tagId].name }}
              </el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="作者" prop="author" width="150" />
        <el-table-column label="译者" prop="translator" width="150" />
        <el-table-column label="备注" prop="note" width="400" />
        <el-table-column
          fixed="right"
          label="上传时间"
          sortable="custom"
          prop="uploadTime"
          width="120"
        >
          <template v-slot="cell">
            {{ formatTimeStamp(cell.row['uploadTime']) }}
          </template>
        </el-table-column>
        <el-table-column
          label="来源"
          sortable="custom"
          prop="source"
          width="100"
        >
          <template v-slot="cell">
            <el-tooltip
              v-if="cell.row['source'].startsWith('http')"
              :content="cell.row['source']"
            >
              <el-link
                :href="cell.row['source']"
                target="_blank"
                type="primary"
              >
                外部链接
              </el-link>
            </el-tooltip>
            <span v-else>{{ cell.row['source'].toUpperCase() }}</span>
          </template>
        </el-table-column>
        <el-table-column
          fixed="right"
          label=""
          style="text-align: center"
          width="64"
        >
          <template v-slot="cell">
            <el-button
              @click="removeFavorite(cell.row['id'])"
              icon="el-icon-delete"
              round
              size="mini"
              type="danger"
            />
          </template>
        </el-table-column>
      </el-table>
      <div class="block">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="param.pageNum"
          :hide-on-single-page="count <= param.offset"
          :page-sizes="[10, 20, 25, 50]"
          :page-size="param.offset"
          :total="count"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
      <el-backtop />

      <show-article
        @close-art="
          content = '';
          contentVisible = false;
        "
        :content="content"
        :selected-art="selectedArt"
        :visible="contentVisible"
      />
    </el-col>
  </el-row>
</template>

<script>
import connector from '@/renderer/utils/connector';
import { formatTimeStamp } from '@/renderer/utils/renderer-utils';
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
  components: { ShowArticle },
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
  props: ['saveMe'],
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
        await this.$notify({
          message: `收藏夹导出成功！${path}`,
          title: '',
          type: 'success',
        });
      } else {
        await this.$notify({
          message: `导出收藏夹已取消`,
          title: '',
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
          art.tagLabels.push(this.search.id2Tag[tagId].name),
        );
      }
    },
    formatTimeStamp,
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
        await this.$notify({
          message: `导入收藏夹已取消`,
          title: '',
          type: 'warning',
        });
      } else if (favList.length !== undefined) {
        this.favorites = favList;
        await this.$notify({
          message: `收藏夹导入成功！`,
          title: '',
          type: 'success',
        });
        this.searchArticle();
      } else {
        await this.$notify({
          message: `请选取正确的导出文件！`,
          title: '',
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
  },
};
</script>

<style scoped></style>
