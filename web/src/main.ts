import "./style.css";
import { decodeFile } from "./decode";
import {
  chronologicalMonths,
  rotateClockwise,
  validateCrop,
} from "./processing";
import type { Crop, GrayImage, Result } from "./types";

const el = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const fileInput = el<HTMLInputElement>("file-input");
const sex = el<HTMLSelectElement>("sex");
const dob = el<HTMLInputElement>("dob");
const exam = el<HTMLInputElement>("exam-date");
const confirmed = el<HTMLInputElement>("confirm-hand");
const canvas = el<HTMLCanvasElement>("image-canvas");
const ctx = canvas.getContext("2d")!;
const source = document.createElement("canvas");
const sourceCtx = source.getContext("2d")!;
const base = new URL("./", document.baseURI).href;
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
exam.value = today();
let image: GrayImage | undefined;
let filename = "";
let crop: Crop = { x0: 0, y0: 0, x1: 0, y1: 0 };
let worker: Worker | undefined;
let result: Result | undefined;
let busy = false,
  fileGeneration = 0;
let dragging: { x: number; y: number } | undefined;
const number = (n: number, digits = 1) =>
  n.toLocaleString("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
const ageText = (months: number) => {
  const rounded = Math.round(months),
    years = Math.floor(rounded / 12),
    m = rounded % 12;
  return `${years} ${years === 1 ? "ano" : "anos"} e ${m} ${m === 1 ? "mês" : "meses"}`;
};
const localDate = (s: string) => s.split("-").reverse().join("/");

function error(message: string) {
  el("error").textContent = message;
  el("error").hidden = false;
}
function notice(message: string) {
  el("notice").textContent = message;
  el("notice").hidden = false;
}
function invalidateResult() {
  result = undefined;
  el("result").hidden = true;
  el("step-3").classList.remove("active");
}
function refresh() {
  let validDates = true;
  el("chrono").textContent = "—";
  try {
    if (!exam.value) validDates = false;
    if (dob.value && exam.value)
      el("chrono").textContent = ageText(
        chronologicalMonths(dob.value, exam.value),
      );
  } catch {
    validDates = false;
    el("chrono").textContent = "Verifique as datas";
  }
  el<HTMLButtonElement>("analyze").disabled =
    busy ||
    !image ||
    !sex.value ||
    !confirmed.checked ||
    !validDates ||
    !validateCrop(crop, image.width, image.height);
}
function setBusy(value: boolean) {
  busy = value;
  if (value) dragging = undefined;
  el<HTMLFieldSetElement>("exam-fields").disabled = value;
  for (const id of ["prepare", "clear-cache", "rotate", "full-crop", "replace"])
    el<HTMLButtonElement>(id).disabled = value;
  for (const id of ["x0", "y0", "x1", "y1"])
    el<HTMLInputElement>(id).disabled = value;
  fileInput.disabled = value;
  el("cancel").hidden = !value;
  el("progress-area").hidden = !value;
  refresh();
}
function syncCrop() {
  for (const key of ["x0", "y0", "x1", "y1"] as const)
    el<HTMLInputElement>(key).value = String(crop[key]);
  confirmed.checked = false;
  invalidateResult();
  refresh();
  draw();
}
function draw() {
  if (!image) return;
  ctx.drawImage(source, 0, 0);
  ctx.fillStyle = "#08130ba8";
  ctx.fillRect(0, 0, image.width, crop.y0);
  ctx.fillRect(0, crop.y1, image.width, image.height - crop.y1);
  ctx.fillRect(0, crop.y0, crop.x0, crop.y1 - crop.y0);
  ctx.fillRect(crop.x1, crop.y0, image.width - crop.x1, crop.y1 - crop.y0);
  ctx.strokeStyle = "#d5e7b8";
  ctx.lineWidth = Math.max(2, image.width / 350);
  ctx.setLineDash([image.width / 100, image.width / 150]);
  ctx.strokeRect(crop.x0, crop.y0, crop.x1 - crop.x0, crop.y1 - crop.y0);
  ctx.setLineDash([]);
}
function showImage() {
  if (!image) return;
  source.width = canvas.width = image.width;
  source.height = canvas.height = image.height;
  const rgba = sourceCtx.createImageData(image.width, image.height);
  for (let i = 0; i < image.pixels.length; i++) {
    rgba.data[4 * i] =
      rgba.data[4 * i + 1] =
      rgba.data[4 * i + 2] =
        image.pixels[i];
    rgba.data[4 * i + 3] = 255;
  }
  sourceCtx.putImageData(rgba, 0, 0);
  crop = { x0: 0, y0: 0, x1: image.width, y1: image.height };
  syncCrop();
  el("viewer").hidden = false;
  el("dropzone").hidden = true;
  el("image-format").textContent = image.format;
  el("file-info").textContent =
    `${filename} · ${image.width} × ${image.height}`;
  el("step-2").classList.add("active");
}
async function openFile(file: File) {
  if (busy) return;
  const generation = ++fileGeneration;
  invalidateResult();
  image = undefined;
  el("viewer").hidden = true;
  el("dropzone").hidden = false;
  el("error").hidden = el("notice").hidden = true;
  setBusy(true);
  el("progress-label").textContent = "Abrindo radiografia localmente…";
  el("progress-percent").textContent = "";
  el<HTMLProgressElement>("progress").removeAttribute("value");
  try {
    const decoded = await decodeFile(file);
    if (generation !== fileGeneration) return;
    image = decoded;
    filename = file.name;
    sex.value = image.sex || "";
    dob.value = image.dob || "";
    exam.value = image.examDate || today();
    showImage();
    if (image.sex || image.dob || image.examDate)
      notice(
        "Os campos disponíveis foram preenchidos pelo DICOM. Confira os dados e selecione a mão esquerda antes de calcular.",
      );
  } catch (e) {
    if (generation === fileGeneration)
      error(
        e instanceof Error ? e.message : "Não foi possível abrir este arquivo.",
      );
  } finally {
    if (generation === fileGeneration) setBusy(false);
  }
}
const choose = () => {
  if (!busy) fileInput.click();
};
fileInput.addEventListener("change", () => {
  if (fileInput.files?.[0]) void openFile(fileInput.files[0]);
  fileInput.value = "";
});
el("dropzone").addEventListener("click", choose);
el("dropzone").addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    choose();
  }
});
el("replace").addEventListener("click", choose);
for (const name of ["dragenter", "dragover"])
  el("dropzone").addEventListener(name, (e) => {
    e.preventDefault();
    if (!busy) el("dropzone").classList.add("dragging");
  });
for (const name of ["dragleave", "drop"])
  el("dropzone").addEventListener(name, (e) => {
    e.preventDefault();
    el("dropzone").classList.remove("dragging");
  });
el("dropzone").addEventListener("drop", (event) => {
  const files = (event as DragEvent).dataTransfer?.files;
  if (files?.length && !busy) {
    if (files.length !== 1) error("Selecione uma radiografia por vez.");
    else void openFile(files[0]);
  }
});
function pointer(event: PointerEvent) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(
    rect.width / image!.width,
    rect.height / image!.height,
  );
  return {
    x: Math.round(
      Math.max(
        0,
        Math.min(
          image!.width,
          (event.clientX -
            rect.left -
            (rect.width - image!.width * scale) / 2) /
            scale,
        ),
      ),
    ),
    y: Math.round(
      Math.max(
        0,
        Math.min(
          image!.height,
          (event.clientY -
            rect.top -
            (rect.height - image!.height * scale) / 2) /
            scale,
        ),
      ),
    ),
  };
}
canvas.addEventListener("pointerdown", (event) => {
  if (!image || busy) return;
  dragging = pointer(event);
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (!dragging || !image) return;
  const p = pointer(event);
  crop = {
    x0: Math.min(p.x, dragging.x),
    y0: Math.min(p.y, dragging.y),
    x1: Math.max(p.x, dragging.x),
    y1: Math.max(p.y, dragging.y),
  };
  syncCrop();
});
for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
  canvas.addEventListener(name, () => {
    dragging = undefined;
  });
for (const key of ["x0", "y0", "x1", "y1"] as const)
  el<HTMLInputElement>(key).addEventListener("input", () => {
    crop[key] = Number(el<HTMLInputElement>(key).value);
    confirmed.checked = false;
    invalidateResult();
    refresh();
    if (image && validateCrop(crop, image.width, image.height)) draw();
  });
el("rotate").addEventListener("click", () => {
  if (image && !busy) {
    image = rotateClockwise(image);
    showImage();
  }
});
el("full-crop").addEventListener("click", () => {
  if (image) {
    crop = { x0: 0, y0: 0, x1: image.width, y1: image.height };
    syncCrop();
  }
});
for (const input of [sex, dob, exam, confirmed])
  input.addEventListener("input", () => {
    invalidateResult();
    refresh();
  });

function finishWorker() {
  worker?.terminate();
  worker = undefined;
  setBusy(false);
}
function run(mode: "prepare" | "infer") {
  if (busy) return;
  if (mode === "infer" && (!image || !sex.value || !confirmed.checked)) return;
  el("error").hidden = el("notice").hidden = true;
  invalidateResult();
  setBusy(true);
  el("progress-label").textContent = "Preparando modelo local…";
  el("progress-percent").textContent = "";
  el<HTMLProgressElement>("progress").value = 0;
  el("progress-detail").textContent =
    mode === "infer"
      ? "Três redes são executadas em sequência. Isso pode levar alguns minutos."
      : "Somente arquivos públicos do modelo serão baixados.";
  worker = new Worker(new URL("./inference.worker.ts", import.meta.url), {
    type: "module",
  });
  worker.onerror = (event) => {
    error(
      event.message ||
        "O worker foi interrompido. Feche outras abas para liberar memória e tente novamente.",
    );
    finishWorker();
  };
  worker.onmessage = ({ data }) => {
    if (data.type === "progress") {
      const labels: Record<string, string> = {
        cache: "Lendo cache",
        download: "Baixando pesos",
        compute: "Calculando",
        done: "Rede concluída",
      };
      el("progress-label").textContent =
        `${labels[data.stage]} · rede ${data.fold + 1}/3`;
      const percent = Math.round(
        (100 *
          (data.fold +
            (data.stage === "compute"
              ? 0.7
              : data.stage === "done"
                ? 1
                : data.fraction * (mode === "infer" ? 0.65 : 1)))) /
          3,
      );
      el<HTMLProgressElement>("progress").value = percent;
      el("progress-percent").textContent = `${percent}%`;
    } else if (data.type === "notice") notice(data.message);
    else if (data.type === "error") {
      error(data.message);
      finishWorker();
    } else if (data.type === "ready") {
      finishWorker();
      el("model-status").textContent =
        "Download concluído. Pesos disponíveis para cálculo local; cache sujeito ao espaço do navegador.";
      if (el("notice").hidden)
        notice(
          "Download concluído. Você já pode abrir uma radiografia e executar o modelo.",
        );
    } else if (data.type === "result") {
      result = {
        ...data,
        crop: { ...crop },
        sex: sex.value as "male" | "female",
        dob: dob.value,
        examDate: exam.value,
      };
      finishWorker();
      showResult(result!);
      el("model-status").textContent =
        "Modelo executado neste navegador. Os pesos baixados são reutilizados quando o cache está disponível.";
    }
  };
  worker.postMessage({
    base,
    mode,
    image: mode === "infer" ? image : undefined,
    crop,
    sex: sex.value,
  });
}
el("prepare").addEventListener("click", () => run("prepare"));
el("analysis-form").addEventListener("submit", (e) => {
  e.preventDefault();
  refresh();
  if (!el<HTMLButtonElement>("analyze").disabled) run("infer");
});
el("cancel").addEventListener("click", () => {
  ++fileGeneration;
  finishWorker();
  notice("Processamento cancelado. Nenhum resultado parcial foi apresentado.");
});
el("clear-cache").addEventListener("click", async () => {
  try {
    for (const key of await caches.keys())
      if (key.startsWith("bone-age-weights-")) await caches.delete(key);
    el("model-status").textContent =
      "Cache de pesos removido. O próximo cálculo precisará baixar ~340 MB.";
    notice("Os pesos do modelo foram removidos do cache deste navegador.");
  } catch {
    error("O navegador não permite acessar o cache neste modo.");
  }
});
function showResult(r: Result) {
  el("result-age").textContent = ageText(r.months);
  el("result-months").textContent =
    `${number(r.months, 2)} meses · média das três redes`;
  const chrono = r.dob ? chronologicalMonths(r.dob, r.examDate) : undefined;
  el("result-chrono").textContent =
    chrono === undefined ? "Não informada" : ageText(chrono);
  el("result-date").textContent = `Exame em ${localDate(r.examDate)}`;
  const diff = chrono === undefined ? undefined : r.months - chrono;
  el("result-difference").textContent =
    diff === undefined
      ? "—"
      : `${diff >= 0 ? "+" : "−"}${number(Math.abs(diff))} meses`;
  el("execution-details").textContent =
    `${r.model} · revisão ${r.revision} · ONNX FP32 · WebAssembly/CPU · ${number(r.seconds)} s · redes: ${r.folds.map((m) => number(m, 4)).join(" / ")} meses · recorte: ${Object.values(r.crop).join(", ")} · sexo: ${r.sex === "male" ? "masculino" : "feminino"}.`;
  el("result").hidden = false;
  el("step-3").classList.add("active");
  el("result").scrollIntoView({ behavior: "smooth", block: "start" });
}
el("download-report").addEventListener("click", () => {
  if (!result) return;
  const r = result,
    chrono = r.dob ? chronologicalMonths(r.dob, r.examDate) : undefined;
  const report = [
    "# Estimativa experimental de idade óssea",
    "",
    `- Idade óssea estimada: **${number(r.months, 4)} meses (${ageText(r.months)})**.`,
    `- Sexo: ${r.sex === "male" ? "masculino" : "feminino"}.`,
    `- Nascimento: ${r.dob ? localDate(r.dob) : "não informado"}.`,
    `- Exame: ${localDate(r.examDate)}.`,
    `- Idade cronológica: ${chrono === undefined ? "não informada" : `${number(chrono, 4)} meses`}.`,
    `- Diferença: ${chrono === undefined ? "não calculada" : `${number(r.months - chrono, 4)} meses`}.`,
    "",
    `Modelo: ${r.model}, revisão ${r.revision}.`,
    "Execução local no navegador: ONNX FP32, WebAssembly/CPU, três redes.",
    `Saídas individuais (meses): ${r.folds.map((v) => number(v, 4)).join("; ")}.`,
    `Tempo incluindo carregamento: ${number(r.seconds)} segundos.`,
    `Recorte [x0, y0, x1, y1] na imagem orientada: [${Object.values(r.crop).join(", ")}].`,
    "Pré-processamento: decodificação local, recorte manual, ajuste de histograma, interpolação bilinear, padding 512×512.",
    "",
    "Resultado experimental. Não é um laudo nem estabelece diagnóstico. O erro médio publicado não é um intervalo de confiança individual.",
    "Nenhuma imagem ou dado do exame foi enviado a servidores.",
    "",
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([report], { type: "text/markdown;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `idade-ossea-${r.examDate}.md`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
el("reset").addEventListener("click", () => {
  ++fileGeneration;
  finishWorker();
  invalidateResult();
  image = undefined;
  filename = "";
  dragging = undefined;
  source.width = source.height = canvas.width = canvas.height = 0;
  sex.value = dob.value = fileInput.value = "";
  exam.value = today();
  confirmed.checked = false;
  el("viewer").hidden = true;
  el("dropzone").hidden = false;
  el("error").hidden = el("notice").hidden = true;
  el("image-format").textContent = "ARQUIVO LOCAL";
  el("file-info").textContent = "";
  el("step-2").classList.remove("active");
  refresh();
});
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  navigator.serviceWorker
    .register(new URL("sw.js", base), { scope: new URL("./", base).pathname })
    .catch(() =>
      notice(
        "O navegador não habilitou o modo offline. A execução local continua disponível com conexão.",
      ),
    );
}
refresh();
