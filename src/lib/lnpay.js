const KEY = process.env.PREACT_APP_LNPAY_KEY

const AUTH = btoa(KEY + ':')
const URL = 'https://lnpay.co/v1'

const generateLabel = () => ({
    user_label: 'sparkbj_' + [...Array(16)].map(_ => (Math.random() * 36 | 0).toString(36)).join ``
})

export const lnpay = {
    createWallet: async () => {
        const response = await fetch(`${URL}/wallet`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${AUTH}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(generateLabel())
        })
        const body = await response.json()
        const wallet = {
            id: body.id,
            balance: body.balance,
            key: body.access_keys["Wallet Admin"][0]
        }
        return wallet
    },

    getBalance: async (key) => {
        const response = await fetch(`${URL}/wallet/${key}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${AUTH}`,
                'Content-Type': 'application/json'
            }
        })
        const body = await response.json()
        return body.balance
    },

    generateInvoice: async (key, value) => {
        const response = await fetch(`${URL}/wallet/${key}/invoice`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${AUTH}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                num_satoshis: value
            })
        })
        const body = await response.json()
        return body
    },

    invoiceStatus: async (invoice_id) => {
        const response = await fetch(`${URL}/lntx/${invoice_id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${AUTH}`,
                'Content-Type': 'application/json'
            }
        })
        const body = await response.json()
        return body
    },

    withdrawLNURL: async (key) => {
        const response = await fetch(`${URL}/wallet/${key}/lnurl/withdraw`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${AUTH}`,
                'Content-Type': 'application/json'
            }
        })
        const body = await response.json()
        return body.lnurl
    },

    walletTransfer: async (key, dest, sats) => {
        const response = await fetch(`${URL}/wallet/${key}/transfer`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${AUTH}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                dest_wallet_id: dest,
                num_satoshis: sats
            })
        })
        const body = await response.json()
        return body
    }
}

