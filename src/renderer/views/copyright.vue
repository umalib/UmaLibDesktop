<template>
  <el-row>
    <el-col :offset="2" :span="20" style="text-align: center">
      <el-row>
        <el-tooltip v-if="saveMe > 0" content="纪念碑注视着你……">
          <h1>纪念碑</h1>
        </el-tooltip>
        <el-tooltip v-else content="以虚空吟唱者之名！">
          <h1>旧神方尖碑</h1>
        </el-tooltip>
      </el-row>
      <el-row>
        <h2>Staff</h2>
        <small>以下为NGA论坛ID</small>
        <h4>主催</h4>
        <p>
          <span>黑羽仙洛</span>
          <el-divider direction="vertical" />
          <span>ChibaNils</span>
          <el-divider direction="vertical" />
          <span>风之低吟</span>
        </p>
        <h4>程序</h4>
        <p>
          <span>风之低吟</span>
          <el-divider direction="vertical" />
          <span>ForeverDdB</span>
        </p>
        <h4>录入协助</h4>
        <small>按字母/笔画顺序，排名不分先后</small>
        <p>
          <span v-for="(staff, i) in staffs" :key="i">
            <el-divider v-if="i % 8 !== 0" direction="vertical" />
            <br v-if="i !== 0 && i % 8 === 0" />
            <span>{{ staff }}</span>
          </span>
        </p>
        <h4>散篇收录</h4>
        <p>
          <span v-for="(editor, i) in editors" :key="i">
            <el-divider v-if="i % 8 !== 0" direction="vertical" />
            <br v-if="i !== 0 && i % 8 === 0" />
            <span>{{ editor }}</span>
          </span>
        </p>
        <h4>复核协助</h4>
        <p>
          <span>我就是雷gay的化身</span>
          <el-divider direction="vertical" />
          <span>nameabcd</span>
        </p>
        <el-tooltip content="双王子？你为什么不问问黑暗剑呢？">
          <h2>今日，我等攻略了大书库！</h2>
        </el-tooltip>
      </el-row>
      <el-divider />
      <el-row>
        <h2>其他译者/作者</h2>
        <small>NGA论坛ID，按字母/笔画顺序，排名不分先后</small>
        <el-tooltip content="找不到您的名字？请联系@风之低吟">
          <p>
            <span v-for="(creator, i) in creators" :key="i">
              <el-divider v-if="i % 8 !== 0" direction="vertical" />
              <br v-if="i !== 0 && i % 8 === 0" />
              <span>{{ creator }}</span>
            </span>
          </p>
        </el-tooltip>
        <strong>
          感谢在上方名单中所有参与翻译创作的大家，以及，浏览该页面的您
        </strong>
        <p>
          <small>
            <el-link
              href="https://bbs.nga.cn/read.php?tid=32535194#l2"
              style="font-size: inherit"
              target="_blank"
              type="primary"
            >
              我有作品想被收录/我不想被收录/我有其他问题？点击这里
            </el-link>
          </small>
        </p>
      </el-row>
      <el-divider />
      <el-row>
        <el-descriptions
          :column="4"
          border
          size="small"
          title="本项目依赖于（按重要性排序）"
        >
          <el-descriptions-item label="vue-electron-prisma-test">
            <el-link
              href="https://github.com/clementvp/vue-electron-prisma-test"
              style="font-size: inherit"
              target="_blank"
              type="primary"
            >
              16 Feb 2021
            </el-link>
          </el-descriptions-item>
          <el-descriptions-item label="electron">19.0.11</el-descriptions-item>
          <el-descriptions-item label="vue">2.7.8</el-descriptions-item>
          <el-descriptions-item label="vue-router">3.5.4</el-descriptions-item>
          <el-descriptions-item label="vue-quill-editor">
            3.0.6
          </el-descriptions-item>
          <el-descriptions-item label="element-ui">2.15.9</el-descriptions-item>
          <el-descriptions-item label="prisma">
            3.15.2
          </el-descriptions-item>
          <el-descriptions-item label="sqlite3">3.37.0</el-descriptions-item>
          <el-descriptions-item label="webpack">4.46.0</el-descriptions-item>
          <el-descriptions-item label="jshashes">1.0.8</el-descriptions-item>
          <el-descriptions-item label="sm-crypto">
            0.3.8
          </el-descriptions-item>
        </el-descriptions>
      </el-row>
      <el-row v-if="saveMe > 0">
        <el-divider />
        <el-col :offset="8" :span="8">
          <el-input
            v-model="keyword"
            placeholder="枯树洞看着你"
            style="width: 100%"
          >
            <el-button slot="append" @click="jump">爱丽丝</el-button>
          </el-input>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>

<script>
import connector from '@/renderer/utils/connector';
import EmbeddedData from '@/renderer/utils/data';

export default {
  name: 'copyright',
  props: ['saveMe'],
  data() {
    return {
      creators: [],
      editors: EmbeddedData.editors,
      keyword: '',
      staffs: EmbeddedData.staffs,
    };
  },
  emits: ['is-safe'],
  async created() {
    this.creators = await connector.get('copyright', {});
  },
  methods: {
    async jump() {
      if (this.keyword === (await connector.get('getPwd', {}))) {
        connector.get('isSafe', {}).then();
        this.$notify({
          message: '',
          title: '格林……是你吗？',
          type: 'warning',
        });
        this.$emit('is-safe');
        await this.$router.push('/empty');
      } else {
        this.$notify({
          message: '',
          title: '退下，无礼者！',
          type: 'error',
        });
      }
    },
  },
};
</script>

<style scoped></style>
