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
    this.getRoute = this.getRoute.bind(this);
    this.getContents = this.getContents.bind(this);
    this.subscribeCallBack = this.subscribeCallBack.bind(this);
    this.uploadToIPFS = this.uploadToIPFS.bind(this);
    this.register = this.register.bind(this);
    this.getFromIPFS = this.getFromIPFS.bind(this);
  }


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
      const address = (await web3.eth.getAccounts())[0]

      // When testing with ganache locally however, you can most definitely receive more than 1 accounts so use something like this instead (change state.address to accounts)
      // const accounts = await web3.eth.getAccounts()
      let registered = await contract.methods.isRegistered(address).call({from: address}, (error, retval) => retval);

      let name='';
      let imageHash='';

      if(registered) {
        let result = await contract.methods.getMyIdentity().call(
          {from:address},
          (error, retval) => retval)
        
        name = result[0]
        imageHash = result[1]
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
        console.log("subscribing to public config store");
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

















  subscribeCallBack = async (props) => {

    let contract = this.state.contract;
    let address = props.selectedAddress;
    let registered = await contract.methods.isRegistered(address).call(
      {from: address},
      (error, retval) => retval
    );
    let route = await this.getRoute(address, registered);

  
    // This if is to handle the event when you logout and you try to log back in. The address will be '' so when you try to do this.state.address.toLowerCase(), it'll fail. 
    if(this.state.address) {
      console.log("User is still logged in")

      // User is still logged in
      if(typeof address !== 'undefined') {

        // You need to do the toLowerCase cause for some reason, update functions keep getting triggered on all networks except local ganache network.
        if(address !== this.state.address.toLowerCase()) {
          let name, imageHash;

          if(registered) {
            let result = await contract.methods.getMyIdentity().call(
              {from:address},
              (error, retval) => retval
            );
            name = result[0];
            imageHash = result[1];
          } 

          console.log("name is", name, "imageHash is", imageHash)

          console.log("User is changing metamask accounts")
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
        }


      } else {
        console.log("User has logged out")
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
      console.log("User is relogging in")
      this.setState((prevState) => ({
        address,
        prevAddress: prevState.address,
        route,
        registered,
        redirect: true
      }))
    }
  }

  getFromIPFS = async(hash) => {

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

  uploadToIPFS = async (app, reader, name, address) => {
    const buffer = await Buffer.from(reader.result);
    
    // Logic here a bit wonky. You should sign transaction then add to ipfs.
    // Once you get the hash, then update the function arguments? But i don't know how to alter function parameters after the transaction is signed. 
    // https://itnext.io/build-a-simple-ethereum-interplanetary-file-system-ipfs-react-js-dapp-23ff4914ce4e
    let res = await ipfs.files.add(buffer);
    


    await app.state.contract.methods.createUser(name, res[0].hash).send({from: address, name, imageHash: res[0].hash})
    .on('receipt', async (receipt) => {
      console.log("Receipt is:", receipt);

      // Updating the route and registered status
      let registered = true;
      let route = await app.getRoute(address, registered);
      app.setState({name, imageHash: res[0].hash, registered, route})
    })
    .on('error', (error) => {
      // I've tried catching the error but it's a metamask issue. https://github.com/MetaMask/metamask-extension/issues/4431
      console.log("Error is:", error);
      // even though registered is already false, we're setting state again because we want to rerender the page.
    })

  };

  // Get the updated routes
  getRoute = async (address, registered) => {
    if(typeof address === 'undefined'){
      return disconnectedRoute;
    }

    let route;
    if(!registered) {
      route = newRegistrationRoute
      route[0].main = () => <h2>Hi there <i>{address}</i>! Please register an identity if you wish to use this identity dapp.</h2> 
    } else {
      route = connectedRoutes

      // Updating routes
      route[0].main = () => 
      <div>
        <h2>Welcome back {this.state.name}! Your imageHash is {this.state.imageHash} </h2>
        <img id="ipfsImage" src=''></img>
      </div>

      route[1].main = () =>
      <div>
        <h2>Update your details here!</h2>
        <form onSubmit={this.update}>
          <label>
            Name:
            <input placeholder={this.state.name} type="text" id="name"/>
          </label>
          <br/>
          <label>
            Image:
            <input placeholder="Your image" type="file" id="image"/>
          </label>
          <img id="ipfsImage" src=''></img>
          <br/>


          <button>Submit Registration!</button>
        </form>



      </div>
    }
    
    return route;
  }


  // Process the registration input values
  register = async (event) => {

    event.stopPropagation();
    event.preventDefault();

    let name = document.getElementById("name").value;
    let file = document.getElementById("image").files[0]

    let reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => this.uploadToIPFS(this, reader, name, this.state.address);
  }

  // Update the identity
  update = async (event) => {
    event.stopPropagation();
    event.preventDefault();


    let name = document.getElementById("name").value;
    let file = document.querySelector('input[type=file]').files[0]

    // Name can be either '' or something
    // file can be either undefined or something
















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

    }


    // 4 scenarios
    // When root page and not logged in => Redirect to disconnect
    // When root page and logged in => Redirect to connected
    // When not root page and change account => Redirect to connected
    // When not root page and log out => Redirect to disconnected

    // When metamask is not enabled and address is undefined (not logged in)
    if(!address) {
      console.log("mm not enabled")
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
      console.log("metamask enabled");


      // If user is not registered, display new registration page
      if(!app.state.registered){
        console.log("if not registered")


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

        console.log("if registered")

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

    console.log(this.state)

    if (!this.state.web3) { 
      console.log("First initialisation");
      return <div>Loading Web3, accounts, and contract...</div>
    } else {
      console.log("Inside subsequent renders");

      return(
        <Router>
          {this.getContents(this)}
        </Router>
      )
    }

  }
}


export default App