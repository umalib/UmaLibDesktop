<template>
  <el-row>
    <el-col :offset="2" :span="20">
      <el-row style="text-align: center">
        <h1>管理处</h1>
      </el-row>
      <el-tabs v-if="cue >= 10" v-model="activeName" @tab-click="changeTab">
        <el-tab-pane label="创作者管理" name="author-management">
          <el-row>
            <el-transfer
              :data="authors"
              :titles="['创作者列表', '待合并创作者']"
              filterable
              filter-placeholder="请输入创作者"
              v-loading="authorLoading"
              v-model="toMergedAuthors"
            />
          </el-row>
          <el-row style="margin-top: 10px">
            <el-col :offset="6" :span="10">
              <el-input
                :placeholder="getAuthorPlaceHolder()"
                v-model="authorResult"
              />
            </el-col>
            <el-col :span="2">
              <el-button @click="mergeAuthors" type="warning">
                合并创作者
              </el-button>
            </el-col>
          </el-row>
        </el-tab-pane>
        <el-tab-pane label="标签管理" name="tag-management">
          <el-row>
            <el-transfer
              :data="tags"
              :filter-method="filterTags"
              :titles="['标签列表', '待处理标签']"
              filterable
              filter-placeholder="请输入标签"
              v-loading="tagLoading"
              v-model="toMergedTags"
            >
              <template v-slot="{ option }">
                <span>
                  {{ option.label }}
                  <el-tag size="mini">{{
                    typeOptions[option.type].label
                  }}</el-tag>
                </span>
              </template>

              <el-button
                @click="sortTagByName"
                class="transfer-footer"
                round
                size="small"
                slot="left-footer"
              >
                按名字排序
              </el-button>
              <el-button
                @click="sortTagByType"
                class="transfer-footer"
                round
                size="small"
                slot="left-footer"
                >按类别排序
              </el-button>

              <el-button
                @click="sortTagByName"
                class="transfer-footer"
                round
                size="small"
                slot="right-footer"
                >按名字排序
              </el-button>
              <el-button
                @click="sortTagByType"
                class="transfer-footer"
                round
                size="small"
                slot="right-footer"
                >按类别排序
              </el-button>
            </el-transfer>
          </el-row>
          <el-row style="margin-top: 10px">
            <el-col :offset="6" :span="10">
              <el-input
                :placeholder="getTagPlaceHolder()"
                v-model="tagResult"
              />
            </el-col>
            <el-col :span="2">
              <el-button @click="mergeTags" style="width: 100%" type="warning">
                合并标签
              </el-button>
            </el-col>
          </el-row>
          <el-row style="margin-top: 10px">
            <el-col :offset="6" :span="8">
              <el-select
                placeholder="请选择标签类别"
                style="width:100%"
                v-model="typeResult"
              >
                <el-option
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                  v-for="item in typeOptions"
                />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-button-group style="width: 100%">
                <el-button
                  @click="changeTagTypes"
                  style="width: 50%"
                  type="primary"
                >
                  改变类别
                </el-button>
                <el-button @click="deleteTags" style="width: 50%" type="danger">
                  删除标签
                </el-button>
              </el-button-group>
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
      <div v-else style="text-align: center">
        <p>你没有资格 没有资格啊 没有资格</p>
        <p>正因为如此</p>
        <p>你没有资格 没有资格啊 没有资格</p>
      </div>
    </el-col>
  </el-row>
</template>

<script>
import connector from '@/renderer/utils/connector';
import EmbeddedData from '@/renderer/utils/data';

function sortTagOptionByName(a, b) {
  if (a.label === b.label) {
    return a.key - b.key;
  }
  return a.label > b.label ? 1 : -1;
}

function sortTagOptionByType(a, b) {
  if (a.type === b.type) {
    return sortTagOptionByName(a, b);
  }
  return a.type - b.type;
}

async function updateAuthors(_vue) {
  _vue.authorLoading = true;
  const data = await connector.get('getAuthors', {});
  _vue.authorResult = '';
  _vue.authors = [];
  _vue.toMergedAuthors = [];
  const authorList = [];
  authorList.push.apply(authorList, data['authors']);
  authorList.push.apply(authorList, data['translators']);
  authorList.push.apply(authorList, data['double']);
  authorList.sort();
  authorList.forEach(x =>
    _vue.authors.push({
      key: x,
      label: `[${x}]`,
      disabled: false,
    }),
  );
  _vue.authorLoading = false;
}

async function updateTags(_vue) {
  _vue.tagLoading = true;
  const data = await connector.get('getTags', {});
  _vue.id2Tag = data.tags;
  _vue.tagResult = '';
  _vue.tags = [];
  _vue.toMergedTags = [];
  const typeMap = data['typeMap'];
  for (const type in typeMap) {
    for (const index in typeMap[type]) {
      const idInt = typeMap[type][index];
      _vue.tags.push({
        key: idInt,
        label: _vue.id2Tag[idInt].name,
        type,
        disabled: false,
      });
    }
  }
  _vue.tags.sort(sortTagOptionByName);
  _vue.tagLoading = false;
}

export default {
  name: 'manage-view',
  data() {
    return {
      activeName: 'author-management',
      authorLoading: true,
      authorResult: '',
      authors: [],
      id2Tag: {},
      tagLoading: true,
      tagResult: '',
      tags: [],
      toMergedAuthors: [],
      toMergedTags: [],
      typeOptions: EmbeddedData.tagTypes.map((x, i) => {
        return {
          value: i,
          label: x,
        };
      }),
      typeResult: 0,
    };
  },
  props: ['cue'],
  created() {
    updateAuthors(this);
  },
  methods: {
    async actionWithConfirm(option) {
      if (!option.nullCheck) {
        this.$message({
          type: 'warning',
          message: option.nullCheckMsg,
        });
      } else {
        try {
          await this.$confirm(option.actionMsg, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          });
          await connector.get(option.action, option.data);
          this.$message({
            type: 'success',
            message: option.successMsg,
          });
          option.success();
        } catch (_) {
          this.$message({
            type: 'info',
            message: option.cancelMsg,
          });
        }
      }
    },
    changeTab(tab) {
      if (tab.name === 'tag-management') {
        updateTags(this);
      } else {
        updateAuthors(this);
      }
    },
    changeTagTypes() {
      const _vue = this;
      this.actionWithConfirm({
        nullCheck: this.toMergedTags.length,
        nullCheckMsg: '请先选择要改变类别的标签！',
        action: 'setTags',
        actionMsg: `将 ${this.toMergedTags.length} 个标签的类别变更为
                ${this.typeOptions[this.typeResult].label}？`,
        data: {
          type: this.typeResult,
          tagIds: this.toMergedTags,
        },
        successMsg: '类别变更成功！',
        success() {
          updateTags(_vue);
        },
        cancelMsg: '类别变更已取消',
      });
    },
    deleteTags() {
      const _vue = this;
      this.actionWithConfirm({
        nullCheck: this.toMergedTags.length,
        nullCheckMsg: '请先选择要删除的标签！',
        action: 'deleteTags',
        actionMsg: `删除 ${this.toMergedTags.length} 个标签？`,
        data: {
          tagIds: this.toMergedTags,
        },
        successMsg: '删除成功！',
        success() {
          updateTags(_vue);
        },
        cancelMsg: '删除标签已取消',
      });
    },
    filterTags(query, item) {
      return (
        item.label.indexOf(query) > -1 ||
        this.typeOptions[item.type].label.indexOf(query) > -1
      );
    },
    mergeAuthors() {
      const _vue = this;
      this.actionWithConfirm({
        nullCheck: this.toMergedAuthors.length,
        nullCheckMsg: '请先选择要合并的创作者！',
        action: 'mergeAuthors',
        actionMsg: `将 ${this.toMergedAuthors.length} 个创作者合并为 ${
          this.authorResult ? this.authorResult : this.toMergedAuthors[0]
        }？`,
        data: {
          finalAuthor: this.authorResult,
          toMergedAuthors: this.toMergedAuthors,
        },
        successMsg: '合并成功！',
        success() {
          updateAuthors(_vue);
        },
        cancelMsg: '合并已取消',
      });
    },
    mergeTags() {
      const _vue = this;
      this.actionWithConfirm({
        nullCheck: this.toMergedTags.length,
        nullCheckMsg: '请先选择要合并的标签！',
        action: 'mergeTags',
        actionMsg: `将 ${this.toMergedTags.length} 个标签合并为 ${
          this.tagResult
            ? this.tagResult
            : this.id2Tag[this.toMergedTags[0]].name
        }？`,
        data: {
          tagLabel: this.tagResult
            ? this.tagResult
            : this.id2Tag[this.toMergedTags[0]].name,
          toMergedTags: this.toMergedTags.sort(),
        },
        successMsg: '合并成功！',
        success() {
          updateTags(_vue);
        },
        cancelMsg: '合并已取消',
      });
    },
    getAuthorPlaceHolder() {
      return `请输入合并后创作者，置空则合并为${
        this.toMergedAuthors.length
          ? ' ' + this.toMergedAuthors[0]
          : '第一个创作者'
      }`;
    },
    getTagPlaceHolder() {
      return `请输入合并后标签，置空则合并为${
        this.toMergedTags.length
          ? ' ' + this.id2Tag[this.toMergedTags[0]].name
          : '第一个标签'
      }`;
    },
    sortTagByName() {
      this.tags.sort(sortTagOptionByName);
    },
    sortTagByType() {
      this.tags.sort(sortTagOptionByType);
    },
  },
};
</script>

<style lang="scss">
div.el-transfer {
  text-align: center;

  div.el-transfer-panel {
    text-align: left;
    width: 320px;
  }
}
</style>
