import requests
import csv
import time

#Add latitude and longitude
with open('d:/Data Visualization/Project/data/FinalOutput.csv','r') as recordsInput:
    with open('d:/Data Visualization/Project/data/latlong_output.csv', 'w') as recordsOutput:
        reader = csv.DictReader(recordsInput)
        writer = csv.writer(recordsOutput)
        all = []
        for row in reader:
            time.sleep(1)
            city = row['city']
            state = row['state']
            response = requests.get('https://maps.googleapis.com/maps/api/geocode/json?address=' + city + ',' + state)
            resp_json_payload = response.json()
            loc = resp_json_payload['results'][0]['geometry']['location']
            print(loc['lat'])
            print(loc['lng'])
            row['latitude'] = loc['lat']
            row['longitude'] = loc['lng']
            all.append(row)
            writer.writerow([loc['lat'],loc['lng']])
        writer = csv.DictWriter(recordsOutput, all[0].keys())
        writer.writeheader()
        writer.writerows(all)