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

ticksX = [data['days'][0], 18809, 18901, 18993, 19083, 19174, 19266, data['days'][-1]]

ticksY = list(np.arange(0, data['all'][-1], 50 if data['all'][-1] < 1000 else 500))
ticksY.append(data['all'][-1])

plt.plot(data['days'], data['all'], '-')
plt.xticks(ticksX, map(lambda x: time.strftime('%Y%m%d', time.localtime(x * 86400)), ticksX))
plt.yticks(list(set(ticksY)))
plt.xlabel(u"时间")
plt.ylabel(u"作品数")
plt.grid(linestyle=":")
plt.savefig(u'./作品总数增长曲线.pdf')
