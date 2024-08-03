# -*- coding: utf-8 -*-
import json
import time

import matplotlib.pyplot as plt
import numpy as np
from matplotlib import rcParams

f = open('./output-plot-count.json', 'r', encoding='utf-8')
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


ticksX = [data['days'][0]]
for t in range(18809,data['days'][-1] - 90):
    ticksName = time.strftime('%Y%m%d', time.localtime(t * 86400))
    if ticksName.endswith('0101') or ticksName.endswith('0401') or ticksName.endswith('0701') or ticksName.endswith('1001'):
        ticksX.append(t)
ticksX.append(data['days'][-1])

ticksY = list(np.arange(0, max(data['delta']), 10))

# exceptionVal = round(data['all'][-1] * 4 / len(data['all']))
#
# for i in range(0, len(data['delta'])):
#     if data['delta'][i] > exceptionVal:
#         ticksX.append(data['days'][i])
#         ticksY.append(data['delta'][i])

plt.bar(data['days'], data['delta'])
plt.xticks(ticksX, map(lambda x: time.strftime('%Y%m%d', time.localtime(x * 86400))[2:], ticksX))
plt.yticks(list(set(ticksY)))
plt.xlabel(u"时间")
plt.ylabel(u"创作数")
plt.grid(linestyle=":")
plt.savefig(u'./作品增长量.pdf')
