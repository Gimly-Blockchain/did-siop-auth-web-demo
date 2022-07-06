import React from "react";
import {Link} from 'react-router-dom';
import ProtectedResource from "../pages/ProtectedResource";


export default class Nav extends ProtectedResource {

  render() {
    return (
        <div
            style={{
              padding: "10px",
              width: "10em",
              height: "auto",
              minHeight: "calc(100vh - 40px)",
              background: "#f0f0f0"
            }}
        >
          <ul style={{listStyleType: "none", padding: 0}}>
            <li>
              <Link to="/">Home</Link>
            </li>
            {this.protectedResources()}
          </ul>
        </div>
    );
  }

  private protectedResources() {
    if (this.isAuthenticated()) {
      return <>
        <li>
          <Link to="/secret">A secret page</Link>
        </li>
        <li>
          <Link to="/classified">A classified page</Link>
        </li>
      </>;
    } else {
      return null
    }
  }
}