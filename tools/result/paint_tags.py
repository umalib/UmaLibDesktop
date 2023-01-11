# -*- coding: utf-8 -*-
import json
import math
import time

import matplotlib.pyplot as plt
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

ticks = []
start = data['days'][0]
end = data['days'][-1]
delta = math.floor((end - start) / 10)
while start + delta < end:
    ticks.append(start)
    start += delta

ticks.append(end)

tagLabels = data['dict']['tags']

lineColor = ['red', 'orange', 'goldenrod', 'green', 'darkcyan', 'blue', 'purple', 'darkred', 'darkorange', 'olive',
             'black', 'steelblue']

ticksY = [0, 50, 100, 150, 200, 250]
for i in range(0, len(tagLabels)):
    ticksY.append(data['tags'][i][-1])

for i in range(0, len(tagLabels)):
    plt.plot(data['days'], data['tags'][i], '-', c=lineColor[i], label=tagLabels[i])
plt.xticks(ticks, map(lambda x: time.strftime('%Y%m%d', time.localtime(x * 86400)), ticks))
plt.yticks(ticksY)
plt.xlabel(u"时间")
plt.ylabel(u"作品数")
plt.legend(loc="best")
plt.grid(linestyle=":")
plt.savefig(u'./前10标签及R18R15创作数增长曲线.pdf')
