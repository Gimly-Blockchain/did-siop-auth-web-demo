import React, {Component} from "react";
import {Link} from 'react-router-dom';
import {AuthRequestResponse} from "../../../onto-demo-shared-types/dist";


export type NavProps = {
  authRequestResponse?: AuthRequestResponse
}

export default class Nav extends Component<NavProps> {

  constructor(props: NavProps) {
    super(props)
  }

  render() {
    return (
        <div
            style={{
              padding: "10px",
              width: "10em",
              height: "50em",
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
    if (this.props.authRequestResponse) {
      return <>
        <li>
          <Link to="/secret">A secret page</Link>
        </li>
        <li>
          <Link to="/top-secret">A top-secret page</Link>
        </li>
      </>;
    } else {
      return null
    }
  }
}