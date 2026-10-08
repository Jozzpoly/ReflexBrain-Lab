import fs from 'node:fs/promises';
import { chromium } from 'playwright-core';

const baseUrl =
  process.env.R3G_BASE_URL ??
  'http://127.0.0.1:4173/probes/medium-d-r3e-spatial-proxy.html';

const errors = [];
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
});

const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});

page.on('pageerror', (error) => {
  errors.push('pageerror: ' + String(error?.stack ?? error));
});
page.on('console', (message) => {
  if (message.type() === 'error') {
    errors.push('console.error: ' + message.text());
  }
});

await fs.mkdir('artifacts/r3g', { recursive: true });

function parseFirstInteger(text) {
  const match = String(text ?? '').replaceAll(',', '').match(/-?\d+/);
  if (!match) throw new Error('expected integer in text: ' + String(text));
  return Number(match[0]);
}

async function requireVisible(locator, label) {
  await locator.waitFor({ state: 'visible', timeout: 10_000 });
  if (!(await locator.isVisible())) {
    throw new Error(label + ' is not visible');
  }
}

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30_000 });

  const status = page.locator('#status');
  const tick = page.locator('#tick');
  const mark = page.locator('#mark');
  const fork = page.locator('#fork');
  const markAge = page.locator('#markAge');
  const branches = page.locator('#branches');
  const sync = page.locator('#sync');
  const proxy = page.getByRole('button', {
    name: /Movable material body.*drag to define impulse/i,
  });
  const ribbon = page.locator('#ribbon');
  const impulseTick = page.locator('#impulseTick');
  const divergenceTick = page.locator('#divTick');
  const compare = page.locator('#compare');
  const singleView = page.locator('#singleView');
  const compareView = page.locator('#compareView');

  await requireVisible(mark, 'MARK');
  await page.waitForFunction(() => {
    const text = document.querySelector('#tick')?.textContent ?? '';
    const n = Number(text.replace(/[^0-9]/g, ''));
    return Number.isFinite(n) && n > 20;
  });

  if (!/WATCH/.test(await status.textContent())) {
    throw new Error('page did not begin in WATCH state');
  }

  const markClickTick = parseFirstInteger(await tick.textContent());
  await mark.click();

  await page.waitForFunction(() => {
    const text = document.querySelector('#markAge')?.textContent ?? '';
    const match = text.replaceAll(',', '').match(/(\d+)\s*ticks shadowed/);
    return match ? Number(match[1]) > 240 : false;
  }, { timeout: 15_000 });

  const shadowAgeBeforeFork = parseFirstInteger(await markAge.textContent());
  if (shadowAgeBeforeFork <= 240) {
    throw new Error('shadow age did not exceed 240 ticks');
  }

  await requireVisible(fork, 'FORK');
  await fork.click();

  await requireVisible(branches, 'branch strip');

  // Read the live A/B tick labels and sync badge in one browser task.
  // Separate Playwright round-trips can span RAF/simulation steps and compare
  // different causal moments even when the branches are actually synchronized.
  const exposure = await page.evaluate(() => {
    const parse = (value) => {
      const match = String(value ?? '').replaceAll(',', '').match(/-?\d+/);
      if (!match) throw new Error('missing branch tick');
      return Number(match[0]);
    };
    return {
      a: parse(document.querySelector('#tickA')?.textContent),
      b: parse(document.querySelector('#tickB')?.textContent),
      sync: document.querySelector('#sync')?.textContent ?? '',
    };
  });

  if (!/sync/i.test(exposure.sync)) {
    throw new Error('A/B were not synchronized at semantic FORK exposure');
  }

  const branchATick = exposure.a;
  const branchBTick = exposure.b;
  if (branchATick !== branchBTick) {
    throw new Error(
      'branch tick mismatch in atomic exposure read: A=' +
        branchATick +
        ' B=' +
        branchBTick,
    );
  }

  await requireVisible(proxy, 'derived material-body proxy');
  if ((await proxy.getAttribute('aria-disabled')) !== 'false') {
    throw new Error('material-body proxy was disabled before intervention');
  }

  await page.screenshot({
    path: 'artifacts/r3g/01-fork-proxy.png',
    fullPage: true,
  });

  const box = await proxy.boundingBox();
  if (!box || box.width <= 0 || box.height <= 0) {
    throw new Error('material-body proxy has no usable bounding box');
  }

  const start = {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
  const end = {
    x: start.x + 140,
    y: start.y - 35,
  };

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await page.mouse.up();

  await page.waitForFunction(() => {
    const text = document.querySelector('#status')?.textContent ?? '';
    return /RELEASE\s*\/\s*IMPULSE/i.test(text);
  }, { timeout: 10_000 });

  await requireVisible(ribbon, 'causal divergence ribbon');

  const interventionTick = parseFirstInteger(await impulseTick.textContent());
  const firstMaterialDivergence = parseFirstInteger(
    await divergenceTick.textContent(),
  );

  if (firstMaterialDivergence < interventionTick) {
    throw new Error(
      'material divergence precedes intervention: divergence=' +
        firstMaterialDivergence +
        ' intervention=' +
        interventionTick,
    );
  }

  await page.screenshot({
    path: 'artifacts/r3g/02-after-impulse.png',
    fullPage: true,
  });

  await requireVisible(compare, 'Compare A/B');
  await compare.click();

  await requireVisible(compareView, 'A/B compare view');
  if (await singleView.isVisible()) {
    throw new Error('single Habitat view remained visible in Compare mode');
  }
  if (!/Return to Habitat/i.test(await compare.textContent())) {
    throw new Error('Compare action did not become Return to Habitat');
  }
  if (await proxy.isVisible()) {
    throw new Error('spatial proxy remained visible in read-only Compare mode');
  }

  await page.screenshot({
    path: 'artifacts/r3g/03-compare.png',
    fullPage: true,
  });

  await compare.click();

  await requireVisible(singleView, 'single Habitat view after return');
  if (await compareView.isVisible()) {
    throw new Error('Compare view remained visible after Return to Habitat');
  }
  await requireVisible(proxy, 'material-body proxy after Habitat return');

  const proxyDisabledAfterIntervention =
    (await proxy.getAttribute('aria-disabled')) === 'true';

  await page.screenshot({
    path: 'artifacts/r3g/04-return-habitat.png',
    fullPage: true,
  });

  if (errors.length > 0) {
    throw new Error('browser runtime errors: ' + JSON.stringify(errors));
  }

  const result = {
    outcome: 'PASS',
    markClickTick,
    shadowAgeBeforeFork,
    forkExposureTick: branchATick,
    synchronizedAtExposure: true,
    proxyFound: true,
    pointerDragPixels: {
      dx: end.x - start.x,
      dy: end.y - start.y,
    },
    interventionTick,
    firstMaterialDivergence,
    compareOpened: true,
    returnedToHabitat: true,
    proxyVisibleAfterReturn: await proxy.isVisible(),
    proxyDisabledAfterIntervention,
    runtimeErrors: errors,
  };

  console.log('MEDIUM_D_R3G_BROWSER_RESULT ' + JSON.stringify(result));
} finally {
  await browser.close();
}
