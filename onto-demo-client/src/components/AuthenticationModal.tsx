import {Col, Container, Modal, Row} from "react-bootstrap"
import Button from "react-bootstrap/Button"
import AuthenticationQR from "./AuthenticationQR"
import {Component} from "react"
import {AuthRequestResponse} from "../../../onto-demo-shared-types/dist"

export type AuthenticationModalProps = {
  show?: boolean
  onCloseClicked?: () => void
  onSignInComplete: (authRequestResponse: AuthRequestResponse) => void
}

export default class AuthenticationModal extends Component<AuthenticationModalProps> {

  constructor(props: AuthenticationModalProps) {
    super(props)
  }

  render() {
    return <Modal show={this.props.show} animation={false}>
      <Modal.Header style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}>
        <Modal.Title>QR Code Authentication</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Container>
          <Row>
            <Col className="d-flex justify-content-center">
              <h6>Please scan this QR code now in your authenticator app.</h6>
            </Col>
          </Row>
          <Row>
            <Col className="d-flex justify-content-center" style={{paddingTop: "10px"}}>
              <AuthenticationQR onSignInComplete={(authRequestResponse) =>
                  this.props.onSignInComplete(authRequestResponse)}/>
            </Col>
          </Row>

        </Container>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={this.handleClose}>Cancel</Button>
      </Modal.Footer>
    </Modal>
  }

  private handleClose = () => {
    this.props.onCloseClicked?.()
  }
}
