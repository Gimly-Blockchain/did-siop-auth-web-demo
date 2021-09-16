import logo from "./logo.svg"
import "./App.css"
import React, {Component} from "react"
import Button from "react-bootstrap/Button"
import AuthenticationModal from "./components/AuthenticationModal"
import {AuthRequestResponse} from "../../onto-demo-shared-types/dist"
import jsonpack from "jsonpack"


export type AppState = {
  showAuthenticationModal?: boolean
  authRequestResponse?: AuthRequestResponse
}


class App extends Component<AppState> {

  state: AppState = {}
  private readonly _stateStorageKey = "state-onto-app";

  constructor(props: AppState, context: any) {
    super(props, context);
    this.initState();
  }

  render() {
    this.saveState();
    return (
        <div className="App">

          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo"/>
            <p>
              ONTO QR code authentication demo using SIOP
            </p>
            {this.stateDependentBlock()}
          </header>
          <AuthenticationModal show={this.state.showAuthenticationModal as boolean} onCloseClicked={this.hideLoginDialog}
                               onSignInComplete={this.completeSignIn}/>
        </div>
    )
  }

  private showLoginDialog = () => {
    this.setState({showAuthenticationModal: true})
  }

  private hideLoginDialog = () => {
    this.setState({showAuthenticationModal: false})
  }

  private completeSignIn = (authRequestResponse: AuthRequestResponse) => {
    this.setState({showAuthenticationModal: false, authRequestResponse: authRequestResponse})
  }

  private signOut = () => {
    this.setState({authRequestResponse: undefined})
  };

  private initState() {
    let storedState = localStorage.getItem(this._stateStorageKey)
    if (storedState != null) {
      this.loadState(storedState);
    } else {
      this.state.showAuthenticationModal = false
    }
  }

  private loadState = (storedState: string) => {
    this.state = jsonpack.unpack(storedState) as AppState
  };


  private saveState = () => {
    localStorage.setItem(this._stateStorageKey, jsonpack.pack(this.state))
  };

  private stateDependentBlock = () => {
    const authRequestResponse = this.state.authRequestResponse
    if (authRequestResponse) {
      return <Button variant="primary" size="lg" onClick={this.signOut}>Sign out</Button>
    } else {
      return <Button variant="primary" size="lg" onClick={this.showLoginDialog}>Sign in</Button>
    }
  };
}

export default App
