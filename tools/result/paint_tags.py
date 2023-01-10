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

tagLabels = [
    '青云天空',
    '爱丽速子',
    '黄金船',
    '无声铃鹿',
    '里见光钻',
    '曼城茶座',
    '爱丽数码',
    '一路通',
    '大和赤骥',
    '目白麦昆',
    'R18',
    'R15'
]

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
