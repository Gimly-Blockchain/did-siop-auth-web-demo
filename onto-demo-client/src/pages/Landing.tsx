import React, {Component} from "react";
import logo from "../logo.svg";

export default class Landing extends Component {
  render() {
    return (
        <div className="App">
          <img src={logo} className="App-logo" alt="logo"/>
          <p>
            QR code authentication demo using SIOP v2
          </p>
        </div>
    )
  }
}
