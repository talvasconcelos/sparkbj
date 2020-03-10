import { Component, createRef } from 'preact'
import * as B from '../lib/blackjack'
import { lnpay } from '../lib/lnpay'
import { idb } from '../lib/idb'
import QRCode from 'qrcode'

import { Loader } from './loader'
import { OffCanvasMenu } from './menu'
import { Hand } from './hand'
import { Cogs } from './cogs'
import { Modal } from './modal'
import { LNURLModal } from './lnurlmodal'
import { InitModal } from './initmodal'

const WID = process.env.PREACT_APP_BJ_WALLET_ID
const WKEY = process.env.PREACT_APP_BJ_WALLET_KEY

const { BUST, WIN, LOSE, PUSH, BLACKJACK } = B.results

const DELAY = 750

const BASE_HAND = {
	cards: [],
	result: undefined,
	bets: []
}

const clone = obj => JSON.parse(JSON.stringify(obj))

export default class App extends Component {

	state = {
		isTitleShowing: true,
		settings: {
			deckCount: 6,
			startingBank: 1000,
			shuffleAfterPercent: 0.75,
			minimumBet: 50
		},
		wins: 0,
		losses: 0,
		bank: 0,
		pot: 0,
		shoe: null,
		hands: null,
		activeHandIndex: null,
		isDealing: false,
		isSplit: false,
		canSplit: false,
		canDoubleDown: false,
		loading: true,
		init: false
	}

	toggle = createRef()

	setStateSync = (stateUpdate) => {
		return new Promise(resolve => {
			this.setState(stateUpdate, resolve())
		})
	}

	updateBalance = async () => {
		const balance = await idb.getBalance(this.state.wallet.key)
		this.setState({ wallet: { ...this.state.wallet, balance} })
	}

	resetInvoice = async () => {
		await this.updateBalance()
		this.setState({
			invoice: null,
			invoiceQR: null,
			lnurl: null,
			lnurlqr: null
		}, this.setInitials)
	}

	handleInvoice = async () => {
		const { wallet } = this.state
		//console.log('handleInvoice')
		const invoice = await lnpay.generateInvoice(wallet.key, 1000)
		const qr = await this.generateQR(invoice.payment_request)
		this.setState({ invoice, invoiceQR: qr })
	}

	handleWithdraw = async () => {
		const key = this.state.wallet.key
		const lnurl = await lnpay.withdrawLNURL(key)
		const lnurlqr = await this.generateQR(lnurl)
		this.setState({ lnurl, lnurlqr })
	}

	generateQR = async (address) => {
		try {
			return await QRCode.toDataURL(address, { margin: 0 })
		} catch (err) {
			console.error(err)
		}
	}

	get canSplit() {
		if (this.state.bank < this.state.settings.minimumBet) return false
		if (!this.state.hands.length || !this.state.activeHandIndex) return false
		if (this.state.hands.length > 2) return false
		const cards = this.state.hands[this.state.activeHandIndex].cards
		return cards.length === 2 && cards[0].value === cards[1].value
	}

	get canDoubleDown() {
		if (this.state.bank < this.state.settings.minimumBet) return false
		if (!this.state.hands.length || !this.state.activeHandIndex) return false
		const cards = this.state.hands[this.state.activeHandIndex].cards
		return cards.length === 2
	}

	resetShoe = () => {
		const c = this.state.settings
		let shoe = B.createShoe(c.deckCount)
		shoe = B.shuffle(shoe)
		return shoe
	}

	reshuffleIfNeeded = async () => {
		const c = this.state.settings
		const shoeUsedPercent = 1 - (this.state.shoe.length / (c.deckCount * 52))
		if (shoeUsedPercent >= c.shuffleAfterPercent) {
			await this.setStateSync({ shoe: this.resetShoe() })
		}
	}

	advanceActiveHand = async () => {
		if (this.state.activeHandIndex > 0) {
			await this.setStateSync({ activeHandIndex: this.state.activeHandIndex - 1 })
		}
		if (this.state.activeHandIndex === null) {
			await this.setStateSync({ activeHandIndex: this.state.hands.length - 1 })
		}
	}

	checkForBustsAndBlackjacks = async () => {
		const hands = clone(this.state.hands)
		for (let i = 0; i < hands.length; i++) {
			const hand = hands[i]
			const total = B.score(hand.cards)
			if (total > 21) hand.result = BUST
			if (total === 21 && hand.cards.length === 2) {
				hand.result = BLACKJACK
			}
			if (i > 0 && hands[0].result === BLACKJACK) {
				if (hand.result === BLACKJACK) hand.result = PUSH
				if (!hand.result) hand.result = LOSE
			}
			//console.log(total)
		}
		await this.setStateSync({ hands: hands })
	}

	bet = () => {
		const c = this.state.settings
		if (this.state.bank < c.minimumBet) return
		const bet = c.minimumBet
		this.setState({ bank: this.state.bank - bet, pot: this.state.pot + bet })
		//console.log(bet)
		return bet
	}

	handleAction = (e) => {
		e.preventDefault()
		e.preventDefault()
		const action = e.target.innerText.toLowerCase()
		//console.log(action)
		switch (action) {
			case 'hit':
				this.hit()
				break;
			case 'stand':
				this.stand()
				break;
			case 'split':
				this.split()
				break;
			case 'double':
				this.doubleDown()
				break;
			default:
				break;
		}
	}

	inactive = async () => {
		await this.setState({ inactive: !this.state.inactive })
	}

	hit = async (onlyOnce = false, isDealer = false) => {
		await this.inactive()
		const active = this.state.activeHandIndex
		await this.deal(this.state.activeHandIndex)
		await this.checkForBustsAndBlackjacks()
		const isResult = this.state.hands[active].result ? true : false
		// !isDealer && console.debug('hit result', isResult, isDealer)
		if (isResult || onlyOnce) {
			//!isDealer && console.log('#1', isResult, onlyOnce)
			return setTimeout(() => this.endTurn(), DELAY)
		}
		if (B.score(this.state.hands[active].cards) === 21) {
			//!isDealer && console.log('#2')
			return setTimeout(() => this.endTurn(), DELAY)
		}
		if (isDealer) {
			//console.log('#3')
			return setTimeout(() => this.makeDealerDecision(), DELAY)
		}
		this.setState({inactive: false})
		// return this.setState((prevstate) => {
		// 	return {inactive: !prevstate.inactive}
		// })
		//await this.inactive()
	}

	stand = () => {
		this.endTurn()
	}

    /*
    canSplit (state) {
    if (state.bank < state.settings.minimumBet) return false
    if (!state.hands.length || !state.activeHandIndex) return false
    if (state.hands.length > 2) return false
    const cards = state.hands[state.activeHandIndex].cards
    return cards.length === 2 && cards[0].value === cards[1].value
    },
    canDoubleDown (state) {
        if (state.bank < state.settings.minimumBet) return false
        if (!state.hands.length || !state.activeHandIndex) return false
        const cards = state.hands[state.activeHandIndex].cards
        return cards.length === 2
    },
    */

	split = () => {
		const hands = this.state.hands
		hands[2] = clone(BASE_HAND)
		hands[2].cards.push(hands[1].cards.pop())
		hands[2].bets[0] = this.bet()
		this.setState({ hands, activeHandIndex: null, isSplit: true }, this.startNextTurn)
	}

	doubleDown = () => {
		const idx = this.state.activeHandIndex
		const hands = this.state.hands
		hands[idx].bets = [...hands[idx].bets, this.bet()]
		this.setState({ hands }, () => this.hit(true))
	}

	deal = async (deal) => {
		const hands = this.state.hands
		const shoe = this.state.shoe
		let newCard = shoe.shift()
		// console.debug('Deal Card:', newCard)
		const isFirstDealerCard = deal === 0 && hands[deal].cards.length === 1
		newCard.isFaceDown = isFirstDealerCard
		hands[deal].cards = [...hands[deal].cards, newCard]
		await this.setStateSync({
			hands: hands,
			shoe: shoe
		})
	}

	dealRound = async () => {
		console.debug('dealRound')
		if (!this.state.hands[1].bets[0]) return
		const dealQueue = [1, 0, 1, 0]
		for (const handIndex of dealQueue) {
			try {
				await this.deal(handIndex)
			} catch (err) {
				console.error(err)
			}
		}
		setTimeout(() => this.startRound(), 300)
	}

	startNewGame = () => {
		const hands = this.state.hands
		hands[1].bets = [...hands[1].bets, this.bet()]

		this.setState({ hands: hands, inactive: true }, this.dealRound)
	}

	revealDealerHand = async () => {
		const hands = this.state.hands
		hands[0].cards[1].isFaceDown = false
		await this.setStateSync({ hands })
	}

	dealerTotal = () => {
		if (!this.state.hands.length) return
		return B.score(this.state.hands[0].cards)
	}

	makeDealerDecision = () => {
		const remainingHands = this.state.hands.find((hand, i) => !hand.result && i > 0)
		const dealerTotal = this.dealerTotal()
		//console.log('dealer decision', dealerTotal)
		if (dealerTotal < 17 && remainingHands) {
			this.hit(false, true)
		} else {
			this.stand()
		}
	}

	startRound = async () => {
		console.log('Start Round')
		this.setState({ inactive: false })
		await this.checkForBustsAndBlackjacks()
		if (this.state.hands.find(hand => hand.result)) {
			await this.revealDealerHand()
			setTimeout(() => this.endRound(), DELAY)
		} else {
			setTimeout(() => this.startNextTurn(), DELAY)
		}
	}

	endRound = () => {
		console.debug('endRound')
		this.setState({ activeHandIndex: null }, this.compareHands)
	}


	compareHands = () => {
		const hands = this.state.hands
		for (let i = 1; i < hands.length; i++) {
			const hand = hands[i]
			const total = B.score(hand.cards)
			const dealerTotal = B.score(hands[0].cards)
			if (dealerTotal === total) hand.result = PUSH
			if (dealerTotal > 21 && !hand.result) hand.result = WIN
			if (total > dealerTotal && !hand.result) hand.result = WIN
			if (dealerTotal > total && !hand.result) hand.result = LOSE
		}
		this.settleHands(hands)
	}

	settleHands = (hands) => {
		for (let i = 1; i < hands.length; i++) {
			const hand = hands[i]
			if (hand.result === BLACKJACK) {
				hand.bets = Array(3).fill(hand.bets[0])
				this.setState({wins: this.state.wins + 1, message: 'Blackjack!'})
			}
			if (hand.result === WIN) {
				// hand.bets.push(...hand.bets)
				this.setState({wins: this.state.wins + 1, message: 'You Win!'})
			}
			if ([LOSE, BUST].includes(hand.result)) {
				hands[0].bets.push(...hand.bets)
				hand.bets = []
			}			
			if(hand.result === LOSE) {
				this.setState({losses: this.state.losses + 1, message: 'You Lose!'})
			}
			if(hand.result === BUST) {
				this.setState({losses: this.state.losses + 1, message: 'You Busted!'})
			}
			if(hand.result === PUSH) {
				this.setState({message: `It's a draw!`})
				hand.bets = []
			}
		}
		// console.debug('dealer settle:', hands[0].bets)
		// console.debug('player settle:', hands[1].bets)
		this.collectWinnings(hands)
	}

	collectWinnings = async (hands) => {
		const { wallet } = this.state
		let bank = this.state.bank
		let w = 0
		for (let i = 1; i < hands.length; i++) {
			const hand = hands[i]
			let winnings = hand.bets.reduce((a, b) => a + b, 0)
			w += winnings
			if (hand.result === WIN) {
				hand.bets.push(...hand.bets)
				winnings = hand.bets.reduce((a, b) => a + b, 0)
			}
			bank += winnings
			//console.log('collect', winnings)
			// await this.setStateSync({bank: this.state.bank + winnings})
			hand.bets = []
		}
		if(w) {
			console.debug('Pay user', w)
			await lnpay.walletTransfer(WKEY, wallet.id, w)
		}
		if(!w && hands[0].bets.length) {
			const pay = hands[0].bets.reduce((a, b) => a + b, 0)
			console.debug('Pay house', pay)
			await lnpay.walletTransfer(wallet.key, WID, pay)
		}
		setTimeout(() => this.setState({ hands, bank, activeHandIndex: null, pot: this.state.settings.minimumBet }, this.resetRound), DELAY * 2)
	}

	endTurn = () => {
		console.debug('end turn')
		if (this.state.activeHandIndex > 0) {
			setTimeout(() => this.startNextTurn(), DELAY)
		} else {
			this.setState({ inactive: true }, this.endRound)
		}
	}

	startNextTurn = async () => {
		await this.advanceActiveHand()
		const activeHand = this.state.hands[this.state.activeHandIndex]
		if (activeHand.cards.length === 1) {
			let onlyOnce = activeHand.cards[0].value === 'A'
			this.hit(onlyOnce)
		}
		if (this.state.activeHandIndex === 0) {
			this.setState({ inactive: true })
			setTimeout(() => this.revealDealerHand(), DELAY)
			setTimeout(() => this.makeDealerDecision(), DELAY)
		}
		console.log('start next turn')
	}

	setInitials = async () => {
		const { wallet } = this.state
		if(wallet && (!wallet.balance || wallet.balance < this.state.settings.minimumBet)) {
			return this.handleInvoice()
		}
		await this.setStateSync({
			shoe: this.resetShoe(),
			hands: [clone(BASE_HAND), clone(BASE_HAND)],
			bank: this.state.wallet.balance
		})
		this.startNewGame()
	}

	resetRound = async () => {
		console.debug('resetRound')
		await this.reshuffleIfNeeded()
		this.setState({ hands: [clone(BASE_HAND), clone(BASE_HAND)], isSplit: false, message: null }, this.startNewGame)
	}

	openMenu = () => {
		this.updateBalance()
			.then(() => {
				document.getElementById("overlay").style.width = "100%"
				document.getElementById("main-menu").style.width = "100%"
				this.toggle.current.style.display = "none"
			})			
			
	}

	updateSettings = async () => {
		const config = await idb.getConfig()
		const wallet = await idb.getWalletDetails()
		if (!wallet) {
			this.setState({ loading: false, config })
			console.debug('open init modal')
			return //(<InitModal open={!wallet}  close={this.updateSettings}/>)
		}
		this.setState({
			config,
			wallet,
			loading: false
		}, this.setInitials)
	}

	componentDidMount = async () => {
		await this.updateSettings()
	}

	render(props, { hands, message = null, loading = true, config, wallet, invoice = null }) {
		const getTotal = (hand) => {
            if (hand.cards.length < 2) return
            if (hand.cards.find(card => card.isFaceDown)) return
            return B.score(hand.cards)
		}
		
		return (
			<div id="app">
				{hands && <div class='game'>
				{loading ? <Loader /> : null}
				<Cogs open={this.openMenu} toggle={this.toggle} />
				<OffCanvasMenu toggle={this.toggle} wallet={wallet} withdraw={this.handleWithdraw} topUp={this.handleInvoice} />
				<h1>Blackjack</h1>
				<section class={`game_area ${message && 'blur'}`}>
					{wallet && hands && <section class="game_area--cards">
						<div class="dealer">
							<Hand cards={hands[0].cards} score={getTotal(hands[0])} />
						</div>
						<div class={`player ${hands.length > 2 && 'is-split'}`}>
							<Hand cards={hands[1].cards} score={getTotal(hands[1])} dim={this.state.isSplit && this.state.activeHandIndex !== 1} />
							{hands.length > 2 && <Hand cards={hands[2].cards} score={getTotal(hands[2])}dim={this.state.isSplit && this.state.activeHandIndex !== 2} />}
						</div>
					</section>}
					<section class="game_area--controls">
						<button onClick={this.handleAction} disabled={!this.canDoubleDown || this.state.inactive}>Double</button>
						<button onClick={this.handleAction} disabled={!this.canSplit || this.state.inactive} >Split</button>
						<button onClick={this.handleAction} disabled={this.state.inactive}>Hit</button>
						<button onClick={this.handleAction} disabled={this.state.inactive}>Stand</button>
					</section>
					<section class="game_area--details">
						{/* <div class="range-slider">
							<span id="rs-bullet" class="rs-label">{this.state.settings.minimumBet}</span>
							<input id="rs-range-line" class="rs-range" type="range" value={this.state.settings.minimumBet} min="1" max="200" step='50' />						
						</div> */}
						<span>{`Bet: ${this.state.settings.minimumBet} sats`}</span>
						<span>Wins: {this.state.wins}</span>
						<span>Losses: {this.state.losses}</span>
						<span>{`Stack: ${this.state.bank} sats`}</span>
					</section>
				</section>
				</div>}
				{invoice && <Modal open={invoice} qr={this.state.invoiceQR} close={this.resetInvoice} />}
				{this.state.lnurl && <LNURLModal open={this.state.lnurl} qr={this.state.lnurlqr} sats={wallet.balance} close={this.resetInvoice} />}
				{config && !wallet ? <InitModal open={!wallet} close={this.updateSettings} /> : null}
				
				{message && <div id="toast"><span>{message}</span></div>}
			</div>
		);
	}
}
