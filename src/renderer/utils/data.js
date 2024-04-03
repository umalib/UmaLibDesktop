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

module.exports = {
  editors: editorList,
  elTagTypes: ['info', '', 'warning', 'success', 'danger'],
  signInfo: {
    content: '内容：NGA赛马娘翻译交流群 | 开发：风之低吟 | 版本：3.0.1-Final',
    pubKey:
      '04f7c5d1bf43e06c4a119deb999c33a488fc38d1a7f6387cdc0001ed190d6b304846b3d2931fb15f819c6e57ac7ce119f8c68e376a5631d5ccfc1f712a51187123',
    sign:
      '304402202de93abc0d269e05ce72b52bcac0797cb12e44821c097e2c0d31836358a34c5202207e253dba1e7abf0a37244b2b55829cd9a9bee64ffa1db62af521f19e99df55f8',
  },
  staffs: staffList,
  tagTypes: ['其他', '角色', '系列', '长篇/合集', '争议/不适'],
};
