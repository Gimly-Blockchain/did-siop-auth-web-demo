import "./App.css"
import React, {Component} from "react"
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom'

import Button from "react-bootstrap/Button"
import AuthenticationModal from "./components/AuthenticationModal"
import AuthorityLoginModal from "./components/AuthorityLoginModal"
import {AuthResponse} from "@gimly-blockchain/did-auth-siop-web-demo-shared"
import jsonpack from "jsonpack"
import Nav from "./components/Nav"
import Landing from "./pages/Landing"
import Secret from "./pages/Secret"
import Classified from "./pages/Classified"
import Authority from "./pages/Authority"
import {Col, Container, Image, Row} from "react-bootstrap"

type AppState = {
    showAuthenticationModal?: boolean
    authResponse?: AuthResponse
    showAuthorityLoginModal?: boolean
    adminLoginType?: string
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
        const headerContent = this.signInOutButtons()
        return (
            <div>
                {headerContent&&<header className="App-header">{headerContent}</header>}
                <Router>
                    <div style={{display: "flex"}}>
                        {authResponse && <Nav AuthResponse={authResponse}/>}
                        <Switch>
                            <Route path="/secret">
                                <Secret AuthResponse={authResponse}/>
                            </Route>
                            <Route path="/classified">
                                <Classified AuthResponse={authResponse}/>
                            </Route>
                            <Route path="/authority">
                                <Authority/>
                            </Route>
                            <Route path="/">
                                <Landing
                                    authResponse={authResponse}
                                    showLoginDialog={this.showLoginDialog}
                                    showLogin={this.showLogin}
                                />
                            </Route>
                        </Switch>
                        <AuthenticationModal show={this.state.showAuthenticationModal as boolean}
                            onCloseClicked={this.hideLoginDialog}
                            onSignInComplete={this.completeSignIn}/>
                        <AuthorityLoginModal show={this.state.showAuthorityLoginModal}
                            onCloseClicked={this.hideLoginAuthority}
                            onSubmit={this.submitAuthorityLogin}
                        />
                    </div>
                </Router>
            </div>
        )
    }

    private showLoginDialog = () => {
        this.setState({showAuthenticationModal: true})
    }

    private showLogin = () => {
        this.setState({showAuthorityLoginModal: true})
    }

    private hideLoginAuthority = () => {
        this.setState({showAuthorityLoginModal: false})
    }

    private submitAuthorityLogin = () => {
        this.setState({showAuthorityLoginModal: false})
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
                            <Button variant="primary" size="sm" onClick={this.signOut}>Sign out</Button>
                        </Col>
                    </Row>
                </Container>
            )
        } else {
            return null
            /*return (<Container fluid>
                    <Row>
                        <Col className="col-8">
                            <p/>
                        </Col>
                        <Col className="col-4">
                            <Button variant="primary" size="sm" onClick={this.showLoginDialog}>Sign in</Button>
                            <Button variant="outline-primary" size="sm" onClick={this.showLoginEmployer}>Admin Company</Button>
                            <Button variant="outline-primary" size="sm" onClick={this.showLoginHotel}>Admin Hotel</Button>
                        </Col>
                    </Row>
            </Container>)*/
        }
    }
}

export default App
