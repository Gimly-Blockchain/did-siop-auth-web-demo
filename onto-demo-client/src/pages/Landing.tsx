import React, {Component} from "react";
import logo from "../logo.svg";

export default class Landing extends Component {
  render() {
    return (
        <div className="App">
          <img src={logo} className="App-logo" alt="logo"/>
          <p>
            ONTO QR code authentication demo using SIOP
          </p>
        </div>
    )
  }
}