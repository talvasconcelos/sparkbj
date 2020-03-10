import { useState, useEffect } from 'preact/hooks'
import { lnpay } from '../lib/lnpay'

export const Modal = ({open, qr, close, top = false}) => {
    
    const [status, setStatus] = useState(false)
    const [check, doCheck] = useState(0)

    const poll = setTimeout(() => doCheck(check + 1), 1000)

    const closeModal = () => {
        clearTimeout(poll)
        return close()
    }
    
    useEffect(async () => {
        const lntx = await lnpay.invoiceStatus(open.id)
        if(!lntx.settled){
            console.log('Not settled!', check)
            return poll
        } 
        if(lntx.settled) {
            // console.log('Settled!')
            return setStatus(true)
        }
        return () => (clearTimeout(poll))
    }, [check])

    return (
        <div class={`modal ${open ? 'open' : null} ${status ? 'settled' : null}`} data-modal="payment-modal">
            <article class="content-wrapper">
                <button onClick={closeModal} class="close"></button>
                <header class="modal-header">
                    <h2>Add funds!</h2>
                </header>
                <div class="content">
                    {!status && 
                    <>
                        <p>Scan to pay 1000 satoshis</p>
                        <br/>
                        <img src={qr} class="img-responsive" alt={open}/>
                        <br/>
                        <p>Your wallet is empty or your balance is less than the minimum bet! Please refill it.</p>
                    </>}
                    {status && 
                    <>
                        <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52"><circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/><path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg>
                    </>}
                </div>
            </article>
        </div>
    )
}