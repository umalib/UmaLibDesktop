<template>
  <el-row>
    <el-col :offset="2" :span="20" style="text-align: center">
      <el-row>
        <h1>长篇/合集总目</h1>
        <el-breadcrumb separator-class="el-icon-arrow-right">
          <el-breadcrumb-item :replace="true" :to="{ path: '/menu/m' }">
            总目
          </el-breadcrumb-item>
          <el-breadcrumb-item v-if="param.tagId !== ''">
            {{ search.id2Tag[param.tagId].name }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </el-row>

      <div v-if="param.tagId === ''">
        <el-row
          :key="index"
          v-for="(novelList, index) in search.novels"
          v-loading="loading.menu"
          style="margin:10px 0"
        >
          <el-col
            :key="novelId"
            v-for="(novelId, i2) in novelList"
            :offset="1 + !!(i2 % 4)"
            :span="4"
          >
            <el-link @click="showNovel(novelId)" :underline="false">
              <el-card shadow="hover">
                <el-image
                  :src="search.id2Tag[novelId]['cover']"
                  style="width: 100%"
                >
                  <div slot="error" class="default-cover">
                    <div>
                      {{ search.id2Tag[novelId].name }}
                    </div>
                  </div>
                </el-image>
                <div class="novel-info-small">
                  <p>
                    <strong>{{ search.id2Tag[novelId].name }}</strong>
                  </p>
                  <p>{{ search.id2Tag[novelId].author }} 著</p>
                </div>
              </el-card>
            </el-link>
          </el-col>
        </el-row>
      </div>

      <el-row v-else>
        <el-col :offset="8" :span="8">
          <h2>{{ search.id2Tag[param.tagId].name }}</h2>
          <div class="block">
            <el-image
              style="max-width: 100%; min-width: calc(500vw / 36 - 40px);"
              :src="search.id2Tag[param.tagId]['cover']"
              fit="contain"
            >
              <div slot="error" class="default-cover">
                <div>
                  {{ search.id2Tag[param.tagId].name }}
                </div>
              </div>
            </el-image>
          </div>
          <p>{{ search.id2Tag[param.tagId].author }} 著</p>
          <p
            v-if="search.id2Tag[param.tagId].description"
            class="novel-description"
          >
            <span
              v-bind:key="i"
              v-for="(content, i) in replaceNewLine(
                search.id2Tag[param.tagId].description,
              )"
            >
              <br v-if="i !== 0" />
              {{ content }}
            </span>
          </p>
        </el-col>

        <el-col>
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
            :default-sort="{ prop: 'uploadTime', order: 'ascending' }"
            class="article-table"
            row-key="id"
            stripe
            style="width: 100%"
            v-loading="loading.article"
          >
            <el-table-column
              :index="param.offset * (param.pageNum - 1) + 1"
              fixed
              type="index"
              width="54"
            />
            <el-table-column
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
            <el-table-column label="标签">
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
            <el-table-column label="译者" prop="translator" width="150" />
            <el-table-column label="备注" prop="note" width="400" />
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
              label="上传时间"
              sortable="custom"
              prop="uploadTime"
              width="160"
            >
              <template v-slot="cell">
                {{ formatTimeStamp(cell.row['uploadTime']) }}
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
      <el-backtop />
    </el-col>
  </el-row>
</template>

<script>
import connector from '@/renderer/utils/connector';
import { formatTimeStamp, splitList } from '@/renderer/utils/renderer-utils';
import ShowArticle from '@/renderer/views/sub-components/show-article';

async function fillArticles(_vue, param) {
  _vue.loading.article = true;
  const data = await connector.get('listArt', param);
  _vue.contentVisible = false;
  _vue.articles = [];
  _vue.id2Art = {};
  _vue.count = data.count;
  data.list.forEach(x => {
    x.tags = x.tags.filter(id => id !== _vue.param.tagId);
    x.tags.sort(_vue.tagComparator);
    _vue.id2Art[x.id] = _vue.articles.length;
    _vue.articles.push(x);
  });
  _vue.loading.article = false;
}

export default {
  name: 'MenuView',
  components: { ShowArticle },
  data() {
    return {
      articles: [],
      content: '',
      contentVisible: false,
      count: 0,
      id2Art: {},
      loading: {
        article: true,
        menu: true,
      },
      param: {
        offset: 10,
        pageNum: 1,
        sortBy: {
          uploadTime: 'asc',
        },
        tagId: '',
      },
      search: {
        id2Tag: {},
        novels: [],
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
    const _vue = this;
    function jump2Novel(id) {
      if (id !== 'm') {
        _vue.param.tagId = Number(id);
        _vue.param.pageNum = 1;
        _vue.searchArticle();
      } else {
        _vue.param.tagId = '';
      }
    }
    this.$watch(() => this.$route.params.id, jump2Novel);
    const data = await connector.get('getLongNovelTags', {});
    this.search.id2Tag = data.tags;
    this.search.novels = splitList(data.novels, 4);
    this.loading.menu = false;
    jump2Novel(this.$route.params.id);
  },
  methods: {
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
    replaceNewLine(content) {
      return content.split('\n');
    },
    searchArticle() {
      window.scrollTo(0, 0);
      this.contentVisible = false;
      fillArticles(this, {
        tagIds: [this.param.tagId],
        noTagIds: [this.saveMe],
        keyword: '',
        someone: '',
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
    showNovel(id) {
      this.$router.push(`/menu/${id}`);
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

<style lang="scss">
div.el-col > a.el-link,
div.el-col > a.el-link > span.el-link--inner {
  width: 100%;
}
div.default-cover {
  color: black;
  background-image: url('../images/cover.png');
  background-size: contain;
  background-repeat: no-repeat;
  width: 100%;
  height: 0;
  padding-bottom: calc(100% * 937 / 666);

  div {
    font-size: 14px;
    font-weight: normal;
    padding: 35% 20% 0 20%;
  }
}

div.novel-info-small {
  strong {
    font-size: 16px;
  }
}

p.novel-description {
  text-align: left;
  font-size: 14px;
  line-height: 2;
}
</style>
