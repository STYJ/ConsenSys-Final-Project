# consensys-final-project

## What does your project do?
This is my submission for the final project for the ConsenSys Developer Academy course of class 2018. I have decided to create a simple decentralised ID system (think uPort, Sovrin) where users can make requests (which can be approved or rejected) to view another users' details. 

Unlike uPort that stores your identification details locally on the app itself (which I think is quite a big security risk), I've planned for mine to be stored on the Blockchain. 

There is a myriad of issues pertaining to privacy when it comes to your personal information however, **I haven't had the time to implement any privacy features**. That said, any of these methods (e.g. encryption of data before uploading onto the blockchain) will be done outside the blockchain via the Dapp before the web3.js library calls my smart contract functions. 

This goal of this project is to create the data structure to hold these private and confidential information. I've opted for a KISS approach in order to make my contract easy to understand (which comes with higher gas costs as a trade off). 

## User stories

Any individual is able to interact with the dapp however, you need to have registered an identity for you to be able to view the identities of others. Once an identity has been created, you can also update it if it's incorrect. To view the identity of others, you will first need to make an approval request. This approval request can either be approved or rejected by the requestee. Once approved, you can enter the address of the requestee to view his/her details. 

I've also built an additional functionality on top the dapp where if you swap metamask accounts, the dapp will be reflected on the fly to show you your latest active account. This is to ensure that the address registered on web3 is the correct one and that you don't sign the wrong transaction.

Without further ado, let's proceed to set this up!

## How to set it up?

### Assumptions
- Assuming fresh installation of ubuntu 16.04

### Basic setup (run the following commands in the order described below)

1. sudo apt install curl
2. curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash and restart terminal.
3. nvm install node
4. npm install -g ganache-cli
5. npm install -g truffle
6. install ipfs for linux (download package, unzip it and run ./install.sh)
7. install google chrome and install the metamask extension.

### To test

1. Run ganache-cli in one terminal
2. Open another terminal, navigate to the root folder and do truffle test.

### To interact with the dapp, please do the following (please follow the instructions very closely as any missteps will cause the deployment of the dapp to fail)

1. Run ganache-cli and connect metamask to ganache (under settings, new RPC url, enter http://127.0.0.1:8545). Make sure that even if you already have a custom RPC to this address, that you set up a new RPC address.
2. Import at least 3 accounts to Metamask
3. Navigate to the root folder and do "truffle compile" followed by "truffle migrate"
4. Navigate to the client folder and do npm install
5. Open a new terminal and run ipfs init followed by the following commands:
  - ipfs config Addresses.API /ip4/127.0.0.1/tcp/5001
  - ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
  - ipfs config --json Gateway.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
  - ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "GET", "POST"]'
6. run ipfs daemon
7. run npm start inside the terminal that is currently in the client folder (consensys-final-project/client)
8. Have fun! 

## Additional Notes

1. I used a more updated truffle react boilerplate which can be found here https://github.com/adrianmcli/truffle-react but I downgraded the web3 version to 0.20.7 as it is more stable.
2. Please wait for transactions to be confirmed before swapping metamask accounts otherwise the transactions will be stuck in limbo on the blockchain (where it's mined but metamask says it's pending confirmation).
