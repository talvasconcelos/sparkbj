// import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { lnpay } from '../lib/lnpay'
import { idb } from '../lib/idb'


const Nowallet = ({create, restore}) => {
    return (
    <>
        <div class="content">
            <p>It seems you don't have a wallet yet, that's fine, let's create one for you! Click the button bellow and we'll get you started.</p>
        </div>
        <footer class="modal-footer">
            <button class="action green" onClick={create}>Create</button>
        </footer>
        <br/>
        <small><a href='#'  onClick={restore}>Restore</a></small>
    </>
)}

const Restorewallet = ({upload, cancel}) => {
    const [wallet, setWallet] = useState({id: null, key: null})

    const handleChange = (e) => {
        const target = e.target
		const value = target.value
        const name = target.name
        
        setWallet({...wallet, [name]: value})
    }

    const getWallet = async () => {
        const balance = await idb.getBalance(wallet.key)
        await idb.setWallet(wallet.id, wallet.key, balance)
        return upload({id: wallet.id, key: wallet.key, balance})
    }

    useEffect(() => {
        return () => {}
    }, [wallet])

    return (
        <>
        <div class="content">
            <p>To restore your wallet, you need the wallet ID and key!</p>
            <label for="id">Wallet ID</label>
            <input type="text" name="id" placeholder="w_Noii2dJ..." value={wallet.id} onChange={handleChange} />
            <label for="key">Wallet Key</label>
            <input type="text" name="key" placeholder="wa_JEa9ZqCRT6o..." value={wallet.key} onChange={handleChange} />
        </div>
        <footer class="modal-footer">
        <button class="action green" onClick={getWallet}>Restore</button>
        <button class="action red" onClick={cancel}>Cancel</button>
        </footer>
        </>
    )
}

const Wallet = ({close, wallet}) => {
    return (
    <>
        <div class="content">
            <p><strong>Wallet ID</strong></p>
            <small>{wallet.id}</small>
            <p><strong>Wallet Key</strong></p>
            <small>{wallet.key}</small>
            <br/>
            <small><strong>Warning! </strong>The wallet and key, are generated and stored on your browser. Backup and secure the Wallet ID and Key, as if you lose them your funds will be lost.</small>
        </div>
        <footer class="modal-footer">
            <button class="action green" onClick={close}>Done</button>
        </footer>
    </>
)}

export const InitModal = ({open, close}) => {

    const [wallet, setWallet] = useState(null)
    const [restore, setRestore] = useState(false)

    const createWallet = async () => {
        const {id, key, balance} = await lnpay.createWallet()
        await idb.setWallet(id, key, balance)
        return setWallet({id, key, balance})
    }

    useEffect(() => {
        return () => {}
    }, [wallet, restore])

    return (
        <div class={`modal ${open ? 'open' : null} ${status ? 'settled' : null}`} data-modal="payment-modal">
            <article class="content-wrapper">
                <header class="modal-header">
                    <h2>Sparkpay Blackjack</h2>
                </header>
                {!wallet && !restore && <Nowallet create={createWallet} restore={() => setRestore(!restore)} />}
                {!wallet && restore && < Restorewallet upload={setWallet} cancel={() => setRestore(!restore)} />}
                {wallet && <Wallet close={close} wallet={wallet} />}
            </article>
        </div>
    )
}