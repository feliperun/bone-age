import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

// The app origin, plus the public weights host when it is a separate one.
// Nothing else may be contacted: no image or examination datum ever leaves the page.
const allowedOrigins = (pageUrl) =>
  new Set([
    new URL(pageUrl).origin,
    new URL(process.env.VITE_WEIGHTS_BASE || "./", pageUrl).origin,
  ]);

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
        allowedOrigins(page.url()).has(new URL(r.url).origin),
    ),
  ).toBe(true);
});

// A second radiograph resets the examination fields so one patient's data can
// never be carried into another's analysis - but the user has to be told.
test("opening another radiograph never silently drops typed examination data", async ({
  page,
}) => {
  await page.goto("./");
  const png = (shade) =>
    page.evaluate((value) => {
      const canvas = document.createElement("canvas");
      canvas.width = 80;
      canvas.height = 120;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = `rgb(${value},${value},${value})`;
      ctx.fillRect(0, 0, 80, 120);
      ctx.fillStyle = "#fff";
      ctx.fillRect(10, 10, 40, 60);
      return canvas.toDataURL().split(",")[1];
    }, shade);
  const open = async (name, shade) =>
    page.locator("#file-input").setInputFiles({
      name,
      mimeType: "image/png",
      buffer: Buffer.from(await png(shade), "base64"),
    });
  await open("first.png", 30);
  await expect(page.locator("#viewer")).toBeVisible();
  await page.locator("#sex").selectOption("female");
  await page.locator("#dob").fill("2019-03-08");
  await expect(page.locator("#chrono")).not.toHaveText("\u2014");
  await open("second.png", 90);
  await expect(page.locator("#file-info")).toContainText("second.png");
  await expect(page.locator("#dob")).toHaveValue("");
  await expect(page.locator("#sex")).toHaveValue("");
  await expect(page.locator("#notice")).toContainText(
    "Os dados do exame foram limpos",
  );
});

// Screenshots are the only way to inspect this layout: CI owns the only browser.
// They are uploaded as a build artifact.
const WIDTHS = [
  ["360", 360, 780],
  ["390", 390, 844],
  ["768", 768, 1024],
];
test("small screens neither overflow nor overlap", async ({ page }) => {
  const overlaps = async () =>
    page.evaluate(() => {
      const name = (el) =>
        el.id ||
        (typeof el.className === "string" && el.className) ||
        el.tagName.toLowerCase();
      const boxes = [...document.querySelectorAll("main *, header *")]
        .filter(
          (el) =>
            // Collapsed <details> content and anything else not on screen is
            // not a layout problem.
            el.checkVisibility({ contentVisibilityAuto: true }) &&
            getComputedStyle(el).position === "static" &&
            el.getBoundingClientRect().height > 0 &&
            !el.querySelector("*"),
        )
        .map((el) => ({ tag: name(el), box: el.getBoundingClientRect() }));
      const hits = [];
      for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i].box,
            b = boxes[j].box;
          const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          // Leaf boxes that are not nested must not cover each other.
          if (x > 2 && y > 2)
            hits.push(
              `${boxes[i].tag} [${Math.round(a.left)},${Math.round(a.top)},${Math.round(a.right)},${Math.round(a.bottom)}]` +
                ` / ${boxes[j].tag} [${Math.round(b.left)},${Math.round(b.top)},${Math.round(b.right)},${Math.round(b.bottom)}]`,
            );
        }
      return hits;
    });
  const problems = [];
  for (const [name, width, height] of WIDTHS) {
    await page.setViewportSize({ width, height });
    await page.goto("./");
    await expect(page.locator("#title")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `horizontal overflow at ${name}px`,
    ).toBe(true);
    await page.screenshot({
      path: `../.local-validation/empty-${name}.png`,
      fullPage: true,
    });
    // Collected across every width so one bad layout does not hide the others,
    // and so every screenshot is still taken.
    problems.push(...(await overlaps()).map((hit) => `${name}px: ${hit}`));
  }
  expect(problems).toEqual([]);
  // The workspace with a radiograph open is a different layout again.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await page.locator("#demo").click();
  await expect(page.locator("#viewer")).toBeVisible({ timeout: 30_000 });
  await page.locator("#cancel").click();
  await page.screenshot({
    path: "../.local-validation/viewer-390.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

// The sample lets a visitor without a radiograph see the whole pipeline.
test("the sample radiograph loads its data and starts the analysis", async ({
  page,
}) => {
  await page.goto("./");
  await page.locator("#demo").click();
  await expect(page.locator("#viewer")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("#file-info")).toContainText("example.tif");
  await expect(page.locator("#file-info")).toContainText("841 \u00d7 1035");
  await expect(page.locator("#sex")).toHaveValue("female");
  await expect(page.locator("#dob")).toHaveValue("2023-07-17");
  await expect(page.locator("#exam-date")).toHaveValue("2026-05-16");
  await expect(page.locator("#confirm-hand")).toBeChecked();
  // It goes straight into the analysis, and says where the data came from.
  await expect(page.locator("#progress-area")).toBeVisible();
  await expect(page.locator("#cancel")).toBeVisible();
  await expect(page.locator("#notice")).toContainText("Exemplo do repositório");
  await page.locator("#cancel").click();
  await expect(page.locator("#progress-area")).toBeHidden();
  await expect(page.locator("#notice")).toContainText("cancelado");
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
    /^idade-ossea-\d{4}-\d{2}-\d{2}\.pdf$/,
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
        allowedOrigins(page.url()).has(new URL(r.url).origin),
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
  // The saved report is a real PDF, built in the page from the analysed crop.
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-report").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /^idade-ossea-\d{4}-\d{2}-\d{2}\.pdf$/,
  );
  const pdf = readFileSync(await download.path());
  expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  expect(pdf.subarray(-5).toString("latin1")).toBe("%%EOF");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "../.local-validation/result-390.png",
    fullPage: true,
  });
  const text = pdf.toString("latin1");
  // The analysed crop travels inside it, at the pixel size the networks saw.
  expect(text).toContain("/DCTDecode");
  expect(text).toMatch(/\/Subtype \/Image \/Width 128 \/Height 192/);
  expect(text).toContain("startxref");
  expect(pdf.length).toBeGreaterThan(4000);
  expect(errors).toEqual([]);
  expect(
    requests.every(
      (r) =>
        r.method === "GET" &&
        !r.body &&
        allowedOrigins(page.url()).has(new URL(r.url).origin),
    ),
  ).toBe(true);
});

test.describe("English", () => {
  test.use({ locale: "en-US" });

  test("follows the browser language and switches from the header", async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("./");
    await expect(
      page.getByRole("heading", { name: "Bone age. In your browser." }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("#lang-en")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator("#analyze")).toContainText("Estimate bone age");
    // The model credit and its author link read in both languages.
    await expect(page.locator("#credits-title")).toHaveText(
      "The AI model is Ian Pan's.",
    );
    await expect(
      page.locator('.credits a[href="https://huggingface.co/ianpan"]'),
    ).toBeVisible();
    await page.locator("#lang-pt").click();
    await expect(
      page.getByRole("heading", { name: "Idade óssea. No seu navegador." }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    await expect(page.locator("#analyze")).toContainText("Calcular idade óssea");
    await page.reload();
    await expect(page.locator("#lang-pt")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator("#credits-title")).toHaveText(
      "O modelo de IA é de Ian Pan.",
    );
    expect(errors).toEqual([]);
  });
});
