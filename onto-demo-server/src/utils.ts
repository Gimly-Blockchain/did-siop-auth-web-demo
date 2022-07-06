import {NewCredentialProps} from './types'

const EMPLOYEE_CREDENTIAL = (did: string, newCredential) => ({
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://gimly-blockchain.github.io/vc-contexts/employee-context.jsonld"
  ],
  "issuer": "did:ethr:ropsten:0x028360fb95417724cb7dd2ff217b15d6f17fc45e0ffc1b3dce6c2b8dd1e704fa98",
  "type": ["VerifiableCredential", "Employee"],
  "id": "Employee",
  "issuanceDate": null,
  "credentialSubject": {
    "id": did,
    "Employee": {
      "firstName": newCredential.firstName,
      "lastName": newCredential.lastName,
      "email": newCredential.email,
      "phone": newCredential.phone,
      "address": newCredential.address,
      "department": newCredential.department,
      "securityClearanceLevel": newCredential.securityClearanceLevel,
    }
  },
})

const HOTEL_GUEST_CREDENTIAL = (did: string, newCredential) => ({
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://gimly-blockchain.github.io/vc-contexts/hotel-guest-context.jsonld"
  ],
  "issuer": "did:ethr:ropsten:0x028360fb95417724cb7dd2ff217b15d6f17fc45e0ffc1b3dce6c2b8dd1e704fa98",
  "type": ["VerifiableCredential", "HotelGuest"],
  "id": "HotelGuest",
  "issuanceDate": null,
  "credentialSubject": {
    "id": did,
    "HotelGuest": {
      "firstName": newCredential.firstName,
      "lastName": newCredential.lastName,
      "email": newCredential.email,
      "phone": newCredential.phone,
      "address": newCredential.address,
      "roomType": newCredential.roomType,
      "roomNumber": newCredential.roomNumber,
      "checkIn": newCredential.checkIn,
      "checkOut": newCredential.checkOut,
    }
  },
})

const CREDENTIALS = {
  'employer': EMPLOYEE_CREDENTIAL,
  'hotel': HOTEL_GUEST_CREDENTIAL
}

export const getVc = (did: string, newCredential: NewCredentialProps) => {
  const dt = new Date() 
  const vc = CREDENTIALS[newCredential.adminLoginType](did, newCredential)
  vc.issuanceDate = dt.toISOString()
  return vc;
};