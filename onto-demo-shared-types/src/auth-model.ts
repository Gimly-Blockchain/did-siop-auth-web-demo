// noinspection JSUnusedGlobalSymbols
export class QRVariables {
  redirectUrl?: string;
  requestorDID?: string;
}

export class AuthRequestMapping {
  redirectUrl?: string;
  nonce?: string;
  requestorDID?: string;
  sessionId?:string;
}


export declare class AuthRequestResponse {
  authRequestMapping: AuthRequestMapping
  userDID: string
  userName: string
}
