[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# Cisco-Video-FaceID

* [Introduction](https://github.com/dhenwood/Cisco-Video-FaceID#introduction)
* [Background](https://github.com/dhenwood/Cisco-Video-FaceID#background)
* [Setup](https://github.com/dhenwood/Cisco-Video-FaceID#setup)

## Introduction
The following code demonstrates the intelligent sensors inside Cisco video devices to detect a persons face and subsequently log them into a Cisco Video Device based on their face (similar to FaceID on iPhone).

## Background
It is made up of two scripts; a macro running on the video device and a python script. Whilst I originally had hoped to run all of this from a single macro; there were some limitations that prevented this - notably, the video device has a limit in the body of any POST message (and the size of the image exceeded this).

* [Macro](https://github.com/dhenwood/Cisco-Video-FaceID/blob/main/faceId.js) - runs on the video device
* [Python script](https://github.com/dhenwood/Cisco-Video-FaceID/blob/main/main.py) - runs on a web server. <i>NOTE; this needs direct access to the video device, so cannot be placed on a public web server if the device is inside a corporate network</i>

The following diagram illistrates the interactions of these two scripts, along with querying an image detection engine and posting the output to a Webex space.
![alt text](https://github.com/dhenwood/Cisco-Video-FaceID/blob/main/FaceIdMessageFlow.png)

1. The macro running on the video device sends a POST message containing the username and password of the device.
2. Using the username and password (from 1), the Python script requests a specific cookie from the device. The device returns this in a header.
3. Using the cookie, the Python script requests the image.
4. The Python script takes this image, along with the saved image for that person and sends it to [MXFace](https://mxface.ai/), face comparison engine. This compares the two images and determines if they are the same person and returns the results.
5. The Python script returns (from step 1) to the video device that the two images are either a match or not.
6. The macro then, assuming their is a succesful facial match, displays all the usual icons on the Cisco video devices screen.

## Setup
The **Remote Monitoring** license key is **required** to be installed on the endpoint. The Remote Monitoring feature allows an administrator to monitor a room from the endpoint's web interface by getting snapshots from the camera sources connected to the endpoint. To purchase this license, the top level part code required is "**L-TP-RM**", after which you select the appropriate item for the respective device it will run on.

As mentioned above, the Python script needs to run on a server that has direct access to the Cisco video device. It needs to be able to initiate HTTP POST/GET requests to the device.

Once the [Macro](https://github.com/dhenwood/Cisco-Video-FaceID/blob/main/faceId.js) is installed on the Cisco video device, lines 4, 5 and 6 will need to be updated to reflect where the Python script is running along with the local username and password for the device.

For the [Python script](https://github.com/dhenwood/Cisco-Video-FaceID/blob/main/main.py), you will need to browse to [MXFace](https://mxface.ai/) and create an account with a trial service. Once done, you will be able to obtain a Subscription Key (click your profile icon in top right, then My Subscription). Once you have the key, update line 10 to include the key. Alternate facial comparison services or Python libraries could equally be used instead.
