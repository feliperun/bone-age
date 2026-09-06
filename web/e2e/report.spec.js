import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

// Exercise the real upload, report rendering and PDF download without model
// weights. Only inference is stubbed; these tests make no accuracy claims.
async function reportFixture(page, months = 34.2481) {
  await page.addInitScript((estimate) => {
    window.Worker = class {
      onmessage;
      postMessage() {
        setTimeout(
          () =>
            this.onmessage?.({
              data: {
                type: "result",
                months: estimate,
                folds: [estimate - 0.25, estimate + 0.25, estimate],
                seconds: 42.71,
                model: "ianpan/bone-age",
                revision: "a".repeat(40),
              },
            }),
          50,
        );
      }
      terminate() {
        this.onmessage = undefined;
      }
    };
  }, months);
  await page.goto("./");
  await page.locator("#demo").click();
  await expect(page.locator("#result")).toBeVisible();
}

async function downloadPdf(page, name) {
  const pending = page.waitForEvent("download");
  await page.locator("#download-report").click();
  const download = await pending;
  if (name) await download.saveAs(`../.local-validation/${name}.pdf`);
  return readFileSync(await download.path());
}

test("screen and PDF share values, radiograph, metadata and translations", async ({
  page,
  context,
}) => {
  const errors = [],
    requests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  context.on("request", (request) => requests.push(request));
  await reportFixture(page);
  await expect(page.locator("#result-months")).toHaveText("34,2 meses");
  await expect(page.locator("#result-age")).toHaveText("2 anos e 10 meses");
  await expect(page.locator("#result-networks .network-row")).toHaveCount(3);
  await expect(page.locator("#result-exam-data")).toContainText("example.tif");
  await expect(page.locator("#result-exam-data")).toContainText(
    "841 × 1035 px",
  );
  await expect(page.locator("#execution-details")).toContainText(
    "WebAssembly/CPU",
  );

  for (const language of ["pt", "en"]) {
    await page.locator(`#lang-${language}`).click();
    const pdf = await downloadPdf(page, `report-${language}`);
    const text = pdf.toString("latin1");
    expect(text).toContain("/Type /Pages /Count 2");
    expect(text).toMatch(/\/Subtype \/Image \/Width 841 \/Height 1035/);
    for (const id of [
      "result-months",
      "result-chrono",
      "result-difference",
      "result-mean",
    ]) {
      expect(text).toContain(
        `(${await page.locator(`#${id}`).innerText()}) Tj`,
      );
    }
    await expect(page.locator("#result")).toContainText(
      language === "pt" ? "Não é um laudo" : "not a medical report",
    );
    for (const width of [360, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const clipped = await page
        .locator("#result")
        .evaluate((root) =>
          [...root.querySelectorAll("p, dd, dt, strong, h2, h3, button")]
            .filter((node) => {
              // Content inside a closed <details> is skipped by layout, so its
              // scrollWidth can hold a stale value right after a viewport change.
              if (node.closest("details:not([open])")) return false;
              // Discard the first read: it settles on-demand layout.
              return (
                void node.scrollWidth, node.scrollWidth > node.clientWidth + 1
              );
            })
            .map((node) => node.id || node.textContent),
        );
      expect(clipped).toEqual([]);
      await page
        .locator("#result")
        .screenshot({
          path: `../.local-validation/report-${language}-${width}.png`,
        });
    }
  }
  expect(errors).toEqual([]);
  expect(
    requests.every(
      (r) =>
        r.method() === "GET" &&
        !r.postData() &&
        new URL(r.url()).origin === new URL(page.url()).origin,
    ),
  ).toBe(true);
});

test("missing birth date removes comparison markers and survives language changes", async ({
  page,
}) => {
  await reportFixture(page);
  await page.locator("#dob").fill("");
  await expect(page.locator("#result")).toBeHidden();
  await page.locator("#analyze").click();
  await expect(page.locator("#result")).toBeVisible();
  await expect(page.locator("#result-chrono")).toHaveText("Não informada");
  await expect(page.locator("#result-difference")).toHaveText("não calculada");
  await expect(page.locator("#age-chrono-marker")).toBeHidden();
  await expect(page.locator("#age-comparison-span")).toBeHidden();
  const pdf = await downloadPdf(page, "report-no-dob");
  expect(pdf.toString("latin1")).toContain("(n\xe3o calculada) Tj");
  await page.locator("#lang-en").click();
  await expect(page.locator("#result-chrono")).toHaveText("Not provided");
  await expect(page.locator("#result-difference")).toHaveText("not computed");
  await page.locator("#reset").click();
  await expect(page.locator("#result")).toBeHidden();
});

test("rotated crop and long filenames remain consistent in both reports", async ({
  page,
}) => {
  await reportFixture(page, 20);
  await page.locator("#rotate").click();
  await page.locator(".crop-details summary").click();
  for (const [id, value] of Object.entries({
    x0: 100,
    y0: 50,
    x1: 900,
    y1: 800,
  }))
    await page.locator(`#${id}`).fill(String(value));
  await page.locator("#confirm-hand").check();
  await page.locator("#analyze").click();
  await expect(page.locator("#result")).toBeVisible();
  await expect(page.locator("#result-exam-data")).toContainText("800 × 750 px");
  await expect(page.locator("#result-difference")).toContainText("-");
  expect(
    await page
      .locator("#result-radiograph")
      .evaluate((canvas) => [canvas.width, canvas.height]),
  ).toEqual([800, 750]);
  expect((await downloadPdf(page)).toString("latin1")).toMatch(
    /\/Subtype \/Image \/Width 800 \/Height 750/,
  );

  await page.locator("#file-input").setInputFiles({
    name: "<img-onerror=alert(1)>" + "very-long-filename-".repeat(15) + ".tif",
    mimeType: "image/tiff",
    buffer: readFileSync(new URL("../../example.tif", import.meta.url)),
  });
  await expect(page.locator("#result")).toBeHidden();
  await page.locator("#sex").selectOption("male");
  await page.locator("#confirm-hand").check();
  await page.locator("#analyze").click();
  await expect(page.locator("#result")).toBeVisible();
  await expect(page.locator("#result-exam-data img")).toHaveCount(0);
  await page.setViewportSize({ width: 360, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("image inspection fits, zooms, switches crop and full image, and closes by keyboard", async ({ page }) => {
  await reportFixture(page);
  await page.locator("#rotate").click();
  await page.locator(".crop-details summary").click();
  for (const [id, value] of Object.entries({ x0: 100, y0: 50, x1: 900, y1: 800 }))
    await page.locator(`#${id}`).fill(String(value));
  const originalCrop = await page.locator("#x0").inputValue();
  await page.locator("#review-image").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("#review-close")).toBeFocused();
  expect(await page.locator("#review-canvas").evaluate((canvas) => [canvas.width, canvas.height])).toEqual([800, 750]);
  await page.locator("#review-zoom").fill("3");
  await expect(page.locator("#review-zoom-value")).toHaveText("300%");
  expect(await page.locator("#review-viewport").evaluate((node) => node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight)).toBe(true);
  await page.locator("#review-full").click();
  expect(await page.locator("#review-canvas").evaluate((canvas) => [canvas.width, canvas.height])).toEqual([1035, 841]);
  await expect(page.locator("#review-zoom-value")).toHaveText("100%");
  await page.setViewportSize({ width: 360, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("#image-review").screenshot({ path: "../.local-validation/review-mobile.png" });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("#review-image")).toBeFocused();
  await expect(page.locator("#x0")).toHaveValue(originalCrop);
  await expect(page.locator("#confirm-hand")).not.toBeChecked();
});

test("professional comparison is optional, local, editable and exported without changing inference", async ({ page, context }) => {
  const requests = [];
  context.on("request", (r) => requests.push(r));
  await reportFixture(page);
  const ai = await page.locator("#result-months").innerText();
  const chronological = await page.locator("#result-chrono").innerText();
  await expect(page.locator("#professional-comparison")).toBeHidden();
  await page.locator("#professional-entry-summary").click();
  await page.locator("#professional-form button[type=submit]").click();
  await expect(page.locator("#professional-error")).toContainText("mesma radiografia");
  await page.locator("#professional-years").fill("3");
  await page.locator("#professional-months").fill("0");
  await page.locator("#professional-method").fill("Greulich–Pyle");
  await page.locator("#professional-source").fill("Serviço exemplo");
  await page.locator("#professional-date").fill("2026-05-20");
  await page.locator("#professional-same-exam").check();
  await page.locator("#professional-form button[type=submit]").click();
  await expect(page.locator("#professional-comparison")).toContainText("36,0 meses");
  await expect(page.locator("#professional-comparison")).toContainText("-1,8 meses");
  await expect(page.locator("#result-months")).toHaveText(ai);
  await expect(page.locator("#result-chrono")).toHaveText(chronological);
  const pt = (await downloadPdf(page, "professional-pt")).toString("latin1");
  expect(pt).toContain("/Type /Pages /Count 3");
  expect(pt).toContain("(36,0 meses) Tj");
  expect(pt).toContain("(-1,8 meses) Tj");
  expect(pt).toContain("Servi\xe7o exemplo");
  await page.setViewportSize({ width: 360, height: 800 });
  await page.locator("#result").screenshot({ path: "../.local-validation/professional-mobile.png" });
  await page.locator("#professional-entry-summary").click();
  await page.locator("#professional-years").fill("2");
  await page.locator("#professional-months").fill("6");
  await page.locator("#professional-form button[type=submit]").click();
  await expect(page.locator("#professional-comparison")).toContainText("+4,2 meses");
  await page.locator("#lang-en").click();
  await expect(page.locator("#professional-comparison")).toContainText("+4.2 months");
  const en = (await downloadPdf(page, "professional-en")).toString("latin1");
  expect(en).toContain("/Type /Pages /Count 3");
  expect(en).toContain("(+4.2 months) Tj");
  await page.locator("#professional-entry-summary").click();
  await page.locator("#professional-remove").click();
  await expect(page.locator("#professional-comparison")).toBeHidden();
  expect((await downloadPdf(page)).toString("latin1")).not.toContain("Servi\xe7o exemplo");
  await expect(page.locator("#professional-source")).toHaveValue("");
  await page.locator("#professional-source").fill("unsaved draft");
  await page.locator("#sex").selectOption("male");
  await expect(page.locator("#result")).toBeHidden();
  await expect(page.locator("#professional-source")).toHaveValue("");
  expect(requests.every((r) => r.method() === "GET" && !r.postData()
    && new URL(r.url()).origin === new URL(page.url()).origin)).toBe(true);
});
