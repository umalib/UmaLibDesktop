import Utils from './renderer-utils';

const recommendations = {
  creators: [
    {
      name: 'kuirui（悔類）',
      type: 0,
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
      type: 0,
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
      type: 0,
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
      type: 0,
      r: true,
      recommendations: [
        { name: 'Nils', reason: ['推 荐！'] },
        { name: '风之低吟', reason: ['著名老师', '不言而喻'] },
      ],
    },
    {
      name: 'Nils',
      type: 1,
      recommendations: [{ name: '风之低吟', reason: ['老牌译者，品质保证'] }],
    },
  ],
  novels: {
    225: {
      title: 'Out of Triangle',
      isNovel: true,
      recommendations: [{ name: '黑羽仙洛', reason: ['推 荐！'] }],
    },
    264: {
      title: '被拖入其中的训练员',
      isNovel: true,
      recommendations: [
        {
          name: '风之低吟',
          reason: [
            '被拖入其中的训练员第一部让我听见了最想让深陷重马场的训练员们喊出的话。',
          ],
        },
      ],
    },
  },
  articles: {
    1: {
      title: '铃鹿小姐的故事',
      recommendations: [{ name: 'nameabcd', reason: ['万 恶 之 源'] }],
    },
    2212: {
      title: '曼城茶座-大进综合征',
      recommendations: [
        {
          name: '风之低吟',
          reason: [
            '曾经只存在于臆想中的孩子终于降临到父母身边，',
            '虽然有些伤感，但最后很幸福的一篇大进综合征。',
          ],
        },
      ],
    },
    2783: {
      title: '没有星星的夜空',
      recommendations: [
        {
          name: 'banerjee',
          reason: [
            '（录入者的PS：推荐来自三创；是的，推荐者为本作写了三创）',
            '把这张西服的织姬套入正文里，就一转目白城画风了，一切不言者、尽在括号中',
            '桀桀桀桀桀，黑习习，和你努力营造的沉重感说再见吧(吔！！！)',
          ],
        },
      ],
    },
    3457: {
      title: '快子(Tachyon)曾梦扑火飞蛾乎',
      recommendations: [
        {
          name: '风之低吟',
          reason: [
            '两个角色、一个概念正好构成了两组对照，与标题遥相呼应。',
            '结局虽不完美，但从对照的关系去思考，又不得不承认角色某种意义上还是实现了自己的目的。',
            '结构巧妙，情节感人，推荐一读。',
          ],
        },
      ],
    },
  },
};

const staffList = [
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
  signInfo: {
    content: '内容：NGA赛马娘翻译交流群 开发：风之低吟（NGA） 版本：1.6.0',
    pubKey:
      '04f7c5d1bf43e06c4a119deb999c33a488fc38d1a7f6387cdc0001ed190d6b304846b3d2931fb15f819c6e57ac7ce119f8c68e376a5631d5ccfc1f712a51187123',
    sign:
      '30450220222f11deee897dfe569aaac9ce679a4b64fc57adb3464eca9d14bb1011d66c80022100bd7685ed19b4bc3faf6f7d65c36d89d4119df324171c4a1720651ee518e163f3',
  },
  staffs: Utils.splitList(staffList, 8),
  tagTypes: ['其他', '角色', '系列', '长篇/合集', '争议/不适'],
};
