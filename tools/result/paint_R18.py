# -*- coding: utf-8 -*-
import json

import matplotlib.pyplot as plt
import numpy as np
from matplotlib import rcParams

config = {
    "figure.figsize": (12, 8),
    "font.family": 'serif',
    "font.size": 10,
    "mathtext.fontset": 'stix',
    "font.serif": ['Songti SC']
}
rcParams.update(config)

R18 = {"万碎碎碎碎碎": 88, "南村群童": 53, "南极洲老土著": 22, "鬼道": 14, "Takatoshi": 8, "东方季枫": 5, "Tye_sine": 4,
       "亚历山大港的灯塔": 4, "k45ooo": 3, "肠胃不好的暴食者": 3, "自我厌恶者": 3, "蔚蓝之空s": 3, "Lnco♂H": 2,
       "千绵奏": 2, "华生宇": 2, "陨落赤炎": 2, "HasturDelta": 1, "Nils": 1, "STROHEIM": 1, "ken": 1, "几何撕裂": 1,
       "沃斯旦森": 1, "风之低吟": 1}

keys = []
for c in list(R18.keys()):
    keys.append('%s:%d(%.2f' % (c, R18[c], R18[c] * 100 / 259) + '%)')

plt.pie(np.array(list(R18.values())), labels=keys)
plt.title(u'R18创作饼图')
plt.savefig(u'./R18创作饼图.pdf')
