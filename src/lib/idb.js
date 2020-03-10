import { Store, set, get } from 'idb-keyval'
import { lnpay } from './lnpay'

const sparkdb = new Store('sparkBJ', 'blackjack')

export const idb = {
    setWallet: async (id, key, balance) => {
        await set('wallet_id', id, sparkdb)
        await set('wallet_key', key, sparkdb)
        await set('wallet_balance', balance, sparkdb)
        return
    },

    getWalletDetails: async () => {
        const isWallet = await get('wallet_id', sparkdb)
        if(!isWallet) {
            return false
        }
        const wallet = {}
        wallet.id = await get('wallet_id', sparkdb)
        wallet.key = await get('wallet_key', sparkdb)
        await idb.getBalance(wallet.key)
        wallet.balance = await get('wallet_balance', sparkdb)
        return wallet
    },

    getBalance: async (key) => {
        const balance = await lnpay.getBalance(key)
        await set('wallet_balance', balance, sparkdb)
        return balance
    },

    getConfig: async () => {
        const isConfig = await get('config_bet', sparkdb)
        if(!isConfig){
            await idb.setConfig()
        }
        const config = {}
        config.bet = await get('config_bet', sparkdb)
        return config
    },

    setConfig: async (opts = {bet: 50}) => {
        await set('config_bet', opts.bet, sparkdb)
        return
    }
}