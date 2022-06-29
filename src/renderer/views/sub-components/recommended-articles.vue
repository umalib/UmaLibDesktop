<template>
  <el-dialog
    @close="closeDialog"
    :visible="visible"
    center
    class="recommend-article"
    title="作品推荐"
    width="80%"
  >
    <el-row>
      <el-col :offset="2" :span="20">
        <el-tabs v-model="activeName">
          <el-tab-pane label="作者/译者推荐" name="creator-recommend">
            <el-scrollbar style="height: 100%">
              <div
                v-bind:key="i"
                v-for="(creator, i) in recommendations.creators"
              >
                <el-divider v-if="i !== 0" />
                <strong>
                  {{ creator.isAuthor ? '作者' : '译者' }}
                  <el-link
                    @click="$emit('show-someone', creator.name)"
                    type="primary"
                  >
                    {{ creator.name }}
                  </el-link>
                </strong>
                <el-card
                  v-bind:key="rec.name"
                  v-for="rec in creator.recommendations"
                  shadow="hover"
                >
                  <span v-bind:key="j" v-for="(content, j) in rec.reason">
                    {{ content }}
                    <br />
                  </span>
                  <strong class="recommender">
                    ——
                    <el-link
                      @click="$emit('show-someone', rec.name)"
                      type="primary"
                    >
                      {{ rec.name }}
                    </el-link>
                  </strong>
                </el-card>
              </div>
            </el-scrollbar>
          </el-tab-pane>
          <el-tab-pane label="长篇/合集推荐" name="novel-recommend">
            <el-scrollbar style="height: 100%">
              <div
                v-bind:key="i"
                v-for="(novel, tagId, i) in recommendations.novels"
              >
                <el-divider v-if="i !== 0" />
                <strong>
                  {{ novel.isNovel ? '长篇小说' : '小说合集' }}
                  <el-link
                    @click="$emit('show-tag', Number(tagId))"
                    type="primary"
                  >
                    {{ novel.title }}
                  </el-link>
                </strong>
                <el-card
                  v-bind:key="rec.name"
                  v-for="rec in novel.recommendations"
                  shadow="hover"
                >
                  <span v-bind:key="j" v-for="(content, j) in rec.reason">
                    {{ content }}
                    <br />
                  </span>
                  <strong class="recommender">
                    ——
                    <el-link
                      @click="$emit('show-someone', rec.name)"
                      type="primary"
                    >
                      {{ rec.name }}
                    </el-link>
                  </strong>
                </el-card>
              </div>
            </el-scrollbar>
          </el-tab-pane>
          <el-tab-pane label="单篇作品推荐" name="art-recommend">
            <el-scrollbar style="height: 100%">
              <div
                v-bind:key="i"
                v-for="(article, artId, i) in recommendations.articles"
              >
                <el-divider v-if="i !== 0" />
                <strong>
                  作品
                  <el-link
                    @click="$emit('show-art', Number(artId))"
                    type="primary"
                  >
                    {{ article.title }}
                  </el-link>
                </strong>
                <el-card
                  v-bind:key="rec.name"
                  v-for="rec in article.recommendations"
                  shadow="hover"
                >
                  <span v-bind:key="j" v-for="(content, j) in rec.reason">
                    {{ content }}
                    <br />
                  </span>
                  <strong class="recommender">
                    ——
                    <el-link
                      @click="$emit('show-someone', rec.name)"
                      type="primary"
                    >
                      {{ rec.name }}
                    </el-link>
                  </strong>
                </el-card>
              </div>
            </el-scrollbar>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('close-recommend')">关闭</el-button>
    </span>
  </el-dialog>
</template>

<script>
import EmbeddedData from '@/renderer/utils/data';

export default {
  name: 'RecommendedArticles',
  data() {
    return {
      activeName: 'creator-recommend',
      recommendations: EmbeddedData.recommendations,
    };
  },
  props: ['visible'],
  methods: {
    closeDialog() {
      this.$emit('close-recommend');
    },
  },
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
    height: calc(100% - 50px);
  }

  strong {
    font-size: 16px;
    line-height: 1;

    span.el-link--inner {
      font-size: 16px;
      height: 18px;
      line-height: 1;
    }
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
