# consensys-final-project

## What does your project do?
This is my submission for the final project for the ConsenSys Developer Academy course of class 2018. I have decided to create a simple decentralised ID system (think uPort, Sovrin) where users can make requests (which can be approved or rejected) to view another users' details. 

Unlike uPort that stores your identification details locally on the app itself (which I think is quite a big security risk), I've planned for mine to be stored on the Blockchain. 

There is a myriad of issues pertaining to privacy when it comes to your personal information however, **I haven't had the time to implement any privacy features**. That said, any of these methods (e.g. encryption of data before uploading onto the blockchain) will be done outside the blockchain via the Dapp before the web3.js library calls my smart contract functions. 

What I'm working on for this project is the data structure to hold these information. I've opted for a KISS approach in order to make my contract easy to understand (which comes with higher gas costs as a trade off). 

Without further ado, let's proceed to set this up!

## How to set it up?

### Assumptions
- Assuming fresh installation of ubuntu 16.04

### Basic setup 
1. install nvm - curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
2. install node - nvm install node
3. install ganache-cli - npm install -g ganache-cli
4. install truffle - npm install -g truffle
5. install ipfs - npm install -g ipfs

### To test
1. Run ganache-cli in one terminal
2. Open another terminal, navigate to the clients folder and do truffle test.

### To interact with the dapp, please do the following
1. Run ganache-cli and connect metamask to ganache (under settings, new RPC url, enter http://127.0.0.1:8545)
2. Import as many accounts as you'd like to Metamask (you can run ganache-cli -m so you don't have to keep reimporting accounts)
3. Navigate to the root folder (there should be a contracts folder in this folder) and do "truffle compile" followed by "truffle migrate"
4. Navigate to the client folder and do npm install
5. Open a new terminal and run ipfs init followed by the following commands:
  - ipfs config Addresses.API /ip4/127.0.0.1/tcp/5001
  - ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
  - ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "GET", "POST"]'
6. run ipfs daemon
7. run npm start
8. Have fun! 


## Additional Notes
1. I used a more updated truffle react boilerplate which can be found here https://github.com/adrianmcli/truffle-react but I downgraded the web3 version to 0.20.7 as it is more stable.
