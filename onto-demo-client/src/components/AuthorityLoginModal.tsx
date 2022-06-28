import { useState } from 'react'
import {
  Button,
  Container,
  Modal,
  Row,
  Form,
  Alert
} from "react-bootstrap"
import {withRouter, RouteComponentProps} from 'react-router-dom'

type AuthorityLoginModalProps = RouteComponentProps & {
  show?: boolean
  onCloseClicked?: () => void
  onSubmit: () => void,
  adminLoginType?: string
}

const AuthorityLoginModal = ({
  onCloseClicked,
  show,
  onSubmit,
  history,
}: AuthorityLoginModalProps) => {
  const [form, setForm] = useState<{username?: string, password?: string}>({})
  const [error, setError] = useState<string|undefined>()

  const handleSubmit = () => {
    setError('')
    if (form.username === 'admin' && form.password === "1234") {
      history.push({
        pathname: '/authority'
      })
      onSubmit()
    } else {
      setError("Invalid username or password")
    }
  }

  const onChangeForm = (field: string, value: string) => {
    setForm({...form, [field]: value})
  }

  return <Modal show={show} animation={false}>
      <Modal.Header className="modal-header">
        <Modal.Title>Admin Login</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container>
          <Row>
            <Form>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>Username</Form.Label>
                <Form.Control value={form.username} type="text" placeholder="Enter Username" onChange={e => onChangeForm("username", e.target.value)} />
                <Form.Text className="text-muted">
                  Please provide your authority admin username
                </Form.Text>
              </Form.Group>
              <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control value={form.password} type="password" placeholder="Password" onChange={e => onChangeForm("password", e.target.value)} />
              </Form.Group>
              { error && <Alert key="danger" variant="danger">{error}</Alert> }
            </Form>
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCloseClicked}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>
          Submit
        </Button>
      </Modal.Footer>
    </Modal>
}

export default withRouter(AuthorityLoginModal);