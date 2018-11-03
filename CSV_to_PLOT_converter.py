#!/usr/bin/env python
# coding: utf-8

# In[24]:


import matplotlib.pyplot as plt
import pandas as pd


# In[37]:


def createFuture(filters, problem):
    # read DATA
    data = pd.read_csv('./export.csv', delimiter=";")

    # apply filter
    data = data.loc[
        (data['locatie'] == filters[0]) &
        (data['component'] == problem)
        ]

    # create return array
    returnVals = [data, problem]

    # return set array
    return returnVals


# create custom data request
data = createFuture(['Amsterdam-Van Diemenstraat'], 'CO')

# sort values by day (tijdstip)
values = data[0].sort_values(by=['tijdstip'])

# get lenght of the value array
length = len(values)

i = 0
# convert value to CORRECT datatypes / split strings where necessary

tijdstip = values['tijdstip']
values['tijdstip'] = [w.split(' ', 1)[0] for w in values['tijdstip']]
problem = values['waarde']

values['waarde'] = [w.replace(',', '.') for w in values['waarde']]
problem = pd.to_numeric(values['waarde'])

# create plot x & y array
time = []  # x
problemVal = []  # y

# fill set (x & y ) arrays
while i < length:
    if i % 24 == 0:
        time.append(tijdstip.iloc[i])
        problemVal.append(problem.iloc[i])
    i += 1

# create plot
fig, ax = plt.subplots()

# fill plot with x & y arrays
ax.plot(time, problemVal)
# set Labels
ax.set(xlabel='Day', ylabel=values['component'].iloc[0],
       title=values['component'].iloc[0] + " in the air")

my_xticks = ax.get_xticks()
plt.xticks([my_xticks[0], my_xticks[-1]], visible=True, rotation="horizontal")

# show the plot
plt.show()

# In[10]:


plt.style.use('ggplot')

# In[ ]:
