const { ipcRenderer } = require('electron');
const argon2 = require('argon2');

const id2Resolve = {};
ipcRenderer.on('artChannel', (_, res) => {
  if (id2Resolve[res.id]) {
    id2Resolve[res.id](res.data);
  }
});

module.exports = {
  async get(action, args) {
    const id = await argon2.hash(
      action + JSON.stringify(args) + new Date().getTime(),
    );
    ipcRenderer.send('artChannel', {
      id,
      action,
      args,
    });
    return new Promise(resolve => {
      id2Resolve[id] = resolve;
    });
  },
};
