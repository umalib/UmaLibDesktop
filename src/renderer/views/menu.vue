<template>
  <el-row>
    <el-col :offset="2" :span="20" style="text-align: center">
      <el-row>
        <h1>{{ titles.menu }}</h1>
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
          v-for="(novelList, index) in search.novels"
          :key="index"
          v-loading="loading.menu"
          style="margin:10px 0"
        >
          <el-col
            v-for="(novelId, i2) in novelList"
            :key="novelId"
            :offset="1 + !!(i2 % 4)"
            :span="4"
          >
            <el-link :underline="false" @click="showNovel(novelId)">
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
              :src="search.id2Tag[param.tagId]['cover']"
              fit="contain"
              style="max-width: 100%; min-width: calc(500vw / 36 - 40px);"
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
              v-for="(content, i) in replaceNewLine(
                search.id2Tag[param.tagId].description,
              )"
              :key="i"
            >
              <br v-if="i !== 0" />
              {{ content }}
            </span>
          </p>
        </el-col>

        <el-col>
          <article-table
            :articles="articles"
            :count="count"
            :el-tag-map="search.tagType2ElTagType"
            :id2-tag="search.id2Tag"
            :layout="'menu'"
            :loading="loading.article"
            :novel-tag="param.tagId"
            :param="param"
            @art-show="
              $emit('history-add', $event);
              showArticle($event);
            "
            @current-change="handleCurrentChange"
            @size-change="handleSizeChange"
            @sort-change="handleSortChange"
          />

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
      <el-backtop />
    </el-col>
  </el-row>
</template>

<script>
import connector from '@/renderer/utils/connector';
import { splitList } from '@/renderer/utils/renderer-utils';
import ArticleTable from '@/renderer/views/sub-components/article-table';
import ShowArticle from '@/renderer/views/sub-components/show-article';

async function fillArticles(_vue, param) {
  _vue.loading.article = true;
  const data = await connector.get('listArt', param);
  _vue.contentVisible = false;
  _vue.articles = [];
  _vue.id2Art = {};
  _vue.count = data.count;
  data.list.forEach(x => {
    x.tags.sort(_vue.tagComparator);
    _vue.id2Art[x.id] = _vue.articles.length;
    _vue.articles.push(x);
  });
  _vue.loading.article = false;
}

export default {
  name: 'MenuView',
  components: { ArticleTable, ShowArticle },
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
  props: ['saveMe', 'titles'],
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
    replaceNewLine(content) {
      return content.split('\n');
    },
    searchArticle() {
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
