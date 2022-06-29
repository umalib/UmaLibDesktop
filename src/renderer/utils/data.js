import Utils from './renderer-utils';

const recommendations = {
  creators: [
    {
      name: 'kuirui（悔類）',
      isAuthor: true,
      recommendations: [
        {
          name: 'Nils',
          reason: [
            'Pixiv著名高产出作者。角色覆盖量大，文章词句平直但是往往能靠优秀的故事和细腻的情感取胜。',
            '在文章体量上，既有管饱的长篇or主题系列文，也有单篇故事。',
            '在角色分布上，短篇的分布比例相对均衡（长篇没办法），也包括不少作者本人思考后创作的原创角色短篇。',
            '',
            '作品当前翻译收录比例很高，产出频率也比较稳定。',
          ],
        },
      ],
    },
    {
      name: 'おはな',
      isAuthor: true,
      recommendations: [
        {
          name: 'Nils',
          reason: [
            '个人比较中意的一位女性作者。',
            '长于氛围和心理描写，相比于一般以角色间互动作为主体的创作，她的文章中常有不小比例的“独行”和“独思”部分。',
            '相比于上面提到的kuirui桑，おはな太太的问题是“故事性”会相对薄弱一点，但是往往可以通过氛围的铺垫达成一种成功的推进效果',
            '对于那种【愁肠百转，却又只得露出一个淡淡笑容】的高湿度剧情爱好者推荐。',
            '',
            '翻译收录比例暂时不是很高，还有许多单篇和一个十分大的连载可以等待翻译，属于富矿。',
          ],
        },
      ],
    },
    {
      name: '仮名@ウマ娘怪文書',
      isAuthor: true,
      recommendations: [
        {
          name: 'Nils',
          reason: [
            '有时候我们简称他为“匿名版桑”。正如他的名字所代表的，他的许多作品往往和“良马场”一毛钱也不沾边（某些良马场tag属于烟幕弹）。是属于在CY二创规划下来之后还玩命重+发癫（褒义）的一位作者。',
            '他的文章特点是将第一视角的狂热心理状态描写的十分到位，通过大量的换行和独白营造出一种近乎于诗歌但又耽溺于非伦理思考的状态。作品中往往也分为“猎手”和“猎物”的不同视角。交织起来阅读的体验非常的棒。',
            '',
            '不过也适当说明一下问题存在：他的作品就像是粘稠的黑糖一样，适当品味一篇味道会很棒，但是短时间大量阅读就会有一定的审美疲劳（我们翻译也经常隔一段时间再翻）。建议不要一口气读完。',
            '',
            '作品翻译收录比例相对不是太高，富矿作者。',
          ],
        },
      ],
    },
    {
      name: '万碎碎碎碎碎',
      isAuthor: true,
      recommendations: [
        { name: 'Nils', reason: ['推 荐！'] },
        { name: '风之低吟', reason: ['著名老师', '不言而喻'] },
      ],
    },
    {
      name: 'Nils',
      isAuthor: false,
      recommendations: [
        { name: '风之低吟', reason: ['翻译楼元老', '品质保证'] },
      ],
    },
  ],
  novels: {
    225: {
      title: 'Out of Triangle',
      isNovel: true,
      recommendations: [{ name: '黑羽仙洛', reason: ['推 荐！'] }],
    },
  },
  articles: {
    1: {
      title: '铃鹿小姐的故事',
      recommendations: [{ name: 'nameabcd', reason: ['万 恶 之 源'] }],
    },
  },
};

const staffs = [
  'byslm',
  'ChibaNils',
  'ken啊我',
  'NagatoSnake',
  'nameabcd',
  'STROHEIM',
  'Takatoshi',
  'Tye_sine',
  'z2566687',
  '万碎碎碎碎碎',
  '千綿奏',
  '女人的名字',
  '风之低吟',
  '东方季枫',
  '华生宇',
  '进击的南村群童',
  '南极洲老土著',
  '陨落赤炎',
  '莫名的不知火',
  '提里奥·屠鸡者',
  '黑羽仙洛',
].filter((v, i, l) => {
  return l.indexOf(v) === i;
});

export default {
  recommendations,
  staffs: Utils.splitList(staffs, 8),
  tagTypes: ['其他', '角色', '系列', '长篇/合集', '争议/不适'],
};
