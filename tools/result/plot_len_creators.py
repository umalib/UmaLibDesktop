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

ticks = [data['days'][0], 18809, 18901, 18993, 19083, 19174, 19266, 19358, 19448, 19539, 19631, data['days'][-1]]

creatorLabels = data['dict']['creators']

for i in range(0, len(data['creators'])):
    for j in range(0, len(data['creators'][i])):
        data['creators'][i][j] /= 1000

ticksY = list(np.arange(0, data['creators'][0][-1], 200))
for i in range(0, len(creatorLabels)):
    ticksY.append(data['creators'][i][-1])

for i in range(0, len(creatorLabels)):
    plt.plot(data['days'], data['creators'][i], '-', label=creatorLabels[i])
plt.xticks(ticks, map(lambda x: time.strftime('%Y%m%d', time.localtime(x * 86400)), ticks))
plt.yticks(list(set(ticksY)))
plt.xlabel(u"时间")
plt.ylabel(u"字符数（千字）")
plt.legend(loc="best")
plt.grid(linestyle=":")
plt.savefig(u'./前10作者字符数增长曲线.pdf')
