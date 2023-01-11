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

ticksX = [data['days'][0], data['days'][-1]]
ticksY = [0, 10, 20, 30, 40, 50, 60, 70, 80]

for i in range(0, len(data['delta'])):
    if data['delta'][i] > 25:
        ticksX.append(data['days'][i])
        ticksY.append(data['delta'][i])

plt.bar(data['days'], data['delta'])
plt.xticks(ticksX, map(lambda x: time.strftime('%Y%m%d', time.localtime(x * 86400))[2:], ticksX))
plt.yticks(ticksY)
plt.xlabel(u"时间")
plt.ylabel(u"创作数")
plt.grid(linestyle=":")
plt.savefig(u'./作品增长量.pdf')
