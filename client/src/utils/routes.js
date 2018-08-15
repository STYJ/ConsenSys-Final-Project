import React from 'react'

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
    main: () => <h2>About</h2>
  }
];