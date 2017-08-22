import sys
import pandas as pd
import pymongo
import json
import csv
import geopy
import numpy as np


# dataFrameRecords = pd.read_csv('d:/Data Visualization/Project/data/report.csv');
# dataFrameRecordsCleaned = dataFrameRecords.dropna()
# dataFrameRecordsCleaned.to_csv('d:/Data Visualization/Project/data/reportWithoutNA.csv');
# dataFrameRecordsCleaned = dataFrameRecordsCleaned['agency_jurisdiction'].str.split(', ', expand=True)
# dataFrameRecordsCleaned.to_csv('d:/Data Visualization/Project/data/locationSplit_output.csv');


#adding the column "existing_record" : true for real records and false for self generated records
# with open('d:/Data Visualization/Project/data/reportWithoutNA.csv','r') as recordsInput:
#     with open('d:/Data Visualization/Project/data/report_output.csv', 'w') as recordsOutput:
#         writer = csv.writer(recordsOutput, lineterminator='\n')
#         reader = csv.reader(recordsInput)
#
#         row = next(reader)
#         row.append('existing_record')
#         all.append(row)
#         for row in reader:
#             row.append('True')
#             all.append(row)
#         writer.writerows(all)
#

# Writing data to MongoDB
mng_client = pymongo.MongoClient('localhost', 27017)
mng_db = mng_client['test_db']
collection_name = 'test_collection1'
db_cm = mng_db[collection_name]
data = pd.read_csv("d:/Data Visualization/Project/data/FinalOutput.csv")
datafreefromna = data.dropna()
rows1 = datafreefromna.shape[0]
print(rows1)
row = data.shape[0]
print(row)
data_json = json.loads(data.to_json(orient='records'))
db_cm.remove()
db_cm.insert(data_json)

