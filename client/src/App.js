import React, { Component } from 'react'
import getWeb3 from './utils/getWeb3'
import ipfs from './utils/getIPFS'
import bgImage from './images/Blockchain.jpg'

import getContractInstance from './utils/getContractInstance'
import logicContractDefinition from './contracts/UserRegistryLogic.json'

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

  // if got time, move all the constants out to another file.
  // redo the registration too. newRegistratio -> completeRegistration page. Sign 2 txn. Add note on newRegistration to tell them that you will be required to sign 2 transactions, 1 to create the account and 2 to update your details. = means your getRoute must change liao, add 1 more flag called completeRegistration. Walao -.-

  // Note that an asynchronous call to fetch data will not return until a render has occured so that means you'll always need to render with empty / initial data at least once. This is why the render has a !null check. 
  constructor(props){
    super(props);
    this.state = {
      web3: null,
      contract: null,

      redirect: true,
      prevAddress: null,
      address: null,
      route: null,
      registered: null,

      name: null,
      imageHash: null,

      approvalRequests: null,
      numApprovalRequests: null
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
    this.request = this.request.bind(this);
    this.requestForApproval = this.requestForApproval.bind(this);
    this.getApprovalRequests = this.getApprovalRequests.bind(this);


    this.approveRequester = this.approveRequester.bind(this);
    this.unapproveRequester = this.unapproveRequester.bind(this);
    this.view = this.view.bind(this);
    this.getIdentityFrom = this.getIdentityFrom.bind(this);

    
  }


  /** Native component lifecycle methods **/

  // This function is called everytime after render is called (after componentDidMount but CDM is only call one time whereas this is called everytime the component is updated)
  componentDidUpdate = async () => {

      if(this.state.redirect) {
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
      const contract = await getContractInstance(web3, logicContractDefinition)

      // Use web3 to get the user's accounts.
      // If using metamask, the array will always have size of 1 (the selected account).
      const address = web3.eth.accounts[0]

      // When testing with ganache locally however, you can most definitely receive more than 1 accounts so use something like this instead (change state.address to accounts)
      // const accounts = await web3.eth.getAccounts()
      // Getting registration status

      let registered = false;

      if(typeof address !== 'undefined') {
        try {
          registered = await this.getRegistrationStatus(contract, address);
        } catch(error) {
          alert("Unable to get registration status, please see the developer console.")
          console.log(error)
        }
      }

      // Getting identity if registration exists
      let route = null;
      let name = null;
      let imageHash = null;
      let approvalRequests = null;
      let numApprovalRequests = null;

      if(registered) {
        let result;
        try {
          result = await this.getMyIdentity(contract, address);
          name = result[0];
          imageHash = result[1];
        } catch(error) {
          alert("Unable to get identity, please see the developer console.")
          console.log(error)
        }

        try {
          let requestResult = await this.getApprovalRequests(contract, address);
          approvalRequests = requestResult[0];
          numApprovalRequests = requestResult[1].c[0];
        } catch(error) {
          alert("Unable to get approval requests, please see the developer console.");
          console.log(error);
        }
      }

      // Get route after getting accounts
      route = await this.getRoute(address, registered)

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
        imageHash,
        approvalRequests,
        numApprovalRequests
      }, () => {
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
      route[0].main = () => {
        let text = <h2>Please update your details</h2>;
        let updatedText = <h2>Welcome back {this.state.name}!</h2>
        return (
          <div>
            {(this.state.name === '') && text}
            {(this.state.name !== '') && updatedText}
          </div>)
      }
      route[1].main = () => {
        return (
          <div>
            <h2>Update your details here!</h2>
            <form onSubmit={this.update}>
              <div id="ipfsImage"></div>
              <label>
                Current Name: {this.state.name} <br/>
                New Name:
                <div style = {{
                    display: 'inline',
                    paddingLeft: '10px'
                  }}
                >
                    <input placeholder="Enter your new name" type="text" id="name" size='20' maxLength='20'/>
                </div>


                <br/>
                New Image:
                <div style = {{
                    display: 'inline',
                    paddingLeft: '8px'
                  }}
                >
                  <input type="file" id="image"/>
                </div>

              </label>
              <br/>
              <button>Update Identity</button>
            </form>
          </div>
        )
      }
      route[2].main = () => {
        return (
          <div>
            <h2>Please enter an address here to request for their approval.</h2>
            <form onSubmit={this.request}>
              <label>
                Request approval from <input placeholder="Enter requestee's address here" type="text" id="address" size='42' maxLength='42'/> 
              </label>
              <br/>
              <button>Request for Approval</button>
            </form>
          </div>
        )
      }

      route[3].main = () => {

        if(this.state.numApprovalRequests !== 0){
          let table = [];
          for(let i = 0; i < this.state.numApprovalRequests; i ++){
            table.push(
              <tr key={i} id={"row " + i}>
                <td>{this.state.approvalRequests[i]}</td>
                <td>
                  <table name="Actions table">
                    <tbody>
                      <tr>
                        <td><button onClick = {
                          async () => {

                            try {
                              await this.approveRequester(
                                this.state.contract,
                                this.state.approvalRequests[i],
                                this.state.address
                              )
                              alert("Requester " + this.state.approvalRequests[i] + " has been approved. Unfortunately, I am not able to redirect my page properly after requests are approved so I will need your help to manually refresh the browser.")
                            } catch(error) {
                              alert("Unable to approve request, please see the developer console.");
                              console.log(error);
                            }
                          }
                        }>Approve</button></td>
                        <td><button onClick = {
                          async () => {

                            try {
                              await this.unapproveRequester(
                                this.state.contract,
                                this.state.approvalRequests[i],
                                this.state.address
                              )

                              alert("Requester " + this.state.approvalRequests[i] + " has been rejected. Unfortunately, I am not able to redirect my page properly after requests are rejected so I will need your help to manually refresh the browser.")
                            } catch(error) {
                              alert("Unable to reject request, please see the developer console.");
                              console.log(error);
                            }
                          }
                        }>Reject</button></td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            )
          }
          // can add <th>&nbsp;</th> and <td><input type="checkbox" id={i}/>&nbsp;</td> if you want checkbox. If got time, get the approve / unapprove multiple commands working.

          // <button>Approve Selected</button>
          // <button>Reject Selected</button>
          return (

            <div>
              <table id="Approval Requests table">
                <thead >
                  <tr>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {table}
                </tbody>  
              </table>
            </div>
          )
        } else {
          return (<h2>There are no requests pending your approval!</h2>)
        }


      }
      route[4].main = () => {
        return (
          <div>
            <h2>Please enter an address here to view their details.</h2>
            <form onSubmit={this.view}>
              <label>
                View details of <input placeholder="Enter requestee's address here" type="text" id="address" size='42' maxLength='42'/> 
              </label>
              <button>View details</button>
            </form><br/>
            <div id="ipfsImage"></div>
            <label id="name">  
            </label>
            <label id="output">
            </label>
            <br/>
          </div>
        )
      }
    }
    return route;
  }

  // Helper function 
  subscribeCallBack = async (props) => {

    let contract = this.state.contract;
    let address = props.selectedAddress;
    let registered = null;

    // Check if user is currently logged in or out
    if(typeof address !== 'undefined') {

      // Getting details of account
      let route = null;
      let name = null;
      let imageHash = null;
      let approvalRequests = null;
      let numApprovalRequests = null;

      try {
        registered = await this.getRegistrationStatus(contract, address);
      } catch(error) {
        alert("Unable to get registration status, please see the developer console.")
        console.log(error)
      }

      // Getting route
      route = await this.getRoute(address, registered);

      // Only check for details if registered
      if(registered) {
        try {
          let result = await this.getMyIdentity(contract, address);
          name = result[0];
          imageHash = result[1];
        } catch(error) {
          alert("Unable to get identity, please see the developer console")
          console.log(error)
        }

        try {
          let requestResult = await this.getApprovalRequests(contract, address); // for some weird reason this one is not updating!!
          approvalRequests = requestResult[0];
          numApprovalRequests = requestResult[1].c[0];
        } catch(error) {
          alert("Unable to get approval requests, please see the developer console.");
          console.log(error);
        }
      }

      // Check if user was previously logged in
      if(this.state.address) {

        // Check new account details (if account didnt change, pass on trigger)
        if(address !== this.state.address.toLowerCase()){
          this.setState({
            address,
            prevAddress: this.state.address,
            route,
            registered,
            redirect: true,
            name,
            imageHash,
            approvalRequests,
            numApprovalRequests
          })
        } 
      } else {
        this.setState({
          address,
          prevAddress: this.state.address,
          route,
          registered,
          redirect: true,
          name,
          imageHash,
          approvalRequests,
          numApprovalRequests
        })
      }
    } else {
      // User logged out
      this.setState((prevState) => ({
        address: null,
        prevAddress: this.state.address,
        route: disconnectedRoute,
        registered: null,
        redirect: true,
        name: null,
        imageHash: null,
        approvalRequests: null,
        numApprovalRequests: null
      }))
    }
  }

  createUser = async (contract, address, name, hash) => {
    return new Promise(function(resolve, reject) {
      contract.createUser(
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
    })
  }


  uploadToIPFS = async (app, reader, name, address) => {
    const buffer = await Buffer.from(reader.result);
    let res = await ipfs.files.add(buffer);

    try {
      await this.createUser(app.state.contract, address, name, res[0].hash);

      let registered = true;
      let approvalRequests = ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000"]
      let numApprovalRequests = 0;
      let route = await this.getRoute(address, registered);
      
      this.setState({registered, route, name, imageHash: res[0].hash, approvalRequests, numApprovalRequests})
    } catch(error) {
      alert("Error processing your file, please see the developer console.")
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
             gas: 300000},
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

    // 4 permutations as to how you will go about updating your profile.

    if(name !== '' && typeof file === 'undefined') {
      // case 1

      try {
        await this.updateUserDetails(contract, address, name, '', 1);
        alert("Name has been updated! The page will redirect to the home page once you click 'Ok'");
        this.setState({name, redirect: true});
      } catch(error) {
        alert("Unable to update name, please see the developer console.");
        console.log(error);
      }
    } else if(name === '' && typeof file !== 'undefined') {
      // case 2

      let reader = new window.FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = async () => {
        const buffer = await Buffer.from(reader.result);
        let res = await ipfs.files.add(buffer);
        try {
          await this.updateUserDetails(contract, address, '', res[0].hash, 2);
          alert("Pic has been updated! The page will redirect to the home page once you click 'Ok'");
          this.setState({imageHash: res[0].hash, redirect: true});
        } catch(error) {
          alert("Unable to update image hash, please see the developer console.");
          console.log(error);
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
          await this.updateUserDetails(contract, address, name, res[0].hash, 3);
          alert("Name and Pic has been updated! The page will redirect to the home page once you click 'Ok'");
          this.setState({name, imageHash: res[0].hash, redirect: true});
        } catch(error) {
          alert("Unable to update name and image hash, please see the developer console.");
          console.log(error);
        }
      }
    } else {
      // case 4

      try {
        await this.updateUserDetails(contract, address, '', '', 4);
        alert("Name and Pic has been removed. The page will redirect to the home page once you click 'Ok'");
        this.setState({name: '', imageHash: '', redirect: true});
      } catch(error) {
        alert("Unable to remove user's name and image, please see the developer console.");
        console.log(error);
      } 
    }
  }


  // Get pic from IPFS
  getFromIPFS(hash) {
    var url = "https://gateway.ipfs.io/ipfs/" + hash;
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.addEventListener('load', e => resolve(img));
      img.addEventListener('error', () => {
        reject(new Error(`Failed to load image's URL: ${url}`));
      });
      img.src = url;
    });
  }

  requestForApproval = async (contract, requester, requestee) => {
    return new Promise(function(resolve, reject) {
      contract.requestForApproval(
        requestee,
        {from: requester},
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

  request = async (event) => {
    event.stopPropagation();
    event.preventDefault();

    let requestee = document.getElementById("address").value;
    let requester = this.state.address;
    let contract = this.state.contract;

    // Need to check that the address length is 42. Anything shorter and it's not a valid address.
    if(requestee.length === 42) {
      try {
        await this.requestForApproval(contract, requester, requestee);
        alert("Successfully requested for approval from " + requestee + "!")
      } catch(error) {
        alert("Unable to request for approval, please see the developer console.");
        console.log(error);
      }
    } else {
      alert("Please check your address and try again.")
    }
  }

  getApprovalRequests = async (contract, address) => {
    return new Promise(function(resolve, reject) {
      contract.getApprovalRequests(
        {from: address},
        function(err, res){
          if(err) {
            reject(res);
          } else {
            resolve(res);
          }
        }
      )
    })
  }

  approveRequester = async (contract, requester, requestee) => {
    return new Promise(function(resolve, reject) {
      contract.approveRequester(
        requester,
        {from: requestee,
         gas: 300000},
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

  unapproveRequester = async (contract, requester, requestee) => {
    return new Promise(function(resolve, reject) {
      contract.unapproveRequester(
        requester,
        {from: requestee,
         gas: 300000},
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



  getIdentityFrom = async (contract, requester, requestee) => {
    return new Promise(function(resolve, reject) {
      contract.getIdentityFrom(
        requestee,
        {from: requester},
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

  view = async (event) => {
    event.stopPropagation();
    event.preventDefault();

    let requestee = document.getElementById("address").value;
    let requester = this.state.address;
    let contract = this.state.contract;

    try {
      let result = await this.getIdentityFrom(contract, requester, requestee);
      let name = result[0];
      let imageHash = result[1];
      if(name === '' && imageHash === '') {
        alert("This address does not have an identity.")
      } else {
        document.getElementById("name").innerHTML = "Name: "
        document.getElementById("output").innerHTML = name;
        await this.getFromIPFS(imageHash).then(
          img => {
            var tag = document.getElementById('ipfsImage');
            if(!tag.hasChildNodes())
            {
              tag.appendChild(img);
            } else {
              tag.removeChild(tag.childNodes[0]);
              tag.appendChild(img);
            }
          })
    .catch(error => console.error(error));
      }
    } catch(error) {
      alert("Unable to get identity, please see the developer console.")
      console.log(error)
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

    }
    // 4 scenarios
    // When root page and not logged in => Redirect to disconnect
    // When root page and logged in => Redirect to connected
    // When not root page and change account => Redirect to connected
    // When not root page and log out => Redirect to disconnected

    // When metamask is not enabled and address is undefined (not logged in)
    if(!address) {
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

      // If user is not registered, display new registration page
      if(!app.state.registered){
        const button = () => {
          // Don't forget to specify max length for input.
          return(
            <div style = {{
                color: 'white'
              }}
            >
              <form onSubmit={this.register}>
                <label>
                  Name:
                  <div style = {{
                    display: 'inline',
                    paddingLeft: '10px'
                  }}
                  >
                    <input placeholder="Your name" type="text" id="name"/>
                  </div>
                </label><br/>
                <label>
                  Image:
                  <div style = {{
                    display: 'inline',
                    paddingLeft: '8px'
                  }}
                  >
                    <input placeholder="Your image" type="file" id="image"/>
                  </div>
                </label><br/><br/>
                <button>Submit Registration!</button>
              </form>
            </div>
          )
        }

        return (
          <div style =
            {{
              minHeight: '100%',
              minHidth: '1024px',
              width: '100%',
              height: 'auto',
              position: 'fixed',
              top: '0',
              left: '0',
              backgroundImage: 'url('+bgImage+')'
            }}
          >
            <div style =
              // Style related to this div (entire page)
              {{
                display: "flex",
              }}
            >
              <div style =
              // Styling for this div (entire page)
                {{
                  flex: 1,
                  marginLeft: "10%",
                  marginRight: "10%",
                  color: 'white'
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
          </div>
        )
      } else {

        // If user is registered, display connected page
        return (
          <div style =
            {{
              minHeight: '100%',
              minHidth: '1024px',
              width: '100%',
              height: 'auto',
              position: 'fixed',
              top: '0',
              left: '0',
              backgroundImage: 'url('+bgImage+')'
            }}
          >
            <div style =
              // Styling for this div (entire page)
              {{
                display: "flex",
                height: "100%",
              }}
            >
              <div id="navBar" style = 
                // Styling for this div (left panel)
                {{
                  flex: 1,
                  padding: "0px",
                  height: "100%",
                  opacity: '0.5',
                  background: "#f0f0f0",
                  position: "fixed"
                }}
              >      
                <ul 
                  // Styling specific to the nav bar
                  style={{
                    listStyleType: "none",
                    fontSize: '20px',
                    padding: "20px",
                    display: "grid"
                  }}
                > 
                  <li>
                    <Link to="/home">Home</Link>
                  </li><br/>
                  <li>
                    <Link to="/updateProfile" onClick={() =>
                      this.getFromIPFS(app.state.imageHash).then(
                        img => {
                          var tag = document.getElementById('ipfsImage');
                          if(!tag.hasChildNodes())
                          {
                            tag.appendChild(img);
                          } else {
                            tag.removeChild(tag.childNodes[0]);
                            tag.appendChild(img);
                          }
                        }
                      ).catch(error => console.error(error))}>
                      Update Profile
                    </Link>
                  </li><br/>
                  <li>
                    <Link to="/makeRequests">Make Request</Link>
                  </li><br/>
                  <li>
                    <Link to="/getRequests">Your Requests</Link>
                  </li><br/>
                  <li>
                    <Link to="/getDetails">Get Details</Link>
                  </li><br/>
                  <li>
                    <Link to="/about">About</Link>
                  </li><br/>
                </ul>
              </div>

              <div style =
                // Styling for this div (right panel)
                {{
                  display: "flex",
                  marginLeft: "11%",
                  color: "white",
                  fontSize: '25px'
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
          </div>
        )
      } 
    }
  }



  render() { 

    if (!this.state.web3) { 
      return <div>Loading Web3, accounts, and contract...</div>
    } else {
      return(
        <Router>
          {this.getContents(this)}
        </Router>
      )
    }
  }
}

export default App