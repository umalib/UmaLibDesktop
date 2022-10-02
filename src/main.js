import Vue from 'vue';
import VueRouter from 'vue-router';
import VueQuillEditor from 'vue-quill-editor';
import ElementUI from 'element-ui';
import App from '@/renderer/app.vue';

import ArticleView from '@/renderer/views/article.vue';
import ManageView from '@/renderer/views/manage.vue';
import MenuView from '@/renderer/views/menu.vue';
import FavoriteView from '@/renderer/views/favorite.vue';
import HistoryView from '@/renderer/views/history.vue';
import CopyrightView from '@/renderer/views/copyright.vue';
import EmptyView from '@/renderer/views/empty.vue';

import 'element-ui/lib/theme-chalk/index.css';

Vue.config.productionTip = false;
Vue.use(VueRouter);
Vue.use(VueQuillEditor);
Vue.use(ElementUI);

const router = new VueRouter({
  routes: [
    { path: '/', redirect: '/list' },
    {
      path: '/list',
      name: 'Article',
      component: ArticleView,
    },
    {
      path: '/manage',
      name: 'Manage',
      component: ManageView,
    },
    { path: '/menu/:id', name: 'Menu', component: MenuView },
    {
      path: '/favorites',
      name: 'Favorite',
      component: FavoriteView,
    },
    { path: '/history', name: 'History', component: HistoryView },
    { path: '/copyright', name: 'Copyright', component: CopyrightView },
    {
      path: '/empty',
      name: 'Empty',
      component: EmptyView,
    },
  ],
});

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');
