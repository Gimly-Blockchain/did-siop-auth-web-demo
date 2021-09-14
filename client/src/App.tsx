import logo from './logo.svg';
import './App.css';
import React, {Component} from 'react';
import axios from "axios";

interface IState {
  data?: string;
}

class App extends Component<IState> {

  state: IState = {
    data: undefined
  };

  componentDidMount() {
    this.callBackendAPI()
    .then(authenticated => this.setState({data: authenticated}))
    .catch(err => console.log(err));
  }

  render() {
    return (
        <div className="App">
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo"/>
            <p>
              Edit <code>src/App.tsx</code> and save to reload.
            </p>
            <a
                className="App-link"
                href="https://reactjs.org"
                target="_blank"
                rel="noopener noreferrer"
            >
              Learn React</a>
            <p>State: {this.state.data}</p>
          </header>
        </div>
    );
  }

  // fetching the GET route from the Express server which matches the GET route from server.js
  callBackendAPI = async (): Promise<string> => {
    const response = await axios.get('/authenticate');
    const body = await response.data;

    if (response.status !== 200) {
      throw Error(body.message)
    }
    return body.authenticated ? "Authenticated" : "Not authenticated";
  };
}

export default App;
