import "./App.css"
import React, {Component} from "react"
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom'
import Button from "react-bootstrap/Button"
import AuthenticationModal from "./components/AuthenticationModal"
import {AuthResponse} from "onto-demo-shared-types"
import jsonpack from "jsonpack"
import Nav from "./components/Nav";
import Landing from "./pages/Landing";
import Secret from "./pages/Secret";
import Classified from "./pages/Classified";
import {Col, Container, Row} from "react-bootstrap";


export type AppState = {
  showAuthenticationModal?: boolean
  AuthResponse?: AuthResponse
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
              <Nav AuthResponse={this.state.AuthResponse}/>
              <Switch>
                <Route path="/secret">
                  <Secret AuthResponse={this.state.AuthResponse as AuthResponse}/>
                </Route>
                <Route path="/classified">
                  <Classified AuthResponse={this.state.AuthResponse as AuthResponse}/>
                </Route>
                <Route path="/"><Landing/></Route>
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

  private completeSignIn = (AuthResponse: AuthResponse) => {
    this.setState({showAuthenticationModal: false, AuthResponse: AuthResponse})
  }

  private signOut = () => {
    this.setState({AuthResponse: undefined})
  };

  private initState() {
    let storedState = localStorage.getItem(this._stateStorageKey)
    if (storedState != null) {
      this.loadState(storedState);
    } else {
      this.setState({showAuthenticationModal: false})
    }
  }

  private loadState = (storedState: string) => {
    this.state = jsonpack.unpack(storedState) as AppState
  };


  private saveState = () => {
    localStorage.setItem(this._stateStorageKey, jsonpack.pack(this.state))
  };

  private signInOutButtons = () => {
    const AuthResponse = this.state.AuthResponse
    if (AuthResponse) {
      return (<Container fluid>
            <Row className="align-items-center">
              <Col className="col-10">
                <h5>Hello {AuthResponse.userName}</h5>
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
