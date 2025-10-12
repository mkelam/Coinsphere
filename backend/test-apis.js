// Quick API Test Script
import dotenv from 'dotenv';
dotenv.config();

import { coingeckoService } from './src/services/coingecko.js';
import { emailService } from './src/services/emailService.js';
import { logger } from './src/utils/logger.js';

async function testCoinGecko() {
  console.log('\n🚀 Testing CoinGecko API...\n');

  try {
    // Test 1: Ping API
    console.log('Test 1: Ping CoinGecko API');
    const pingResult = await coingeckoService.ping();
    console.log(`✅ Ping successful: ${pingResult}\n`);

    // Test 2: Get Bitcoin price
    console.log('Test 2: Get Bitcoin simple price');
    const btcPrice = await coingeckoService.getSimplePrice(['bitcoin']);
    console.log('✅ Bitcoin price:', btcPrice);
    console.log(`   BTC: $${btcPrice.bitcoin.usd.toLocaleString()}\n`);

    // Test 3: Get market data for top 3 coins
    console.log('Test 3: Get market data for BTC, ETH, SOL');
    const marketData = await coingeckoService.getMarketData(['bitcoin', 'ethereum', 'solana']);
    console.log(`✅ Market data retrieved for ${marketData.length} coins:`);
    marketData.forEach(coin => {
      console.log(`   ${coin.symbol.toUpperCase()}: $${coin.current_price.toLocaleString()} (${coin.price_change_percentage_24h.toFixed(2)}% 24h)`);
    });
    console.log();

    // Test 4: Get OHLC data
    console.log('Test 4: Get Bitcoin OHLC data (1 day)');
    const ohlcData = await coingeckoService.getOHLC('bitcoin', 1);
    console.log(`✅ Retrieved ${ohlcData.length} OHLC candles`);
    if (ohlcData.length > 0) {
      const latest = ohlcData[ohlcData.length - 1];
      console.log(`   Latest candle: O:$${latest.open.toLocaleString()} H:$${latest.high.toLocaleString()} L:$${latest.low.toLocaleString()} C:$${latest.close.toLocaleString()}\n`);
    }

    console.log('✅ ALL COINGECKO TESTS PASSED!\n');
    return true;
  } catch (error) {
    console.error('❌ CoinGecko test failed:', error.message);
    return false;
  }
}

async function testSendGrid() {
  console.log('\n📧 Testing SendGrid Email Service...\n');

  try {
    console.log('Test 1: Send test alert email');
    console.log(`From: ${process.env.SENDGRID_FROM_EMAIL}`);
    console.log(`To: ${process.env.SENDGRID_FROM_EMAIL} (sending to self)\n`);

    const result = await emailService.sendPriceAlert(
      process.env.SENDGRID_FROM_EMAIL,
      {
        tokenSymbol: 'BTC',
        currentPrice: 42000,
        threshold: 40000,
        condition: 'above'
      }
    );

    if (result) {
      console.log('✅ Email sent successfully!');
      console.log('   Check your inbox at:', process.env.SENDGRID_FROM_EMAIL);
      console.log('   Subject: 🚨 BTC Price Alert: $42,000\n');
      console.log('✅ SENDGRID TEST PASSED!\n');
      return true;
    } else {
      console.log('❌ Email failed to send\n');
      return false;
    }
  } catch (error) {
    console.error('❌ SendGrid test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════');
  console.log('   COINSPHERE API INTEGRATION TESTS');
  console.log('═══════════════════════════════════════════');
  console.log(`Date: ${new Date().toLocaleString()}`);
  console.log(`API Keys Configured:`);
  console.log(`  - CoinGecko: ${process.env.COINGECKO_API_KEY ? '✅ Present' : '❌ Missing'}`);
  console.log(`  - SendGrid: ${process.env.SENDGRID_API_KEY ? '✅ Present' : '❌ Missing'}`);
  console.log('═══════════════════════════════════════════\n');

  const coingeckoResult = await testCoinGecko();
  const sendgridResult = await testSendGrid();

  console.log('═══════════════════════════════════════════');
  console.log('   TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════');
  console.log(`CoinGecko API: ${coingeckoResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`SendGrid Email: ${sendgridResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═══════════════════════════════════════════\n');

  if (coingeckoResult && sendgridResult) {
    console.log('🎉 ALL TESTS PASSED! APIs are working correctly.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check the output above.\n');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
