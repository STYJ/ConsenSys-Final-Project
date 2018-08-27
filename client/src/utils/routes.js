import React from 'react'


export const disconnectedRoute = [
  {
    path: "/disconnected",
    main: () => <h2>Please login to Metamask.</h2>
  }
];

export const newRegistrationRoute = [
  {
    path: "/newRegistration",
    main: () => <h2>Placeholder text</h2>
  }
];

export const connectedRoutes = [
  {
    path: "/home",
    main: () => <h2>Placeholder text</h2>
  },
  {
    path: "/updateProfile",
    main: () => <h2>Placeholder text</h2>
  },
  {
    path: "/makeRequests",
    main: () => <h2>Placeholder text</h2>
  },
  {
    path: "/getRequests",
    main: () => <h2>Placeholder text</h2>
  },
  {
    path: "/getDetails",
    main: () => <h2>Placeholder text</h2>
  },
  {
    path: "/about",
    main: () => {
      return (
        <div>
          <h1>About</h1>
            <p>This is a simple identity Dapp created as the final project submission for Simon Tan for the consensys developer academy cohort of 2018.</p>
            <p>The purpose of this dapp is less about showcasing my very bad front-end skills but more about showing you an example implementation of a decentralised identity management system with the smart contract that I have created.</p>
            <p>This smart contract is very simple as it only requires the user to submit a name and a picture to create an identity however, it was meant to serve as the basis of all other identity types.</p>
          <h2>Use cases</h2>
            <ul>
              <li>Users can access the dapp and create an identity that is tied to their ethereum address.</li>
              <li>Users can update their identity details</li>
              <li>Users are required to request for approval before they are able to view someone else's identity</li>
              <li>Requestees can approve or reject an approval to view their accounts</li>
            </ul>
          <h2>Further extensions</h2>
            <ul>
              <li>Read up on ZK proofs and other implementations of privacy (e.g. one-time-pad) on the blockchain and see how it can be incorporated for self sovereign identities.</li>
              <li>To create an endorsement system with some gamification / game theory behind it as a reputation system.</li>
              <li>Figure out how others can create identities that extend this identity with the existing solidity restrictions.</li>
              <li>To redo front end from scratch and to do it properly this time (with proper directory structures).</li>
            </ul>

        </div>
      )
    }
  }
];