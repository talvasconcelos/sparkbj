import { useState, useEffect } from 'preact/hooks'

const close = (menuToggle) => {
    document.getElementById("main-menu").style.width = "0"
    document.getElementById("overlay").style.width = "0"
    menuToggle.current.style.display = "block"
}


export const OffCanvasMenu = ({ toggle, wallet, withdraw, topUp }) => {
    const [options, setOptions] = useState(null)
    const updateSettings = async (event) => {
        const target = event.target
		const value = target.type === 'checkbox' ? target.checked : target.value
        const name = target.name
        // const updatedOptions = options
        // updatedOptions[name] = value
        // setOptions({...options, [name]: value})
        // await idb.setConfig({...options, [name]: value})
        
    }

    useEffect(() => {
        return () => {}
    }, [])

    const doWithdraw = () => {
        close(toggle)
        return withdraw()
    }

    const doTopUp = () => {
        close(toggle)
        return topUp()
    }

    return (
        <>
            <div id="overlay" class="overlay"></div>
            <nav id="main-menu" class="main-menu">
                <a class="closebtn" onClick={() => close(toggle)}>
                &times;
                </a>
                <section>
                    <p>Wallet ID: <small>{wallet.id}</small></p>
                    <p>Wallet Key: <small>{wallet.key}</small></p>
                    <p>Balance: <small>{wallet.balance}</small></p>
                    <br/>
                    <p><small>Top up is limited to 1000 sats</small></p>
                    <p><small>To keep the game simple, the initial bet is always 50 sats</small></p>
                    <p><small>Blackjack pays 2-to-1</small></p>
                    <p><small>Dealer stands on any 17 (S17)</small></p>
                </section>
                <section>
                    <button class="btn" onClick={doTopUp}>Top up</button>
                    {wallet.balance && <button class="btn" onClick={doWithdraw}>Withdraw</button>}
                </section>
                <footer class='menu-footer'>                
                    <a href='https://lnpay.co/'>Powered by ⚡ lnpay.co</a>
                </footer>
            </nav>
        </>
    )
};
  