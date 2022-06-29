export default {
  formatTimeStamp(timestamp) {
    if (!timestamp) {
      return '';
    }
    return new Date(timestamp)
      .toLocaleString('cn', { hour12: false })
      .replace(' 24:', ' 00:');
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
