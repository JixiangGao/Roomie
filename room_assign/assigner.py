#!/usr/bin/env python2
# -*- coding: utf-8 -*-
"""
Created on Tue Dec  5 23:08:49 2017

@author: Raven
"""

import numpy as np
import pandas as pd
from pandas import Series, DataFrame
from sklearn.cluster import AffinityPropagation

def make_features(data):
    hyg = ['1', '2', '3', '4']
    buy = {'17.1': 0, '17.2': 1, '17.3': 3, '17.4': 3, '17.5': 2, '17.6': 0, '17.7': 4, '17.8': 3, '17.9': 1, '17.11': 0, '17.12': 0, '17.13': 0}
    grp = ['13.1', '13.2', '13.3', '13.4', '13.5', '13.6', '13.7', '13.8', '13.9']
    
    
    dataArr = []
    for i in data.index:
        lineArr = [i]
        
        hyg_num = 0.0
        for key in hyg:
            hyg_num += 1.0 / data.ix[i][key]
        lineArr.append(hyg_num)
    
        if data.ix[i]['5'] < 3:
            lineArr.append(1)
        elif data.ix[i]['5'] == 3:
            lineArr.append(2)
        else:
            lineArr.append(3)
        
        stu_num = 0.0
        if data.ix[i]['10'] < 3:
            stu_num += 1.0 / data.ix[i]['10']
        stu_num += 1.0 / (2 * data.ix[i]['11.6'])
        if data.ix[i]['12'] == 5:
            stu_num += 0.5
        lineArr.append(stu_num)
    
        buy_num = 0.0
        buy_sum = 0.0
        buy_num += data.ix[i]['16'] / 5.0
        for key in buy.keys():
            buy_sum += data.ix[i][key] * buy[key]
        buy_num += buy_sum / 8.5
        lineArr.append(buy_num)
    
        grp_num = 0.0
        grp_sum = 0.0
        if data.ix[i]['8'] < 3:
            grp_num += 1.0
        elif data.ix[i]['8'] > 2 and data.ix[i]['8'] < 5:
            grp_num += 0.5
        if data.ix[i]['14'] == 4:
            grp_num += 1.0
        elif data.ix[i]['14'] == 3:
            grp_num += 0.5
        for g in grp:
            grp_sum += data.ix[i][g]
        grp_num += grp_sum / 9.0
        lineArr.append(grp_num)
    
        lineArr.append(data.ix[i]['9'])
    
        bad_hyg = 1.0 / data.ix[i]['15.1'] + 1.0 / data.ix[i]['11.1']
        lineArr.append(bad_hyg)
    
        lat_slp = 1.0 / data.ix[i]['11.6']
        lineArr.append(lat_slp)
    
        flag = 0
        for j in lineArr:
            if j < 0:
                flag = 1
                break
        if flag == 0:
            dataArr.append(lineArr)

    data_new = DataFrame(dataArr, columns = ['index', 'hyg_num', 'sle_tim', 'stu_num', 'buy_num', 'grp_num', 'split', 'bad_hyg', 'lat_slp'])  
    return data_new

def grouping(data):
    groups = []
    
    group = data[(data.sle_tim == 1.0) & (data.lat_slp >= 0.3)].reset_index(drop = True)
    groups.append(group)
    
    index_list = groups[0]['index'].tolist()
    select = []
    for i in data.index:
        if data.ix[i]['hyg_num'] >= 3.0 and data.ix[i]['bad_hyg'] >= 1.2 and data.ix[i]['sle_tim'] <= 2 and data.ix[i]['index'] not in index_list:
            select.append(i)
    group = data.loc[select].reset_index(drop = True)
    groups.append(group)
    
    index_list += groups[1]['index'].tolist()
    select = []
    for i in data.index:
        if data.ix[i]['hyg_num'] >= 3.0 and data.ix[i]['bad_hyg'] >= 1.2 and data.ix[i]['sle_tim'] == 3 and data.ix[i]['index'] not in index_list:
            select.append(i)
    group = data.loc[select].reset_index(drop = True)
    groups.append(group)
    
    index_list += groups[2]['index'].tolist()
    select = []
    for i in data.index:
        if data.ix[i]['sle_tim'] <= 2 and data.ix[i]['index'] not in index_list:
            select.append(i)
    group = data.loc[select].reset_index(drop = True)
    groups.append(group)
    
    index_list += groups[3]['index'].tolist()
    select = []
    for i in data.index:
        if data.ix[i]['index'] not in index_list:
            select.append(i)
    group = data.loc[select].reset_index(drop = True)
    groups.append(group)
    
    return groups

def cluster(group):
    X = group.loc[:, ['stu_num', 'buy_num', 'grp_num']].values
    af = AffinityPropagation()
    y = af.fit_predict(X)
    group['label'] = y
    return group

def get_empty_dict(group):
    cls = {'mix':[]}
    for i in group[group.room == -1].index:  
        if group.ix[i]['split'] == 1:
            cls['mix'].append(i)
            continue
        key = str(group.ix[i]['label'])
        if cls.has_key(key) == False:
            cls[key] = [i]
        else:
            cls[key].append(i)
    return cls

def room_assign(group, room_num):
    grouped = cluster(group)
    grouped['room'] = -1
    #
    round_one = get_empty_dict(grouped)
    for key in round_one.keys():
        cluster_list = round_one[key]
        for m in range(0, len(cluster_list), 4):
            if (m + 4) > len(cluster_list):
                break
            for n in range(4):
                grouped.loc[cluster_list[m + n], ['room']] = room_num
            room_num += 1
    #
    round_two = get_empty_dict(grouped)
    length = {}
    for key in round_two.keys():
        length[str(key)] = len(round_two[key])
    length_s = Series(length).sort_values(ascending=False)
    #length_s.sort_values(ascending=False)
    length_i = length_s.index
    length_left = {}
    count = len(grouped[grouped.room == -1])
    for i in range(count / 4):
        length_left[room_num] = 4 - length_s[length_i[i]]
        for j in round_two[length_i[i]]:
            grouped.loc[j, ['room']] = room_num
        room_num += 1
    #
    round_three = get_empty_dict(grouped)
    left_list = []
    for v in round_three.values():
        left_list += v
    i = 0
    
    for key in length_left.keys():
        for j in range(length_left[key]):
            grouped.loc[left_list[i], ['room']] = key
            i += 1
    grouped.drop('label', 1, inplace = True)
    return room_num

def merge(groups):
    result = groups[0].append(groups[1], ignore_index=True)
    for i in range(2, len(groups)):
        result = result.append(groups[i], ignore_index=True)
    return result

if __name__ == "__main__":
    filename = 'student_info.csv'
    data = pd.read_csv(filename, index_col = 0, header = 0)
    data_new = make_features(data)
    groups = grouping(data_new)
    room_num = 0
    for group in groups:
        room_num = room_assign(group, room_num)
    result = merge(groups)
    result.to_csv('result.csv')