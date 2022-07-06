const { UniResolver } = require("@sphereon/did-uni-client");
const documentLoaderNode = require('@digitalcredentials/jsonld/lib/documentLoaders/node');
const base58 = require("bs58");
const { EthrDID } = require("ethr-did");
const vc = require('@digitalcredentials/vc');
const { Ed25519VerificationKey2020 } = require("@digitalcredentials/ed25519-verification-key-2020");
const { Ed25519Signature2020 } = require("@digitalcredentials/ed25519-signature-2020");

const { frame } = require("@digitalcredentials/jsonld");
const jsonld = require("@digitalcredentials/jsonld");
const crypto = require('crypto');
const base58btc = require('@digitalcredentials/base58-universal');

const { KEYS } = require('./keys')

const getSuite = async (issuer) => {
  const keyPair = await Ed25519VerificationKey2020.from({
    type: KEYS.verificationType,
    controller: issuer,
    id: issuer + "#controllerKey",
    publicKeyMultibase: KEYS.publicKey,
    privateKeyMultibase: KEYS.privateKey
  });
  const suite = new Ed25519Signature2020({ key: keyPair });

  suite.signer = {
    async sign({data}) {

      function _interopNamespace(e) {
        if (e && e.__esModule) return e;
        var n = Object.create(null);
        if (e) {
          Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
              var d = Object.getOwnPropertyDescriptor(e, k);
              Object.defineProperty(n, k, d.get ? d : {
                enumerable: true,
                get: function () { return e[k]; }
              });
            }
          });
        }
        n["default"] = e;
        return Object.freeze(n);
      }

      function privateKeyDerEncode({privateKeyBytes, seedBytes}) {
        const p = privateKeyBytes.slice(0, 32);
        const DER_PRIVATE_KEY_PREFIX = Buffer.from(KEYS.privateKeyPrefix, 'hex');

          return Buffer.concat([DER_PRIVATE_KEY_PREFIX, p]);
      }

      const base58btc__namespace = _interopNamespace(base58btc);
      const privateKeyMulticodec = base58btc__namespace.decode(keyPair.privateKeyMultibase.substr(1));
      const MULTICODEC_ED25519_PRIV_HEADER = new Uint8Array([0x80, 0x26]);
      const privateKeyBytes = privateKeyMulticodec.slice(MULTICODEC_ED25519_PRIV_HEADER.length);

      const privateKey = await crypto.createPrivateKey({
        key: privateKeyDerEncode({privateKeyBytes}),
        format: 'der',
        type: 'pkcs8'
      });

      return crypto.sign(null, data, privateKey);;
    },
    id: keyPair.id
  };
  suite.date = "2010-01-01T19:23:24Z";
  return suite;
}

const createDID = async () => {
  const network = "ropsten";
  const keypair = EthrDID.createKeyPair();
  const ethrDid = new EthrDID({ ...keypair, chainNameOrId: network });
  const uniResolver = new UniResolver();
  const resolutionResult = await uniResolver.resolve(ethrDid.did);
  const didDocument = JSON.stringify(resolutionResult.didDocument);
  const privateKey = base58.encode(
    Buffer.from(keypair.privateKey.replace("0x", ""), "hex")
  );
  const publicKey = base58.encode(
    Buffer.from(keypair.publicKey.replace("0x", ""), "hex")
  );
  const ethrDidObject = {
    did: ethrDid.did,
    didDocument,
    privateKey,
    publicKey,
  };
  return ethrDidObject;
};

const documentLoader = async (url) => {
  if (url.startsWith('did:')) {
    const didResolver = new UniResolver();
    const result = await didResolver.resolve(url);
    if (result.didResolutionMetadata.error || !result.didDocument) {
      console.error(`Unable to resolve DID: ${url}`)
    }
    const framed = await frame(KEYS.loaderJsonld, {
      '@context': result.didDocument["@context"],
      '@embed': '@never',
      id: url,
    })

    framed.id = url;
    framed["assertionMethod"] = {
      '@embed': '@never',
      id: url + '#controllerKey'
    }
    framed["authentication"] = {
      '@embed': '@never',
      id: url + '#controllerKey'
    }

    return {
      contextUrl: null,
      documentUrl: url,
      document: framed,
    }
  }
  let loader = documentLoaderNode.apply(jsonld, [])
  const response = await loader(url)

  return response
}

export const signCredential = async (unsignedCredential) => {
  const suite = await getSuite(unsignedCredential.issuer)
  const signedCredential = await vc.issue({
    credential: unsignedCredential,
    suite,
    documentLoader
  });
  return signedCredential;
};

export const signPresentation = async (arrayOfCredentials, holder) => {
  const verifiableCredential = arrayOfCredentials;
  const suite = await getSuite(holder)
  const id = KEYS.presentationId
  const challenge = KEYS.presentationChallenge
  const presentation = vc.createPresentation({
    verifiableCredential, id, holder
  });
  const vp = await vc.signPresentation({
    presentation, suite, challenge, documentLoader
  });
  return vp;
};

export const verfyCredential = async (signedVC) => {
  const suite = await getSuite(signedVC.issuer);
  const result = await vc.verifyCredential({
    credential: signedVC,
    suite, 
    documentLoader
  });
  return result;
}

export const verifyPresentation = async (signedPresentation) => {
    const suite = await getSuite(signedPresentation.holder);
    const result = await vc.verify({
      presentation: signedPresentation,
      challenge: KEYS.presentationChallenge,
      suite,
      documentLoader
    });
    return result;
  }