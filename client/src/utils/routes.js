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
    path: "/updateDetails",
    main: () => <h2>Placeholder text</h2>
  },
  {
    path: "/requestApproval",
    main: () => <h2>Placeholder text</h2>
  },
  {
    path: "/pendingApproval",
    main: () => <h2>Placeholder text</h2>
  },
  {
    path: "/getDetails",
    main: () => <h2>Placeholder text</h2>
  },
  {
    path: "/about",
    main: () => <h2>About</h2>
  }
];