module.exports = {
  pluginOptions: {
    electronBuilder: {
      externals: ['@prisma/client'],
      extraResources: ['src/data.db'],
    },
  },
};
