const editorList = [
  '黑羽仙洛',
  '风之低吟',
  'ChibaNils',
  'byslm',
  'Alanポポ',
  '提里奥·屠鸡者',
  '盈盈星尘',
  '女人的名字',
  'NagatoSnake',
];

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

const alias = {};
alias['大拓太阳神'] = '大德太阳';
alias['小小蚕茧'] = '小巧圆茧\\Little Cocon';
alias['千明代表'] = 'Mr.CB';
alias['飞机云'] = '铁鸟翱天';
alias['长山我驹'] = '长山之马';
alias['艾尼斯风神'] = '艾尼风神';
alias['东海帝王'] = '东海帝皇';
alias['东商变革'] = '藤正扫帚';
alias['东瀛佐敦'] = '岛川乔登';
alias['目白赖恩'] = '目白莱恩\\目白雷恩';
alias['圣王光环'] = '帝王光辉\\帝皇光辉';
alias['成田白仁'] = '成田拜仁';
alias['成田路'] = '成田速王';
alias['光辉致意'] = 'Light Hello';
alias['优秀素质'] = '好天资';
alias['名将怒涛'] = '名将户仁';
alias['名竞应援'] = '齐叫好';
alias['安身立命'] = '幸存者';
alias['好歌剧'] = '竹正歌剧王';
alias['里见女尊'] = '里见蕾娜斯';
alias['谷水琴蕾'] = '谷野美酒';
alias['快乐米可'] = '快乐温顺\\Happy Mik';
alias['纯洁光辉'] = '纯水之辉\\碧水鉴心';
alias['青云天空'] = '星云天空';
alias['苦味糖衣'] = '微苦糖渍\\Bitter Glasse';
alias['春乌拉拉'] = '春乌菈菈';
alias['待兼诗歌剧'] = '待兼唐怀瑟';
alias['真机伶'] = '卡莲酱';
alias['夏威夷王'] = '龟波王';
alias['高多芬柏布'] = '高多芬阿拉伯';
alias['骏川缰绳'] = '骏川手纲';
alias['萌机伶'] = '机伶梦';
alias['曼城茶座'] = '曼哈顿咖啡';
alias['第一红宝石'] = '第一露比';
alias['超级小海湾'] = '超级小溪\\超级溪流';
alias['鲁铎象征'] = '鲁道夫象征';
alias['樱花进王'] = '樱花蓦进王';

module.exports = {
  editors: editorList,
  elTagTypes: ['info', '', 'warning', 'success', 'danger'],
  getAlias(label) {
    return alias[label] ? `${label}\\${alias[label]}` : label;
  },
  signInfo: {
    content: '内容：NGA赛马娘翻译交流群 | 开发：风之低吟 | 版本：3.0.0-Final',
    pubKey:
      '04f7c5d1bf43e06c4a119deb999c33a488fc38d1a7f6387cdc0001ed190d6b304846b3d2931fb15f819c6e57ac7ce119f8c68e376a5631d5ccfc1f712a51187123',
    sign:
      '3045022100c2ecb6ccc89e1997b0f570a653acc0d65f4f923640274eb023092f8bfbf5915202207a781316d6010b985fee6934344bc28d69f074516a4fa12936118894110a5e4d',
  },
  staffs: staffList,
  tagTypes: ['其他', '角色', '系列', '长篇/合集', '争议/不适'],
};
