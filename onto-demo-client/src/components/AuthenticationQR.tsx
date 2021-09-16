import React, {Component} from "react"
import GimlyIDQRCode, {QRContent, QRMode, QRType} from "gimlyid-qr-code"
import axios from "axios"
import Loader from "react-loader-spinner"
import {AuthRequestMapping, AuthRequestResponse, QRVariables} from "onto-demo-shared-types/dist"

export type AuthenticationQRProps = {
  onSignInComplete: (authRequestResponse: AuthRequestResponse) => void
}

export interface AuthenticationQRState {
  qrVariables?: QRVariables
  qrCode?: Element
}

export default class AuthenticationQR extends Component<AuthenticationQRProps> {
  constructor(props: AuthenticationQRProps) {
    super(props)
  }

  state: AuthenticationQRState = {}

  private authRequestSent: boolean = false
  private refreshTimerHandle?: NodeJS.Timeout;
  private qrExpiryMs: number = 0
  private currentRequestMapping?: AuthRequestMapping
  private timedOutRequestMappings: Set<AuthRequestMapping> = new Set<AuthRequestMapping>()


  componentDidMount() {
    this.qrExpiryMs = parseInt(process.env.REACT_APP_QR_CODE_EXPIRES_AFTER_SEC) * 1000
    this.getQRVariables().then(qrVariables =>
        this.setState({qrVariables: qrVariables, qrCode: this.generateGimlyIDQRCode(qrVariables)}))
    this.refreshTimerHandle = setTimeout(() => this.refreshQR(), this.qrExpiryMs)
  }

  componentWillUnmount() {
    if (this.refreshTimerHandle) {
      clearTimeout(this.refreshTimerHandle)
    }
  }

  render() {
    return this.state.qrCode ? this.state.qrCode : <Loader type="ThreeDots" color="#FEFF8AFF" height="100" width="100"/>
  }

  private generateGimlyIDQRCode(qrVariables: QRVariables) {
    return <GimlyIDQRCode
        type={QRType.AUTHENTICATION}
        mode={QRMode.DID_AUTH_SIOP_V2}
        did={qrVariables?.requestorDID}
        redirectUrl={qrVariables?.redirectUrl}
        onGenerate={(qrContent: QRContent) => this.registerAuthenticationRequest(qrContent)}
    />
  }

  private getQRVariables = async () => {
    const response = await axios.get("/get-qr-variables")
    const body = await response.data

    if (response.status !== 200) {
      throw Error(body.message)
    }
    return body
  }

  private refreshQR = () => {
    console.log("Timeout expired, refreshing QR code...")
    if (this.currentRequestMapping) {
      this.timedOutRequestMappings.add(this.currentRequestMapping)
    }
    this.setState({qrCode: this.generateGimlyIDQRCode(this.state.qrVariables as QRVariables)})
    this.refreshTimerHandle = setTimeout(() => this.refreshQR(), this.qrExpiryMs)
  }

  private registerAuthenticationRequest = (qrContent: QRContent) => {
    if (this.authRequestSent) return
    this.authRequestSent = true // FIXME gives a warning

    const authRequestMapping: AuthRequestMapping = new AuthRequestMapping()
    authRequestMapping.requestorDID = qrContent.did
    authRequestMapping.redirectUrl = qrContent.redirectUrl
    authRequestMapping.nonce = qrContent.nonce
    axios.post("/register-auth-request", authRequestMapping)
    .then(response => {
      console.log("register-auth-request response status", response.status)
      if (response.status !== 200) {
        throw Error(response.data.message)
      }
      this.currentRequestMapping = authRequestMapping
      this.pollForResponse(authRequestMapping)
    })
    .catch(error => console.error("register-auth-request failed", error))
  }

  private pollForResponse = async (authRequestMapping: AuthRequestMapping) => {
    let pollingResponse = await axios.post("/poll-auth-response", {nonce: authRequestMapping.nonce})
    while (pollingResponse.status === 202 && !this.timedOutRequestMappings.has(authRequestMapping)) {
      pollingResponse = await axios.post("/poll-auth-response", {nonce: authRequestMapping.nonce})
    }
    if (this.timedOutRequestMappings.has(authRequestMapping)) {
      console.log("Cancelling timed out auth request.")
      await axios.post("/cancel-auth-request", {nonce: authRequestMapping.nonce})
      this.timedOutRequestMappings.delete(authRequestMapping)
    } else if (pollingResponse.status === 200) {
      this.props.onSignInComplete(pollingResponse.data as AuthRequestResponse)
    } else {
      throw Error(pollingResponse.data.message)
    }
  }
}
