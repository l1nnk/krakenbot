const socket = require('socket.io-client')('wss://streamer.cryptocompare.com')
const chalk = require('chalk')
const config = require('./config')

const markets = ['Poloniex', 'Kraken', 'Coinbase', 'Bitfinex', 'Gemini']
const rates = [
['ETH', 'USD']
]

const krakenClient = require('./kraken')
const kraken = new krakenClient(config.key, config.secret)

// error ESOCKETTIMEDOUT
/*kraken.api('Balance', null)
    .then((response) => {
        console.log(response)
    }).catch(err => {
        console.log(err.message)
    })*/

const combined = {}
const subs = []
markets.forEach(m => {
  rates.forEach(r => {
    subs.push(`2~${m}~${r[0]}~${r[1]}`)
  })
  combined[m] = 0  
})

let prev = null;

const printUpdate = (value, exchange) => {
  let _chalk = chalk.yellow
  let prefix = ''
  if (prev) {
    if (value > prev) {
      _chalk = chalk.green
      prefix = '↑ '
    } else {
      _chalk = chalk.red
      prefix = '↓ '
    }
  }
  console.log(_chalk(`${prefix}${Number(value).toFixed(1)} ${new Date()} (${exchange})`))
  prev = value
}

socket.on('connect', () => {
  console.log(chalk.green('Connected\n============\n'))
  console.log(chalk.white(`Subscribing to ${JSON.stringify(subs, null, 2)}\n============\n`))
  socket.emit('SubAdd', { subs })
})

socket.on('m', (data) => {
  const splitted = data.split('~')
  if (+splitted[0] === 2) {
    const price = splitted[5]
    const exchange = splitted[1]
    combined[exchange] = price
    console.log(combined)
    printUpdate(price, exchange)
  }
})

socket.on('disconnect', () => {
  console.log(chalk.red('Disconnected.'))
})
