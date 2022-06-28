import React, { useState, Fragment } from "react"
import {
	Alert,
  Button,
  Container,
  Modal,
  Row,
  Col,
  Form,
  Spinner
} from "react-bootstrap"
import axios from "axios"
import QRCode from "react-qr-code";
import {withRouter, RouteComponentProps} from 'react-router-dom'

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL

interface ServerResponseWithVc {
  data: {
  	redirectUrl: string,
  	session: string
  }
}

type FormProps = {
	firstName?: string
	lastName?: string
	email?: string
	securityClearanceLevel?: string
	department?: string
	phone?: string
	address?: string
	roomType?: string
	roomNumber?: string
	checkIn?: string
	checkOut?: string
}

type AuthorityProps = RouteComponentProps

const Authority = () => {
  const [form, setForm] = useState<FormProps>({})
  const [error, setError] = useState<string|undefined>()
	const [vc, setVc] = useState<string|undefined>()
	const [loading, setLoading] = useState<boolean>(false)
	const [done, setDone] = useState<boolean>(false)
	const [adminLoginType, setAdminLoginType] = useState<string|undefined>()
	const [step, setStep] = useState<number>(1)

	const handleIssueVc = async () => {
		setError('')
    if (!form.firstName || !form.lastName) {
     setError("Please complete the employee information")
     return
    }
		try {
			setLoading(true)
			const submitForm = {...form, adminLoginType}
			const response:ServerResponseWithVc = await axios.post(`${BACKEND_URL}/backend/request-vc`, submitForm)
			if (response.data.redirectUrl) {
				const vcString = JSON.stringify(response.data)
				setVc(vcString)
				setLoading(false)
				recursiveCheckSession(response.data.session)
			} else {
				throw 'Response Does not contains a verifiableCredential';
			}
		} catch (e) {
			setLoading(false)
			setError("Something went wrong wile issuing your credential, please try again.")
		}
	}

	const handleGoToStep2 = () => {
		setError('')
    if (
    	!form.firstName||
    	!form.lastName||
    	!form.email||
    	!form.phone||
    	!form.address||
    	!form.roomType||
    	!form.checkIn||
    	!form.checkOut
    ) {
     setError("Please complete the employee information")
     return
    }
    setStep(2)
	}

  const onChangeForm = (field: string, value: string) => {
    setForm({...form, [field]: value})
  }

  const recursiveCheckSession = async (sesId: string) => {
  	const response = await axios.get(`${BACKEND_URL}/ext/vc-status?sesId=${sesId}`)
  	if (response?.data?.status === "pending") {
  		await new Promise(resolve => setTimeout(resolve, 2000));
  		recursiveCheckSession(sesId)
  	} else {
  		setVc(undefined)
  		setDone(true)
  	}
  }

  const onChangeVcType = (value: string) => {
  	if (value === 'employer') {
  		setStep(2)
  	}
  	setAdminLoginType(value)
  }
 
	return (
      <div className="Screen">
          <Row>
          	<Col>
          		{/* form */}
		     			<Row>
		          	<h5>Welcome back Admin</h5>
		          </Row>
		          <Row>
		            <Form>
		            	{!adminLoginType && (
			              <Form.Group className="mb-3" controlId="department">
			              	<Form.Label>What type of credential do you want to issue?</Form.Label>
											<Form.Control as="select" value={adminLoginType} onChange={e => onChangeVcType(e.target.value)}>
											  <option>Choose VC type</option>
											  <option value="employer">Employee VC</option>
											  <option value="hotel">Hotel reservation VC</option>
											</Form.Control>
										</Form.Group>
		            	)}
		              {adminLoginType === "employer" && (<Fragment>
			              <Form.Group className="mb-3" controlId="formFirstName">
			                <Form.Label>Employee First Name</Form.Label>
			                <Form.Control value={form.firstName} type="text" placeholder="First Name" onChange={e => onChangeForm("firstName", e.target.value)}/>
			                <Form.Text className="text-muted">
			                  The employee first name, will be included in the credential data
			                </Form.Text>
			              </Form.Group>
		              
			              <Form.Group className="mb-3" controlId="formLastName">
			                <Form.Label>Employee Last Name</Form.Label>
			                <Form.Control value={form.lastName} type="text" placeholder="Last Name" onChange={e => onChangeForm("lastName", e.target.value)}/>
			                <Form.Text className="text-muted">
			                  The employee last name, will be included in the credential datal
			                </Form.Text>
			              </Form.Group>

			              <Form.Group className="mb-3" controlId="formFirstName">
			                <Form.Label>Employee Email</Form.Label>
			                <Form.Control value={form.email} type="email" placeholder="Email" onChange={e => onChangeForm("email", e.target.value)}/>
			                <Form.Text className="text-muted">
			                  The employee email, will be included in the credential data
			                </Form.Text>
			              </Form.Group>

			              <Form.Group className="mb-3" controlId="formFirstName">
			                <Form.Label>Employee Address</Form.Label>
			                <Form.Control value={form.address} type="string" placeholder="Address" onChange={e => onChangeForm("address", e.target.value)}/>
			                <Form.Text className="text-muted">
			                  The employee address, will be included in the credential data
			                </Form.Text>
			              </Form.Group>

			              <Form.Group className="mb-3" controlId="formFirstName">
			                <Form.Label>Employee Phone number</Form.Label>
			                <Form.Control value={form.phone} type="number" placeholder="Phone number" onChange={e => onChangeForm("phone", e.target.value)}/>
			                <Form.Text className="text-muted">
			                  The employee phone, will be included in the credential data
			                </Form.Text>
			              </Form.Group>

			              <Form.Group className="mb-3" controlId="department">
			              	<Form.Label>Security clearance level</Form.Label>
											<Form.Control as="select" value={form.securityClearanceLevel} onChange={e => onChangeForm("securityClearanceLevel", e.target.value)}>
											  <option>Choose level</option>
											  <option value="A1">A1</option>
											  <option value="B1">B1</option>
											  <option value="B2">B2</option>
											  <option value="B3">B3</option>
											  <option value="C1">C1</option>
											  <option value="C2">C2</option>
											  <option value="C3">C3</option>
											  <option value="C4">C4</option>
											</Form.Control>
										</Form.Group>
		                <Form.Text className="text-muted">
		                  The employee company department
		                </Form.Text>
		                
			              <Form.Group className="mb-3" controlId="department">
			              	<Form.Label>Employee department</Form.Label>
											<Form.Control as="select" value={form.department} onChange={e => onChangeForm("department", e.target.value)}>
											  <option>Your employee department</option>
											  <option value="Sales">Sales</option>
											  <option value="HHRR">HHRR</option>
											  <option value="TI">TI</option>
											  <option value="Research">Research</option>
											  <option value="Finances">Finances</option>
											</Form.Control>
										</Form.Group>
		                <Form.Text className="text-muted">
		                  The employee company department
		                </Form.Text>

									</Fragment>)}

									{adminLoginType === "hotel" && (<Fragment>

										{step===1&&(<Fragment>
			              <Form.Group className="mb-3" controlId="formFirstName">
			                <Form.Label>Guest First Name</Form.Label>
			                <Form.Control value={form.firstName} type="text" placeholder="First Name" onChange={e => onChangeForm("firstName", e.target.value)}/>
			                <Form.Text className="text-muted">
			                  The guest first name, will be included in the credential data
			                </Form.Text>
			              </Form.Group>
			              <Form.Group className="mb-3" controlId="formLastName">
			                <Form.Label>Guest Last Name</Form.Label>
			                <Form.Control value={form.lastName} type="text" placeholder="Last Name" onChange={e => onChangeForm("lastName", e.target.value)}/>
			                <Form.Text className="text-muted">
			                  The guest last name, will be included in the credential datal
			                </Form.Text>
			              </Form.Group>
			              <Form.Group className="mb-3" controlId="formFirstName">
			                <Form.Label>Guest Email</Form.Label>
			                <Form.Control value={form.email} type="email" placeholder="Email" onChange={e => onChangeForm("email", e.target.value)}/>
			                <Form.Text className="text-muted">
			                  The guest email, will be included in the credential data
			                </Form.Text>
			              </Form.Group>
			              <Form.Group className="mb-3" controlId="formFirstName">
			                <Form.Label>Guest Address</Form.Label>
			                <Form.Control value={form.address} type="string" placeholder="Address" onChange={e => onChangeForm("address", e.target.value)}/>
			                <Form.Text className="text-muted">
			                  The guest address, will be included in the credential data
			                </Form.Text>
			              </Form.Group>
			              <Form.Group className="mb-3" controlId="formFirstName">
			                <Form.Label>Guest Phone number</Form.Label>
			                <Form.Control value={form.phone} type="number" placeholder="Phone number" onChange={e => onChangeForm("phone", e.target.value)}/>
			                <Form.Text className="text-muted">
			                  The guest phone, will be included in the credential data
			                </Form.Text>
			              </Form.Group>
			              <Form.Group className="mb-3" controlId="formFirstName">
			                <Form.Label>Check-in date</Form.Label>
			                <Form.Control value={form.checkIn} type="date" placeholder="Check-in" onChange={e => onChangeForm("checkIn", e.target.value)}/>
			                <Form.Text className="text-muted">
			                  The guest Check-in date
			                </Form.Text>
			              </Form.Group>
			              <Form.Group className="mb-3" controlId="formFirstName">
			                <Form.Label>Check-out date</Form.Label>
			                <Form.Control value={form.checkOut} type="date" placeholder="Check-out" onChange={e => onChangeForm("checkOut", e.target.value)}/>
			                <Form.Text className="text-muted">
			                  The guest Check-out date
			                </Form.Text>
			              </Form.Group>
			              <Form.Group className="mb-3" controlId="department">
			              	<Form.Label>Room type</Form.Label>
											<Form.Control as="select" value={form.roomType} onChange={e => onChangeForm("roomType", e.target.value)}>
											  <option>Select room type</option>
											  <option value="Single">Single</option>
											  <option value="Double">Double</option>
											  <option value="Luxury Suit">Luxury Suit</option>
											  <option value="Presidential Suite">Presidential Suite</option>
											</Form.Control>
			                <Form.Text className="text-muted">
			                  The guest suit type
			                </Form.Text>
										</Form.Group>
										</Fragment>)}

			              {step===2&&(<Form.Group className="mb-3" controlId="department">
			              	<Form.Label>Suit number</Form.Label>
											<Form.Control as="select" value={form.roomNumber} onChange={e => onChangeForm("roomNumber", e.target.value)}>
											  <option>Select suit number</option>
											  <option value="301">301</option>
											  <option value="302">302</option>
											  <option value="303">303</option>
											  <option value="304">304</option>
											  <option value="401">401</option>
											  <option value="402">402</option>
											  <option value="403">403</option>
											  <option value="404">404</option>
											</Form.Control>
			                <Form.Text className="text-muted">
			                  The guest suit number
			                </Form.Text>
										</Form.Group>)}

									</Fragment>)}

		              { error && <Alert key="danger" variant="danger">{error}</Alert>}

									{adminLoginType==="hotel"&&(step===1)&&(<Row style={{marginTop: '10px', flexDirection: 'row'}}>
			              <Button style={{maxWidth: '250px'}} variant="primary" onClick={handleGoToStep2}>
			                Next
			              </Button>
		              </Row>)}

									{adminLoginType==="hotel"&&(step===2)&&(<Row style={{marginTop: '10px', flexDirection: 'row'}}>
			              <Button style={{maxWidth: '250px'}} variant="secondary" onClick={() => setStep(1)}>
			                Back
			              </Button>
		              </Row>)}

									{adminLoginType&&(step===2)&&(<Row style={{marginTop: '10px', flexDirection: 'row'}}>
			              <Button style={{maxWidth: '250px'}} variant="primary" onClick={handleIssueVc}>
			                Issue Verifiable Credential
			              </Button>
			              <div className="spinnerBox">
			              {loading&&<Spinner animation="border" role="status"></Spinner>}
			              </div>
		              </Row>)}
		            </Form>
		          </Row>
          		{/* form */}
          	</Col>
 						<Col className="center-content">
	 						{ done && (<Fragment>
					    <Alert key="success" variant="success">
					      Done, the holder has completed the process.
					    </Alert>
					    </Fragment>)}		
	 						{ vc && (<Fragment>
					    <Alert key="primary" variant="primary">
					      Now, please allow the credential holder to read this QR to link the verified credential to its SSI agent.
					    </Alert> 							
	 						</Fragment>)}
	 						{ vc && <QRCode value={vc} /> }
          	</Col>
          </Row>
      </div>
	)
}

export default withRouter(Authority);