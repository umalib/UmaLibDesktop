<template>
  <el-dialog
    @close="
      $refs.pubContent && ($refs.pubContent.wrap.scrollTop = 0);
      $emit('close-pub');
    "
    :close-on-click-modal="false"
    :visible="visible"
    center
    class="new-article"
    :title="title"
    width="80%"
  >
    <el-scrollbar ref="pubContent" style="height: 100%">
      <el-col :offset="1" :span="22">
        <el-form :model="newText">
          <el-form-item>
            <el-input
              maxlength="50"
              type="input"
              placeholder="作品的标题"
              v-model="newText.name"
              clearable
            >
              <template slot="prepend">标题</template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-select
              allow-create
              clearable
              filterable
              placeholder="请选择作者"
              style="width: 100%"
              v-model="newText.author"
              value=""
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
              allow-create
              clearable
              filterable
              placeholder="请选择译者"
              style="width: 100%"
              v-model="newText.translator"
              value=""
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
              maxlength="100"
              type="input"
              placeholder="有什么话想说？没有的话默认截取正文前100个字符哦"
              v-model="newText.note"
              clearable
            >
              <template slot="prepend">备注</template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-date-picker
              format="yyyy/MM/dd HH:mm:ss"
              placeholder="选择发表/翻译时间"
              style="width: 100%"
              type="datetime"
              v-model="newText.uploadTime"
              value-format="timestamp"
            >
            </el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-input
              maxlength="128"
              type="input"
              placeholder="这篇作品是转载吗？请附上链接"
              v-model="newText.source"
              clearable
            >
              <template slot="prepend">来源</template>
            </el-input>
          </el-form-item>
          <el-form-item required>
            <el-select
              allow-create
              clearable
              filterable
              multiple
              style="width: 100%"
              placeholder="请选择作品标签"
              v-model="newText.tags"
              value=""
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
              :options="editorOptions"
              class="editor"
              v-model="newText.content"
            />
          </el-form-item>
        </el-form>
      </el-col>
    </el-scrollbar>
    <span slot="footer" class="dialog-footer">
      <el-button type="primary" @click="$emit('publish-article')">
        发布
      </el-button>
      <el-button type="danger" @click="$emit('reset-art')">
        重置
      </el-button>
      <el-button @click="$emit('close-pub')">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'pub-article',
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
  props: ['authorOptions', 'newText', 'tagOptions', 'title', 'visible'],
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
