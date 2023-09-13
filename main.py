from flask import Flask
from flask import request
from flask import jsonify
from os.path import exists
import requests
import json

app = Flask(__name__)

mxfaceKey = "<removed>"


### Obtain the session cookie needed for the Remote Monitoring image ###
def authVideo(ipAddress, username, password):
    url = "https://" + ipAddress + "/web/signin/open?"
    payload="username=" + username + "&password=" + password

    headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
        
    response = requests.request("POST", url, headers=headers, data=payload, verify=False)
    cookie = response.headers["Set-Cookie"]    
    return cookie


### Obtain Remote Monitoring Image blob ###
def getImage(ipAddress, cookie):
    url = "https://" + ipAddress + "/web/api/snapshot/get_b64?SourceType=localInput&SourceId=1&AutoRefresh=true"

    headers = {
      'Cookie': cookie
    }

    response = requests.request("GET", url, headers=headers, verify=False)
    jsonResponse = json.loads(response.text)
    imageBlob = jsonResponse["data"]
    return imageBlob


### Need to signout to avoid - Too Many Sessions
def logoutOfDevice(ipAddress, cookie):
    url = "https://" + ipAddress + "/web/signin/signout"
    headers = {
      'Cookie': cookie
    }

    response = requests.request("GET", url, headers=headers, verify=False)



@app.route("/uploadphoto")
def uploadphoto():
    ipAddress = request.remote_addr
    username = request.args.get('username')
    password = request.args.get('password')
    serialNumber = str(request.args.get('serialnumber'))
    filename = serialNumber + ".txt"

    cookie = authVideo(ipAddress, username, password)
    imageBlob = getImage(ipAddress, cookie)
    logoutOfDevice(ipAddress, cookie)

    with open(filename, "w") as f:
        f.write(imageBlob)

    return "200:OK"


@app.route("/comparephoto")
def comparephoto():
    ipAddress = request.remote_addr
    username = request.args.get('username')
    password = request.args.get('password')
    serialNumber = str(request.args.get('serialnumber'))
    filename = serialNumber + ".txt"

    cookie = authVideo(ipAddress, username, password)
    imageBlob = getImage(ipAddress, cookie)
    logoutOfDevice(ipAddress, cookie)

    with open(filename, "r") as f:
        savedImage = f.read().replace('\n', '')

    photoMatch = checkPhoto(savedImage, imageBlob)
    return photoMatch



def checkPhoto(savedImage, liveImage):
    url = "https://faceapi.mxface.ai/api/v3/face/verify"

    data = {
        "encoded_image1": savedImage,
        "encoded_image2": liveImage
    }

    json_object = json.dumps(data, indent = 4)
    headers = {
      'Content-Type': 'application/json',
      'Subscriptionkey': mxfaceKey
    }
    response = requests.request("POST", url, headers=headers, data=json_object)
    mxfaceResponse = response.text
    mxfaceJson = json.loads(mxfaceResponse)

    try:
        matchResult = mxfaceJson["matchedFaces"][0]["matchResult"]
        return str(matchResult)
    except:
        return mxfaceJson



@app.route("/confirmphotoexists")
def confirmphotoexists():
    serialNumber = str(request.args.get('serialnumber'))
    filename = serialNumber + ".txt"

    file_exists = exists(filename)
    if file_exists == True:
        return "True"
    else:
        return "False"


if __name__ == "__main__":
    app.run(host='0.0.0.0')
