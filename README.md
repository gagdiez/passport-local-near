# Passport-Local-Near

<img alt="version" src="https://img.shields.io/npm/v/passport-local-near" style="max-width:100%;"> <img alt="install size" src="https://packagephobia.now.sh/badge?p=passport-local-near" style="max-width:100%;"> <img alt="license" src="https://img.shields.io/github/license/gagdiez/passport-local-near"> <img alt="downloads" src="https://img.shields.io/github/downloads/gagdiez/passport-local-near/total" style="max-width:100%;">

A plugin for [passport](https://github.com/jaredhanson/passport) that allows users to authenticate in your [express](https://github.com/expressjs/express) app using their [NEAR wallet](wallet.near.org).

## How does it work?

passport-local-near asks the NEAR user to provide a **signed message** plus **their public key**, and checks that:

1. The message can be decrypted using the public key, and therefore, it was signed with its private-key counterpart
1. The public key effectively belongs to the user

Because of this, in order to use passport-local-near, you will need to include code both on your server and client side.

## Installation

Install the passport-local-near package using npm

```bash
npm install passport-local-near
```

## Setting up the Server side

To use passport-local-near you simply need to include it, and use its functions (authenticate, seralizeUser, and deserializeUser) in passport.

```javascript
// import all the needed packages
const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passport_local_near = require('passport-local-near')

// Initialize your app
var app = express();

// Setup passport
app.use(session({secret: 'keyboard cat', resave: false,
                 saveUninitialized: false}))
app.use(passport.initialize())
app.use(passport.session());

// Configure passport to use the passport_local_near functions
passport.use(new LocalStrategy(passport_local_near.authenticate))
passport.serializeUser(passport_local_near.serializeUser())
passport.deserializeUser(passport_local_near.deserializeUser())

// Set if your NEAR app (smartcontract) is in 'mainnet' or 'testnet'
passport_local_near.set_network('testnet')
```

## Setting up the Client side

After the user authorized your smartcontract usint the NEAR wallet, this is, window.walletAccount.getAccountId() is setted, call the following function:

```javascript
async function logged_in(){
  const accountId = window.walletAccount.getAccountId()
  const networkId = "testnet" // or "mainnet"
  
  // ask the user to sign a message with its private key
  const signed = await near.connection.signer.signMessage(
    accountId, accountId, networkId
  )

  // send the signed message to express to validate it
  fetch("/user/login",
        {method: "POST",
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({username: accountId,
                               password: JSON.stringify(signed)})
        }).then(res => res.json())
          .then(res => callback(res))
}

function callback(response){                                                                                                                                                              
  if(response['success']){                                                                                                                                                                
    console.log('server-side login with NEAR succeded')                                                                                                                                     
  }else{                                                                                                                                                                                  
    console.log('server-side login with NEAR failed')                                                                                                                                                      
  }                                                                                                                                                                                       
}                                                                                                                                                                                         
```
where `window.walletAccount` is an instance of `nearAPI.WalletConnection`.

This function asks the user to sign a message, and sends the signed message + user's public key to the middleware `/user/login`.

## Example

You can find a minimal example using local-passport-near [here](https://github.com/gagdiez/MinimalNodeJS/blob/main/minimal-login-near).
