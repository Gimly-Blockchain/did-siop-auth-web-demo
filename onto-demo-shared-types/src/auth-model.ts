// noinspection JSUnusedGlobalSymbols
export class QRVariables {
  redirectUrl?: string
  requestorDID?: string
}

export class StateMapping {
  redirectUrl?: string
  stateId?: string
  requestorDID?: string
  sessionId?:string
  pollCount?: number
  authRequestCreated: boolean = false
  authResponse? :AuthResponse
}


export class AuthResponse {
  constructor(userDID: string, userName: string) {
    this.userDID = userDID;
    this.userName = userName;
  }
  userDID: string
  userName: string
  token?: string
}
