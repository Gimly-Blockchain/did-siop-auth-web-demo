import * as dotenv from "dotenv-flow"
import express from "express"
import {CookieOptions, Response} from "express/ts4.0"
import cookieParser from "cookie-parser"
import ExpiryMap from "expiry-map"
import shortUUID from "short-uuid"
import * as core from "express-serve-static-core";
import {PassBy, VerifiedAuthenticationResponseWithJWT} from "@sphereon/did-auth-siop/dist/main/types/SIOP.types";
import {RP} from "@sphereon/did-auth-siop/dist/main/RP";
import {AuthResponse, QRVariables, StateMapping} from "@sphereon/onto-demo-shared-types";


class Server {

  public express: core.Express;
  private stateMap: ExpiryMap<string, StateMapping>;
  private rp: RP;

  constructor() {
    dotenv.config()

    this.express = express()
    const port = process.env.PORT || 5000
    const secret = process.env.COOKIE_SIGNING_KEY
    this.stateMap = new ExpiryMap(parseInt(process.env.AUTH_REQUEST_EXPIRES_AFTER_SEC) * 1000)
    const bodyParser = require("body-parser")
    this.express.use(bodyParser.urlencoded({extended: true}))
    this.express.use(bodyParser.json())
    this.express.use(cookieParser(secret))
    this.express.listen(port as number, "0.0.0.0", () => console.log(`Listening on port ${port}`))

    this.buildRP();
    this.registerWebAppEndpoints()
    this.registerSIOPEndpoint()
  }

  private static sendErrorResponse(response: Response, statusCode: number, message: string) {
    response.status(statusCode).send(message)
  }

  private registerWebAppEndpoints() {
    this.express.get("/backend/get-qr-variables", (request, response) => {
      const qrVariables = new QRVariables()
      qrVariables.requestorDID = process.env.REQUESTOR_DID
      qrVariables.redirectUrl = process.env.REDIRECT_URL_BASE + "/get-auth-request-url"
      response.send(qrVariables)
    })

    this.express.post("/backend/register-state", (request, response) => {
      const stateMapping: StateMapping = request.body
      let sessionId: string = request.signedCookies.sessionId;
      if (!sessionId) {
        sessionId = shortUUID.generate()
        const options: CookieOptions = {
          signed: true,
          httpOnly: true
        }
        response.cookie("sessionId", sessionId, options).send({authenticated: true})
      }
      stateMapping.sessionId = sessionId
      this.stateMap.set(stateMapping.stateId, stateMapping)
      console.log("Received AuthRequestMapping", stateMapping)
      response.statusCode = 200
      response.send()
    })


    this.express.post("/backend/poll-auth-response", (request, response) => {
      const stateId: string = request.body.stateId as string
      const stateMapping: StateMapping = this.stateMap.get(stateId)
      if (stateMapping === null) {
        Server.sendErrorResponse(response, 500, "No authentication request mapping could be found for the given stateId.")
        return
      }
      const sessionId: string = request.signedCookies.sessionId
      if (!stateMapping.sessionId || stateMapping.sessionId !== sessionId) {
        Server.sendErrorResponse(response, 403, "Browser session violation!")
        return
      }

      if ("true" == process.env.MOCK_AUTH_RESPONSE && "development" == process.env.NODE_ENV) {
        this.mockResponse(stateMapping, response)
      } else {
        if (stateMapping.authResponse == null) {
          response.statusCode = 202
          response.send({authRequestCreated: stateMapping.authRequestCreated})
        } else {
          response.statusCode = 200
          response.send(stateMapping.authResponse)
        }
      }
    })

    this.express.post("/backend/cancel-auth-request", (request, response) => {
          const stateId: string = request.body as string
          // TODO
        }
    )
  }

  private registerSIOPEndpoint() {
    this.express.get("/ext/get-auth-request-url", (request, response) => {
      const stateId = request.query["stateId"] as string
      const stateMapping: StateMapping = this.stateMap.get(stateId);
      if (stateMapping) {
        let nonce = shortUUID.generate();
        console.log(`Nonce: ${nonce}`)

        this.rp.createAuthenticationRequest({nonce, state: stateId})
            .then(requestURI => {
              response.statusCode = 200
              response.send(requestURI.encodedUri)
              stateMapping.authRequestCreated = true
            }).catch((e: Error) => {
          console.error(e, e.stack)
          Server.sendErrorResponse(response, 500, "Could not create an authentication request URI: " + e.message)
        })
      } else {
        Server.sendErrorResponse(response, 403, "State id unknown")
      }
    })

    this.express.post("/ext/siop-sessions", (request, response) => {
          const authResponse = request.body;
          const redirectURL = process.env.REDIRECT_URL_BASE + "/siop-sessions";
          this.rp.verifyAuthenticationResponseJwt(authResponse.id_token, {audience: redirectURL})
              .then((verifiedResponse: VerifiedAuthenticationResponseWithJWT) => {
                console.log("verifiedResponse: ", verifiedResponse)

                const stateMapping: StateMapping = this.stateMap.get(verifiedResponse.payload.state)
                if (stateMapping === null) {
                  Server.sendErrorResponse(response, 500, "No request mapping could be found for the given stateId.")
                  return
                }
                stateMapping.authResponse = {
                  token: verifiedResponse.jwt,
                  userDID: verifiedResponse.payload.did,
                  userName: "Bob OP (hardcoded)"
                }
                response.statusCode = 200
                response.send()
              })
              .catch(reason => {
                console.error("verifyAuthenticationResponseJwt failed:", reason)
              })
        }
    )
  }

  private buildRP() {
    this.rp = RP.builder()
        .redirect(process.env.REDIRECT_URL_BASE + "/siop-sessions",)
        .requestBy(PassBy.VALUE)
        .internalSignature(process.env.RP_PRIVATE_HEX_KEY, process.env.RP_DID, process.env.RP_DID + "#controller")
        .addDidMethod("ethr")
        .registrationBy(PassBy.VALUE)
        .build();
  }

  private timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private mockResponse(stateMapping: StateMapping, response: Response) {
    if (stateMapping.pollCount == undefined) stateMapping.pollCount = 0

    if (stateMapping.pollCount > 2) {
      console.log("Poll mockup sending AuthResponse")
      const authResponse: AuthResponse = new AuthResponse("did:test-user", "Mr. Test")
      response.statusCode = 200
      response.send(authResponse)
    } else {
      console.log("Poll mockup delaying poll response")
      this.timeout(2000).then(() => {
        stateMapping.pollCount++
        console.log("Poll mockup sending 202 response, pollCount=", stateMapping.pollCount)
        response.statusCode = 202
        response.send()
      })
    }
  }
}

export default new Server().express;