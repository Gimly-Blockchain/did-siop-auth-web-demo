import logo from "./logo.svg"
import "./App.css"
import React, {Component} from "react"
import Button from "react-bootstrap/Button"
import axios from "axios"
import AuthenticationModal from "./components/AuthenticationModal"
import {AuthRequestResponse} from "../../onto-demo-shared-types/dist"


export type AppState = {
  showAuthenticationModal?: boolean
  authRequestResponse?: AuthRequestResponse
}


class App extends Component<AppState> {

  state: AppState = {
    showAuthenticationModal: false
  }

  componentDidMount() {
    this.callBackendAPI()
    .then(authenticated => this.setState({data: authenticated}))
    .catch(err => console.log(err))
  }

  render() {
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


  // fetching the GET route from the Express server which matches the GET route from server.js
  callBackendAPI = async (): Promise<string> => {
    const response = await axios.get("/authenticate")
    const body = await response.data

    if (response.status !== 200) {
      throw Error(body.message)
    }
    return body.authenticated ? "Authenticated" : "Not authenticated"
  }

  private showLoginDialog = () => {
    this.setState({showAuthenticationModal: true})
  }

  private hideLoginDialog = () => {
    this.setState({showAuthenticationModal: false})
  }

  private completeSignIn = () => {
    this.setState({showAuthenticationModal: false})
  }

  private signOut() {
    this.setState({authRequestResponse: undefined})
  }

  private stateDependentBlock() {
    const authRequestResponse = this.state.authRequestResponse
    if (authRequestResponse) {
      return <Button variant="primary" size="lg" onClick={this.signOut}>Sign out</Button>
    } else {
      return <Button variant="primary" size="lg" onClick={this.showLoginDialog}>Sign in</Button>
    }
  }
}

export default App
