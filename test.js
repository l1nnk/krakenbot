const assert = require('assert');
const krakenClient = require('./kraken')
const config = require('./config')
const kraken = new krakenClient(config.key, config.secret)

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return balance', function(done) {
    	this.timeout(4000);
      kraken.api('Balance', null)
		.then((response) => {
		  	console.log(response)
		  	done()
		}).catch(err => {
		  	done(err)
		})
    });
  });
});