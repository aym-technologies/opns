/* eslint-disable no-empty */
/* eslint-disable no-constant-condition */
import { randomBytes } from 'crypto'
import { expect, use } from 'chai'
import {
    bsv,
    MethodCallOptions,
    TransactionResponse,
    toByteString,
    ByteString,
} from 'scrypt-ts'
import { getDummySigner, randomPrivateKey } from '../utils/txHelper'
import chaiAsPromised from 'chai-as-promised'
import { OpNS } from '../../src/contracts/opns'
use(chaiAsPromised)

const [priv, pub, , address] = randomPrivateKey()

let opNS: OpNS
let deployTx: TransactionResponse

describe('Test SmartContract `OpNS`', () => {
    before(async () => {
        await OpNS.compile()
        opNS = new OpNS(toByteString('alpha', true), 18n)
        opNS.bindTxBuilder('mint', OpNS.mintTxBuilder)
        await opNS.connect(getDummySigner([priv]))
        deployTx = await opNS.deploy(1)
        console.log('OrdinalLock contract deployed: ', deployTx.id)
    })

    it('should pass the mint method when providing solution with valid POW.', async () => {
        const char = 0x61n
        let nonce: ByteString
        let counter = 0
        while (true) {
            nonce = toByteString(randomBytes(8).toString('hex'))
            counter++
            try {
                console.log(opNS.validatePOW(char, nonce), nonce)
                break
            } catch (e) {}
        }
        console.log('Generated', counter, 'nonces')
        const { tx: callTx, atInputIndex } = await opNS.methods.mint(
            char,
            toByteString(nonce),
            toByteString(bsv.Script.fromAddress(address).toHex()),
            toByteString(''),
            {
                fromUTXO: opNS.utxo,
                pubKeyOrAddrToSign: [pub],
            } as MethodCallOptions<OpNS>
        )

        // console.log('callTx: ', callTx.toBuffer().toString('hex'))
        const result = callTx.verifyScript(atInputIndex)
        expect(result.success, result.error).to.eq(true)
    })

    it('should reject the mint method when providing solution with invalid POW', async () => {
        const char = 0x61n
        let nonce: ByteString
        let counter = 0
        while (true) {
            nonce = toByteString(randomBytes(8).toString('hex'))
            counter++
            try {
                console.log(opNS.validatePOW(char, nonce), nonce)
            } catch (e) {
                break
            }
        }
        console.log('Generated', counter, 'nonces')
        expect(
            opNS.methods.mint(
                char,
                toByteString(nonce),
                toByteString(bsv.Script.fromAddress(address).toHex()),
                toByteString(''),
                {
                    fromUTXO: opNS.utxo,
                    pubKeyOrAddrToSign: [pub],
                } as MethodCallOptions<OpNS>
            )
        ).to.be.rejectedWith('invalid POW')
    })
})
