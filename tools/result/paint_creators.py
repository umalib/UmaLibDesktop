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

creatorLabels = data['dict']['creators']

ticksY = [0, 100, 200, 300, 400, 500, 600]
for i in range(0, len(creatorLabels)):
    ticksY.append(data['creators'][i][-1])

for i in range(0, len(creatorLabels)):
    plt.plot(data['days'], data['creators'][i], '-', label=creatorLabels[i])
plt.xticks(ticks, map(lambda x: time.strftime('%Y%m%d', time.localtime(x * 86400)), ticks))
plt.yticks(ticksY)
plt.xlabel(u"时间")
plt.ylabel(u"作品数")
plt.legend(loc="best")
plt.grid(linestyle=":")
plt.savefig(u'./前10作者创作数增长曲线.pdf')
