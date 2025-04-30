/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import fs from 'fs'
import rsaPemToJwk from 'rsa-pem-to-jwk'

const PUBLIC_KEY = fs.readFileSync("./certs/public.pem")

// sig specifies that the public key is being used to verify the signature

const jwk = rsaPemToJwk(PUBLIC_KEY,{use:'sig'},"public") 

//console.log(JSON.stringify(jwk))

