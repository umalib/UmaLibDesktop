const formatter = new Intl.DateTimeFormat('cn', {
  dateStyle: 'short',
  timeStyle: 'short',
  hour12: false,
});

module.exports = {
  formatTimeStamp(timestamp) {
    if (!timestamp) {
      return '';
    }
    return formatter.format(new Date(timestamp)).replace(/\//g, '-');
  },
  getNewTextObj() {
    return {
      author: '',
      content: '',
      name: '',
      note: '',
      source: '',
      tags: [],
      translator: '',
      uploadTime: new Date().getTime(),
    };
  },
  splitList(src, size) {
    const ret = [];
    let tmpList = [],
      i = 0;
    do {
      tmpList.push(src[i]);
      i++;
      if (i % size === 0 || i === src.length) {
        ret.push(tmpList);
        tmpList = [];
      }
    } while (i < src.length);
    return ret;
  },
};
