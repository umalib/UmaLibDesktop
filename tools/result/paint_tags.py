# -*- coding: utf-8 -*-
import json
import time

import matplotlib.pyplot as plt
import numpy as np
from matplotlib import rcParams

f = open('./output-plot.json', 'r')
data = json.loads(f.read())
f.close()

config = {
    'axes.unicode_minus': False,
    "figure.figsize": (16, 9),
    "font.family": ['Songti SC', 'IPAexMincho', 'serif'],
    "font.size": 10,
    "mathtext.fontset": 'stix',
}
rcParams.update(config)

ticks = [data['days'][0], 18809, 18901, 18993, 19083, 19174, 19266, data['days'][-1]]

tagLabels = data['dict']['tags']

lineColor = ['red', 'orange', 'goldenrod', 'green', 'darkcyan', 'blue', 'purple', 'darkred', 'darkorange', 'olive',
             'black', 'steelblue']

ticksY = list(np.arange(0, data['tags'][0][-1], 25 if data['tags'][0][-1] < 200 else 50))
for i in range(0, len(tagLabels)):
    ticksY.append(data['tags'][i][-1])

for i in range(0, len(tagLabels)):
    plt.plot(data['days'], data['tags'][i], '-', c=lineColor[i], label=tagLabels[i])
plt.xticks(ticks, map(lambda x: time.strftime('%Y%m%d', time.localtime(x * 86400)), ticks))
plt.yticks(list(set(ticksY)))
plt.xlabel(u"时间")
plt.ylabel(u"作品数")
plt.legend(loc="best")
plt.grid(linestyle=":")
plt.savefig(u'./前10标签及R18R15创作数增长曲线.pdf')
