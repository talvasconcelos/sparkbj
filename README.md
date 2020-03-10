# Sparkpay Blackjack

## Description

Sparkpay Blackjack is a single-player HTML5 blackjack game built with [preactjs](https://preactjs.com/) and [LNPay](https://lnpay.co/) you can play with Bitcoin! Guess it makes it a Lapp I guess!

Sparkpay Blackjack is highly inspired by [Kevin Lee Drum's Vlackjack](https://kevinleedrum.github.io/vlackjack/).

It's still a beta version, so use with caution!

## Play Now :spades:

https://casino.sparkpay.pt/

After initial setup you should backup your wallet ID and wallet key. Your browser should ask if you'd like to add the app to your home screen. This way, next time you want to use the app it'll be as easy as opening every other app on your phone, or your computer.

#### Rules

- To keep the game simple, the initial bet is always one coin
- 6 Decks, shuffled after 75% have been played
- Blackjack pays 2-to-1
- Dealer stands on any 17 (`S17`)
- Double down on any two cards (`D2`)
- Double down after splitting (`DAS`) (except Aces)
- No resplitting (`NR`)
- No insurance (`NI`)

## Development

Want to contribute?

To fix a bug or enhance an existing module, follow these steps:

- Fork the repo
- Create a new branch (`git checkout -b improve-feature`)
- Make the appropriate changes in the files
- Add changes to reflect the changes made
- Commit your changes (`git commit -am 'Improve feature'`)
- Push to the branch (`git push origin improve-feature`)
- Create a Pull Request

### Bug / Feature Request

If you find a bug or you'd like to request a new function, kindly open an issue [here](https://github.com/talvasconcelos/sparkbj/issues/new).

## Built with

- [Preact](https://preactjs.com/) - Fast 3kB alternative to React with the same modern API.
- [LNPay](https://lnpay.co/) - LNPay provides public facing tools for Lightning users/businesses/merchants
