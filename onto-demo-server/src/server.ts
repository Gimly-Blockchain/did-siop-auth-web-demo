import * as dotenv from "dotenv-flow"
import express from "express"
import {CookieOptions, Response} from "express/ts4.0"
import cookieParser from "cookie-parser"
import {AuthRequestMapping, QRVariables} from "onto-demo-shared-types/dist"
import ExpiryMap from "expiry-map"
import shortUUID from "short-uuid"
import {AuthResponse} from "onto-demo-shared-types";
//import {RPAuthService} from "@gimly/did-auth-siop/dist/RPAuthService"


dotenv.config()
const app = express()
const port = process.env.PORT || 5000
const secret = process.env.COOKIE_SIGNING_KEY
const authRequestMap = new ExpiryMap(parseInt(process.env.AUTH_REQUEST_EXPIRES_AFTER_SEC) * 1000)
const bodyParser = require("body-parser")
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(cookieParser(secret))
app.listen(port, () => console.log(`Listening on port ${port}`))


app.get("/authenticate", (request, response) => {
  const options: CookieOptions = {
    signed: true,
    httpOnly: true
  }
//  const rpAuthService: RPAuthService = new RPAuthService(null)
  const sessionId: string = shortUUID.generate()
  response.cookie("sessionId", sessionId, options).send({authenticated: true})
})

app.get("/get-qr-variables", (request, response) => {
  const qrVariables = new QRVariables()
  qrVariables.requestorDID = "did:1234"
  qrVariables.redirectUrl = "https://sphereon.com"
  response.send(qrVariables)
})

app.post("/register-auth-request", (request, response) => {
  const authRequestMapping: AuthRequestMapping = request.body
  authRequestMapping.sessionId = request.signedCookies.sessionId

  authRequestMap.set(authRequestMapping.nonce, authRequestMapping)
  console.log("Received AuthRequestMapping", authRequestMapping)
  response.statusCode = 200
  response.send()
})


app.post("/poll-auth-response", (request, response) => {
  const nonce: string = request.body.nonce as string
  const authRequestMapping: AuthRequestMapping = authRequestMap.get(nonce)
  if(authRequestMapping === null) {
    sendErrorResponse(response, 500, "No authentication request mapping could be found for the given nonce.")
    return
  }
  const sessionId: string = request.signedCookies.sessionId
  if (authRequestMapping === null || authRequestMapping.sessionId != sessionId) {
    sendErrorResponse(response, 403, "Browser session violation!" )
    return
  }

  if ("true" == process.env.MOCK_AUTH_RESPONSE && "development" == process.env.NODE_ENV) {
    mockResponse(authRequestMapping, response)
  } else {
    // TODO RPAuthService integration
    response.statusCode = 202
    response.send()
  }
})


function mockResponse(authRequestMapping: AuthRequestMapping, response: Response) {
  if(authRequestMapping.pollCount == undefined) authRequestMapping.pollCount = 0

  if (authRequestMapping.pollCount > 2) {
    console.log("Poll mockup sending AuthResponse")
    const authResponse: AuthResponse = new AuthResponse()
    authResponse.authRequestMapping = authRequestMapping
    authResponse.userDID = "did:test-user"
    authResponse.userName = "Mr. Test"
    response.statusCode = 200
    response.send(authResponse)
  } else {
    console.log("Poll mockup delaying poll response")
    timeout(3000).then(() => {
      authRequestMapping.pollCount++
      console.log("Poll mockup sending 202 response, pollCount=", authRequestMapping.pollCount)
      response.statusCode = 202
      response.send()
    })
  }
}


function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.post("/cancel-auth-request", (request, response) => {
  const nonce: string = request.body as string
  // TODO
})


function sendErrorResponse(response: Response, statusCode: number, message: string) {
  response.statusCode = statusCode
  response.statusMessage = message
  response.send()
}
