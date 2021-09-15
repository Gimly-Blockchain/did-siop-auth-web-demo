import * as dotenv from "dotenv"
import express from "express"
import {CookieOptions} from "express/ts4.0"
import cookieParser from "cookie-parser"
import {AuthRequestMapping, QRVariables} from "onto-demo-shared-types/dist"
import ExpiryMap from "expiry-map"
//import {RPAuthService} from "@gimly/did-auth-siop/dist/RPAuthService"

const authRequestMap = new ExpiryMap(parseInt(process.env.AUTH_REQUEST_EXPIRES_AFTER_SEC) * 1000)

dotenv.config()
const app = express()
const port = process.env.PORT || 5000
const secret = process.env.COOKIE_SIGNING_KEY
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
  const sessionId: string = generateKey(16)
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
  authRequestMapping.sessionId = request.signedCookies["sessionId"]
  authRequestMap.set(authRequestMapping.nonce, authRequestMapping)
  console.log("Received AuthRequestMapping", authRequestMapping)
})

app.post("/poll-auth-response", (request, response) => {
  const authRequestMapping: AuthRequestMapping = request.body
  // TODO
  response.statusCode = 202
})

app.post("/cancel-auth-request", (request, response) => {
  const authRequestMapping: AuthRequestMapping = request.body
  // TODO
})


const generateKey = (length: Number) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]\\:?><,./-="
  let retVal = ""
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n))
  }
  return retVal
}