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
    content: '内容：NGA赛马娘翻译交流群 | 开发：风之低吟 | 版本：3.0.2-Final',
    pubKey:
      '04f7c5d1bf43e06c4a119deb999c33a488fc38d1a7f6387cdc0001ed190d6b304846b3d2931fb15f819c6e57ac7ce119f8c68e376a5631d5ccfc1f712a51187123',
    sign:
      '3044022046198076647c9469c0cbd0cffe134dc208d6d0337f6c7cace46a3d0981dc0839022068d1b2aa8b71d1b8b642e30b1b3a7f2bd160c096d4307216f53943fb5e9438f7',
  },
  staffs: staffList,
  tagTypes: ['其他', '角色', '系列', '长篇/合集', '争议/不适'],
};
