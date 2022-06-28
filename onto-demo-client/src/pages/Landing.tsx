import React, {Component} from "react";
import {Row} from "react-bootstrap"
import Button from "react-bootstrap/Button"
import {AuthResponse} from "@gimly-blockchain/did-auth-siop-web-demo-shared"

type LandingState = {
    showLoginDialog: () => void
    showLogin: () => void
    authResponse: AuthResponse
}

export default class Landing extends Component<LandingState> {

  constructor(props: LandingState, context: any) {
      super(props, context)
  }

  render() {
    return (
        <div className="Landing">
            {!this.props.authResponse && (<Row>
              <Button variant="primary" size="sm" onClick={this.props.showLoginDialog}>Sign in</Button>
              <Button variant="outline-primary" size="sm" onClick={this.props.showLogin}>Admin Login</Button>
            </Row>)}
        </div>
    )
  }
}
