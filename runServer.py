from flask import Flask
from flask import render_template
from pymongo import MongoClient
import json
from bson import json_util
from bson.json_util import dumps

app = Flask(__name__)

MONGODB_HOST = 'localhost'
MONGODB_PORT = 27017
DBS_NAME = 'test_db'
COLLECTION_NAME = 'test_collection1'
FIELDS = {'Rapes': True, 'Assaults': True, 'Robberies': True, 'agency_jurisdiction': True, 'Year': True,'_id':True,
          'Total Crimes' : True, 'Homicides': True, 'months_reported':True,'date':True,'City':True,'State':True, 'Population':True,
          'Total crimes per capita':True, 'cluster':True, 'Type':True, 'lat':True,'lng':True}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/test_db/test_collection1")
def test_db_test_collection():
    connection = MongoClient(MONGODB_HOST, MONGODB_PORT)
    collection = connection[DBS_NAME][COLLECTION_NAME]
    projects = collection.find(projection=FIELDS)
    json_projects = []
    for project in projects:
        json_projects.append(project)
    json_projects = json.dumps(json_projects, default=json_util.default)
    connection.close()
    return json_projects

if __name__ == "__main__":
    app.run(host='0.0.0.0',port=8080,debug=True)