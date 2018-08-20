import React, { Component } from 'react'
import getWeb3 from './utils/getWeb3'
import ipfs from './utils/getIPFS'

import getContractInstance from './utils/getContractInstance'
import contractDefinition from './contracts/UserRegistry.json'


import {
  BrowserRouter as Router,
  Route,
  Link,
  Redirect,
  Switch
} from 'react-router-dom';

import {
  disconnectedRoute,
  newRegistrationRoute,
  connectedRoutes
} from "./utils/routes"


class App extends Component {

  // Note that an asynchronous call to fetch data will not return until a render has occured so that means you'll always need to render with empty / initial data at least once. This is why the render has a !null check. 
  constructor(props){
    super(props);
    this.state = {
      web3: null,
      contract: null,

      redirect: true,
      prevAddress: null,
      prevPath: null,
      address: null,
      route: null,
      registered: false,

      name: '',
      imageHash: ''
    }
    this.getRegistrationStatus = this.getRegistrationStatus.bind(this)
    this.getMyIdentity = this.getMyIdentity.bind(this)
    this.getRoute = this.getRoute.bind(this);
    this.getContents = this.getContents.bind(this);
    this.subscribeCallBack = this.subscribeCallBack.bind(this);
    this.createUser = this.createUser.bind(this);
    this.uploadToIPFS = this.uploadToIPFS.bind(this);
    this.register = this.register.bind(this);

    this.updateUserDetails = this.updateUserDetails.bind(this);
    this.update = this.update.bind(this);
    this.getFromIPFS = this.getFromIPFS.bind(this);

  }


  /** Native component lifecycle methods **/

  // This function is called everytime after render is called (after componentDidMount but CDM is only call one time whereas this is called everytime the component is updated)
  componentDidUpdate = async () => {

      if(this.state.redirect) {
        console.log('rerendering to get rid of redirect')
        this.setState({redirect: false})
      }


  }

  // This function is only run once when the component is mounted for the first time
  componentDidMount = async () => {
    try {
      // await is the same as .then without any callback function.
      // Get network provider and web3 instance.
      const web3 = await getWeb3()

      // Get the contract instance by passing in web3 and the contract definition.
      const contract = await getContractInstance(web3, contractDefinition)

      // Use web3 to get the user's accounts.
      // If using metamask, the array will always have size of 1 (the selected account).
      const address = web3.eth.accounts[0]

      // When testing with ganache locally however, you can most definitely receive more than 1 accounts so use something like this instead (change state.address to accounts)
      // const accounts = await web3.eth.getAccounts()
      // Getting registration status

      let registered = false;

      if(typeof address !== 'undefined') {
        try {
          console.log("trying to get registration status inside componentDidMount");
          registered = await this.getRegistrationStatus(contract, address);
        } catch(error) {
          alert("Unable to get registration status, please see the developer console.")
          console.log(error)
        }
        console.log("inside componentDidMount, registered:": registered)
      }

      

      // Getting identity if registration exists
      let name='';
      let imageHash='';

      if(registered) {
        let result;
        try {
          console.log("trying to get my identity inside componentDidMount");
          result = await this.getMyIdentity(contract, address);
          name = result[0];
          imageHash = result[1];
        } catch(error) {
          alert("Unable to get identity, please see the developer console.")
          console.log(error)
        }
        console.log("inside componentDidMount, Name:", name);
        console.log("inside componentDidMount, imageHash:", imageHash);
      }

      // Get route after getting accounts
      const route = await this.getRoute(address, registered)

      // Set web3, accounts, routes and contract to the state then subscribe to publicConfigStore
      // Once componentDidMount is completed, componentDidUpdate is called. 
      // Once that is done then the callback function in set state is called.
      this.setState({
        web3,
        contract,
        address,
        route,
        registered,
        name,
        imageHash
      }, () => {
        console.log("inside componentDidMount, subscribing to public config store ");
        this.state.web3.currentProvider.publicConfigStore.on(
          'update',
          this.subscribeCallBack);
        }
      )
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(`Failed to load web3, accounts, or contract. Check console for details.`)
      console.log(error)
    }
  }




  /** Utility functions **/

  // Helper function to get registration status of the provided address
  getRegistrationStatus = async (contract, address) => {
    return new Promise(function(resolve, reject) {
      contract.isRegistered(
        address,
        {from:address},
        function(err, res){
          if(err) {
            reject(err);
          } else {
            resolve(res);
          }
        }
      )
    })
  }



  getMyIdentity = async (contract, address) => {
    return new Promise(function(resolve, reject) {
      contract.getMyIdentity(
        {from: address},
        function(err, res){
          if(err) {
            reject(err);
          } else {
            resolve(res);
          }
        }
      )
    })
  }

  // Get the updated routes based on address and registration status
  getRoute = async (address, registered) => {
    if(typeof address === 'undefined'){
      return disconnectedRoute;
    }

    let route;

    // Updating routes with information stored on state.
    if(!registered) {
      route = newRegistrationRoute
      route[0].main = () => <h2>Hi there <i>{address}</i>! Please register an identity if you wish to use this identity dapp.</h2> 
    } else {
      route = connectedRoutes

      // Updating routes
      route[0].main = () => 
      <div>
        <h2>Welcome back {this.state.name}! Your imageHash is {this.state.imageHash} </h2>
        <img id="ipfsImage" src='' alt='this is a pic that you uploaded previously'></img>
      </div>

      route[1].main = () =>
      <div>
        <h2>Update your details here!</h2>
        <form onSubmit={this.update}>
          <label align="left">
            Current Name: {this.state.name} <br/>
            New Name:<input placeholder="Your new name" type="text" id="name"/>
          </label>
          <br/>
          <label>
            Old Image:
            <img id="ipfsImage" src='' alt='this is a pic that you uploaded previously'></img> 
            <br/>
            New Image:
            <input placeholder="Your image" type="file" id="image"/>
          </label>
          <br/>
          <button>Update Identity</button>
        </form>
      </div>
    }
    
    return route;
  }

  // Helper function 
  subscribeCallBack = async (props) => {

    let contract = this.state.contract;
    let address = props.selectedAddress;
    let registered

    try {
      console.log("SCB, trying to get registration status");
      registered = await this.getRegistrationStatus(contract, address);
    } catch(error) {
      alert("Unable to get registration status, please see the developer console.")
      console.log(error)
    }
    console.log("SCB, registered:", registered)

    let route = await this.getRoute(address, registered);

    // This if is to handle the event when you logout and you try to log back in. The address will be '' so when you try to do this.state.address.toLowerCase(), it'll fail. 

    // This is to handle the many times when this event is triggered even though nothing has changed. Try console.log(props)
    if(typeof this.state.address !== 'undefined') {
      if(address !== this.state.address.toLowerCase()){
        if(this.state.address) {
          console.log("SCB, User is still logged in")

          // User is still logged in
          if(typeof address !== 'undefined') {

            let name, imageHash;
            if(registered) {
              let result;
              try {
                console.log("SCB, trying to get my identity");
                result = await this.getMyIdentity(contract, address);
                name = result[0];
                imageHash = result[1];
              } catch(error) {
                console.log("Unable to get identity, please see the developer console")
                console.log(error)
              }
              console.log("SCB, Name:", name);
              console.log("SCB, imageHash:", imageHash);
            } 

            console.log("SCB, User is changing metamask accounts")
            // Update with new address and update routes to reflect address.

            this.setState((prevState) => ({
              address,
              prevAddress: prevState.address,
              route,
              registered, 
              redirect: true,
              name,
              imageHash
            }))
          } else {
            console.log("SCB, User has logged out")
            // User logged out
            this.setState((prevState) => ({
              address: '',
              prevAddress: prevState.address,
              route: disconnectedRoute,
              registered: false,
              redirect: true,
              name: '',
              imageHash: ''
            }))
          }
        } else {
          console.log("SCB, User is relogging in")
          this.setState((prevState) => ({
            address,
            prevAddress: prevState.address,
            route,
            registered,
            redirect: true
          }))
        }
      }   
    }
  }


  createUser = async (contract, address, name, hash) => {
    return new Promise(function(resolve, reject) {
      contract.createUser(
        name,
        hash,
        {from:address},
        function(err, res){
          if(err) {
            reject(err);
          } else {
            resolve(res);
          }
        }
      )
    })
  }


  uploadToIPFS = async (app, reader, name, address) => {
    const buffer = await Buffer.from(reader.result);
    
    // Logic here a bit wonky. You should sign transaction then add to ipfs.
    // Once you get the hash, then update the function arguments? But i don't know how to alter function parameters after the transaction is signed. 
    // https://itnext.io/build-a-simple-ethereum-interplanetary-file-system-ipfs-react-js-dapp-23ff4914ce4e
    let res = await ipfs.files.add(buffer);

    try {
      console.log("trying to create user inside uploadToIPFS");
      await this.createUser(app.state.contract, address, name, res[0].hash);
      console.log("user is created! inside uploadToIPFS")

      let registered = true;
      let route = await this.getRoute(address, registered);
      
      this.setState({name, imageHash: res[0].hash, registered, route})
    } catch(error) {
      alert("unable to upload image to IPFS, please see the developer console.")
      console.log(error)
      this.setState({registered: false})
    }
  };

  // Maybe you want to change your registration workflow. Register with an empty account first? Main page will check if name and image is blank, if so the text will say "please update your identity". The updateDetails page will also do a similar conditional rendering.
  // Process the registration input values
  register = async (event) => {

    event.stopPropagation();
    event.preventDefault();

    let name = document.getElementById("name").value;
    let file = document.getElementById("image").files[0]

    if(name !== '' && typeof file !== 'undefined') {
      let reader = new window.FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = () => this.uploadToIPFS(this, reader, name, this.state.address);
    }
  }


  // Helper function to update user details
  updateUserDetails = async (contract, address, name, hash, choice) => {
    return new Promise(function(resolve, reject) {
      switch(choice) {
        case 1: 
          contract.updateName(
            name,
            {from: address},
            function(err, res){
              if(err) {
                reject(err);
              } else {
                resolve(res);
              }
            }
          )
          break;

        case 2:
          contract.updateImageHash(
            hash,
            {from: address},
            function(err, res){
              if(err) {
                reject(err);
              } else {
                resolve(res);
              }
            }
          )
          break;

        case 3:
          contract.updateNameAndImage(
            name,
            hash,
            {from: address},
            function(err, res){
              if(err) {
                reject(err);
              } else {
                resolve(res);
              }
            }
          )
          break;

        default: 
          contract.updateNameAndImage(
            '',
            '',
            {from: address,
             gas: 3000000},
            function(err, res){
              if(err) {
                reject(err);
              } else {
                resolve(res);
              }
            }
          )
      }
    })
  }


   // Update the identity
  update = async (event) => {

    event.stopPropagation();
    event.preventDefault();
    let name = document.getElementById("name").value;
    let file = document.getElementById("image").files[0]
    let address = this.state.address;
    let contract = this.state.contract;    
    let previousName = this.state.name;
    let previousHash = this.state.imageHash;

    // 4 permutations as to how you will go about updating your profile.

    if(name !== '' && typeof file === 'undefined') {
      // case 1

      try {
        console.log("trying to update user's name");
        await this.updateUserDetails(contract, address, name, '', 1);
        this.setState({name, redirect: true});
      } catch(error) {
        alert("Unable to update name, please see the developer console.");
        console.log(error);
        // this.setState({name: previousName, redirect: true});
      }
    } else if(name === '' && typeof file !== 'undefined') {
      // case 2

      let reader = new window.FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = async () => {

        const buffer = await Buffer.from(reader.result);
        let res = await ipfs.files.add(buffer);
        try {
          console.log("trying to update user's image hash");
          await this.updateUserDetails(contract, address, '', res[0].hash, 2);
          this.setState({imageHash: res[0].hash, redirect: true});
        } catch(error) {
          alert("Unable to update image hash, please see the developer console.");
          console.log(error);
          this.setState({imageHash: previousHash, redirect: true});
        }
      }
    } else if(name !== '' && typeof file !== 'undefined') {
      // case 3
      
      let reader = new window.FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = async () => {

        const buffer = await Buffer.from(reader.result);
        let res = await ipfs.files.add(buffer);
        try {
          console.log("trying to update user's image hash");
          await this.updateUserDetails(contract, address, name, res[0].hash, 3);
          this.setState({name, imageHash: res[0].hash, redirect: true});
        } catch(error) {
          alert("Unable to update name and image hash, please see the developer console.");
          console.log(error);
          // this.setState({name: previousName, imageHash: previousHash, redirect: true});
        }
      }
    } else {
      // case 4

      try {
        console.log("trying to remove user's name and image");
        await this.updateUserDetails(contract, address, '', '', 4);
        this.setState({name: '', imageHash: '', redirect: true});
      } catch(error) {
        alert("Unable to remove user's name and image, please see the developer console.");
        console.log(error);
        // this.setState({name: previousName, imageHash: previousHash, redirect: true});
      } 
    }
  }


  // Get pic from IPFS
  getFromIPFS = async(hash) => { 

    if(hash !== '') {
      // Simulate a call to Dropbox or other service that can
      // return an image as an ArrayBuffer.
      var xhr = new XMLHttpRequest();

      // Use JSFiddle logo as a sample image to avoid complicating
      // this example with cross-domain issues.
      xhr.open( "GET", "https://gateway.ipfs.io/ipfs/" + hash, true );

      // Ask for the result as an ArrayBuffer.
      xhr.responseType = "arraybuffer";

      xhr.onload = function( e ) {
        // Obtain a blob: URL for the image data.
        var arrayBufferView = new Uint8Array(this.response);
        var blob = new Blob( [ arrayBufferView ], { type: "image/jpeg" } );
        var urlCreator = window.URL || window.webkitURL;
        var imageUrl = urlCreator.createObjectURL( blob );
        // 
        var image = document.querySelector('#ipfsImage');

        // Id is unique but className is not. However I used Id in both because if you look at elements, it changes when you go from one page to another i.e. in the source code, there will only ever by 1 id of ipfsImage.
        image.src = imageUrl;
      };

      xhr.send();
    }
  }


  getContents = (app) => {
    let currPath = window.location.pathname;
    let nextPath = app.state.route[0].path;
    let redirect;
    let prevAddress = app.state.prevAddress;
    let address = app.state.address;

    
    // Getting redirect if any.
    if(prevAddress !== address && currPath !== nextPath) {
      redirect = <Redirect exact from={currPath} to={nextPath}/>
      console.log(prevAddress)
      console.log(address)
      console.log(currPath)
      console.log(nextPath)

    }


    // 4 scenarios
    // When root page and not logged in => Redirect to disconnect
    // When root page and logged in => Redirect to connected
    // When not root page and change account => Redirect to connected
    // When not root page and log out => Redirect to disconnected

    // When metamask is not enabled and address is undefined (not logged in)
    if(!address) {
      console.log("metamask not enabled, inside getContents")
      // If user is not logged in, display disconnected page
      return (
        <div style =
          // Style related to this div (entire page)
          {{
            display: "flex",
            height: "100%",
          }}
        >
          <div style =
          // Styling for this div (entire page)
            {{
              flex: 1,
              marginLeft: "40%"
            }}
          >
                                      
            <Switch>
              {redirect}
              {app.state.route.map((route, index) => (
                <Route
                  key={index}
                  path={route.path}
                  component={route.main}
                />
              ))}
            </Switch>
          </div>
        </div>
      )
    } else {
      console.log("metamask enabled, inside getContents");


      // If user is not registered, display new registration page
      if(!app.state.registered){
        console.log("user not registered, inside getContents")


        const button = () => {
          // Don't forget to specify max length for input.
          return(

            <form onSubmit={this.register}>
              <label>
                Name:
                <input placeholder="Your name" type="text" id="name"/>
              </label>
              <br/>
              <label>
                Image:
                <input placeholder="Your image" type="file" id="image"/>
              </label>
              <br/>


              <button>Submit Registration!</button>
            </form>
          )
        }

        return (
          <div style =
            // Style related to this div (entire page)
            {{
              display: "flex",
              height: "100%",
            }}
          >
            <div style =
            // Styling for this div (entire page)
              {{
                flex: 1,
                marginLeft: "20%"
              }}
            >
                                        
              <Switch>
                {redirect}
                {app.state.route.map((route, index) => (
                  <Route
                    key={index}
                    path={route.path}
                    component={route.main}
                  />
                ))}

              </Switch>
              <Route path="/newRegistration" component={button} />
            </div>
          </div>
        )
      } else {

        console.log("user registered, inside getContents")

        // This is for the very first load.
        this.getFromIPFS(app.state.imageHash)

        // If user is registered, display connected page
        return (
          <div style =
            // Styling for this div (entire page)
            {{
              display: "flex",
              height: "100%",
            }}
          >
            <div style = 
              // Styling for this div (left panel)
              {{
                padding: "0px",
                width: "20%",
                background: "#f0f0f0",
                position: "fixed",
                overflow: "auto"
              }}
            >      
              <ul 
                // Styling specific to the nav bar
                style={{
                  listStyleType: "none",
                  padding: "10px"
                }}
              >
                <li>
                  <Link to="/home" onClick={()=>
        this.getFromIPFS(app.state.imageHash)}>Home</Link>
                </li>
                <li>
                  <Link to="/updateDetails" onClick={()=>
        this.getFromIPFS(app.state.imageHash)}>Update Details</Link>
                </li>
                <li>
                  <Link to="/requestApproval">Request for Approval</Link>
                </li>
                <li>
                  <Link to="/pendingApproval">Pending your Approval</Link>
                </li>
                <li>
                  <Link to="/about">About</Link>
                </li>
              </ul>
            </div>

            <div style =
              // Styling for this div (right panel)
              {{
                flex: 1,
                marginLeft: "22%"
              }}
            > 
              <Switch>
                {redirect}
                {app.state.route.map((route, index) => (
                  // Getting contents of the right panel
                  // You can render <Route>(s) in many places
                  <Route
                    key={index}
                    path={route.path}
                    component={route.main}
                  />
                ))}
              </Switch>
            </div>
          </div>
        )
      } 
    }
  }



  render() { 

    console.log("state is:", this.state);

    if (!this.state.web3) { 
      console.log("First initialisation, inside render");
      return <div>Loading Web3, accounts, and contract...</div>
    } else {
      console.log("Subsequent renders, inside render");

      return(
        <Router>
          {this.getContents(this)}
        </Router>
      )
    }
  }



}


export default App