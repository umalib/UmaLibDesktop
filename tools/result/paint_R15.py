# -*- coding: utf-8 -*-
import json

import matplotlib.pyplot as plt
import numpy as np
from matplotlib import rcParams

f = open('./output-pie.json', 'r')
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

R15 = data['R15']

keys = []
for i in range(0, len(R15['creators'])):
    keys.append('%s:%d(%.2f' % (R15['creators'][i], R15['counts'][i], R15['counts'][i] * 100 / R15['all']) + '%)')

plt.pie(np.array(R15['counts']), labels=keys)
plt.axis('equal')
plt.title(u'R15创作饼图')
plt.legend(loc="upper left")
plt.savefig(u'./R15创作饼图.pdf')
