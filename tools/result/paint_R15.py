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

R15 = {"南村群童": 20, "z2566687": 9, "鬼道": 9, "Nils": 8, "Takatoshi": 7, "华生宇": 5, "几何撕裂": 3, "自我厌恶者": 3,
       "莫名的不知火": 3, "ayazuko": 2, "nameabcd": 2, "东方季枫": 2, "蔚蓝之空s": 2, "黑羽仙洛": 2, "Lnco♂H": 1,
       "UID42134725": 1, "luozijin999": 1, "oranjiuce": 1, "南极洲老土著": 1, "咕咕咕jhfd": 1,
       "比那名居花花": 1, "面壁の滑稽": 1, "驱逐舰最棒了": 1}

keys = []
for c in list(R15.keys()):
    keys.append('%s:%d(%.2f' % (c, R15[c], R15[c] * 100 / 86) + '%)')

plt.pie(np.array(list(R15.values())), labels=keys)
plt.title(u'R15创作饼图')
plt.savefig(u'./R15创作饼图.pdf')
