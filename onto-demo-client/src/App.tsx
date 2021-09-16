import "./App.css"
import React, {Component} from "react"
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom'
import Button from "react-bootstrap/Button"
import AuthenticationModal from "./components/AuthenticationModal"
import {AuthRequestResponse} from "../../onto-demo-shared-types/dist"
import jsonpack from "jsonpack"
import NNav from "./components/Nav";
import Landing from "./pages/Landing";
import {Col, Container, Row} from "react-bootstrap";


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
        <div>
          <header className="App-header">
            {this.signInOutButtons()}
          </header>
          <Router>
            <div style={{display: "flex"}}>
              <NNav authRequestResponse={this.state.authRequestResponse}/>
              <Switch>
                <Route component={Landing} path="/"/>
              </Switch>
              <AuthenticationModal show={this.state.showAuthenticationModal as boolean} onCloseClicked={this.hideLoginDialog}
                                   onSignInComplete={this.completeSignIn}/>
            </div>

          </Router>
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

  private signInOutButtons = () => {
    const authRequestResponse = this.state.authRequestResponse
    if (authRequestResponse) {
      return (<Container fluid>
            <Row className="align-items-center">
              <Col className="col-10">
                <h5>Hello {authRequestResponse.userName}</h5>
              </Col>
              <Col className="col-2">
                <Button variant="primary" size="lg" onClick={this.signOut}>Sign out</Button>
              </Col>
            </Row>
          </Container>
      )
    } else {
      return (<Container fluid>
            <Row>
              <Col className="col-10">
                <h5/>
              </Col>
              <Col className="col-2">
                <Button variant="primary" size="lg" onClick={this.showLoginDialog}>Sign in</Button>
              </Col>
            </Row>
          </Container>
      )
      return
    }
  };
}

export default App
