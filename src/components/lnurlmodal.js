import { useEffect } from 'preact/hooks'

export const LNURLModal = ({open, qr, close, issats, sats}) => {
    
    useEffect(() => {
    }, [])
    
    return (
        <div class={`modal ${open ? 'open' : null}`} data-modal="withdraw-modal">
            <article class="content-wrapper">
                <button onClick={close} class="close"></button>
                <header class="modal-header">
                    <h2>Withdraw</h2>
                </header>
                <div class="content">                    
                    <a href={`lightning:${open}`}><img src={qr} alt={open} class="img-responsive" /></a>
                    <br/>
                    <small>Scan the LNURL QR code, or click the image to open in wallet, to withdraw your balance! These LNURLs are ONE-TIME use.</small>
                </div>
            </article>
        </div>
    )
}