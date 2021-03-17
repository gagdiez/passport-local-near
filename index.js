const nacl = require('tweetnacl')
const axios = require('axios')
const borsh = require('borsh')
const js_sha256 = require("js-sha256")

// Object to be exported
let auth = {}
auth.NETWORK = 'development'

// Functions

function getConfig(env){
  switch (env) {
  case 'production':
  case 'mainnet':
    return { nodeUrl: 'https://rpc.mainnet.near.org' }
  case 'development':
  case 'testnet':
    return { nodeUrl: 'https://rpc.testnet.near.org' }
  case 'betanet':
    return { nodeUrl: 'https://rpc.betanet.near.org' }
  case 'local':
    return { nodeUrl: 'http://localhost:3030' }
  case 'test':
  case 'ci':
    return { nodeUrl: 'https://rpc.ci-testnet.near.org' }
  case 'ci-betanet':
    return { nodeUrl: 'https://rpc.ci-betanet.near.org' }
  default:
    throw Error(`Unconfigured environment '${env}'. Can be configured in src/config.js.`)
  }
}

async function validatePublicKeyByAccountId(accountId, pkArray){
  const currentPublicKey = 'ed25519:' + borsh.baseEncode(pkArray)

  const config = getConfig(auth.NETWORK)
  const { data } = await axios({
    method: 'post',
    url: config.nodeUrl,
    headers: {'Content-Type': 'application/json; charset=utf-8'},
    data: `{"jsonrpc":"2.0", "method":"query",
            "params":["access_key/${accountId}", ""], "id":1}`
  })

  if (!data || !data.result || !data.result.keys) return false

  for(const k in data.result.keys){
    if (data.result.keys[k].public_key === currentPublicKey) return true
  }

  return false
}

async function authenticate(username, password, done){
  // Parameters:
  //   username: the NEAR accountId (e.g. test.near)
  //   password: a json.stringify of the object {"signature", "publicKey"},
  //             where "signature" is the signature obtained after signing
  //             the user's username (e.g. test.near), and "publicKey" is
  //             the user's public key

  password = JSON.parse(password)
  let {signature, publicKey} = password

  // We expect the user to sign a message composed by its USERNAME
  let msg = Uint8Array.from(js_sha256.sha256.array(username))
  signature = Uint8Array.from(Object.values(signature))
  publicKey = Uint8Array.from(Object.values(publicKey.data))

  // check that the signature was created using the counterpart private key
  let valid_signature = nacl.sign.detached.verify(msg, signature, publicKey)
    
  // and that the publicKey is from this USERNAME
  let pK_of_account = await validatePublicKeyByAccountId(username, publicKey)

  if(valid_signature && pK_of_account){return done(null, username)}
  
  return done(null, false)
}

auth.authenticate = authenticate
auth.serializeUser = () => {return function(user, done){done(null, user)}}
auth.deserializeUser = () => {return function(id, done){done(null, id)}}
auth.set_network = (network) => {auth.NETWORK = network}

module.exports = auth;
