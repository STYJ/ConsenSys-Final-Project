import React, { Component } from 'react'
import getWeb3 from './utils/getWeb3'

// import getContractInstance from './utils/getContractInstance'
// import contractDefinition from './contracts/SimpleStorage.json'


import {
  BrowserRouter as Router,
  Route,
  Link,
  Redirect,
  Switch
} from 'react-router-dom';



export const disconnectedRoute = [
  {
    path: "/disconnected",
    main: () => <h2>Please login to Metamask.</h2>
  }
];


export const connectedRoutes = [
  {
    path: "/home",
    main: () => <h2>Welcome back!</h2>
  },
  {
    path: "/requestApproval",
    main: () => <h2>Please enter an address here to request for their approval.</h2>
  },
  {
    path: "/pendingApproval",
    main: () => <h2>These are the addresses pending your approval</h2>
  },
  {
    path: "/about",
    main: () => <h2>about</h2>
  }
];




class App extends Component {

  // Note that an asynchronous call to fetch data will not return until a render has occured so that means you'll always need to render with empty / initial data at least once. This is why the render has a !null check. 
  constructor(props){
    super(props);
    this.state = {
      web3: null,
      prevAddress: null,
      address: null,
      route: null
    }
    this.getRoute = this.getRoute.bind(this);
    this.getContents = this.getContents.bind(this);
    this.renderRedirect = this.renderRedirect.bind(this);
  }


  // This function is called everytime after render is called
  componentDidUpdate = async () => {

      if(this.state.address) {
        console.log("User is logged in at", this.state.address);
      } else {
        console.log("user is either not logged in or has logged out");
      }
  }

  // This function is only run once when the component is mounted for the first time
  componentDidMount = async () => {
    try {
      
      // await is the same as .then without any callback function.
      // Get network provider and web3 instance.
      const web3 = await getWeb3()

      // Use web3 to get the user's accounts.
      // If using metamask, the array will always have size of 1 (the selected account).
      const address = (await web3.eth.getAccounts())[0]

      // When testing with ganache locally however, you can most definitely receive more than 1 accounts so use something like this instead (change state.address to accounts)
      // const accounts = await web3.eth.getAccounts()

      // Get route after getting accounts
      const route = await this.getRoute(address)

      // Set web3, accounts, routes and contract to the state then subscribe to publicConfigStore
      // This is the second time render is called.
      // Once componentDidMount is completed, componentDidUpdate is called. 
      // Once that is done then the callback function in set state is called.
      this.setState({
        web3,
        address,
        route
      }, () => {
        console.log("subscribing to public config store");
        this.state.web3.currentProvider.publicConfigStore.on(
          'update',
          (props) => {
            console.log("public store is updated")
            let address = props.selectedAddress;
            if(typeof props.selectedAddress !== 'undefined') {
              // User is still logged in
              if(props.selectedAddress !== this.state.address) {
                // Update with new address and update routes to reflect address.
                let updatedRoutes = connectedRoutes;
                updatedRoutes[0].main = () => <h2>Welcome back! {this.state.address}</h2>
                this.setState((prevState) => ({
                  address,
                  prevAddress: prevState.address,
                  route:updatedRoutes
                }))
              }
            } else {
              // User logged out
              this.setState((prevState) => ({
                address: '',
                prevAddress: prevState.address,
                route: disconnectedRoute
              }))
            }

          }

        )
      })
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(`Failed to load web3, accounts, or contract. Check console for details.`)
      console.log(error)
    }
  }






  getRoute = async (address) => {
    if(typeof address === 'undefined'){
      return disconnectedRoute;
    }
    let updatedRoutes = connectedRoutes;
    updatedRoutes[0].main = () => <h2>Welcome back! {this.state.address}</h2>
    return updatedRoutes;
  }

  renderRedirect = (location) => {
    if(location !== this.state.route[0].path) {
      return <Redirect to={this.state.route[0].path}/>
    } 
    else {
      console.log("Path is the same, do not redirect")
      // return <Redirect to=location/>
    }
  }

  getContents = (prevAddress, address, route) => {
    let currPath = window.location.pathname
    let nextPath = route[0].path
    let redirect;
    
    // Getting redirect if any.
    if(prevAddress !== address && currPath !== nextPath) {
      redirect = <Redirect exact from={currPath} to={nextPath}/>
    }


    // 4 scenarios
    // When root page and not logged in => Redirect to disconnect
    // When root page and logged in => Redirect to connected
    // When not root page and change account => Redirect to connected
    // When not root page and log out => Redirect to disconnected

    // When metamask is enabled and address is undefined (not logged in)
    if(!address) {
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
              {route.map((route, index) => (
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
      // When metamask is enabled and address is defined
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
                <Link to="/home">Home</Link>
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
              {route.map((route, index) => (
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




  render() { 

    if (!this.state.web3) { 
      console.log("First initialisation");
      return <div>Loading Web3, accounts, and contract...</div>
    } else {
      console.log("Inside subsequent renders");

      return(
        <Router>
          {this.getContents(this.state.prevAddress, this.state.address, this.state.route)}
        </Router>
      )
    }

  }
}













// class App extends Component {
//   state = { storageValue: 0, web3: null, accounts: null, contract: null }

//   componentDidMount = async () => {
//     try {
//       // Get network provider and web3 instance.
//       const web3 = await getWeb3()

//       // Use web3 to get the user's accounts.
//       const accounts = await web3.eth.getAccounts()

//       // Get the contract instance by passing in web3 and the contract definition.
//       const contract = await getContractInstance(web3, contractDefinition)

//       // Set web3, accounts, and contract to the state, and then proceed with an
//       // example of interacting with the contract's methods.
//       this.setState({ web3, accounts, contract }, this.runExample)
//     } catch (error) {
//       // Catch any errors for any of the above operations.
//       alert(`Failed to load web3, accounts, or contract. Check console for details.`)
//       console.log(error)
//     }
//   }

//   runExample = async () => {
//     const { accounts, contract } = this.state

//     // Stores a given value, 5 by default.
//     await contract.methods.set(5).send({ from: accounts[0] })
    
//     // Get the value from the contract to prove it worked.
//     const response = await contract.methods.get().call({ from: accounts[0] })

//     // Update state with the result.
//     this.setState({ storageValue: response })
//   }

//   render() {
//     if (!this.state.web3) {
//       return <div>Loading Web3, accounts, and contract...</div>
//     }
//     return (
//       <div className="App">
//         <h1>Good to Go!</h1>
//         <p>Your Truffle Box is installed and ready.</p>
//         <h2>Smart Contract Example</h2>
//         <p>If your contracts compiled and migrated successfully, below will show a stored value of 5 (by default).</p>
//         <p>Try changing the value stored on <strong>line 37</strong> of App.js.</p>
//         <div>The stored value is: {this.state.storageValue}</div>
//       </div>
//     );
//   }
// }

export default App