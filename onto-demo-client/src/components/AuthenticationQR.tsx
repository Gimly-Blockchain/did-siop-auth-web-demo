import React, {Component} from "react"
import GimlyIDQRCode, {QRContent, QRMode, QRType} from "gimlyid-qr-code"
import axios from "axios"
import Loader from "react-loader-spinner"
import {AuthResponse, QRVariables, StateMapping} from "onto-demo-shared-types"

export type AuthenticationQRProps = {
  onAuthRequestCreated: () => void
  onSignInComplete: (AuthResponse: AuthResponse) => void
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

  private registerStateSent: boolean = false
  private refreshTimerHandle?: NodeJS.Timeout;
  private qrExpiryMs: number = 0
  private currentStateMapping?: StateMapping
  private timedOutRequestMappings: Set<StateMapping> = new Set<StateMapping>()


  componentDidMount() {
    this.qrExpiryMs = parseInt(process.env.REACT_APP_QR_CODE_EXPIRES_AFTER_SEC) * 1000
    if (!this.state.qrCode) {
      this.getQRVariables().then(qrVariables => {
        return this.setState({qrVariables: qrVariables, qrCode: this.generateGimlyIDQRCode(qrVariables)});
      })
      this.refreshTimerHandle = setTimeout(() => this.refreshQR(), this.qrExpiryMs)
    }
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
        did={qrVariables?.requestorDID as string}
        redirectUrl={qrVariables?.redirectUrl}
        onGenerate={(qrContent: QRContent) => this.registerState(qrContent)}
    />
  }

  private getQRVariables = async () => {
    const response = await axios.get("/backend/get-qr-variables")
    const body = await response.data

    if (response.status !== 200) {
      throw Error(body.message)
    }
    return body
  }

  private refreshQR = () => {
    console.log("Timeout expired, refreshing QR code...")
    if (this.currentStateMapping) {
      this.timedOutRequestMappings.add(this.currentStateMapping)
    }
    this.setState({qrCode: this.generateGimlyIDQRCode(this.state.qrVariables as QRVariables)})
    this.refreshTimerHandle = setTimeout(() => this.refreshQR(), this.qrExpiryMs)
  }

  private registerState = (qrContent: QRContent) => {
    if (this.registerStateSent) return
    this.registerStateSent = true // FIXME gives a warning

    const stateMapping: StateMapping = new StateMapping()
    stateMapping.requestorDID = qrContent.did
    stateMapping.redirectUrl = qrContent.redirectUrl
    stateMapping.stateId = qrContent.state
    axios.post("/backend/register-state", stateMapping)
        .then(response => {
          console.log("register-state response status", response.status)
          if (response.status !== 200) {
            throw Error(response.data.message)
          }
          this.currentStateMapping = stateMapping
          this.pollForResponse(stateMapping)
        })
        .catch(error => console.error("register-state failed", error))
  }

  private pollForResponse = async (stateMapping: StateMapping) => {
    let pollingResponse = await axios.post("/backend/poll-auth-response", {stateId: stateMapping.stateId})
    while (pollingResponse.status === 202 && !this.timedOutRequestMappings.has(stateMapping)) {
      if (this.state.qrCode && pollingResponse.data && pollingResponse.data.authRequestCreated) {
        this.setState({qrCode: undefined})
        this.props.onAuthRequestCreated()
      }
      pollingResponse = await axios.post("/backend/poll-auth-response", {stateId: stateMapping.stateId})
    }
    if (this.timedOutRequestMappings.has(stateMapping)) {
      console.log("Cancelling timed out auth request.")
      await axios.post("/backend/cancel-auth-request", {stateId: stateMapping.stateId})
      this.timedOutRequestMappings.delete(stateMapping)
    } else if (pollingResponse.status === 200) {
      this.props.onSignInComplete(pollingResponse.data as AuthResponse)
    } else {
      throw Error(pollingResponse.data.message)
    }
  }
}
