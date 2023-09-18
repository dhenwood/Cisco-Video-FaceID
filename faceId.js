import xapi from 'xapi';

// Variables
const faceIdServerAddress = "http://anzbots.cisco.com:5000";
const username = "<removed>"; // local device username
const password = "<removed>"; // local device password


// Do not touch
var deviceName;
var refreshInterval;
var loopStart = 0;
const loopStop = 10;


function verifyFaceId(){
  //Need to add check for Remote Monitoring License Key installed
  //Need to add check for Camera Lid == "Open"
    const faceIdServer = faceIdServerAddress + "/comparephoto?username=" + username + "&password=" + password + "&serialnumber=" + deviceName
    console.log("attempting to compare to: " + faceIdServer)
    progress()

    xapi.command('HttpClient Get', { 'Url':faceIdServer, 'AllowInsecureHTTPS': 'True'}).then(
      (result) => {
      var body = result.Body;
      console.log("photoCompareResponse: " + body)
      
      if(body == 1){
      //Face Match Successful
      performLogin();
    }else if(body == 0){
      //Face Match Unsuccessful
      clearInterval(refreshInterval);
      notifyUI("Error", "FaceID has detected that your face does match.")
    }else{
      // Face Match Error
      clearInterval(refreshInterval);

      var errorJson = JSON.parse(body)
      var errorMessage = errorJson.errorMessage
      notifyUI("Error", errorMessage)
    }
  });
}

function performPhotoUpload(){
  console.log("faceIdUpdatePhoto Pressed")
  const faceIdServer = faceIdServerAddress + "/uploadphoto?username=" + username + "&password=" + password + "&serialnumber=" + deviceName
  console.log("attempting to upload to: " + faceIdServer)
  
  xapi.command('HttpClient Get', { 'Url':faceIdServer, 'AllowInsecureHTTPS': 'True'}).then(
    (result) => {
    var body = result.Body;
    console.log("myResponse: " + body)
  });
  // Clear panel
}

function performLogout(){
  // do a check if saved photo exists - call checkIfSavedImageExists with callback
  xapi.config.set("UserInterface Features HideAll", 'True')
  togglePanelVisbility('faceIdLoginPanel', 'Auto') 
  togglePanelVisbility('faceIdLogoutPanel', 'Hidden')
  xapi.config.set("UserInterface SettingsMenu Visibility", "Hidden")
  xapi.command("UserInterface Extensions Panel Close")
}

function performLogin(){
  xapi.config.set("UserInterface Features HideAll", 'False')
  togglePanelVisbility('faceIdLoginPanel', 'Hidden') 
  togglePanelVisbility('faceIdLogoutPanel', 'Auto')
  xapi.config.set("UserInterface SettingsMenu Visibility", "Auto")
  xapi.command("UserInterface Extensions Panel Close")
}

function checkIfSavedImageExists(){
  console.log("checkIfSavedImageExists ")
  const faceIdServer = faceIdServerAddress + "/confirmphotoexists?serialnumber=" + deviceName
  console.log("attempting to checkPhoto to: " + faceIdServer)
  
  xapi.command('HttpClient Get', { 'Url':faceIdServer, 'AllowInsecureHTTPS': 'True'}).then(
    (result) => {
    var body = result.Body;
    console.log("myResponse: " + body)
    if(body == "True"){
      console.log("We have a file")
    }else{
      console.log("No file exists")
    }
  });
}

function checkCameraState(callback){
  xapi.status.get('SystemUnit State CameraLid').then ((value) => {
    console.log("cameraLid: " + value)
    //return value
    callback(value)
  });
}

function notifyUI(title, message){
  xapi.Command.UserInterface.Message.Prompt.Display({
    Title: title,
    Text: message,
    Duration: 5
  })
}


function init(){
  // Get Device Name (to identify device for photo image)
  xapi.status.get('SystemUnit Hardware Module SerialNumber').then ((value) => {
    deviceName = value // used for photo image being unique
    console.log("DeviceName: " + deviceName)
    
  })

  createLogoutPanel();
  createLoginPanel();
}


/*
** Progress Bar **
*/
function showProgresBar(stage, length, name, subtext = '', barSize) {
  let percentage = Math.floor((stage / length) * 100);
  let progressBar = Math.floor(percentage / (100 / barSize));

  let bar = '';
  for (let i = 0; i < barSize; i++) {
    if ((i + 1) > progressBar) {
      bar = bar + '🟥'
    } else {
      bar = bar + '🟩'
    }
  }
  
  let completeTitle = '';
  if (stage == length) {
    //completeTitle = ', Complete!' 
    loopStart = 0;
    clearInterval(refreshInterval);
    };
  let completeSubtext = subtext == '' ? '' : `${subtext}<p>`;
  if (stage == length && subtext != '') { completeSubtext = 'Successful, logging in.<p>' };

  xapi.Command.UserInterface.Message.Prompt.Display({
    Title: name + completeTitle,
    Text: `${completeSubtext}${bar} ${percentage}%`,
    Duration: 2
  })
} 

function progress(){
  refreshInterval = setInterval(timer, 250); // check every 250msec
}

function timer(){
  if (loopStart >= loopStop){
    clearInterval(refreshInterval);
  }else{
    loopStart++;
    showProgresBar(loopStart, loopStop, "Verifying FaceID", "One moment...", loopStop)
  }
}


/*
** Listeners for UI actions **
*/
xapi.event.on('UserInterface Extensions Widget Action', (event) => {
  if(event.WidgetId == 'faceIdLogout' && event.Type == 'released'){
      performLogout();
  }else if(event.WidgetId == 'faceIdUpdatePhoto' && event.Type == 'released'){
      performPhotoUpload();
  }
})

xapi.Event.UserInterface.Extensions.Panel.Clicked.on((event) => {
  if(event.PanelId == 'faceIdLoginPanel'){
    verifyFaceId();
  }
});


/*
** Setup FaceID Panels **
*/
function togglePanelVisbility(panelId, visibility){
  xapi.Command.UserInterface.Extensions.Panel.Update(
    {
      PanelId: panelId,
      Visibility: visibility
    }
  )
}

function createLogoutPanel(){
  const logoutPanel = `
  <Extensions>
    <Version>1.10</Version>
    <Panel>
      <Order>14</Order>
      <PanelId>faceIdPanel</PanelId>
      <Origin>local</Origin>
      <Location>HomeScreen</Location>
      <Icon>Custom</Icon>
      <Color>#1D805F</Color>
      <Name>Logout</Name>
      <ActivityType>Custom</ActivityType>
      <CustomIcon>
        <Content>iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAEqUlEQVR4nO2dTWsdVRjHn1OxUBqkCKW2TenGTezG+AGsm4qNRVdVP4ClTYqvH0Jx6UZsoaCuXItW0Z3iRhGTWi2CmmCqGKMmNYUWc+3PxZzSyZkx83Zm7nPnPj+4MPfezHP+5/lnztyZc+YcEcMwDMMwDMMwjBECmATOAh8CV4DrlGcROD7sOoQAM15bWa77ul8E5oDJYYjeC7wObFYQnsfVzsUXAPzcsE7/Au8A+7sSfAK41lD0bZY7EV0BYDlS3a4BM22LnQMGkQT/BDzWquAaAMe9thgMgNm2hJ4gORxD5oHngClgdyuFKwbYDTwAPA8s/I8pcY8U4ADZZuoGcArYEbWwEQbYAZwGbga5Wgfui1nQ+RwzHo5WQM8AjuaY8mas4JNkf02dihK8xwCzQc42gYMxAp8NAs9bM1WMb74uBbkrPMGXSezjwfsLzrlb9WSODz5HF4KPw1xWB/g+cHmqcdAxgeTXV5orMYJuBEEnImgdC4CJIHcbRfu4EkHZsoNzhfsYd6iaPzs5K8MMUYYZogwzRBlmiDLMEGWYIcowQ5RhhiijjCFLqe3FlnT0maXUdvP8kfQxL/uXuj5w7Vj+DMMwjN4DPAn8DqwATww7Xmw9IwfwS6onrfEY36bxYuupy9B6/2L3RDaNp6Vn1K7UlWGGKMMMUYYZogwzRBnDNGQpta3hLvJSaluDnm6JfRc0GCFI8R7t6qlLb0YharmOaIqdQ5RhhijDDFGGGaIMM0QZZogyzBBl9MIQsjPwFD46ppWRN8SbET6Uf3kYWsYSys1ndWbYOscG4GqBGV8Adw9b59jA9vNZfUlXE4cZCWTns9oAPgfO2JFhGIZhGIZh1ISOR4UDJ4E/SAY/n2wh/lPAb8BfwNOx4+eUFzd/dDgqHHDAaqq8W8BbwL4IsfcBb/uYt/kTaHUwRPT8hZfCETQWlbeScwW+BrwCHK4R7zDwqo8RstJGHYLyK+VP3QRm/rB+V0R25X0tIl+JyMciMi/JXd01EVn33+8RkXtF5IiITIvIoyLykOTX84aIPOOcey+m/ozg2Pnr+gjxZU4D3+b8R8fiMjDdUV3i5m8YhvhydwIvs/Wc0pRV4CVgZ4f16IchqfJ3Ac8Cn1FvIYAB8KmPkdcMtq2/Uv7UnUMKtOwVkWMi8qB/HZLkvLHH/8m6fy2LyNcisiAinzjnVrtXm1A1fyNlyChSNX8j36feN8wQZZghyjBDlGGGKKOMIVtGAWKT8ZcGuCf46O+ifcoY8mvw/lBpRUaYqzCXGcoY8mPw/lhpOUaYqx8aRyS75NECtuRRIcBdwDdB7pqvaUj+omCnI2juNSSLcKbZBA7ECn4uCH4TOBoleA8BHiG7bN4bMQvYT7I4YmjKrDVfd/DN1FyOGWtE6IYOC5sh//b3JeAF4AjjufTqhK/7i2TPGfictbNMuT8iYi1OvNia0AZQfT317RjQ9rMqXnDYfNVF4/LdRc+flGWNGnOmVG7/nXMXReR+EXlNRP6pun8YruH+bdB00cyBiJwXkSnn3EcR9JQHOEjSjH0AfEd2zcPt6Mt66hu+7u+TPKMS56etYRiGYRiGYRhGR/wHSnFxUqJLOaEAAAAASUVORK5CYII=</Content>
        <Id>d266a294ac64f9a8053e3769374bc90e892a0a9db90e0c46a8b3585d50250a86</Id>
      </CustomIcon>
      <Page>
       <Name>Face ID</Name>
        <Row>
          <Name>Logout</Name>
          <Widget>
            <WidgetId>faceIdLogout</WidgetId>
            <Name>Logout</Name>
            <Type>Button</Type>
            <Options>size=2</Options>
          </Widget>
        </Row>
        <Row>
          <Name>Set Photo</Name>
          <Widget>
            <WidgetId>faceIdUpdatePhoto</WidgetId>
            <Name>Update Photo</Name>
            <Type>Button</Type>
            <Options>size=2</Options>
          </Widget>
        </Row>
        <Options>hideRowNames=1</Options>
      </Page>
    </Panel>
  </Extensions>
  `

  xapi.Command.UserInterface.Extensions.Panel.Save(
    { PanelId: 'faceIdLogoutPanel' },
    logoutPanel
  );
}

function createLoginPanel(){
  const loginPanel = `
  <Extensions>
  <Version>1.10</Version>
  <Panel>
    <Order>16</Order>
    <PanelId>faceIdLoginPanel</PanelId>
    <Location>HomeScreen</Location>
    <Icon>Custom</Icon>
    <Name>Login</Name>
    <ActivityType>Custom</ActivityType>
    <CustomIcon>
      <Content>iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAEqUlEQVR4nO2dTWsdVRjHn1OxUBqkCKW2TenGTezG+AGsm4qNRVdVP4ClTYqvH0Jx6UZsoaCuXItW0Z3iRhGTWi2CmmCqGKMmNYUWc+3PxZzSyZkx83Zm7nPnPj+4MPfezHP+5/lnztyZc+YcEcMwDMMwDMMwjBECmATOAh8CV4DrlGcROD7sOoQAM15bWa77ul8E5oDJYYjeC7wObFYQnsfVzsUXAPzcsE7/Au8A+7sSfAK41lD0bZY7EV0BYDlS3a4BM22LnQMGkQT/BDzWquAaAMe9thgMgNm2hJ4gORxD5oHngClgdyuFKwbYDTwAPA8s/I8pcY8U4ADZZuoGcArYEbWwEQbYAZwGbga5Wgfui1nQ+RwzHo5WQM8AjuaY8mas4JNkf02dihK8xwCzQc42gYMxAp8NAs9bM1WMb74uBbkrPMGXSezjwfsLzrlb9WSODz5HF4KPw1xWB/g+cHmqcdAxgeTXV5orMYJuBEEnImgdC4CJIHcbRfu4EkHZsoNzhfsYd6iaPzs5K8MMUYYZogwzRBlmiDLMEGWYIcowQ5RhhiijjCFLqe3FlnT0maXUdvP8kfQxL/uXuj5w7Vj+DMMwjN4DPAn8DqwATww7Xmw9IwfwS6onrfEY36bxYuupy9B6/2L3RDaNp6Vn1K7UlWGGKMMMUYYZogwzRBnDNGQpta3hLvJSaluDnm6JfRc0GCFI8R7t6qlLb0YharmOaIqdQ5RhhijDDFGGGaIMM0QZZogyzBBl9MIQsjPwFD46ppWRN8SbET6Uf3kYWsYSys1ndWbYOscG4GqBGV8Adw9b59jA9vNZfUlXE4cZCWTns9oAPgfO2JFhGIZhGIZh1ISOR4UDJ4E/SAY/n2wh/lPAb8BfwNOx4+eUFzd/dDgqHHDAaqq8W8BbwL4IsfcBb/uYt/kTaHUwRPT8hZfCETQWlbeScwW+BrwCHK4R7zDwqo8RstJGHYLyK+VP3QRm/rB+V0R25X0tIl+JyMciMi/JXd01EVn33+8RkXtF5IiITIvIoyLykOTX84aIPOOcey+m/ozg2Pnr+gjxZU4D3+b8R8fiMjDdUV3i5m8YhvhydwIvs/Wc0pRV4CVgZ4f16IchqfJ3Ac8Cn1FvIYAB8KmPkdcMtq2/Uv7UnUMKtOwVkWMi8qB/HZLkvLHH/8m6fy2LyNcisiAinzjnVrtXm1A1fyNlyChSNX8j36feN8wQZZghyjBDlGGGKKOMIVtGAWKT8ZcGuCf46O+ifcoY8mvw/lBpRUaYqzCXGcoY8mPw/lhpOUaYqx8aRyS75NECtuRRIcBdwDdB7pqvaUj+omCnI2juNSSLcKbZBA7ECn4uCH4TOBoleA8BHiG7bN4bMQvYT7I4YmjKrDVfd/DN1FyOGWtE6IYOC5sh//b3JeAF4AjjufTqhK/7i2TPGfictbNMuT8iYi1OvNia0AZQfT317RjQ9rMqXnDYfNVF4/LdRc+flGWNGnOmVG7/nXMXReR+EXlNRP6pun8YruH+bdB00cyBiJwXkSnn3EcR9JQHOEjSjH0AfEd2zcPt6Mt66hu+7u+TPKMS56etYRiGYRiGYRhGR/wHSnFxUqJLOaEAAAAASUVORK5CYII=</Content>
      <Id>d266a294ac64f9a8053e3769374bc90e892a0a9db90e0c46a8b3585d50250a86</Id>
    </CustomIcon>
  </Panel>
  </Extensions>
  `

  xapi.Command.UserInterface.Extensions.Panel.Save(
    { PanelId: 'faceIdLoginPanel' },
    loginPanel
  );

  togglePanelVisbility('faceIdLoginPanel', 'Hidden') // Hide Login button for initial setup
}

init();
