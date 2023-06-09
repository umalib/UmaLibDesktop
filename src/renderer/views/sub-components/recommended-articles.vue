<template>
  <el-dialog
    :visible="visible"
    center
    class="recommend-article"
    title="作品推荐"
    width="80%"
    @close="$emit('recommend-close')"
  >
    <el-row>
      <el-col :offset="2" :span="20">
        <el-tabs v-model="activeName">
          <el-tab-pane label="作者/译者推荐" name="creator-recommend">
            <el-scrollbar style="height: 100%">
              <el-collapse v-model="collapse.creator" :accordion="true">
                <el-collapse-item
                  v-for="(recs, i) in recommendations.creators.filter(
                    x => saveMe < 0 || !x[0].r,
                  )"
                  :key="`creator-${i}`"
                  :name="`creator-${i}`"
                  :title="`${creatorType[recs[0].type]} ${recs[0].title}`"
                >
                  <p>
                    <el-link
                      type="primary"
                      @click="$emit('someone-show', recs[0].title)"
                    >
                      {{ recs[0].title }}
                    </el-link>
                  </p>
                  <el-card
                    v-for="(rec, j) in recs"
                    :key="`rec-${i}-${j}`"
                    shadow="hover"
                  >
                    <span
                      v-for="(content, k) in rec.reason"
                      :key="`rec-${i}-${j}-${k}`"
                    >
                      {{ content }}
                      <br />
                    </span>
                    <strong class="recommender">
                      ——
                      <el-link
                        type="primary"
                        @click="$emit('someone-show', rec.name)"
                      >
                        {{ rec.name }}
                      </el-link>
                    </strong>
                  </el-card>
                </el-collapse-item>
              </el-collapse>
            </el-scrollbar>
          </el-tab-pane>
          <el-tab-pane label="长篇/合集推荐" name="novel-recommend">
            <el-scrollbar style="height: 100%">
              <el-collapse v-model="collapse.novel" :accordion="true">
                <el-collapse-item
                  v-for="(recs, i) in recommendations.novels.filter(
                    x => saveMe < 0 || !x[0].r,
                  )"
                  :key="`novel-${i}`"
                  :name="`novel-${i}`"
                  :title="
                    `${recs[0].type - 2 ? '长篇小说' : '短篇合集'} ${
                      recs[0].title
                    }`
                  "
                >
                  <p>
                    <el-link
                      type="primary"
                      @click="$emit('novel-show', recs[0]['refId'])"
                    >
                      {{ recs[0].title }}
                    </el-link>
                  </p>
                  <el-card
                    v-for="(rec, j) in recs"
                    :key="`rec-${i}-${j}`"
                    shadow="hover"
                  >
                    <span
                      v-for="(content, k) in rec.reason"
                      :key="`rec-${i}-${j}-${k}`"
                    >
                      {{ content }}
                      <br />
                    </span>
                    <strong class="recommender">
                      ——
                      <el-link
                        type="primary"
                        @click="$emit('someone-show', rec.name)"
                      >
                        {{ rec.name }}
                      </el-link>
                    </strong>
                  </el-card>
                </el-collapse-item>
              </el-collapse>
            </el-scrollbar>
          </el-tab-pane>
          <el-tab-pane label="系列推荐" name="series-recommend">
            <el-scrollbar style="height: 100%">
              <el-collapse v-model="collapse.series" :accordion="true">
                <el-collapse-item
                  v-for="(recs, i) in recommendations.series.filter(
                    x => saveMe < 0 || !x[0].r,
                  )"
                  :key="`series-${i}`"
                  :name="`series-${i}`"
                  :title="
                    `系列 ${recs[0].title}${
                      Object.keys(recs[0].others).length
                        ? ' ' +
                          Object.values(recs[0].others)
                            .filter(x => typeof x === 'string')
                            .join(' ')
                        : ''
                    }`
                  "
                >
                  <p>
                    <el-link
                      type="primary"
                      @click="
                        $emit('tag-show', recs[0]['refId'], recs[0].others.join)
                      "
                    >
                      {{ recs[0].title }}
                    </el-link>
                    <span v-for="(tag, tagId) in recs[0].others" :key="tagId">
                      <template v-if="tagId !== 'join'">
                        <br />
                        <el-link
                          type="primary"
                          @click="$emit('tag-show', Number(tagId))"
                        >
                          {{ tag }}
                        </el-link>
                      </template>
                    </span>
                  </p>
                  <el-card
                    v-for="(rec, j) in recs"
                    :key="`rec-${i}-${j}`"
                    shadow="hover"
                  >
                    <span
                      v-for="(content, k) in rec.reason"
                      :key="`rec-${i}-${j}-${k}`"
                    >
                      {{ content }}
                      <br />
                    </span>
                    <strong class="recommender">
                      ——
                      <el-link
                        type="primary"
                        @click="$emit('someone-show', rec.name)"
                      >
                        {{ rec.name }}
                      </el-link>
                    </strong>
                  </el-card>
                </el-collapse-item>
              </el-collapse>
            </el-scrollbar>
          </el-tab-pane>
          <el-tab-pane label="单篇作品推荐" name="art-recommend">
            <el-scrollbar style="height: 100%">
              <el-collapse v-model="collapse.article" :accordion="true">
                <el-collapse-item
                  v-for="(recs, i) in recommendations.articles.filter(
                    x => saveMe < 0 || !x[0].r,
                  )"
                  :key="`art-${i}`"
                  :name="`article-${i}`"
                  :title="
                    `作品 ${getTitle(recs[0].title)}${
                      Object.keys(recs[0].others).length
                        ? ` ${Object.values(recs[0].others)
                            .map(getTitle)
                            .join('')}`
                        : ''
                    }`
                  "
                >
                  <p>
                    <el-link
                      type="primary"
                      @click="$emit('art-show', recs[0]['refId'])"
                    >
                      {{ getTitle(recs[0].title) }}
                    </el-link>
                    <span
                      v-for="(artTitle, artId) in recs[0].others"
                      :key="artId"
                    >
                      <br />
                      <el-link
                        @click="$emit('art-show', Number(artId))"
                        type="primary"
                      >
                        {{ getTitle(artTitle) }}
                      </el-link>
                    </span>
                  </p>
                  <el-card
                    v-for="(rec, j) in recs"
                    :key="`rec-${i}-${j}`"
                    shadow="hover"
                  >
                    <span
                      v-for="(content, k) in rec.reason"
                      :key="`rec-${i}-${j}-${k}`"
                    >
                      {{ content }}
                      <br />
                    </span>
                    <strong class="recommender">
                      ——
                      <el-link
                        type="primary"
                        @click="$emit('someone-show', rec.name)"
                      >
                        {{ rec.name }}
                      </el-link>
                    </strong>
                  </el-card>
                </el-collapse-item>
              </el-collapse>
            </el-scrollbar>
          </el-tab-pane>
          <el-tab-pane label="用语解释" name="dictionary">
            <el-scrollbar style="height: 100%">
              <div style="text-align: center">
                <h3>【部分二创内容的内容说明、梗词词典等】</h3>
                <p>
                  此页面并非是推荐，是对于“看不懂这二创是啥”的各种创作要素 ·
                  梗词的介绍
                </p>
              </div>
              <span v-for="(entries, _class, i) in dict" :key="`dict-${i}`">
                <el-divider />
                <strong>{{ _class }}</strong>
                <el-card shadow="hover">
                  <span>
                    <span
                      v-for="(desc, j) in entries[0].desc"
                      :key="`desc-${i}-${j}`"
                    >
                      <br v-if="j" />
                      <span>{{ desc }}</span>
                    </span>
                  </span>
                  <ul>
                    <li
                      v-for="(entry, j) in entries.slice(1)"
                      :key="`entry-${i}-${j}`"
                    >
                      <template>
                        <el-link
                          v-if="entry['refId']"
                          type="primary"
                          @click="$emit('tag-show', entry['refId'])"
                        >
                          {{ entry.key }}
                        </el-link>
                        <template v-else>{{ entry.key }}</template>
                      </template>
                      <span
                        v-for="(desc, k) in entry.desc"
                        :key="`desc-${i}-${j}-${k}`"
                      >
                        <br v-if="k" />
                        <span>{{ desc }}</span>
                      </span>
                      <template v-if="entry.related">
                        <br />
                        扩展阅读：
                        <el-link
                          type="primary"
                          @click="$emit('art-show', entry['relatedId'])"
                        >
                          {{ entry.related }}
                        </el-link>
                      </template>
                    </li>
                  </ul>
                </el-card>
              </span>
            </el-scrollbar>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('recommend-close')">关闭</el-button>
    </span>
  </el-dialog>
</template>

<script>
import connector from '@/renderer/utils/connector';

export default {
  async created() {
    this.dict = await connector.get('getDict', {});
    this.recommendations = await connector.get('getRecData', {});
  },
  data() {
    return {
      activeName: 'creator-recommend',
      collapse: {
        creator: 'creator-0',
        novel: 'novel-0',
        series: 'series-0',
        article: 'article-0',
      },
      creatorType: ['作者', '译者', '译/作者'],
      recommendations: {
        articles: [],
        creators: [],
        novels: [],
        series: [],
      },
      dict: {},
    };
  },
  emits: [
    'art-show',
    'novel-show',
    'recommend-close',
    'someone-show',
    'tag-show',
  ],
  methods: {
    getTitle(x) {
      return x.startsWith('《') ? x : `《${x}》`;
    },
  },
  name: 'RecommendedArticles',
  props: ['saveMe', 'visible'],
};
</script>

<style lang="scss">
.recommend-article {
  .el-row,
  .el-col,
  .el-tabs,
  .el-tab-pane {
    height: 100%;
  }

  .el-tabs__content {
    height: calc(100% - 45px);
  }

  .el-card {
    margin: 10px 15px 0 15px;

    span {
      line-height: 2;
    }

    strong.recommender {
      float: right;
      padding: 20px 0;

      span.el-link--inner {
        height: 100%;
      }
    }
  }
}
</style>
