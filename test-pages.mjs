import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'http://localhost:3017';

// All routes to test
const routes = [
  { path: '/', name: 'Home', requiresAuth: false },
  { path: '/about', name: 'About', requiresAuth: false },
  { path: '/articles', name: 'Articles List', requiresAuth: false },
  { path: '/archive', name: 'Archive', requiresAuth: false },
  { path: '/tags', name: 'Tags', requiresAuth: false },
  { path: '/projects', name: 'Projects', requiresAuth: false },
  { path: '/resources', name: 'Resources', requiresAuth: false },
  { path: '/ideas', name: 'Ideas', requiresAuth: false },
  { path: '/daily', name: 'Daily', requiresAuth: false },
  { path: '/news', name: 'News', requiresAuth: false },
  { path: '/writing', name: 'Writing', requiresAuth: false },
  { path: '/search', name: 'Search', requiresAuth: false },
  { path: '/subscribe', name: 'Subscribe', requiresAuth: false },
  { path: '/login', name: 'Login', requiresAuth: false },
  { path: '/register', name: 'Register', requiresAuth: false },
  { path: '/forgot-password', name: 'Forgot Password', requiresAuth: false },
  { path: '/reset-password', name: 'Reset Password', requiresAuth: false },
  { path: '/verify-email', name: 'Verify Email', requiresAuth: false },
  { path: '/verify-email-change', name: 'Verify Email Change', requiresAuth: false },
  { path: '/account', name: 'Account', requiresAuth: true },
  { path: '/member', name: 'Member Dashboard', requiresAuth: true },
  { path: '/member/groups', name: 'Member Groups', requiresAuth: true },
  { path: '/member/search', name: 'Member Search', requiresAuth: true },
  { path: '/member/resources', name: 'Member Resources', requiresAuth: true },
  { path: '/admin', name: 'Admin Dashboard', requiresAuth: true, isAdmin: true },
];

const results = {
  pages: [],
  summary: {
    totalPages: 0,
    pagesWithErrors: 0,
    totalConsoleErrors: 0,
    totalConsoleWarnings: 0,
    totalNetworkFailures: 0,
    total404Resources: 0,
  }
};

async function testPage(browser, route) {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const pageResult = {
    path: route.path,
    name: route.name,
    consoleErrors: [],
    consoleWarnings: [],
    networkFailures: [],
    resources404: [],
    hydrationErrors: [],
    otherIssues: [],
  };

  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      pageResult.consoleErrors.push(text);
      
      // Check for hydration errors
      if (text.includes('Hydration') || text.includes('hydration') || 
          text.includes('server HTML') || text.includes('client-side')) {
        pageResult.hydrationErrors.push(text);
      }
    } else if (type === 'warning') {
      pageResult.consoleWarnings.push(text);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    pageResult.consoleErrors.push(`Page Error: ${error.message}`);
  });

  // Capture network failures
  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    
    if (status === 404) {
      pageResult.resources404.push({
        url: url,
        type: response.request().resourceType(),
      });
    } else if (status >= 400 && status !== 404) {
      pageResult.networkFailures.push({
        url: url,
        status: status,
        statusText: response.statusText(),
        type: response.request().resourceType(),
      });
    }
  });

  // Capture request failures
  page.on('requestfailed', request => {
    pageResult.networkFailures.push({
      url: request.url(),
      failure: request.failure()?.errorText || 'Unknown error',
      type: request.resourceType(),
    });
  });

  try {
    // Navigate to page
    const response = await page.goto(`${BASE_URL}${route.path}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    pageResult.statusCode = response?.status();

    // Wait a bit for any delayed console messages
    await page.waitForTimeout(2000);

    // Check for specific error patterns in the page
    const bodyText = await page.textContent('body').catch(() => '');
    
    if (bodyText.includes('Application error') || bodyText.includes('Error:')) {
      pageResult.otherIssues.push('Page contains error text');
    }

    // Check if page requires auth and shows login redirect
    if (route.requiresAuth) {
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        pageResult.otherIssues.push('Redirected to login (expected for protected route without auth)');
      }
    }

    // Take screenshot
    const screenshotPath = `/tmp/e-life-blog-${route.path.replace(/\//g, '_') || 'home'}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: false });
    pageResult.screenshot = screenshotPath;

  } catch (error) {
    pageResult.consoleErrors.push(`Navigation Error: ${error.message}`);
  }

  await context.close();
  return pageResult;
}

async function testAdminPage(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const pageResult = {
    path: '/admin',
    name: 'Admin Dashboard (with headers)',
    consoleErrors: [],
    consoleWarnings: [],
    networkFailures: [],
    resources404: [],
    hydrationErrors: [],
    otherIssues: [],
  };

  // Set admin headers
  await context.setExtraHTTPHeaders({
    'Host': 'admin.solarisovo.icu',
    'cf-access-authenticated-user-email': 'admin@test.com'
  });

  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      pageResult.consoleErrors.push(text);
      if (text.includes('Hydration') || text.includes('hydration')) {
        pageResult.hydrationErrors.push(text);
      }
    } else if (type === 'warning') {
      pageResult.consoleWarnings.push(text);
    }
  });

  page.on('pageerror', error => {
    pageResult.consoleErrors.push(`Page Error: ${error.message}`);
  });

  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    
    if (status === 404) {
      pageResult.resources404.push({
        url: url,
        type: response.request().resourceType(),
      });
    } else if (status >= 400 && status !== 404) {
      pageResult.networkFailures.push({
        url: url,
        status: status,
        statusText: response.statusText(),
        type: response.request().resourceType(),
      });
    }
  });

  page.on('requestfailed', request => {
    pageResult.networkFailures.push({
      url: request.url(),
      failure: request.failure()?.errorText || 'Unknown error',
      type: request.resourceType(),
    });
  });

  try {
    const response = await page.goto(`${BASE_URL}/admin`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    pageResult.statusCode = response?.status();
    await page.waitForTimeout(2000);

    const screenshotPath = '/tmp/e-life-blog-admin-with-headers.png';
    await page.screenshot({ path: screenshotPath, fullPage: false });
    pageResult.screenshot = screenshotPath;

  } catch (error) {
    pageResult.consoleErrors.push(`Navigation Error: ${error.message}`);
  }

  await context.close();
  return pageResult;
}

async function main() {
  console.log('🚀 Starting comprehensive page test...\n');
  console.log(`Testing ${routes.length} routes on ${BASE_URL}\n`);

  const browser = await chromium.launch({
    headless: true,
  });

  // Test all routes
  for (const route of routes) {
    console.log(`Testing: ${route.name} (${route.path})`);
    const result = await testPage(browser, route);
    results.pages.push(result);
  }

  // Test admin with special headers
  console.log('Testing: Admin with auth headers');
  const adminResult = await testAdminPage(browser);
  results.pages.push(adminResult);

  await browser.close();

  // Calculate summary
  results.summary.totalPages = results.pages.length;
  
  results.pages.forEach(page => {
    if (page.consoleErrors.length > 0 || page.networkFailures.length > 0 || 
        page.resources404.length > 0 || page.hydrationErrors.length > 0) {
      results.summary.pagesWithErrors++;
    }
    results.summary.totalConsoleErrors += page.consoleErrors.length;
    results.summary.totalConsoleWarnings += page.consoleWarnings.length;
    results.summary.totalNetworkFailures += page.networkFailures.length;
    results.summary.total404Resources += page.resources404.length;
  });

  // Print results
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Pages Tested: ${results.summary.totalPages}`);
  console.log(`Pages with Issues: ${results.summary.pagesWithErrors}`);
  console.log(`Total Console Errors: ${results.summary.totalConsoleErrors}`);
  console.log(`Total Console Warnings: ${results.summary.totalConsoleWarnings}`);
  console.log(`Total Network Failures: ${results.summary.totalNetworkFailures}`);
  console.log(`Total 404 Resources: ${results.summary.total404Resources}`);
  console.log('='.repeat(80) + '\n');

  // Print detailed results for each page
  results.pages.forEach(page => {
    const hasIssues = page.consoleErrors.length > 0 || page.networkFailures.length > 0 || 
                      page.resources404.length > 0 || page.hydrationErrors.length > 0 ||
                      page.otherIssues.length > 0;
    
    if (!hasIssues) {
      console.log(`✅ ${page.name} (${page.path}) - No issues`);
      return;
    }

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`❌ ${page.name} (${page.path})`);
    console.log(`${'─'.repeat(80)}`);
    
    if (page.statusCode) {
      console.log(`Status Code: ${page.statusCode}`);
    }

    if (page.hydrationErrors.length > 0) {
      console.log(`\n🔥 Hydration Errors (${page.hydrationErrors.length}):`);
      page.hydrationErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 150)}${err.length > 150 ? '...' : ''}`);
      });
    }

    if (page.consoleErrors.length > 0) {
      console.log(`\n🔴 Console Errors (${page.consoleErrors.length}):`);
      page.consoleErrors.slice(0, 10).forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 150)}${err.length > 150 ? '...' : ''}`);
      });
      if (page.consoleErrors.length > 10) {
        console.log(`  ... and ${page.consoleErrors.length - 10} more errors`);
      }
    }

    if (page.consoleWarnings.length > 0) {
      console.log(`\n⚠️  Console Warnings (${page.consoleWarnings.length}):`);
      page.consoleWarnings.slice(0, 5).forEach((warn, i) => {
        console.log(`  ${i + 1}. ${warn.substring(0, 150)}${warn.length > 150 ? '...' : ''}`);
      });
      if (page.consoleWarnings.length > 5) {
        console.log(`  ... and ${page.consoleWarnings.length - 5} more warnings`);
      }
    }

    if (page.networkFailures.length > 0) {
      console.log(`\n🌐 Network Failures (${page.networkFailures.length}):`);
      page.networkFailures.forEach((fail, i) => {
        console.log(`  ${i + 1}. [${fail.status || 'FAILED'}] ${fail.url}`);
        if (fail.failure) {
          console.log(`     Error: ${fail.failure}`);
        }
      });
    }

    if (page.resources404.length > 0) {
      console.log(`\n📂 404 Resources (${page.resources404.length}):`);
      page.resources404.forEach((res, i) => {
        console.log(`  ${i + 1}. [${res.type}] ${res.url}`);
      });
    }

    if (page.otherIssues.length > 0) {
      console.log(`\n⚡ Other Issues (${page.otherIssues.length}):`);
      page.otherIssues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
    }

    if (page.screenshot) {
      console.log(`\n📸 Screenshot: ${page.screenshot}`);
    }
  });

  // Generate recommendations
  console.log('\n' + '='.repeat(80));
  console.log('💡 RECOMMENDATIONS');
  console.log('='.repeat(80));

  const recommendations = new Set();

  results.pages.forEach(page => {
    // Check for hydration errors
    if (page.hydrationErrors.length > 0) {
      recommendations.add('🔥 Fix React hydration errors - ensure server and client render the same content');
    }

    // Check for 404s
    if (page.resources404.length > 0) {
      page.resources404.forEach(res => {
        if (res.type === 'image') {
          recommendations.add('📷 Fix missing images - check image paths in public folder');
        }
        if (res.type === 'stylesheet' || res.type === 'script') {
          recommendations.add('📦 Fix missing assets (CSS/JS) - verify build output and paths');
        }
        if (res.url.includes('/api/')) {
          recommendations.add('🔌 Fix API endpoints returning 404 - check API routes');
        }
      });
    }

    // Check for network failures
    if (page.networkFailures.length > 0) {
      page.networkFailures.forEach(fail => {
        if (fail.status === 500) {
          recommendations.add('🔴 Fix server errors (500) - check API error handling');
        }
        if (fail.failure && fail.failure.includes('timeout')) {
          recommendations.add('⏱️  Optimize slow requests - some API calls are timing out');
        }
      });
    }

    // Check for console errors
    page.consoleErrors.forEach(err => {
      if (err.includes('Failed to load resource')) {
        recommendations.add('📦 Check resource loading - some resources are failing to load');
      }
      if (err.includes('NetworkError') || err.includes('fetch')) {
        recommendations.add('🌐 Fix network/fetch errors - check API availability and CORS');
      }
      if (err.includes('undefined') || err.includes('null')) {
        recommendations.add('🐛 Fix null/undefined errors - add proper null checks');
      }
    });
  });

  if (recommendations.size === 0) {
    console.log('✅ No major issues found! All pages are working correctly.');
  } else {
    Array.from(recommendations).forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Test complete!');
  console.log('='.repeat(80) + '\n');

  // Save detailed results to JSON
  const fs = await import('fs');
  fs.writeFileSync('/tmp/e-life-blog-test-results.json', JSON.stringify(results, null, 2));
  console.log('📄 Detailed results saved to: /tmp/e-life-blog-test-results.json\n');
}

main().catch(console.error);
