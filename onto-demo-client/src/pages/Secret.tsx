import React from "react"
import ProtectedResource from "./ProtectedResource";

export default class Landing extends ProtectedResource {

  render() {
    if (this.isAuthenticated()) {
      return (
          <div className="App">
            <img src="secret.gif" alt="logo"/>
            <p>
              <h5>The secret page</h5>
            </p>
          </div>
      )
    } else {
      return this.accessDenied();
    }
  }
}
