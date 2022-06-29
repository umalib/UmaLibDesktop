module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
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
