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
    "font.family": ['Songti SC', 'IPAexGothic', 'Times New Roman', 'serif'],
    "font.size": 10,
    "mathtext.fontset": 'stix',
}
rcParams.update(config)

R18 = data['R18']

keys = []
for i in range(0, len(R18['creators'])):
    keys.append('%s:%d(%.2f' % (R18['creators'][i], R18['counts'][i], R18['counts'][i] * 100 / R18['all']) + '%)')

plt.pie(np.array(R18['counts']), labels=keys)
plt.axis('equal')
plt.title(u'R18创作饼图')
plt.legend(loc="upper left")
plt.savefig(u'./R18创作饼图.pdf')
