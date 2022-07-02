const { ipcRenderer } = require('electron');
const MD5 = new (require('jshashes').MD5)();

const id2Resolve = {};
ipcRenderer.on('artChannel', (_, res) => {
  if (id2Resolve[res.id]) {
    id2Resolve[res.id](res.data);
  }
});

module.exports = {
  async get(action, args) {
    const id = await MD5.hex(
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
