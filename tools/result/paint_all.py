# -*- coding: utf-8 -*-
import json
import math
import time

import matplotlib.pyplot as plt
from matplotlib import rcParams

f = open('./output.json', 'r')
data = json.loads(f.read())
f.close()

config = {
    "figure.figsize": (12, 8),
    "font.family": 'serif',
    "font.size": 10,
    "mathtext.fontset": 'stix',
    "font.serif": ['Songti SC']
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

plt.plot(data['days'], data['all'], '-')
plt.xticks(ticks, map(lambda x: time.strftime('%Y%m%d', time.localtime(x * 86400)), ticks))
plt.yticks([0, 1000, 2000, 3000, 4000, 4614], [0, 1000, 2000, 3000, 4000, 4614])
plt.xlabel(u"时间")
plt.ylabel(u"作品数")
plt.grid(linestyle=":")
plt.savefig(u'./作品总数增长曲线.pdf')