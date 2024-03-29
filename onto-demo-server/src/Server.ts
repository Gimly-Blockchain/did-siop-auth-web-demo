import * as dotenv from "dotenv-flow"
import express from "express"
import { createClient } from 'redis';
import { Request } from "express";
import {CookieOptions, Response} from "express/ts4.0"
import cookieParser from "cookie-parser"
import ExpiryMap from "expiry-map"
import shortUUID from "short-uuid"
import cors from "cors";
import {AuthResponse, QRVariables, StateMapping} from "@gimly-blockchain/did-auth-siop-web-demo-shared";
import * as core from "express-serve-static-core";
import {PresentationDefinition, Rules} from '@sphereon/pe-models';
import {RP} from "@sphereon/did-auth-siop";
import {parseJWT} from '@sphereon/did-auth-siop/dist/main/functions/DidJWT'

import {
    PassBy,
    PresentationLocation,
    VerifiedAuthenticationResponseWithJWT
} from "@sphereon/did-auth-siop/dist/main/types/SIOP.types";

//let memoryMap = {};

class Server {

  public express: core.Express;
  private rp: RP;

  private redisCli = createClient({
    url: 'REDIS_URL'
  })

  constructor() {
    dotenv.config()
    this.express = express()
    const port = process.env.PORT || 5000
    const secret = process.env.COOKIE_SIGNING_KEY
    const bodyParser = require("body-parser")
    this.express.use(cors<Request>());
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
            qrVariables.requestorDID = process.env.RP_DID
            qrVariables.redirectUrl = process.env.REDIRECT_URL_BASE + "/get-auth-request-url"
            response.send(qrVariables)
        })

        this.express.post("/backend/register-state", async (request, response) => {
            const stateMapping: StateMapping = request.body
            let sessionId: string = request.signedCookies.sessionId;
            if (!sessionId) {
                sessionId = shortUUID.generate()
                const options: CookieOptions = {
                    signed: true,
                    httpOnly: true
                }
                response.cookie("sessionId", sessionId, options).send({
                    authenticated: true,
                    sessionId
               })
            }
            stateMapping.sessionId = sessionId
            //memoryMap[stateMapping.stateId] = stateMapping

            try {
                await this.redisCli.connect()
            } catch (e) {}
            this.redisCli.set(stateMapping.stateId, JSON.stringify(stateMapping))
            this.redisCli.quit()
            response.statusCode = 200
            response.send()
        })


        this.express.post("/backend/poll-auth-response", async (request, response) => {
            const stateId: string = request.body.stateId as string
            //const stateMapping: StateMapping = memoryMap[stateId]
            
            try {
                await this.redisCli.connect()
            } catch (e) {}
            const stateFromCache = await this.redisCli.get(stateId)
            const stateMapping: StateMapping = JSON.parse(stateFromCache)
            this.redisCli.quit()

            if (!stateMapping) {
                return Server.sendErrorResponse(response, 500, "No authentication request mapping could be found for the given stateId.")
            }

            const sessionId: string = request.body.sessionId as string
            if (!stateMapping.sessionId || stateMapping.sessionId !== sessionId) {
                return Server.sendErrorResponse(response, 403, "Browser session violation!")
            }

            if ("true" == process.env.MOCK_AUTH_RESPONSE && "development" == process.env.NODE_ENV) {
                this.mockResponse(stateMapping, response)
            } else {
                if (stateMapping.authResponse == null) {
                    response.statusCode = 202
                     return response.send({authRequestCreated: stateMapping.authRequestCreated})
                } else {
                    response.statusCode = 200
                    return response.send(stateMapping.authResponse)
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
        this.express.get("/ext/get-auth-request-url", async (request, response) => {
            const stateId = request.query["stateId"] as string
            //const stateMapping: StateMapping = memoryMap[stateId]
            
            try {
                await this.redisCli.connect()
            } catch (e) {}
            const stateFromCache = await this.redisCli.get(stateId)
            const stateMapping: StateMapping = JSON.parse(stateFromCache)

            if (stateMapping) {
                let nonce = shortUUID.generate();
                this.rp.createAuthenticationRequest({
                    nonce,
                    state: stateId
                }).then(async (requestURI) => {
                    stateMapping.authRequestCreated = true
                    try {
                        await this.redisCli.connect()
                    } catch (e) {}
                    this.redisCli.set(stateId, JSON.stringify(stateMapping))
                    this.redisCli.quit()

                    response.statusCode = 200
                    return response.send(requestURI.encodedUri)
                }).catch((e: Error) => {
                    console.error(e, e.stack)
                    return Server.sendErrorResponse(response, 500, "Could not create an authentication request URI: " + e.message)
                })
            } else {
                return Server.sendErrorResponse(response, 403, "State id unknown")
            }
        })

        this.express.post("/ext/siop-sessions", async (request, response) => {
                const jwt = request.body.id_token;

                const authResponse = parseJWT(jwt);
                //const stateMapping: StateMapping = memoryMap[authResponse.payload.state]
                
                try {
                    await this.redisCli.connect()
                } catch (e) {}

                const stateFromCache = await this.redisCli.get(authResponse.payload.state)
                const stateMapping: StateMapping = JSON.parse(stateFromCache)

                if (stateMapping === null) {
                    return Server.sendErrorResponse(response, 500, "No request mapping could be found for the given stateId.")
                }

                if (authResponse.payload) {
                    const verifiableCredential = authResponse.payload?.vp_token?.presentation?.verifiableCredential;
                    if(verifiableCredential) {
                        const credentialSubject = verifiableCredential[0].credentialSubject;
                        const youtubeChannelOwner = credentialSubject['YoutubeChannelOwner']
                        if (youtubeChannelOwner) {
                            stateMapping.authResponse = {
                                token: jwt,
                                userDID: authResponse.payload.did,
                                ...youtubeChannelOwner
                            }
                            try {
                                await this.redisCli.connect()
                            } catch (e) {}
                            this.redisCli.set(stateMapping.stateId, JSON.stringify(stateMapping))
                            this.redisCli.quit()
                        }
                        response.statusCode = 200
                    } else {
                        response.statusCode = 500
                        response.statusMessage = 'Missing YoutubeChannelOwner credential subject'
                    }
                    return response.send()
               }

            }
        )
    }

    private buildPresentationDefinition() {
        const presentationDefinitions: PresentationDefinition = {
            id: "9449e2db-791f-407c-b086-c21cc677d2e0",
            purpose: "You can login if you are a Youtube channel owner",
            submission_requirements: [{
                name: "YoutubeChannelOwner",
                rule: Rules.Pick,
                count: 1,
                from: "A"
            }],
            input_descriptors: [{
                id: "YoutubeChannelOwner",
                purpose: "The channel ownership needs to be asserted by Youtube",
                name: "YoutubeChannelOwner",
                group: ["A"],
                schema: [{uri: "https://sphereon-opensource.github.io/vc-contexts/gimly/youtube/youtube-channel-owner.jsonld"}]
            }]
        }
        return presentationDefinitions;
    }

    private buildRP() {
        this.rp = RP.builder()
            .redirect(process.env.REDIRECT_URL_BASE + "/siop-sessions",)
            .requestBy(PassBy.VALUE)
            .internalSignature(process.env.RP_PRIVATE_HEX_KEY, process.env.RP_DID, process.env.RP_DID + "#controller")
            .addDidMethod("ethr")
            .registrationBy(PassBy.VALUE)
            .addPresentationDefinitionClaim({
                location: PresentationLocation.VP_TOKEN,
                definition: this.buildPresentationDefinition()
            })
            .build();
    }

    private timeout(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private mockResponse(stateMapping: StateMapping, response: Response) {
        if (stateMapping.pollCount == undefined) stateMapping.pollCount = 0

        if (stateMapping.pollCount > 2) {
            console.log("Poll mockup sending AuthResponse")
            const authResponse: AuthResponse = new AuthResponse()
            authResponse.userDID = "did:test-user"
            authResponse.firstName = "Mr."
            authResponse.lastName = "Test"
            response.statusCode = 200
            response.send(authResponse)
        } else {
            console.log("Poll mockup delaying poll response")
            this.timeout(2000).then(() => {
                stateMapping.pollCount++
                console.log("Poll mockup sending 202 response, pollCount=", stateMapping.pollCount)
                response.statusCode = 202
                return response.send()
            })
        }
    }
}

export default new Server().express;
