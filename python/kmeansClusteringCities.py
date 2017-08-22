import sys
import pandas as pd
import pymongo
import json
import csv
import numpy as np
from sklearn.cluster import KMeans

dataFrameRecords = pd.read_csv('d:/Data Visualization/Project/data/inputForCluster.csv');
dataFrameRecordsCleaned = dataFrameRecords.dropna()
kmeans = KMeans(n_clusters=3)

clusters = kmeans.fit(dataFrameRecordsCleaned)
dataFrameRecordsCleaned['cluster'] = pd.Series(clusters.labels_, index=dataFrameRecordsCleaned.index)
dataFrameRecordsCleaned.to_csv('d:/Data Visualization/Project/data/cluster.csv')