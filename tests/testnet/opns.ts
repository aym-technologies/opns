/* eslint-disable no-empty */
/* eslint-disable no-constant-condition */
import { randomBytes } from 'crypto'
import { bsv, ByteString, MethodCallOptions, toByteString } from 'scrypt-ts'
import { OpNS } from '../../src/contracts/opns'
import { randomPrivateKey, getDefaultSigner } from '../utils/txHelper'

async function main() {
    await OpNS.compile()

    const [priv, pub, , address] = randomPrivateKey()

    let opNS = new OpNS(toByteString('alpha1', true), 8n)
    opNS.bindTxBuilder('mint', OpNS.mintTxBuilder)
    const signer = getDefaultSigner(priv)
    await opNS.connect(signer)

    const deployTx = await opNS.deploy(1)
    console.log('OpNS contract deployed: ', deployTx.id)

    const char = 0x61n
    let nonce: ByteString
    let counter = 0
    while (true) {
        nonce = toByteString(randomBytes(4).toString('hex'))
        counter++
        try {
            console.log(opNS.validatePOW(char, nonce))
            break
        } catch (e) {}
    }
    console.log('Generated', counter, 'nonces')
    let call = await opNS.methods.mint(
        char,
        nonce,
        toByteString(bsv.Script.fromAddress(address).toHex()),
        toByteString(''),
        {
            fromUTXO: opNS.utxo,
            pubKeyOrAddrToSign: [pub],
        } as MethodCallOptions<OpNS>
    )

    // console.log('callTx: ', callTx.toBuffer().toString('hex'))
    // const result = callTx.verifyScript(atInputIndex)
    // expect(result.success, result.error).to.eq(true)

    console.log('OpNS contract called: ', call.tx.id)
    opNS = OpNS.fromTx(call.tx, 1)
    opNS.bindTxBuilder('mint', OpNS.mintTxBuilder)
    await opNS.connect(signer)

    counter = 0
    while (true) {
        nonce = toByteString(randomBytes(4).toString('hex'))
        counter++
        try {
            console.log(opNS.validatePOW(char, nonce))
            break
        } catch (e) {}
    }
    console.log('Generated', counter, 'nonces')
    call = await opNS.methods.mint(
        char,
        nonce,
        toByteString(bsv.Script.fromAddress(address).toHex()),
        toByteString(''),
        {
            fromUTXO: opNS.utxo,
            pubKeyOrAddrToSign: [pub],
        } as MethodCallOptions<OpNS>
    )

    console.log('OpNS contract called: ', call.tx.id)
}

describe('Test SmartContract `OpNS` on testnet', () => {
    it('should succeed', async () => {
        await main()
    })
})

// main().catch(console.error).then(() => process.exit())
