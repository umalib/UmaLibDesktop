module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId: 'cn.umafan.lib',
        productName: '赛马娘同人集中楼大书库',
        mac: {
          icon: 'icons/icon.icns',
          artifactName: 'umalib-mac-v${version}.${ext}',
          target: ['dmg'],
        },
        win: {
          icon: 'icons/256x256.png',
          artifactName: 'umalib-win64-${version}.${ext}',
          target: [{ target: '7z', arch: ['x64'] }],
        },
        extraResources: [
          'prisma/**/*',
          'node_modules/.prisma/**/*',
          'node_modules/@prisma/client/**/*',
        ],
      },
      externals: ['@prisma/client'],
      nodeIntegration: true,
    },
  },
  devServer: {
    port: 58090,
  },
};
