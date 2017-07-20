const rp = require('request-promise');
const querystring	= require('querystring');
const crypto = require('crypto');

class KrakenClient {
	constructor(key, secret, otp) {
		this.config = {
			url: 'https://api.kraken.com',
			version: '0',
			key: key,
			secret: secret,
			otp: otp,
			timeoutMS: 5000
		};
	}

	api(method, params={}) {
		params = params || {}
		const methods = {
			public: ['Time', 'Assets', 'AssetPairs', 'Ticker', 'Depth', 'Trades', 'Spread', 'OHLC'],
			private: ['Balance', 'TradeBalance', 'OpenOrders', 'ClosedOrders', 'QueryOrders', 'TradesHistory', 'QueryTrades', 'OpenPositions', 'Ledgers', 'QueryLedgers', 'TradeVolume', 'AddOrder', 'CancelOrder', 'DepositMethods', 'DepositAddresses', 'DepositStatus', 'WithdrawInfo', 'Withdraw', 'WithdrawStatus', 'WithdrawCancel']
		};
		if(methods.public.indexOf(method) !== -1) {
			return this._publicMethod(method, params);
		}
		else if(methods.private.indexOf(method) !== -1) {
			return this._privateMethod(method, params);
		}
		else {
			throw new Error(method + ' is not a valid API method.');
		}
	}

	_publicMethod(method, params) {
		const url	= `${this.config.url}/${this.config.version}/public/${method}`
		return this._rawRequest(url, {}, params);
	}

	_privateMethod(method, params) {
		const path = `/${this.config.version}/private/${method}`
		const url	= this.config.url + path
		if(!params.nonce) {
			params.nonce = new Date() * 1000; // spoof microsecond
		}
		if(this.config.otp !== undefined) {
			params.otp = this.config.otp;
		}
		const signature = this._getMessageSignature(path, params, params.nonce);
		const headers = {
			'API-Key': this.config.key,
			'API-Sign': signature
		};
		return this._rawRequest(url, headers, params);
	}

	_getMessageSignature(path, request, nonce) {
		const message	= querystring.stringify(request);
		const secret	= new Buffer(this.config.secret, 'base64');
		const hash	= new crypto.createHash('sha256');
		const hmac	= new crypto.createHmac('sha512', secret);

		const hash_digest	= hash.update(nonce + message).digest('binary');
		const hmac_digest	= hmac.update(path + hash_digest, 'binary').digest('base64');

		return hmac_digest;
	}

	_rawRequest(url, headers, params) {
		headers['User-Agent'] = 'Kraken Javascript API Client';

		const options = {
			url: url,
			method: 'POST',
			headers: headers,
			form: params,
			timeout: this.config.timeoutMS,
			transform: this._autoParse
		};
		return rp(options)
	}

	_autoParse(body, response, resolveWithFullResponse) {
	    if (response.headers['content-type'].includes('application/json')) {
	        return JSON.parse(body);
	    } else {
	        return body;
	    }
	}
}

module.exports = KrakenClient