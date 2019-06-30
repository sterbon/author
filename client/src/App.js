import React, { Component } from "react";
import getWeb3 from "./utils/getWeb3";
import OwnershipContract from "./contracts/Ownership.json"
import ipfs from "./ipfsCall";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import "react-tabs/style/react-tabs.css";
import Modal from 'react-awesome-modal';
import Card from './Card.js';

import "./App.css";

class App extends Component {

  state = { wallet: null, current: [], visibleBook: false, bookDetails: [], prnt: false, render: true, visible: false, bookName: null, clientName: "utsav", token: 0, ownerName: null, price: 0, contentName: null, viewText: 'Show Preview', showPreview: false, fileMetadata: [], storageValue: [], web3: null, accounts: null, contract: null, buffer: null, ipfsHash: null };

  constructor(props) {
    super(props)

    this.getFile = this.getFile.bind(this);
    this.submitFile = this.submitFile.bind(this);
    this.calcTime = this.calcTime.bind(this);
    this.loadHtml = this.loadHtml.bind(this);
    this.toggle = this.toggle.bind(this);
    this.buyToken = this.buyToken.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.searchFile = this.searchFile.bind(this);
    this.checkView = this.checkView.bind(this);//view timer
    this.viewHandler = this.viewHandler.bind(this);
  }


  componentDidMount = async () => {

    var self = this;
    window.addEventListener("keyup", function (e) {
      if (e.keyCode == 44) {
        self.setState({ prnt: true });
        console.log("pressed!")
      }
    });
    setInterval(() => this.checkView(), 1000);//view timer
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = OwnershipContract.networks[networkId];
      const instance = new web3.eth.Contract(
        OwnershipContract.abi,
        deployedNetwork && deployedNetwork.address,
      );
      instance.address = "0x0c38a6510266e279b91035b5a3495a0ee30b6a95";
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  checkView() { //view timer
    if (this.state.render == false) {
      this.closeModal();
    }
  }

  uploadTransaction = async () => {
    const { accounts, contract, ipfsHash, contentName, ownerName, price } = this.state;

    await contract.methods.uploadContent(ipfsHash, contentName, ownerName, price).send({ from: accounts[0] });

    const response = await contract.methods.search(ipfsHash).call();

    this.setState({ storageValue: response });
    console.log("storage Value: ", this.state.storageValue);
  };

  buyTokenTransaction = async () => {
    const { contract, accounts, clientName, token } = this.state
    await contract.methods.buyTokens(token).send({ from: accounts[0] });
  };

  purchaseTransaction = async () => {
    console.log("Working");
    const { ipfsHash, contract, accounts, clientName } = this.state;
    await contract.methods.purchase(ipfsHash, clientName).send({ from: accounts[0] });
    console.log("Transaction Successful !");
  };

  getCustomerCall = async () => {
    const { contract, accounts, clientName } = this.state;
    const response = await contract.methods.getCustomer(accounts[0]).call();
    this.setState({wallet: response[0]._hex});

    console.log("wallet: ", this.state.wallet);
  };

  getAll = async () => {
    const { contract } = this.state;
    const response = await contract.methods.getAllBooks().call();
    this.setState({ bookDetails: response });
    console.log("books: ", this.state.bookDetails);
  };

  loadHtml() {
    return (`https://ipfs.io/ipfs/${this.state.ipfsHash}`);
    // return (`https://wix.com`);
  }

  searchFile(event) {
    event.preventDefault()
    console.log("Push");
    // this.setState(this.searchForFile);
    // console.log("Data: ", this.state.fileMetadata);
  }

  openModal() {
    if (this.state.render) {
      this.setState({
        visible: true
      });
      setTimeout(
        function () {
          this.setState({ render: false });
        }.bind(this), 300000);
    }
    else {
      this.setState({
        visible: false
      });
    }
  }

  closeModal() {
    this.setState({
      visible: false
    });
  }

  getFile(event) {
    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file);
    console.log('buffer', this.state.buffer)

    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }
  }

  submitFile(event) {
    event.preventDefault();
    ipfs.files.add(this.state.buffer, (error, result) => {
      if (error) {
        console.error(error)
        return
      }
      this.setState({ ipfsHash: result[0].hash }, this.uploadTransaction)
      console.log('IPFS Hash Value: ', this.state.ipfsHash);
    })
  }

  calcTime(timestamp) {
    if (timestamp) {
      var date = new Date(timestamp * 1000);
      return date.toLocaleTimeString;
    }
  }

  toggle() {
    this.setState({
      shown: !this.state.shown,
      viewText: 'Hide Preview'
    });
  }

  buyToken(event) {
    event.preventDefault();
    this.setState(this.buyTokenTransaction);
  }

  viewHandler(value) {
    console.log(value);
    this.setState({ current: value });
    this.openModal();
  }

  buyHandler(hash) {
    this.setState({ ipfsHash: hash }, this.purchaseTransaction);
    // this.openModal();
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    // var hidden = {
    // 	display: this.state.shown ? "block" : "none"
    // }
    if (this.state.prnt) {
      return <div></div>
    }

    const coins = Object.values(this.state.bookDetails).map((key, index) => (
      <Card pname={key[0]} author={key[1]} price={key[2]} viewClick={() => this.viewHandler(key[3])} buyClick={() => this.buyHandler(key[3])} />
    ));


    return (
      <div className="App">
        <div className="Header">
          <h1>Decentralized Content Sharing </h1>
          <p><strong>My Address: </strong>{this.state.accounts[0]}</p>
          <p>Upload to IPFS and Secure by Ethereum</p>
        </div>

        <Tabs>
          <TabList className="tabs">
            <Tab>
              Upload
            </Tab>
            <Tab>
              Find Content
            </Tab>
            <Tab>
              Buy Tokens
            </Tab>
            <Tab>
              Profile
            </Tab>
          </TabList>

          <TabPanel >

            <h3>Select your file</h3>
            <form className="form" onSubmit={this.submitFile}>
              <input type='file' onChange={this.getFile} />
              <br></br>
              <label>Title: </label>
              <input className="text" type='text' onInput={e => this.setState({ ownerName: e.target.value })} />
              <br></br>
              <label>Author: </label>
              <input className="text" type='text' onInput={e => this.setState({ contentName: e.target.value })} />
              <br></br>
              <label>Price: </label>
              <input className="text" type='text' onInput={e => this.setState({ price: e.target.value })} />
              <br></br>
              <br></br>
              <button className="button"><span>Upload </span></button><br></br>

              <p><strong>IPFS Hash:</strong></p>
              <p className="hashLink" onClick={() => this.openModal()}>{this.state.ipfsHash}</p>

            </form>

            <Modal visible={this.state.visible} width="600" height="600" effect="fadeInUp" onClickAway={() => this.closeModal()}>
              <p><strong>Preview</strong></p>
              <iframe className="preview" src={this.loadHtml()} ></iframe>
            </Modal>

          </TabPanel>

          <TabPanel >

            {coins}

            <Modal visible={this.state.visible} width="600" height="600" effect="fadeInUp" onClickAway={() => this.closeModal()}>
              <p><strong>Book Review</strong></p>
              <iframe className="preview" src={this.loadHtml()} ></iframe>
            </Modal>

            <button onClick={this.getAll}>Refresh</button>
          </TabPanel>

          <TabPanel className="tab">
            <h3>Buy Tokens</h3>
            <form className="form" onSubmit={this.buyToken}>
             
              <label>Tokens: </label>
              <input className="text" type='text' onInput={e => this.setState({ token: e.target.value })} /><br></br>
              <button className="button"><span>Buy </span></button>
            </form>
          </TabPanel>

          <TabPanel>
            <h3>Profile</h3>
            <button onClick={this.getCustomerCall}>Refresh</button>
            
            <p>Wallet Balance: {parseInt(this.state.wallet)} </p>
            <p>BOOKS BOUGHT</p>
          </TabPanel>
        </Tabs>
      </div>
    );
  }
}
export default App;
