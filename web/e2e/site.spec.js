import { test, expect } from "@playwright/test";

test("upload, crop controls, validation, responsive layout, local-only networking", async ({
  page,
  context,
}) => {
  const requests = [];
  context.on("request", (request) =>
    requests.push({
      url: request.url(),
      method: request.method(),
      body: request.postData(),
    }),
  );
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Idade óssea. No seu navegador." }),
  ).toBeVisible();
  await expect(page.locator("#analyze")).toBeDisabled();
  await page
    .locator("#file-input")
    .setInputFiles({
      name: "bad.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not an image"),
    });
  await expect(page.locator("#error")).toContainText("Formato não reconhecido");
  // Synthetic image, generated in the test. No patient file is part of the site or CI.
  const data = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 80;
    canvas.height = 120;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 80, 120);
    gradient.addColorStop(0, "#000");
    gradient.addColorStop(1, "#fff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 80, 120);
    return canvas.toDataURL().split(",")[1];
  });
  await page
    .locator("#file-input")
    .setInputFiles({
      name: "synthetic.png",
      mimeType: "image/png",
      buffer: Buffer.from(data, "base64"),
    });
  await expect(page.locator("#viewer")).toBeVisible();
  await page.locator("#sex").selectOption("male");
  await page.locator("#dob").fill("2020-01-01");
  await page.locator("#exam-date").fill("2026-01-01");
  await page.locator("#confirm-hand").check();
  await expect(page.locator("#analyze")).toBeEnabled();
  await page.locator("#rotate").click();
  await expect(page.locator("#confirm-hand")).not.toBeChecked();
  await expect(page.locator("#analyze")).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../.local-validation/mobile.png",
    fullPage: true,
  });
  await page.locator("#reset").click();
  await expect(page.locator("#dropzone")).toBeVisible();
  await expect(page.locator("#sex")).toHaveValue("");
  expect(errors).toEqual([]);
  expect(
    requests.every(
      (r) =>
        r.method === "GET" &&
        !r.body &&
        new URL(r.url).origin === new URL(page.url()).origin,
    ),
  ).toBe(true);
});

test("local DICOM end-to-end WASM parity and offline inference", async ({
  page,
  context,
}) => {
  test.skip(
    !process.env.LOCAL_DICOM,
    "Private, local-only verification; never copied into build or CI.",
  );
  const requests = [],
    errors = [];
  context.on("request", (r) =>
    requests.push({ url: r.url(), method: r.method(), body: r.postData() }),
  );
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await page.locator("#file-input").setInputFiles(process.env.LOCAL_DICOM);
  await expect(page.locator("#viewer")).toBeVisible();
  await expect(page.locator("#sex")).toHaveValue("male");
  await page.locator("#dob").fill(process.env.LOCAL_DOB);
  await page.locator(".crop-details summary").click();
  const coordinates = Object.fromEntries(
    ["x0", "y0", "x1", "y1"].map((key, i) => [
      key,
      process.env.LOCAL_CROP.split(",")[i],
    ]),
  );
  for (const [key, value] of Object.entries(coordinates))
    await page.locator(`#${key}`).fill(value);
  await page.locator("#confirm-hand").check();
  await page.locator("#analyze").click();
  await expect(page.locator("#result")).toBeVisible({ timeout: 240_000 });
  const text = await page.locator("#result-months").innerText();
  const months = Number(text.split(" meses")[0].replace(",", "."));
  expect(Math.abs(months - Number(process.env.EXPECTED_MONTHS))).toBeLessThan(
    0.25,
  );
  await page.screenshot({
    path: "../.local-validation/local-result.png",
    fullPage: true,
  });
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-report").click();
  expect((await downloadPromise).suggestedFilename()).toMatch(
    /^idade-ossea-\d{4}-\d{2}-\d{2}\.md$/,
  );
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  // The entire app must reopen offline, not only continue in the existing tab.
  await page.reload();
  await expect(page.locator("#dropzone")).toBeVisible();
  await expect(page.locator("#exam-date")).not.toHaveValue("");
  await page.locator("#file-input").setInputFiles(process.env.LOCAL_DICOM);
  await expect(page.locator("#viewer")).toBeVisible();
  await page.locator(".crop-details summary").click();
  for (const [key, value] of Object.entries(coordinates))
    await page.locator(`#${key}`).fill(value);
  await page.locator("#confirm-hand").check();
  await page.locator("#analyze").click();
  await expect(page.locator("#result")).toBeVisible({ timeout: 240_000 });
  expect(await page.locator("#result-months").innerText()).toBe(text);
  expect(errors).toEqual([]);
  expect(
    requests.every(
      (r) =>
        r.method === "GET" &&
        !r.body &&
        new URL(r.url).origin === new URL(page.url()).origin,
    ),
  ).toBe(true);
  console.log(
    `Browser WASM: ${months} months; Python: ${process.env.EXPECTED_MONTHS}; offline reload and inference: OK; no outgoing patient data.`,
  );
});

test("public synthetic JPEG runs all three networks after offline reopening", async ({
  page,
  context,
}) => {
  const requests = [],
    errors = [];
  context.on("request", (r) =>
    requests.push({ url: r.url(), method: r.method(), body: r.postData() }),
  );
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await expect(page.locator("#exam-date")).not.toHaveValue("");
  const data = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 192;
    const ctx = canvas.getContext("2d");
    for (let y = 0; y < 192; y++)
      for (let x = 0; x < 128; x++) {
        const v = (x * 7 + y * 3) % 256;
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, 1, 1);
      }
    return canvas.toDataURL("image/jpeg").split(",")[1];
  });
  await page.locator("#prepare").click();
  await expect(page.locator("#model-status")).toContainText(
    "Download concluído",
    { timeout: 180_000 },
  );
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#exam-date")).not.toHaveValue("");
  await page
    .locator("#file-input")
    .setInputFiles({
      name: "synthetic.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from(data, "base64"),
    });
  await expect(page.locator("#viewer")).toBeVisible();
  await page.locator("#sex").selectOption("female");
  await page.locator("#confirm-hand").check();
  await page.locator("#analyze").click();
  await expect(page.locator("#result")).toBeVisible({ timeout: 180_000 });
  await expect(page.locator("#execution-details")).toContainText(
    "WebAssembly/CPU",
  );
  await expect(page.locator("#result-chrono")).toHaveText("Não informada");
  const months = Number(
    (await page.locator("#result-months").innerText())
      .split(" meses")[0]
      .replace(",", "."),
  );
  expect(months).toBeGreaterThan(0);
  expect(months).toBeLessThan(239);
  expect(errors).toEqual([]);
  expect(
    requests.every(
      (r) =>
        r.method === "GET" &&
        !r.body &&
        new URL(r.url).origin === new URL(page.url()).origin,
    ),
  ).toBe(true);
});
