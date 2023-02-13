<template>
  <div>
    <div v-if="param" class="block">
      <el-pagination
        :current-page="param.pageNum"
        :hide-on-single-page="count <= 10"
        :page-size="param.offset"
        :page-sizes="[10, 20, 25, 50]"
        :total="count"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="$emit('size-change', $event)"
        @current-change="$emit('current-change', $event)"
      />
    </div>
    <el-table
      v-loading="loading"
      :data="articles"
      :default-sort="{
        prop: 'uploadTime',
        order: layout === 'main' ? 'descending' : undefined,
      }"
      class="article-table"
      row-key="id"
      stripe
      style="width: 100%"
      @sort-change="$emit('sort-change', $event)"
    >
      <el-table-column
        v-if="param"
        :index="param.offset * (param.pageNum - 1) + 1"
        fixed
        type="index"
        width="54"
      />
      <el-table-column v-else :index="1" fixed type="index" />
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
            @click="$emit('art-show', cell.row['id'])"
          >
            {{ cell.row['name'] ? cell.row['name'] : '「无题」' }}
          </el-link>
        </template>
      </el-table-column>

      <el-table-column v-if="layout === 'main'" label="标签" width="140">
        <template v-slot="cell">
          <el-tooltip
            v-for="tagId in cell.row['tags']"
            :key="tagId"
            effect="light"
            placement="right"
          >
            <div slot="content">
              <span v-if="id2Tag[tagId].name.length > 9">
                {{ id2Tag[tagId].name }}
              </span>
              <el-tag
                :type="elTagMap[id2Tag[tagId].type]"
                size="mini"
                style="margin-right: 10px"
              >
                {{ tagType2Name[id2Tag[tagId].type] }}
              </el-tag>
              <el-button
                circle
                icon="el-icon-plus"
                size="mini"
                type="success"
                @click="$emit('tag-change', tagId, true)"
              />
              <el-button
                circle
                icon="el-icon-minus"
                size="mini"
                type="danger"
                @click="$emit('tag-change', tagId)"
              />
            </div>
            <el-link
              :underline="false"
              type="primary"
              @click="$emit('tag-replace', tagId)"
            >
              <el-tag v-if="id2Tag[tagId].name.length > 9" size="mini">
                {{ id2Tag[tagId].name.substring(0, 4) }}…{{
                  id2Tag[tagId].name.substring(id2Tag[tagId].name.length - 4)
                }}
              </el-tag>
              <el-tag v-else size="mini">
                {{ id2Tag[tagId].name }}
              </el-tag>
            </el-link>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column
        v-else
        :width="layout === 'random' || layout === 'menu' ? 0 : 140"
        label="标签"
      >
        <template v-slot="cell">
          <span v-for="tagId in cell.row['tags']" :key="tagId">
            <template v-if="tagId !== novelTag">
              <el-tooltip
                v-if="id2Tag[tagId].name.length > 9"
                :content="id2Tag[tagId].name"
              >
                <el-tag :type="elTagMap[id2Tag[tagId].type]" size="mini">
                  {{ id2Tag[tagId].name.substring(0, 4) }}…{{
                    id2Tag[tagId].name.substring(id2Tag[tagId].name.length - 4)
                  }}
                </el-tag>
              </el-tooltip>
              <el-tag v-else :type="elTagMap[id2Tag[tagId].type]" size="mini">
                {{ id2Tag[tagId].name }}
              </el-tag>
            </template>
          </span>
        </template>
      </el-table-column>

      <el-table-column
        v-if="layout === 'main'"
        label="作者"
        prop="author"
        width="150"
      >
        <template v-slot="cell">
          <div
            v-for="(c, i) in cell.row['author'].split('/')"
            :key="`${cell.row['id']}-a-${i}`"
          >
            <el-link
              v-if="c"
              :underline="false"
              type="primary"
              @click="$emit('creator-change', c)"
            >
              {{ c }}
            </el-link>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        v-else-if="layout !== 'menu'"
        label="作者"
        prop="author"
        width="150"
      >
        <template v-slot="cell">
          <div
            v-for="(c, i) in cell.row['author'].split('/')"
            :key="`${cell.row['id']}-a-${i}`"
          >
            <div>{{ c }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column
        v-if="layout === 'main'"
        label="译者"
        prop="translator"
        width="150"
      >
        <template v-slot="cell">
          <div
            v-for="(c, i) in cell.row['translator'].split('/')"
            :key="`${cell.row['id']}-t-${i}`"
          >
            <el-link
              v-if="c"
              :underline="false"
              type="primary"
              @click="$emit('creator-change', c)"
            >
              {{ c }}
            </el-link>
          </div>
        </template>
      </el-table-column>
      <el-table-column v-else label="译者" prop="translator" width="150">
        <template v-slot="cell">
          <div
            v-for="(c, i) in cell.row['translator'].split('/')"
            :key="`${cell.row['id']}-t-${i}`"
          >
            <div>{{ c }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column
        v-if="
          layout === 'main' ||
            layout === 'menu' ||
            layout === 'favorite' ||
            layout === 'history'
        "
        label="备注"
        prop="note"
        width="400"
      />
      <el-table-column
        v-if="
          layout === 'main' ||
            layout === 'menu' ||
            layout === 'favorite' ||
            layout === 'history'
        "
        label="来源"
        prop="source"
      >
        <template v-slot="cell">
          <div v-for="src in cell.row['source'].map(s => s.val)" :key="src">
            <el-tooltip v-if="src.startsWith('http')" :content="src">
              <el-link :href="src" target="_blank" type="primary">
                外部链接
              </el-link>
            </el-tooltip>
            <span v-else>{{ src }}</span>
          </div>
        </template>
      </el-table-column>
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
      <el-table-column
        v-if="layout === 'main'"
        :width="editor ? 150 : 107"
        fixed="right"
        label=""
        style="text-align: center"
      >
        <template v-slot="cell">
          <el-button-group>
            <el-button
              v-if="editor"
              icon="el-icon-edit"
              round
              size="mini"
              type="primary"
              @click="$emit('art-edit', cell.row['id'])"
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
              @click="$emit('favorite-change', cell.row['id'])"
            />
            <el-button
              icon="el-icon-delete"
              round
              size="mini"
              type="danger"
              @click="$emit('art-delete', cell.row['id'])"
            />
          </el-button-group>
        </template>
      </el-table-column>
      <el-table-column
        v-if="layout === 'random'"
        fixed="right"
        label=""
        style="text-align: center"
        width="64"
      >
        <template v-slot="cell">
          <el-button
            :icon="
              favorites[cell.row['id']] ? 'el-icon-star-on' : 'el-icon-star-off'
            "
            :type="favorites[cell.row['id']] ? 'success' : 'info'"
            round
            size="mini"
            @click="$emit('favorite-change', cell.row['id'])"
          />
        </template>
      </el-table-column>
      <el-table-column
        v-if="layout === 'favorite'"
        fixed="right"
        label=""
        style="text-align: center"
        width="64"
      >
        <template v-slot="cell">
          <el-button
            icon="el-icon-delete"
            round
            size="mini"
            type="danger"
            @click="$emit('favorite-delete', cell.row['id'])"
          />
        </template>
      </el-table-column>
    </el-table>
    <div v-if="param" class="block">
      <el-pagination
        :current-page="param.pageNum"
        :hide-on-single-page="count <= 10"
        :page-size="param.offset"
        :page-sizes="[10, 20, 25, 50]"
        :total="count"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="$emit('size-change', $event)"
        @current-change="$emit('current-change', $event)"
      />
    </div>
  </div>
</template>

<script>
import EmbeddedData from '@/renderer/utils/data';
import { formatTimeStamp } from '@/renderer/utils/renderer-utils';

export default {
  name: 'ArticleTable',
  props: [
    'articles',
    'count',
    'editor',
    'favorites',
    'id2Tag',
    'layout',
    'loading',
    'novelTag',
    'param',
  ],
  data() {
    return {
      elTagMap: EmbeddedData.elTagTypes,
      tagType2Name: EmbeddedData.tagTypes,
    };
  },
  emits: [
    'art-delete',
    'art-edit',
    'art-show',
    'creator-change',
    'current-change',
    'favorite-change',
    'favorite-delete',
    'size-change',
    'sort-change',
    'tag-change',
    'tag-replace',
  ],
  methods: {
    formatTimeStamp,
  },
};
</script>

<style scoped></style>
