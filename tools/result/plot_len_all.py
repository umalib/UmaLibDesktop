# -*- coding: utf-8 -*-
import json
import time

import matplotlib.pyplot as plt
import numpy as np
from matplotlib import rcParams

f = open('./output-plot-len.json', 'r', encoding='utf-8')
data = json.loads(f.read())
f.close()

config = {
    'axes.unicode_minus': False,
    "figure.figsize": (16, 9),
    "font.family": ['Microsoft YaHei', 'msgothic', 'serif'],
    "font.size": 10,
    "mathtext.fontset": 'stix',
}
rcParams.update(config)

ticksX = [data['days'][0], 18809, 18901, 18993, 19083, 19174, 19266, 19358, 19448, 19539, 19631, 19723, data['days'][-1]]
for i in range(0, len(data['all'])):
    data['all'][i] /= 1000

ticksY = []
for x in ticksX:
    ticksY.append(data['all'][data['days'].index(x)])

plt.plot(data['days'], data['all'], '-')
plt.xticks(ticksX, map(lambda x: time.strftime('%Y%m%d', time.localtime(x * 86400)), ticksX))
plt.yticks(list(set(ticksY)))
plt.xlabel(u"时间")
plt.ylabel(u"字符数（千字）")
plt.grid(linestyle=":")
plt.savefig(u'./作品字数增长曲线.pdf')
