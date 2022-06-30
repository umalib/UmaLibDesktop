<template>
  <el-row>
    <el-col :offset="2" :span="20" style="text-align: center">
      <el-row>
        <h1>鸣谢</h1>
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
        <p>风之低吟</p>
        <h4>录入协助</h4>
        <small>按字母/笔画顺序，排名不分先后</small>
        <p>
          <span v-bind:key="i1" v-for="(subList, i1) in staffs">
            <span v-bind:key="staff" v-for="(staff, i2) in subList">
              <el-divider v-if="i2 !== 0" direction="vertical" />
              <span>{{ staff }}</span>
            </span>
            <br v-if="i1 !== staffs.length" />
          </span>
        </p>
        <h4>散篇收录</h4>
        <p>
          <span>黑羽仙洛</span>
          <el-divider direction="vertical" />
          <span>风之低吟</span>
        </p>
        <h4>复核协助</h4>
        <p>
          <span>我就是雷gay的化身</span>
          <el-divider direction="vertical" />
          <span>nameabcd</span>
        </p>
      </el-row>
      <el-divider />
      <el-row>
        <h2>其他译者/作者</h2>
        <small>NGA论坛ID，按字母/笔画顺序，排名不分先后</small>
        <el-tooltip content="找不到您的名字？请联系@风之低吟">
          <p>
            <span v-bind:key="i1" v-for="(subList, i1) in creators">
              <span v-bind:key="staff" v-for="(staff, i2) in subList">
                <el-divider v-if="i2 !== 0" direction="vertical" />
                <span>{{ staff }}</span>
              </span>
              <br v-if="i1 !== creators.length" />
            </span>
          </p>
        </el-tooltip>
        <strong>
          感谢在上方名单中所有参与翻译创作的大家，以及，浏览该页面的您
        </strong>
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
          <el-descriptions-item label="electron">11.2.3</el-descriptions-item>
          <el-descriptions-item label="vue">2.6.12</el-descriptions-item>
          <el-descriptions-item label="vue-router">3.5.1</el-descriptions-item>
          <el-descriptions-item label="vue-quill-editor">
            3.0.6
          </el-descriptions-item>
          <el-descriptions-item label="element-ui">2.15.8</el-descriptions-item>
          <el-descriptions-item label="prisma">2.16.1</el-descriptions-item>
          <el-descriptions-item label="sqlite3">3.37.0</el-descriptions-item>
          <el-descriptions-item label="webpack">4.46.0</el-descriptions-item>
          <el-descriptions-item label="argon2">0.28.5</el-descriptions-item>
          <el-descriptions-item label="sm-crypto">
            0.3.8
          </el-descriptions-item>
        </el-descriptions>
      </el-row>
      <el-row v-if="saveMe > -3">
        <el-divider />
        <el-col :offset="8" :span="8">
          <el-input
            placeholder="枯树洞看着你"
            style="width: 100%"
            v-model="keyword"
          >
            <el-button @click="jump" slot="append">爱丽丝</el-button>
          </el-input>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>

<script>
import connector from '@/renderer/utils/connector';
import EmbeddedData from '@/renderer/utils/data';
import { splitList } from '@/renderer/utils/renderer-utils';

export default {
  name: 'copyright',
  data() {
    return {
      staffs: EmbeddedData.staffs,
      creators: [],
      keyword: '',
    };
  },
  props: ['saveMe'],
  async created() {
    this.creators = splitList(await connector.get('copyright', {}), 8);
  },
  methods: {
    async jump() {
      if (
        this.keyword ===
        EmbeddedData.signInfo.sign[1].substring(
          EmbeddedData.signInfo.sign[1].length - 8,
        )
      ) {
        connector.get('isSafe', {}).then();
        await this.$notify({
          message: '格林……是你吗？',
          title: '',
          type: 'warning',
        });
        this.$emit('is-safe');
        await this.$router.push('/empty');
      } else {
        await this.$notify({
          message: '退下，无礼者！',
          title: '',
          type: 'error',
        });
      }
    },
  },
};
</script>

<style scoped></style>
