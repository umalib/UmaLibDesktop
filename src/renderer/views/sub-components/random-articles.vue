<template>
  <el-dialog
    :close-on-click-modal="false"
    :visible="visible"
    center
    title="手气不错！"
    width="80%"
    @close="
      $refs.randomContent && ($refs.randomContent.wrap.scrollTop = 0);
      $emit('close-random');
    "
  >
    <el-scrollbar ref="randomContent" style="height: 100%">
      <el-table :data="randomList" row-key="id" stripe style="width: 100%">
        <el-table-column :index="1" fixed type="index" />
        <el-table-column fixed label="标题" prop="name" sortable="custom">
          <template v-slot="cell">
            <el-link
              :underline="false"
              type="primary"
              @click="$emit('show-art', cell.row['id'])"
            >
              {{ cell.row['name'] ? cell.row['name'] : '「无题」' }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="标签">
          <template v-slot="cell">
            <span v-for="label in cell.row['tagLabels']" :key="label.name">
              <el-tooltip v-if="label.name.length > 9" :content="label.name">
                <el-tag :type="label.elType" size="mini">
                  {{ label.name.substring(0, 4) }}…{{
                    label.name.substring(label.name.length - 4)
                  }}
                </el-tag>
              </el-tooltip>
              <el-tag v-else :type="label.type" size="mini">
                {{ label.name }}
              </el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="作者" prop="author" />
        <el-table-column label="译者" prop="translator" />
        <el-table-column
          fixed="right"
          label="上传时间"
          prop="uploadTime"
          sortable="custom"
          width="160"
        >
          <template v-slot="cell">
            {{ formatTimeStamp(cell.row['uploadTime']) }}
          </template>
        </el-table-column>
      </el-table>
    </el-scrollbar>
    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('close-random')">
        关闭
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { formatTimeStamp } from '@/renderer/utils/renderer-utils';

export default {
  name: 'random-articles',
  methods: {
    formatTimeStamp,
  },
  props: ['randomList', 'visible'],
};
</script>

<style></style>
