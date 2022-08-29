<template>
  <el-row>
    <el-col :offset="2" :span="20" style="text-align: center">
      <el-row>
        <h1>大书库</h1>
      </el-row>
      <el-row>
        <el-col :offset="10" :span="4">
          <el-button
            v-if="cue >= 10"
            style="width: 100%"
            type="primary"
            @click="showPubDialog"
          >
            发布新作品
          </el-button>
        </el-col>
        <el-col :offset="1" :span="8" style="float: right">
          <el-tooltip content="不知道看什么？试试这些！">
            <el-button-group>
              <el-button
                v-if="cue >= 10 || builtInDb"
                type="success"
                @click="visible.recommend = true"
              >
                推荐
              </el-button>
              <el-button type="success" @click="showRandomArticle">
                手气不错
              </el-button>
              <el-button type="success" @click="showRandomArticle(11)">
                十连！
              </el-button>
            </el-button-group>
          </el-tooltip>
        </el-col>
      </el-row>
      <el-row style="margin: 10px auto;">
        <el-col :offset="1" :span="10">
          <el-cascader
            v-model="param.tagIds"
            :filter-method="filterTagsInCascader"
            :options="search.tagCascaderOptions"
            :props="search.cascaderProps"
            :show-all-levels="false"
            clearable
            filterable
            placeholder="请选择想检索的标签"
            style="width: 100%"
            @change="resetPageNumAndSearchArticle"
          >
            <template v-slot="{ node, data }">
              <span>{{ data.label }}</span>
              <span v-if="!node.isLeaf">({{ data.children.length }})</span>
            </template>
          </el-cascader>
          <el-cascader
            v-model="param.noTagIds"
            :filter-method="filterTagsInCascader"
            :options="search.noTagCascaderOptions"
            :props="search.cascaderProps"
            :show-all-levels="false"
            clearable
            filterable
            placeholder="请选择想筛去的标签"
            style="width: 100%"
            @change="resetPageNumAndSearchArticle"
          >
            <template v-slot="{ node, data }">
              <span>{{ data.label }}</span>
              <span v-if="!node.isLeaf">({{ data.children.length }})</span>
            </template>
          </el-cascader>
        </el-col>
        <el-col :span="10">
          <el-select
            v-model="param.someone"
            clearable
            filterable
            placeholder="请选择作者/译者"
            style="width: 100%"
            @change="resetPageNumAndSearchArticle"
          >
            <el-option-group
              v-for="group in search.authorOptions"
              :key="group.label"
              :label="group.label"
            >
              <el-option
                v-for="item in group.options"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-option-group>
          </el-select>
          <el-input
            v-model="param.keyword"
            placeholder="请输入关键词"
            @change="resetPageNumAndSearchArticle"
          >
            <el-button
              slot="append"
              icon="el-icon-circle-close"
              @click="
                param.keyword = '';
                resetPageNumAndSearchArticle();
              "
            />
          </el-input>
        </el-col>
        <el-col :span="2">
          <el-button
            style="width: 100%"
            type="danger"
            @click="clearSearchParam"
          >
            重置
          </el-button>
          <el-tooltip
            content="在搜索结果中不返回NTR、R18G等引起争议/令人不适的作品"
          >
            <el-checkbox
              v-model="search.preventSensitive"
              style="line-height: 42px; margin-left: 5px"
              @change="changePrevents"
            >
              屏蔽争议/不适的作品
            </el-checkbox>
          </el-tooltip>
        </el-col>
      </el-row>

      <div class="block">
        <el-pagination
          :current-page="param.pageNum"
          :hide-on-single-page="count <= 10"
          :page-size="param.offset"
          :page-sizes="[10, 20, 25, 50]"
          :total="count"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
      <el-table
        v-loading="articleLoading"
        :data="articles"
        :default-sort="{ prop: 'uploadTime', order: 'descending' }"
        class="article-table"
        row-key="id"
        stripe
        style="width: 100%"
        @sort-change="handleSortChange"
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
          width="200"
        >
          <template v-slot="cell">
            <el-link
              :underline="false"
              type="primary"
              @click="showArticle(cell.row['id'])"
            >
              {{ cell.row['name'] ? cell.row['name'] : '「无题」' }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="标签" width="140">
          <template v-slot="cell">
            <el-tooltip
              v-for="tagId in cell.row['tags']"
              :key="tagId"
              effect="light"
              placement="right"
            >
              <div slot="content">
                <span v-if="search.id2Tag[tagId].name.length > 9">
                  {{ search.id2Tag[tagId].name }}
                </span>
                <el-tag
                  :type="search.tagType2ElTagType[search.id2Tag[tagId].type]"
                  size="mini"
                  style="margin-right: 10px"
                >
                  {{ search.tagType2Name[search.id2Tag[tagId].type] }}
                </el-tag>
                <el-button
                  circle
                  icon="el-icon-plus"
                  size="mini"
                  type="success"
                  @click="handleTagLink(tagId, true)"
                />
                <el-button
                  circle
                  icon="el-icon-minus"
                  size="mini"
                  type="danger"
                  @click="handleTagLink(tagId)"
                />
              </div>
              <el-link
                :underline="false"
                type="primary"
                @click="handleTagLinkWithReplace(tagId)"
              >
                <el-tag v-if="search.id2Tag[tagId].name.length > 9" size="mini">
                  {{ search.id2Tag[tagId].name.substring(0, 4) }}…{{
                    search.id2Tag[tagId].name.substring(
                      search.id2Tag[tagId].name.length - 4,
                    )
                  }}
                </el-tag>
                <el-tag v-else size="mini">
                  {{ search.id2Tag[tagId].name }}
                </el-tag>
              </el-link>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="作者" prop="author" width="150">
          <template v-slot="cell">
            <el-link
              v-if="cell.row['author']"
              :underline="false"
              type="primary"
              @click="handleAuthorLink(cell.row['author'])"
            >
              {{ cell.row['author'] }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="译者" prop="translator" width="150">
          <template v-slot="cell">
            <el-link
              v-if="cell.row['translator']"
              :underline="false"
              type="primary"
              @click="handleAuthorLink(cell.row['translator'])"
            >
              {{ cell.row['translator'] }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="note" width="400" />
        <el-table-column
          fixed="right"
          label="上传时间"
          prop="uploadTime"
          sortable="custom"
          width="125"
        >
          <template v-slot="cell">
            {{ formatTimeStamp(cell.row['uploadTime']) }}
          </template>
        </el-table-column>
        <el-table-column label="来源" prop="source" sortable="custom">
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
          :width="cue >= 10 ? 150 : 107"
          fixed="right"
          label=""
          style="text-align: center"
        >
          <template v-slot="cell">
            <el-button-group>
              <el-button
                v-if="cue >= 10"
                icon="el-icon-edit"
                round
                size="mini"
                type="primary"
                @click="showEditDialog(cell.row['id'])"
              />
              <el-button
                :icon="
                  favorites[cell.row['id']]
                    ? 'el-icon-star-on'
                    : 'el-icon-star-off'
                "
                :type="favorites[cell.row['id']] ? 'success' : 'info'"
                round
                size="mini"
                @click="changeFavorites(cell.row['id'])"
              />
              <el-button
                icon="el-icon-delete"
                round
                size="mini"
                type="danger"
                @click="deleteArticle(cell.row['id'])"
              />
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
      <div class="block">
        <el-pagination
          :current-page="param.pageNum"
          :hide-on-single-page="count <= 10"
          :page-size="param.offset"
          :page-sizes="[10, 20, 25, 50]"
          :total="count"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
      <el-backtop />

      <show-article
        :content="content"
        :selected-art="selectedArt"
        :visible="visible.content"
        @close-art="
          content = '';
          visible.content = false;
        "
      />

      <pub-article
        :author-options="search.authorOptions"
        :new-text="newText"
        :publishDisable="publishDisable"
        :tag-options="search.tagOptions"
        :title="publishTitle"
        :visible="visible.publish"
        @close-pub="visible.publish = false"
        @publish-article="publish"
        @reset-art="resetNewArt"
      />

      <random-articles
        :id2-tag="search.id2Tag"
        :random-list="randomList"
        :visible="visible.random"
        @close-random="visible.random = false"
        @show-art="showArticle"
      />

      <recommended-articles
        :save-me="saveMe"
        :visible="visible.recommend"
        @close-recommend="visible.recommend = false"
        @show-art="showArticle"
        @show-novel="$router.push(`/menu/${$event}`)"
        @show-someone="showSomeoneFromRec"
        @show-tag="showTagFromRec"
      />
    </el-col>
  </el-row>
</template>

<script>
import connector from '@/renderer/utils/connector';
import EmbeddedData from '@/renderer/utils/data';
import {
  formatTimeStamp,
  getNewTextObj,
} from '@/renderer/utils/renderer-utils';
import 'quill/dist/quill.core.css'; // import styles
import 'quill/dist/quill.snow.css'; // for snow theme
// import 'quill/dist/quill.bubble.css'; // for bubble theme
import PubArticle from '@/renderer/views/sub-components/pub-article';
import RandomArticles from '@/renderer/views/sub-components/random-articles';
import RecommendedArticles from '@/renderer/views/sub-components/recommended-articles';
import ShowArticle from '@/renderer/views/sub-components/show-article';

function creator2SelectOption(x) {
  return { value: x, label: x };
}

async function fillArticles(_vue, param) {
  _vue.articleLoading = true;
  const data = await connector.get('listArt', param);
  _vue.visible.content = false;
  _vue.articles = [];
  _vue.id2Art = {};
  _vue.count = data.count;
  data.list.forEach(x => {
    x.tags.sort(_vue.tagComparator);
    _vue.id2Art[x.id] = _vue.articles.length;
    _vue.articles.push(x);
  });
  _vue.articleLoading = false;
}

async function getTagsFromServer(_vue) {
  const data = await connector.get('getTags', {});
  _vue.search.id2Tag = data.tags;
  _vue.search.tagOptions = [];
  _vue.search.tagCascaderOptions = [];
  _vue.search.noTagCascaderOptions = [];
  _vue.search.sensitiveTags = [];
  if (data['typeMap'][4]) {
    _vue.search.sensitiveTags = data['typeMap'][4];
  }
  for (let k in data['typeMap']) {
    if (_vue.search.preventSensitive && Number(k) === 4) {
      continue;
    }
    let v = data['typeMap'][k];
    let options = [];
    v.filter(x => x !== _vue.saveMe).forEach(x =>
      options.push({
        value: x,
        label: _vue.search.id2Tag[x].name,
      }),
    );
    _vue.search.tagOptions.push({
      label: EmbeddedData.tagTypes[k],
      options,
    });
    _vue.search.tagCascaderOptions.push({
      value: k,
      label: EmbeddedData.tagTypes[k],
      children: options.map(x => {
        return {
          value: x.value,
          label: `+${x.label}`,
        };
      }),
    });
    _vue.search.noTagCascaderOptions.push({
      value: k,
      label: EmbeddedData.tagTypes[k],
      children: options.map(x => {
        return {
          value: x.value,
          label: `-${x.label}`,
        };
      }),
    });
  }
  if (
    _vue.search.tagOptions.length > 1 &&
    _vue.search.tagOptions[0].label === EmbeddedData.tagTypes[0]
  ) {
    let others = _vue.search.tagOptions.splice(0, 1);
    _vue.search.tagOptions.push(others[0]);
    others = _vue.search.tagCascaderOptions.splice(0, 1);
    _vue.search.tagCascaderOptions.push(others[0]);
    others = _vue.search.noTagCascaderOptions.splice(0, 1);
    _vue.search.noTagCascaderOptions.push(others[0]);
  }
}

async function getAuthorsFromServer(_vue) {
  const data = await connector.get('getAuthors', {});
  _vue.search.authorOptions = [
    {
      label: '两栖',
      options: data['double'].map(creator2SelectOption),
    },
    {
      label: '译者',
      options: data['translators'].map(creator2SelectOption),
    },
    {
      label: '作者',
      options: data['authors'].map(creator2SelectOption),
    },
  ];
}

function updateFavorites(_vue, favList) {
  _vue.favorites = {};
  favList.forEach(x => (_vue.favorites[x] = true));
}

export default {
  name: 'ArticleView',
  components: { RecommendedArticles, RandomArticles, PubArticle, ShowArticle },
  data() {
    return {
      articles: [],
      articleLoading: true,
      content: '',
      count: 0,
      favorites: {},
      id2Art: {},
      newText: getNewTextObj(),
      param: {
        keyword: '',
        noTagIds: [],
        offset: 10,
        pageNum: 1,
        someone: '',
        sortBy: {
          uploadTime: 'desc',
        },
        tagIds: [],
      },
      publishDisable: false,
      publishTitle: '',
      randomList: [],
      search: {
        authorOptions: [],
        cascaderProps: {
          checkStrictly: false,
          emitPath: false,
          expandTrigger: 'hover',
          multiple: true,
        },
        id2Tag: {},
        noTagCascaderOptions: [],
        preventSensitive: true,
        sensitiveTags: [],
        tagCascaderOptions: [],
        tagOptions: [],
        tagType2ElTagType: EmbeddedData.elTagTypes,
        tagType2Name: EmbeddedData.tagTypes,
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
      visible: {
        publish: false,
        content: false,
        random: false,
        recommend: false,
      },
    };
  },
  props: ['builtInDb', 'cue', 'saveMe'],
  async created() {
    updateFavorites(this, await connector.get('getFavorites'));
    await getTagsFromServer(this);
    getAuthorsFromServer(this).then();
    fillArticles(this, {
      noTagIds: this.fillNoTagIds(),
      sortBy: this.param.sortBy,
    }).then();
  },
  methods: {
    async changeFavorites(id) {
      if (this.favorites[id]) {
        updateFavorites(this, await connector.get('removeFavorite', id));
        this.$message({
          message: `取消收藏 ${this.articles[this.id2Art[id]].name}`,
        });
      } else {
        updateFavorites(this, await connector.get('addFavorite', id));
        this.$message({
          type: 'success',
          message: `收藏 ${this.articles[this.id2Art[id]].name} 成功！`,
        });
      }
    },
    async changePrevents() {
      this.param.pageNum = 1;
      await getTagsFromServer(this);
      this.searchArticle();
    },
    clearSearchParam() {
      this.param.tagIds = [];
      this.param.noTagIds = [];
      this.param.someone = '';
      this.param.keyword = '';
      this.param.pageNum = 1;
      this.search.preventSensitive = true;
      this.searchArticle();
    },
    async deleteArticle(id) {
      try {
        await this.$confirm(
          `确定删除作品 ${this.articles[this.id2Art[id]].name}？`,
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          },
        );
        await connector.get('deleteArt', id);
        this.$message({
          type: 'success',
          message: '删除成功！',
        });
        if (
          this.param.pageNum > 1 &&
          this.count % this.param.offset === 1 &&
          this.param.pageNum === Math.ceil(this.count / this.param.offset)
        ) {
          this.param.pageNum -= 1;
        }
        this.searchArticle();
      } catch (_) {
        this.$message({
          type: 'info',
          message: '删除已取消',
        });
      }
    },
    fillArticleTags(art) {
      if (!art.tagLabels) {
        art.tagLabels = [];
      }
      if (art.tagLabels.length === 0) {
        art.tags.forEach(tagId =>
          art.tagLabels.push({
            name: this.search.id2Tag[tagId].name,
            elType: this.search.tagType2ElTagType[
              this.search.id2Tag[tagId].type
            ],
          }),
        );
      }
    },
    fillNoTagIds() {
      let noTagIds = [].concat(this.param.noTagIds);
      if (this.search.preventSensitive) {
        noTagIds.push.apply(noTagIds, this.search.sensitiveTags);
      }
      if (this.saveMe > 0) {
        noTagIds.push(this.saveMe);
      }
      return noTagIds;
    },
    filterTagsInCascader(node, keyword) {
      return (
        node.isLeaf &&
        node.text.toLowerCase().indexOf(keyword.toLowerCase()) !== -1
      );
    },
    formatTimeStamp,
    handleAuthorLink(someone) {
      this.param.someone = someone;
      this.param.pageNum = 1;
      this.searchArticle();
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
    handleTagLinkWithReplace(tagId) {
      this.param.tagIds = [tagId];
      this.param.noTagIds = [];
      this.param.pageNum = 1;
      this.searchArticle();
    },
    handleTagLink(tagId, isAppend) {
      let tagIndex = this.param.tagIds.indexOf(tagId);
      const lengthArr = [this.param.tagIds.length, this.param.noTagIds.length];
      if (isAppend) {
        if (tagIndex === -1) {
          this.param.tagIds = this.param.tagIds.concat([tagId]);
        }
      } else {
        if (tagIndex !== -1) {
          this.param.tagIds = this.param.tagIds.filter(
            (_, i) => i !== tagIndex,
          );
        }
        this.param.noTagIds = this.param.noTagIds.concat([tagId]);
      }
      if (
        this.param.tagIds.length !== lengthArr[0] ||
        this.param.noTagIds.length !== lengthArr[1]
      ) {
        this.param.pageNum = 1;
        this.searchArticle();
      }
    },
    async publish() {
      this.publishDisable = true;
      if (!this.newText.author) {
        this.newText.author = '匿名';
      }
      if (this.newText.source.startsWith('[')) {
        this.newText.source = this.newText.source.substring(1);
      }
      if (this.newText.source.endsWith(']')) {
        this.newText.source = this.newText.source.substring(
          0,
          this.newText.source.length - 1,
        );
      }
      if (
        this.newText.source.startsWith('tsumanne.net') ||
        this.newText.source.startsWith('www.pixiv.net')
      ) {
        this.newText.source = 'https://' + this.newText.source;
      }
      if (this.newText.source.startsWith('pixiv.net')) {
        this.newText.source = 'https://www.' + this.newText.source;
      }
      const pubResult = await connector.get('pubArticle', {
        id: this.newText.id,
        name: this.newText.name,
        author: this.newText.author,
        translator: this.newText.translator,
        uploadTime: this.newText.uploadTime
          ? this.newText.uploadTime
          : new Date().getTime(),
        source: this.newText.source,
        note: this.newText.note,
        content: this.newText.content,
        tags: this.newText.tags,
      });
      if (pubResult) {
        this.$notify({
          message: `作品 ${this.newText.name} ${
            this.newText.id === undefined ? '发布' : '编辑'
          }成功！`,
          title: '',
          type: 'success',
        });
        this.visible.publish = false;
        this.newText = getNewTextObj();
        await getTagsFromServer(this);
        this.searchArticle();
      } else {
        this.$notify({
          message: `内部错误！请联系开发者！`,
          title: '',
          type: 'error',
        });
      }
      this.publishDisable = false;
    },
    resetNewArt() {
      this.newText = getNewTextObj();
    },
    resetPageNumAndSearchArticle() {
      this.param.pageNum = 1;
      this.searchArticle();
    },
    searchArticle() {
      window.scrollTo(0, 0);
      this.visible.content = false;
      fillArticles(this, {
        tagIds: this.param.tagIds,
        noTagIds: this.fillNoTagIds(),
        keyword: this.param.keyword,
        someone: this.param.someone,
        sortBy: this.param.sortBy,
        page: this.param.pageNum,
        offset: this.param.offset,
      });
    },
    async showArticle(id) {
      if (id && this.id2Art[id]) {
        this.selectedArt = this.articles[this.id2Art[id]];
        this.fillArticleTags(this.selectedArt);
        this.content = await connector.get('getArtContent', id);
        this.visible.content = true;
      } else {
        this.selectedArt = await connector.get('getArt', id);
        this.selectedArt.tags.sort(this.tagComparator);
        this.fillArticleTags(this.selectedArt);
        this.content = this.selectedArt.content;
        delete this.selectedArt.content;
        this.visible.content = true;
      }
    },
    async showEditDialog(id) {
      const art = this.articles[this.id2Art[id]];
      this.fillArticleTags(art);
      this.publishTitle = `修改作品 ${art.name}`;
      this.newText = {
        author: art.author,
        content: await connector.get('getArtContent', id),
        id,
        name: art.name,
        note: art.note,
        source: art.source,
        tags: art.tagLabels.map(label => label.name),
        translator: art.translator,
        uploadTime: art.uploadTime,
      };
      this.visible.publish = true;
    },
    showPubDialog() {
      this.publishTitle = '发布新作品';
      this.newText.id = undefined;
      this.visible.publish = true;
    },
    async showRandomArticle(num) {
      const param = {
        noTagIds: this.fillNoTagIds(),
      };
      if (num && num > 1) {
        param.count = num;
        this.randomList = await connector.get('getRandomArt', param);
        if (this.randomList.length) {
          this.randomList.forEach(x => {
            x.tags.sort(this.tagComparator);
            this.fillArticleTags(x);
          });
          this.visible.random = true;
        } else {
          this.$notify({
            message: `无可返回的怪文书！`,
            title: '',
            type: 'error',
          });
        }
      } else {
        this.selectedArt = await connector.get('getRandomArt', param);
        if (this.selectedArt.content) {
          this.content = this.selectedArt.content;
          delete this.selectedArt.content;
          this.fillArticleTags(this.selectedArt);
          this.visible.content = true;
        } else {
          this.$notify({
            message: `无可返回的怪文书！`,
            title: '',
            type: 'error',
          });
        }
      }
    },
    showSomeoneFromRec(someone) {
      this.visible.recommend = false;
      this.param.tagIds = [];
      this.param.noTagIds = [];
      this.param.someone = someone;
      this.param.keyword = '';
      this.searchArticle();
    },
    showTagFromRec(tagId) {
      this.visible.recommend = false;
      this.param.tagIds = [tagId];
      this.param.noTagIds = [];
      this.param.someone = '';
      this.param.keyword = '';
      this.searchArticle();
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
.ql-editor img {
  max-width: 100%;
}

.new-article .ql-editor,
.uma-article .normal-font .ql-editor {
  h1 {
    font-size: 28px;
    line-height: 2;
  }

  h2 {
    font-size: 23px;
    line-height: 2;
  }

  p,
  li {
    font-size: 16px;
    line-height: 2;
  }

  span.ql-size-large {
    font-size: 20px;
  }

  span.ql-size-small,
  blockquote {
    font-size: 12px;
  }
}

div.el-dialog {
  height: calc(100% - 60px);
  margin: 30px auto !important;

  div.el-dialog__body {
    height: calc(100% - 124px);
    padding-top: 0;
    padding-bottom: 0;
  }
}

div.el-scrollbar__wrap {
  overflow-x: hidden;
}

.el-cascader__suggestion-panel.el-scrollbar .el-scrollbar__wrap {
  margin-bottom: 0 !important;
}
</style>
