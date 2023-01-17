# -*- coding: utf-8 -*-
import json
import math
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

creatorLabels = data['dict']['creators']

ticksY = list(np.arange(0, data['creators'][0][-1], 20 if data['creators'][0][-1] < 300 else 50))
for i in range(0, len(creatorLabels)):
    ticksY.append(data['creators'][i][-1])

for i in range(0, len(creatorLabels)):
    plt.plot(data['days'], data['creators'][i], '-', label=creatorLabels[i])
plt.xticks(ticks, map(lambda x: time.strftime('%Y%m%d', time.localtime(x * 86400)), ticks))
plt.yticks(list(set(ticksY)))
plt.xlabel(u"时间")
plt.ylabel(u"作品数")
plt.legend(loc="best")
plt.grid(linestyle=":")
plt.savefig(u'./前10作者创作数增长曲线.pdf')
