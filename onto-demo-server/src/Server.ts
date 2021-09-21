import * as dotenv from "dotenv-flow"
import express from "express"
import {CookieOptions, Response} from "express/ts4.0"
import cookieParser from "cookie-parser"
import {QRVariables, StateMapping} from "onto-demo-shared-types/dist"
import ExpiryMap from "expiry-map"
import shortUUID from "short-uuid"
import {AuthResponse} from "onto-demo-shared-types";
import * as core from "express-serve-static-core";
import {PassBy} from "@sphereon/did-auth-siop/dist/main/types/SIOP.types";
import {RP} from "@sphereon/did-auth-siop/dist/main/RP";


const EXAMPLE_REFERENCE_URL = "https://rp.acme.com/siop/jwts"; // FIXME to env
const HEX_KEY = "f857544a9d1097e242ff0b287a7e6e90f19cf973efe2317f2a4678739664420f";
const DID = "did:ethr:0x0106a2e985b1E1De9B5ddb4aF6dC9e928F4e99D0";
const KID = "did:ethr:0x0106a2e985b1E1De9B5ddb4aF6dC9e928F4e99D0#keys-1";

class Server {

  public express: core.Express;
  private stateMap: ExpiryMap<string, StateMapping>;

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
        // TODO RPAuthService integration
        response.statusCode = 202
        response.send({authRequestCreated: stateMapping.authRequestCreated})
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
        const rp = this.buildRP();
        rp.createAuthenticationRequest({nonce: shortUUID.generate(), state: stateId})
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
          // TODO

        }
    )
  }

  private buildRP() {
    const rp = RP.builder()
        .redirect(process.env.REDIRECT_URL_BASE + "/siop-sessions")
        .requestRef(PassBy.REFERENCE, EXAMPLE_REFERENCE_URL)
        .internalSignature(HEX_KEY, DID, KID)
        .registrationRef(PassBy.VALUE)
        .addDidMethod('ethr')
        .build()
    /*
            const rp = RP.builder()
            .addDidMethod("eosio")
            .addResolver('eosio', new Resolver(getUniResolver('eosio')))
            .redirect(process.env.REDIRECT_URL + "/siop-sessions")
            .requestRef(PassBy.VALUE)
            .response(ResponseMode.POST)
            .registrationRef(PassBy.REFERENCE, 'https://registration.here')
            .internalSignature('e4924411769ab9435ee540d2723555d962b07c974af4f3e90f713c9eec54e2ed70e45143aedb',
                'did:eosio:eos:testnet:jungle:spostma33333', 'did:eosio:eos:testnet:jungle:spostma33333#owner-0')
            .build()
    */
    return rp;
  }

  private mockResponse(stateMapping: StateMapping, response: Response) {
    if (stateMapping.pollCount == undefined) stateMapping.pollCount = 0

    if (stateMapping.pollCount > 2) {
      console.log("Poll mockup sending AuthResponse")
      const authResponse: AuthResponse = new AuthResponse()
      authResponse.stateMapping = stateMapping
      authResponse.userDID = "did:test-user"
      authResponse.userName = "Mr. Test"
      response.statusCode = 200
      response.send(authResponse)
    } else {
      console.log("Poll mockup delaying poll response")
      this.timeout(3000).then(() => {
        stateMapping.pollCount++
        console.log("Poll mockup sending 202 response, pollCount=", stateMapping.pollCount)
        response.statusCode = 202
        response.send()
      })
    }
  }

  private timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}


export default new Server().express;