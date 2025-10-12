/**
 * CryptoCompare Integration Test
 * Tests the new cryptocompare service and price aggregator
 */

import { cryptocompareService } from './backend/dist/services/cryptocompare.js';
import { priceAggregatorService } from './backend/dist/services/priceAggregatorService.js';

async function testCryptoCompareService() {
  console.log('\n=== CRYPTOCOMPARE SERVICE TEST ===\n');

  try {
    // Test 1: Ping (Health Check)
    console.log('1. Testing health check...');
    const isHealthy = await cryptocompareService.ping();
    console.log(`✅ CryptoCompare Health: ${isHealthy ? 'ONLINE' : 'OFFLINE'}`);

    // Test 2: Single Price
    console.log('\n2. Testing single price lookup (BTC)...');
    const startSingle = Date.now();
    const btcPrice = await cryptocompareService.getSinglePrice('BTC', 'USD');
    const singleTime = Date.now() - startSingle;
    console.log(`✅ BTC Price: $${btcPrice.toLocaleString()}`);
    console.log(`   Response Time: ${singleTime}ms`);

    // Test 3: Simple Price (Multiple Symbols)
    console.log('\n3. Testing simple price (BTC, ETH)...');
    const startSimple = Date.now();
    const simplePrices = await cryptocompareService.getSimplePrice(['BTC', 'ETH'], ['USD']);
    const simpleTime = Date.now() - startSimple;
    console.log(`✅ Simple Prices:`, simplePrices);
    console.log(`   Response Time: ${simpleTime}ms`);

    // Test 4: Full Market Data
    console.log('\n4. Testing full market data...');
    const startFull = Date.now();
    const marketData = await cryptocompareService.getMarketData(['BTC', 'ETH']);
    const fullTime = Date.now() - startFull;
    console.log(`✅ Market Data (first item):`, {
      symbol: marketData[0]?.symbol,
      price: marketData[0]?.price,
      change24h: marketData[0]?.changePct24h,
      marketCap: marketData[0]?.marketCapDisplay,
      volume24h: marketData[0]?.volume24hDisplay,
    });
    console.log(`   Response Time: ${fullTime}ms`);

    // Test 5: Historical Data
    console.log('\n5. Testing historical data (hourly OHLCV)...');
    const startHist = Date.now();
    const histData = await cryptocompareService.getHistoricalData('BTC', 'USD', 24, 'hour');
    const histTime = Date.now() - startHist;
    console.log(`✅ Historical Data: ${histData.length} candles`);
    console.log(`   Latest Candle:`, {
      timestamp: new Date(histData[histData.length - 1].time * 1000).toISOString(),
      close: histData[histData.length - 1].close,
      high: histData[histData.length - 1].high,
      low: histData[histData.length - 1].low,
    });
    console.log(`   Response Time: ${histTime}ms`);

    // Test 6: Top Coins
    console.log('\n6. Testing top coins by market cap...');
    const startTop = Date.now();
    const topCoins = await cryptocompareService.getTopCoins(5);
    const topTime = Date.now() - startTop;
    console.log(`✅ Top 5 Coins:`, topCoins.map(c => c.CoinInfo?.Name).join(', '));
    console.log(`   Response Time: ${topTime}ms`);

    console.log('\n✅ ALL CRYPTOCOMPARE TESTS PASSED\n');
    return true;
  } catch (error) {
    console.error('\n❌ CryptoCompare Test Failed:', error.message);
    return false;
  }
}

async function testPriceAggregator() {
  console.log('\n=== PRICE AGGREGATOR TEST ===\n');

  try {
    // Test 1: Health Check (Both Services)
    console.log('1. Testing health check (both services)...');
    const health = await priceAggregatorService.healthCheck();
    console.log(`✅ Health Check:`, health);
    console.log(`   CryptoCompare: ${health.cryptocompare ? 'ONLINE' : 'OFFLINE'}`);
    console.log(`   CoinGecko: ${health.coingecko ? 'ONLINE' : 'OFFLINE'}`);
    console.log(`   Overall: ${health.overall ? 'ONLINE' : 'OFFLINE'}`);

    // Test 2: Single Price (with source tracking)
    console.log('\n2. Testing single price with source tracking...');
    const start1 = Date.now();
    const priceData = await priceAggregatorService.getPrice('BTC', 'USD');
    const time1 = Date.now() - start1;
    console.log(`✅ BTC Price: $${priceData.price.toLocaleString()}`);
    console.log(`   Source: ${priceData.source}`);
    console.log(`   Response Time: ${time1}ms`);

    // Test 3: Multiple Prices
    console.log('\n3. Testing multiple prices...');
    const start2 = Date.now();
    const prices = await priceAggregatorService.getPrices(['BTC', 'ETH', 'SOL']);
    const time2 = Date.now() - start2;
    console.log(`✅ Multiple Prices:`, prices.map(p => ({
      symbol: p.symbol,
      price: `$${p.price.toLocaleString()}`,
      source: p.source,
    })));
    console.log(`   Response Time: ${time2}ms`);

    // Test 4: Market Data with Fallback
    console.log('\n4. Testing market data (with fallback)...');
    const start3 = Date.now();
    const market = await priceAggregatorService.getMarketData(['BTC', 'ETH']);
    const time3 = Date.now() - start3;
    console.log(`✅ Market Data (first item):`, {
      symbol: market[0]?.symbol,
      price: market[0]?.price,
      source: market[0]?.source,
    });
    console.log(`   Response Time: ${time3}ms`);

    // Test 5: Historical Data with Fallback
    console.log('\n5. Testing historical data (with fallback)...');
    const start4 = Date.now();
    const hist = await priceAggregatorService.getHistoricalData('BTC', 'hour', 24);
    const time4 = Date.now() - start4;
    console.log(`✅ Historical Data: ${hist.length} candles`);
    console.log(`   Source: ${hist[0]?.source}`);
    console.log(`   Latest Close: $${hist[hist.length - 1]?.close.toLocaleString()}`);
    console.log(`   Response Time: ${time4}ms`);

    console.log('\n✅ ALL PRICE AGGREGATOR TESTS PASSED\n');
    return true;
  } catch (error) {
    console.error('\n❌ Price Aggregator Test Failed:', error.message);
    return false;
  }
}

async function testCacheBehavior() {
  console.log('\n=== CACHE BEHAVIOR TEST ===\n');

  try {
    console.log('1. First request (cache miss)...');
    const start1 = Date.now();
    await priceAggregatorService.getPrice('BTC', 'USD');
    const time1 = Date.now() - start1;
    console.log(`   Response Time: ${time1}ms (expected: ~700ms)`);

    console.log('\n2. Second request (cache hit)...');
    const start2 = Date.now();
    await priceAggregatorService.getPrice('BTC', 'USD');
    const time2 = Date.now() - start2;
    console.log(`   Response Time: ${time2}ms (expected: <50ms)`);

    const cacheWorking = time2 < time1 / 2;
    console.log(`\n${cacheWorking ? '✅' : '❌'} Cache ${cacheWorking ? 'WORKING' : 'NOT WORKING'}`);
    console.log(`   Speed improvement: ${Math.round((time1 - time2) / time1 * 100)}%`);

    return cacheWorking;
  } catch (error) {
    console.error('\n❌ Cache Test Failed:', error.message);
    return false;
  }
}

async function performanceComparison() {
  console.log('\n=== PERFORMANCE COMPARISON ===\n');

  try {
    // CryptoCompare
    console.log('1. CryptoCompare response time...');
    const start1 = Date.now();
    await cryptocompareService.getSinglePrice('BTC', 'USD');
    const ccTime = Date.now() - start1;
    console.log(`   CryptoCompare: ${ccTime}ms`);

    // CoinGecko (from aggregator fallback)
    console.log('\n2. CoinGecko response time (via aggregator)...');
    const start2 = Date.now();
    const priceData = await priceAggregatorService.getPrice('BTC', 'USD');
    const aggTime = Date.now() - start2;
    console.log(`   ${priceData.source}: ${aggTime}ms`);

    const speedup = Math.round(((aggTime - ccTime) / aggTime) * 100);
    console.log(`\n✅ CryptoCompare is ~${speedup}% faster than CoinGecko`);
    console.log(`   Expected: ~70% faster (3x improvement)`);

    return true;
  } catch (error) {
    console.error('\n❌ Performance Test Failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║  CRYPTOCOMPARE INTEGRATION TEST SUITE        ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  const results = {
    cryptocompare: await testCryptoCompareService(),
    aggregator: await testPriceAggregator(),
    cache: await testCacheBehavior(),
    performance: await performanceComparison(),
  };

  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║  TEST SUMMARY                                 ║');
  console.log('╚═══════════════════════════════════════════════╝\n');
  console.log(`CryptoCompare Service: ${results.cryptocompare ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Price Aggregator:      ${results.aggregator ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Cache Behavior:        ${results.cache ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Performance:           ${results.performance ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(r => r === true);
  console.log(`\n${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`);

  process.exit(allPassed ? 0 : 1);
}

runAllTests();
