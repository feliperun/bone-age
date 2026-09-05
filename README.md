# Bone Age

Bone age assessment from hand radiographs using the [ianpan/bone-age](https://huggingface.co/ianpan/bone-age) deep learning model — a ConvNeXtV2-tiny 3-model ensemble trained on the RSNA Pediatric Bone Age 2017 dataset (14,036 left-hand PA radiographs, MAE 4.16 months).

## Browser app — fully local inference

**[Open the app](https://bone-age.app)**

Open a radiograph, crop the **left hand**, confirm orientation and sex, and run all
three networks locally through ONNX Runtime Web / WebAssembly. Birth date is optional
and is used only for the descriptive chronological-age comparison. The report is
saved as a PDF built in the page — the analysed crop, the three network outputs,
the execution details, and the credit and licence of the model — with no
dependency and no server: `web/src/report.ts` writes the PDF bytes by hand,
embedding the radiograph as JPEG with `/DCTDecode`.

The interface is bilingual, Portuguese and English. It follows the browser
languages on first visit and the header switch overrides that, remembered in
`localStorage`. Every string lives in `web/src/i18n.ts`; `web/tests/i18n.test.ts`
fails the build when a key is missing from either language, is referenced but
undefined, or loses a `{placeholder}` in translation.

- Without a radiograph at hand, one button loads `example.tif` — the same sample
  the CLI documents — with its examination data and runs the whole pipeline. It is
  served from the repository root at build time and deliberately left out of the
  service worker precache, so only visitors who ask for it download it.
- No backend inference, accounts, analytics, or patient-data uploads. Files and
  exam details stay in page memory. Reloading or discarding the analysis clears them.
- First use downloads approximately **340 MB** of model weights. Public weights
  are SHA-256 checked and cached when browser storage allows. The app and runtime
  are cached by a service worker for offline reopening after setup.
- ONNX FP32, original three-fold ensemble, sequential inference in a dedicated
  worker, one WASM thread. This works without cross-origin isolation.
  A modern desktop browser with free RAM is recommended; mobile memory is limited.
- Supports PNG, JPEG, single-page TIFF, WebP, BMP, AVIF and DICOM Part 10 (including
  extensionless files), monochrome 8/16-bit uncompressed little/big endian and
  JPEG baseline. JPEG lossless, JPEG-LS, JPEG 2000 and multiframe DICOM are explicitly
  rejected; export those to a supported format first.
- Histogram matching follows `skimage`; bilinear resizing can differ from OpenCV
  by one gray level. This is a technical reimplementation, not clinical validation.
- The app bundle contains only its own assets, and the weights site only public
  model files. Repository-root radiographs and generated patient reports are
  **never included** in either.

### Build locally

Use Python 3.12 and Node.js 22. From the repository root:

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install torch==2.6.0+cpu torchvision==0.21.0+cpu --index-url https://download.pytorch.org/whl/cpu
.venv/bin/python -m pip install -r requirements-web.txt
.venv/bin/python scripts/export_web_model.py
cd web
npm ci
npm test
npm run build
npm run preview
```

A local build serves the weights from its own origin, out of `web/public/models`;
set `VITE_WEIGHTS_BASE` to rehearse the split deployment.

The export is pinned to model revision `2ab81275b84e9f518f04584177221a1d8c1dc1a5`.
Each ONNX fold is checked against the original PyTorch network for both sexes;
export fails if an absolute difference exceeds 0.002 months on the deterministic
test tensor. `manifest.json` records the errors, file sizes and checksums.

Browser tests: `cd web && npx playwright install chromium && npm run test:e2e`.
The optional private DICOM parity/offline test takes `LOCAL_DICOM`, `LOCAL_DOB`,
`LOCAL_CROP` (x0,y0,x1,y1) and `EXPECTED_MONTHS` environment variables. No private
file or its metadata is checked into the source or published.

### Deployment

The 11 MB app and the 325 MB of weights are hosted separately, because a single
host would move 336 MB per new visitor:

| | Host | Content |
|---|---|---|
| App | Vercel, [bone-age.app](https://bone-age.app) | `web/dist`: HTML/CSS/JS and the ONNX Runtime `.wasm` |
| Weights | GitHub Pages, `feliperun.github.io/bone-age/` | `models/`: three `.onnx` folds, `manifest.json`, `reference.json` |

`vercel.json` at the repository root holds the whole Vercel configuration —
build command, output directory, security headers and the `VITE_WEIGHTS_BASE`
build variable that points the app at the weights host. Nothing needs to be
configured in the dashboard beyond importing the repository and adding the
domain. Pointing the app at another host (a Hugging Face mirror, an R2 bucket)
is a one-line change there; the value must be an origin that sends
`access-control-allow-origin`. Unset — as in local builds and CI — the app reads
`models/` from its own origin.

The `Test the app and publish the public model weights` Actions workflow converts
and numerically validates the model, runs the unit and browser tests against a
same-origin copy, checks the published allowlist, and deploys only `models/`
(plus the model license and a redirect to `bone-age.app`) to Pages. Weights are
generated and cached as build artifacts, never committed to Git. Pages must use
**GitHub Actions** as the build source. Vercel builds the app on every push to
`main`, running `npm test` before `npm run build`; the browser tests stay in
Actions, where the weights exist.

The two deployments are independent: `manifest.json` travels with the weights, so
an older app and freshly published weights always agree on checksums and revision.

Model redistribution retains the Apache-2.0 license and modification notice in
`web/public/model-license.txt` and `web/public/model-notice.txt`; app code is MIT.

<p align="center">
  <img src="bone-age.png" width="600" alt="Bone age assessment screenshot">
</p>

## Disclaimer

**Experimental — not clinically validated.** Built as an engineering exercise to explore medical imaging inference. Only a radiologist's report has diagnostic value. Do not use for medical decisions.

## Why this model

The original [Deeplasia](https://github.com/aimi-bonn/Deeplasia) paper was the first choice, but the authors never published the pretrained checkpoints. `ianpan/bone-age` is a public alternative trained on the same RSNA dataset with comparable performance (MAE 4.16 vs. Deeplasia's 3.87 months) and includes native DICOM support.

## Image requirements

- **Left hand**, PA view, fingers up — matches training distribution
- All 5 fingers visible, wrist included, forearm cropped
- Manual crop recommended over the model's auto-crop (which can clip the thumb on rotated images)
- Screen photos work but degrade accuracy vs. original DICOM (gamma, glare, JPEG artifacts)

## Install

```bash
pip install -r requirements.txt
```

## Usage

```bash
python bone-age.py \
  --patient "Patient Example" \
  --dob 2023-07-17 \
  --sex female \
  --image example.tif
```

| Flag | Default | Description |
|------|---------|-------------|
| `--patient` | `Patient Example` | Patient name or identifier |
| `--dob` | `2023-07-17` | Date of birth (`YYYY-MM-DD`) |
| `--sex` | `female` | `male` or `female` |
| `--exam-date` | today | Exam date (`YYYY-MM-DD`) |
| `--image` | `example.tif` | Path to hand X-ray image (PNG/TIFF) |

The script preprocesses the image via histogram matching against the model's reference, runs inference, saves `{image}_result.md` to disk, and prints the report to the terminal.

## Model

| Detail | Value |
|--------|-------|
| Architecture | ConvNeXtV2-tiny 3-model ensemble |
| Parameters | 84.1M |
| Training data | RSNA Pediatric Bone Age 2017 |
| Training samples | 14,036 left-hand PA radiographs |
| MAE | 4.16 months (RSNA test set) |
| Input | 1-channel grayscale + sex |
| Preprocessing | Histogram matching |

## Notes on accuracy

- Bone age ≠ chronological age is normal in healthy children (±12 months variation)
- The model is sensitive to input quality — bad crop or skipped histogram matching can shift predictions by 10+ months
- This pipeline uses CPU inference (sufficient for single images)

## License

MIT
