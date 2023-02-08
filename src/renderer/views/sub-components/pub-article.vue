<template>
  <el-dialog
    v-loading="publishDisable"
    :close-on-click-modal="false"
    :title="title"
    :visible="visible"
    center
    class="new-article"
    width="80%"
    @close="
      $refs.pubContent && ($refs.pubContent.wrap.scrollTop = 0);
      $emit('pub-close');
    "
  >
    <el-scrollbar ref="pubContent" style="height: 100%">
      <el-col :offset="1" :span="22">
        <el-form :model="newText">
          <el-form-item>
            <el-input
              v-model="newText.name"
              clearable
              maxlength="50"
              placeholder="作品的标题"
              show-word-limit
              type="text"
            >
              <template v-slot:prepend>标题</template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-select
              v-model="newText.author"
              allow-create
              clearable
              filterable
              placeholder="请选择作者"
              style="width: 100%"
            >
              <el-option-group
                v-for="group in authorOptions"
                :key="group.label"
                :label="group.label"
              >
                <el-option
                  v-for="item in group.options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.label"
                />
              </el-option-group>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select
              v-model="newText.translator"
              allow-create
              clearable
              filterable
              placeholder="请选择译者"
              style="width: 100%"
            >
              <el-option-group
                v-for="group in authorOptions"
                :key="group.label"
                :label="group.label"
              >
                <el-option
                  v-for="item in group.options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.label"
                />
              </el-option-group>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="newText.note"
              clearable
              maxlength="100"
              placeholder="有什么话想说？没有的话默认截取正文前100个字符哦"
              show-word-limit
              type="text"
            >
              <template v-slot:prepend>备注</template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-date-picker
              v-model="newText.uploadTime"
              format="yyyy-MM-dd HH:mm"
              placeholder="选择发表/翻译时间"
              style="width: 100%"
              type="datetime"
              value-format="timestamp"
            />
          </el-form-item>
          <el-form-item
            v-for="(src, index) in newText.source"
            :key="`art-src-${index}`"
          >
            <el-input
              v-model="src.val"
              placeholder="请输入来源链接"
              type="text"
            >
              <template v-slot:prepend>
                来源{{ newText.source.length > 1 ? index + 1 : '' }}
              </template>
              <template v-slot:append>
                <el-button
                  icon="el-icon-minus"
                  @click="removeSourceInTextObj(newText, index)"
                />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item required>
            <el-select
              v-model="newText.tags"
              allow-create
              clearable
              filterable
              multiple
              placeholder="请选择作品标签"
              style="width: 100%"
            >
              <el-option-group
                v-for="group in tagOptions"
                :key="group.label"
                :label="group.label"
              >
                <el-option
                  v-for="item in group.options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.label"
                />
              </el-option-group>
            </el-select>
          </el-form-item>
          <el-form-item required>
            <quill-editor
              v-model="newText.content"
              :options="editorOptions"
              class="editor"
            />
          </el-form-item>
        </el-form>
      </el-col>
    </el-scrollbar>
    <span slot="footer" class="dialog-footer">
      <el-button type="primary" @click="$emit('article-publish')">
        发布
      </el-button>
      <el-button type="info" @click="addNewSourceInTextObj(newText)">
        增加来源
      </el-button>
      <el-button
        :disabled="!!newText.id"
        type="danger"
        @click="$emit('art-reset')"
      >
        重置
      </el-button>
      <el-button @click="$emit('pub-close')">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import {
  addNewSourceInTextObj,
  removeSourceInTextObj,
} from '@/renderer/utils/renderer-utils.js';

export default {
  name: 'pub-article',
  props: [
    'authorOptions',
    'newText',
    'publishDisable',
    'tagOptions',
    'title',
    'visible',
  ],
  data() {
    return {
      editorOptions: {
        modules: {
          toolbar: {
            container: [
              [
                // {'font': []},
                { size: ['small', false, 'large'] },
                { header: 1 },
                { header: 2 },
              ],
              [
                'bold',
                'italic',
                'underline',
                'strike',
                { script: 'sub' },
                { script: 'super' },
              ],
              [{ color: [] }, { background: [] }],

              [{ list: 'ordered' }, { list: 'bullet' }],
              [{ indent: '-1' }, { indent: '+1' }],
              [{ direction: 'rtl' }, { align: [] }],
              ['blockquote', 'code-block'],

              ['clean'],
              ['link', 'image'],
            ],
          },
        },
        placeholder: '请在此撰写您的作品……',
        theme: 'snow',
      },
    };
  },
  emits: ['art-reset', 'article-publish', 'pub-close'],
  methods: {
    addNewSourceInTextObj,
    removeSourceInTextObj,
  },
};
</script>

<style lang="scss">
span.ql-formats {
  span.ql-picker {
    margin-top: -9px;
  }

  span.ql-align {
    margin-top: -8px;
  }

  span.ql-picker-options {
    margin-top: 9px !important;
  }

  span.ql-background.ql-picker span.ql-picker-label {
    margin-top: -2px;
  }
}

span.ql-size span.ql-picker-label svg {
  margin-top: 0 !important;
}

div.ql-container div.ql-editor {
  height: 540px;
}

div.new-article span.el-input__suffix {
  right: -25px;
}
</style>
