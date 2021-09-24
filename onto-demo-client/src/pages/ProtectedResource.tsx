import {AuthResponse} from "../../../onto-demo-shared-types/dist"
import React, {Component} from "react"
import {isBlank} from "underscore.string"

export type ProtectedResourceProps = {
  AuthResponse: AuthResponse
}


export default class ProtectedResource extends Component<ProtectedResourceProps> {
  constructor(props: ProtectedResourceProps) {
    super(props)
  }


  protected isAuthenticated(): boolean {
    return this.props.AuthResponse && !isBlank(this.props.AuthResponse.userDID)
  }


  protected accessDenied() {
    return (
        <div className="App">
          <img src="access-denied.jpg" alt="logo" width="80%"/>
        </div>
    )
  }
}