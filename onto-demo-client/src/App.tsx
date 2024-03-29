import "./App.css"
import React, {Component} from "react"
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom'
import Button from "react-bootstrap/Button"
import AuthenticationModal from "./components/AuthenticationModal"
import {AuthResponse} from "@gimly-blockchain/did-auth-siop-web-demo-shared"
import jsonpack from "jsonpack"
import Nav from "./components/Nav"
import Landing from "./pages/Landing"
import Secret from "./pages/Secret"
import Classified from "./pages/Classified"
import {Col, Container, Image, Row} from "react-bootstrap"


export type AppState = {
    showAuthenticationModal?: boolean
    authResponse?: AuthResponse
}


class App extends Component<AppState> {

    state: AppState = {}
    private readonly _stateStorageKey = "state-onto-app"

    constructor(props: AppState, context: any) {
        super(props, context)
        this.initState()
    }

    render() {
        this.saveState()
        const authResponse = this.state.authResponse as AuthResponse
        return (
            <div>
                <header className="App-header">
                    {this.signInOutButtons()}
                </header>
                <Router>
                    <div style={{display: "flex"}}>
                        <Nav AuthResponse={authResponse}/>
                        <Switch>
                            <Route path="/secret">
                                <Secret AuthResponse={authResponse}/>
                            </Route>
                            <Route path="/classified">
                                <Classified AuthResponse={authResponse}/>
                            </Route>
                            <Route path="/"><Landing/></Route>
                        </Switch>
                        <AuthenticationModal show={this.state.showAuthenticationModal as boolean}
                                             onCloseClicked={this.hideLoginDialog}
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

    private completeSignIn = (authResponse: AuthResponse) => {
        this.setState({showAuthenticationModal: false, authResponse: authResponse})
    }

    private signOut = () => {
        this.setState({authResponse: undefined})
    }

    private initState() {
        let storedState = sessionStorage.getItem(this._stateStorageKey)
        if (storedState != null) {
            this.loadState(storedState)
        } else {
            this.setState({showAuthenticationModal: false})
        }
    }

    private loadState = (storedState: string) => {
        // eslint-disable-next-line react/no-direct-mutation-state
    this.state = jsonpack.unpack(storedState) as AppState
  }


    private saveState = () => {
        sessionStorage.setItem(this._stateStorageKey, jsonpack.pack(this.state))
    }

    private signInOutButtons = () => {
        const authResponse = this.state.authResponse as AuthResponse
        if (authResponse) {
            return (<Container fluid>
                    <Row className="align-items-center">

                        <Col className="col">
                                <a className="youTubeLink" href={authResponse.youtubeChannelURL} target={"_blank"}><Image width={"40px;"} src={authResponse.youtubeChannelImageURL}/><b>{authResponse.youtubeChannelName}</b></a>
                        </Col>
                        <Col className="col-1">
                            <h5>Hi {authResponse.firstName} {authResponse.lastName}</h5>
                        </Col>
                        <Col className="col-1">
                            <Button variant="primary" size="lg" onClick={this.signOut}>Sign out</Button>
                        </Col>
                    </Row>
                </Container>
            )
        } else {
            return (<Container fluid>
                    <Row>
                        <Col className="col-10">
                            <p/>
                        </Col>
                        <Col className="col-1">
                <Button variant="primary" size="lg" onClick={this.showLoginDialog}>Sign in</Button>
              </Col>
            </Row>
          </Container>
      )
        }
    }
}

export default App
