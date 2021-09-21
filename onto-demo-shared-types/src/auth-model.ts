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
}


export class AuthResponse {
  stateMapping: StateMapping
  userDID: string
  userName: string
}
