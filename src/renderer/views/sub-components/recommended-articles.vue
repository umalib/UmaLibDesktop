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
                <div v-if="saveMe === -3 || !creator.r">
                  <el-divider v-if="i !== 0" />
                  <strong>
                    {{ creatorType[creator.type] }}
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
              </div>
            </el-scrollbar>
          </el-tab-pane>
          <el-tab-pane label="长篇/合集推荐" name="novel-recommend">
            <el-scrollbar style="height: 100%">
              <div v-bind:key="i" v-for="(novel, i) in recommendations.novels">
                <div v-if="saveMe === -3 || !novel.r">
                  <el-divider v-if="i !== 0" />
                  <strong>
                    {{ novel.isNovel ? '长篇小说' : '短篇合集' }}
                    <el-link
                      @click="$emit('show-novel', novel.id)"
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
              </div>
            </el-scrollbar>
          </el-tab-pane>
          <el-tab-pane label="系列推荐" name="series-recommend">
            <el-scrollbar style="height: 100%">
              <div v-bind:key="i" v-for="(tag, i) in recommendations.series">
                <div v-if="saveMe === -3 || !tag.r">
                  <el-divider v-if="i !== 0 && !tag.noDivider" />
                  <strong>
                    系列
                    <el-link @click="$emit('show-tag', tag.id)" type="primary">
                      {{ tag.title }}
                    </el-link>
                  </strong>
                  <el-card
                    v-bind:key="rec.name"
                    v-for="rec in tag.recommendations"
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
              </div>
            </el-scrollbar>
          </el-tab-pane>
          <el-tab-pane label="单篇作品推荐" name="art-recommend">
            <el-scrollbar style="height: 100%">
              <div
                v-bind:key="i"
                v-for="(article, i) in recommendations.articles"
              >
                <div v-if="saveMe === -3 || !article.r">
                  <el-divider v-if="i !== 0 && !article.noDivider" />
                  <strong>
                    作品
                    <el-link
                      @click="$emit('show-art', article.id)"
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
              </div>
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
              <el-divider />
              <strong>【角色】</strong>
              <el-card shadow="hover">
                <span>
                  角色Tag包含了：
                </span>
                <ul>
                  <li>
                    <span>
                      【企划内出现马娘】
                      如特别周、东海帝王、优秀素质、成田路等所有企划内角色。
                    </span>
                  </li>
                  <li>
                    <span>
                      【企划内NPC】 骏川缰绳（手纲）、快乐米可（Happy
                      Meek）、SP队长等NPC
                    </span>
                  </li>
                  <li>
                    <span>
                      【实马】
                      如一路通、萌机伶、飞机云等实马的拟人化，也包括黄金旅程、黄金巨匠等因为社台版权因素无法落地，但是存在二创作品的角色。
                    </span>
                  </li>
                  <li>
                    <span>
                      【特别的训练员】
                      如代表著名问题儿童管理家池添谦一的“池添T”，好歌剧的骑手和田龙二的“和田T”等
                    </span>
                  </li>
                </ul>
              </el-card>
              <el-divider />
              <strong>【系列】</strong>
              <el-card shadow="hover">
                <span>
                  系列Tag代表的含义，严格而言并非是“同个作者的作品”（同作者的长篇作品请找寻【长篇/合集】Tag，或于状态栏功能
                  -
                  总目表中进行阅览），而是一种常于日站中出现的“热点风潮式创作”（例如某些热词，某时段的梗创作等）。其中有大量的一时梗词和迷惑行为。现对其中部分难以理解的系列进行解释说明（较为直观的恕不展开）：
                </span>
                <ul>
                  <li>
                    <span>
                      <el-link @click="$emit('show-tag', 211)" type="primary">
                        【目白城】
                      </el-link>
                      最初由X年后的马娘的一篇二创作品
                      <el-link @click="$emit('show-art', 3447)" type="primary">
                        目白城：起源
                      </el-link>
                      为基础，结合其下方吐槽内容产生的匿名版系列梗文。创作方向为“目白麦昆将自己一心同体追寻幸福的方式用夸张化的财阀力量扩展到了一片区域，是马娘们追寻幸福（强调婚姻等方向）所在地”，故而被称之为目白城系列。
                      目白城系列为十分kuso+搞笑的内容为主（不 要 较
                      真），主要包括几个方向：一，想办法把两人凑对，对于恩恩爱爱来消费的对象有着离谱（1折/九割）起步的折扣。二，将字面意义的“一心同体”行为扩展到生活中。三，对于婚后的夫妻们提供各种情景扮演服务。
                      P.S.
                      现实中的目白地区位于日本豐島区目白町，地区邮政编号为171-0031
                    </span>
                  </li>
                  <li>
                    <span>
                      <el-link @click="$emit('show-tag', 223)" type="primary">
                        【鸭葱】
                      </el-link>
                      出自日本谚语：鸭子背着大葱来（鴨が葱を背負って来る），意为本来就很棒的事变得愈发符合自己心意了（好事成双）。该梗文创作往往以“我被前辈教导过，要和担当马娘保持适当的距离感”开头，随后在这种理念下反而了做出各种让对方愈发好感度上升的行为，最终训练员成为了背着大葱被吃干抹净的那只鸭子。
                    </span>
                  </li>
                  <li>
                    <span>
                      <el-link @click="$emit('show-tag', 200)" type="primary">
                        【寝系列】
                      </el-link>
                      段子文，最开始基于室友在睡前和你搭话突然谈起一个不知所谓话题的情景为基础。往往以“睡前听XXX说说话吧”开头，以“好了，话说完了，你可以睡了”作为结尾。话题内容比较无厘头+天马行空。其中存在“XX寝”的亚种（XX为角色名）。其中“铃鹿寝”是日站非常离谱的创作内容，旨在让无声铃鹿这种清秀系的角色说出各种过激离谱发言，如刻意希望阅读，请注意心灵卫生保护。
                    </span>
                  </li>
                  <li>
                    <span>
                      <el-link @click="$emit('show-tag', 194)" type="primary">
                        【大进综合征】
                      </el-link>
                      从角色成田大进的my
                      page发言“如果你成为了家长，孩子一定会很郁闷吧……又热血、又爱管闲事、又爱操心什么的。”超展开产生的梗创作风潮。核心可以总结为【马娘误以为自己已经和对方是老夫老妻+孩子都有了】的一种有精神性症状的综合征（第一个由成田大进发病，故命名）。该梗作品创作较早，涉及到某些角色的早期刻板印象。建议先从
                      <el-link @click="$emit('show-art', 569)" type="primary">
                        爱丽速子 大进综合征 研究报告1期
                      </el-link>
                      开始阅读。
                    </span>
                  </li>
                  <li>
                    <span>
                      <el-link @click="$emit('show-tag', 199)" type="primary">
                        【实验记录系列】
                      </el-link>
                      以科学狂魔爱丽速子的“伪科学实验报告”格式进行各种奇怪的研究方向的主题创作。
                    </span>
                  </li>
                  <li>
                    <span>
                      <el-link @click="$emit('show-tag', 218)" type="primary">
                        【铃鹿甜点系列】
                      </el-link>
                      无声铃鹿用自己“异次元的逃亡者”的夸张速度能力，在日本各地找寻各种甜点点心，并发表品味观点的系列作。翻译内容较少，日后会有增补。
                    </span>
                  </li>
                  <li>
                    <span>
                      <el-link @click="$emit('show-tag', 219)" type="primary">
                        【霸王世代已经烂掉了】
                      </el-link>
                      爱慕织姬一脸冷漠的吐槽和自己同世代的霸王时代（好歌剧、名将怒涛等人）的不检点风纪行为。但是其实自己才是做的最过火的那个（所以说这个世代真的烂掉了。）
                    </span>
                  </li>
                  <li>
                    <span>
                      <el-link @click="$emit('show-tag', 213)" type="primary">
                        【藏头系列】
                      </el-link>
                      就是藏头书。因为翻译的问题，无法做到中日完美对应藏头。文后会附带日文原文藏头句。
                    </span>
                  </li>
                  <li>
                    <span>
                      <el-link @click="$emit('show-tag', 192)" type="primary">
                        【名作文学】
                      </el-link>
                      各类世界名作（中日欧美）的化用梗文
                    </span>
                  </li>
                  <li>
                    <span>
                      <el-link @click="$emit('show-tag', 191)" type="primary">
                        【动机黑暗的训练员】
                      </el-link>
                      动机不纯，想着找大小姐类型马娘吃软饭or榨取金钱，结果反过来被捕食的搞笑向。可从
                      <el-link @click="$emit('show-art', 3465)" type="primary">
                        黑暗训练员VS大小姐马娘 之 起源篇
                      </el-link>
                      开始阅读
                    </span>
                  </li>
                  <li>
                    <span>
                      <el-link @click="$emit('show-tag', 182)" type="primary">
                        【UNJASH】
                      </el-link>
                      梗名来源于日本搞笑组合UN -
                      JASH，主要为通过误会产生笑点的故事
                    </span>
                  </li>
                  <li>
                    <span>
                      <el-link @click="$emit('show-tag', 184)" type="primary">
                        【Yogibo广告】
                      </el-link>
                      出自一家现实中接受退役竞赛马养老的牧场————Yogibi凡尔赛假日牧场，其因为募集赛马养老资金而开发多样商品，作为现成的形象代言人，牧场中的马儿自然就可以作为广告中的宣传大使。目前生活在Yogibo养老的马娘企划马有谷水琴蕾，曾在此生活的有大树快车和名将怒涛。
                    </span>
                  </li>
                  <li>
                    <span>
                      <el-link @click="$emit('show-tag', 208)" type="primary">
                        【特雷森观察】
                      </el-link>
                      一开始出自于匿名版中因版权原因未能实装的黑历史形象马，2005年经典三冠马大震撼和2011年经典三冠马黄金巨匠之间对特雷森内的各种荒唐故事的版内下出现并进行点评，尤其是在匿名版中对二人形象的完善之后，使得以池添谦一作为主战骑手的问题儿童军团们（即希望队）因为自己的问题被隔离在组合屋，就变成大震撼以噗咿前辈的姿态来组合屋游玩和黄金巨匠一起吐槽特雷森内的各种搞笑故事。该类文往往以类似双口相声的对话形式由一句突然发言开头搭配第二人的吐槽引出本次观察的主题，再引出整个对话，从中完善了以往怪文书中所不曾展现的对特雷森学园人物风景的补充。
                    </span>
                  </li>
                </ul>
              </el-card>
              <el-divider />
              <strong>【长篇/合集】</strong>
              <el-card shadow="hover">
                <span>
                  真正意义上的系列作，部分篇幅较长，部分篇幅中等
                </span>
                <br />
                <span>
                  除了使用Tag搜索，还可于状态栏功能 - 总目表中进行阅览
                </span>
              </el-card>
              <el-divider />
              <strong>【争议/不适】</strong>
              <el-card shadow="hover">
                <span>
                  除了部分一眼就懂的不适Tag外，还存在部分创作主题上无法详细归类，但是在曾经发布时都引起争议性讨论的作品。
                </span>
                <br />
                <span>
                  如需要阅读，请于页面右侧取消“屏蔽争议/不适的作品”的勾选项。
                </span>
              </el-card>
              <el-divider />
              <strong>【其他】</strong>
              <el-card shadow="hover">
                <span>
                  不太适合归类为系列及角色，但起到其他归类和说明（包括警示）性质的Tag合集
                </span>
              </el-card>
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
      creatorType: ['作者', '译者', '译/作者'],
      recommendations: EmbeddedData.recommendations,
    };
  },
  props: ['saveMe', 'visible'],
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
    height: calc(100% - 45px);
  }

  div.el-scrollbar__view {
    > div:nth-child(1) {
      margin-top: 16px;
    }
    > div:last-child {
      margin-bottom: 8px;
    }
  }

  strong {
    font-size: 16px;
    line-height: 1;

    span.el-link--inner {
      font-size: 16px;
      height: 18px;
      line-height: 0.9;
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
