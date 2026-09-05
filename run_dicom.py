#!/usr/bin/env python3
"""Run the repository's inference pipeline on an explicitly cropped DICOM."""
import argparse
from datetime import date, datetime
import hashlib
import importlib.util
from importlib.metadata import version
from pathlib import Path
import shlex
import sys

import cv2
import numpy as np
import pydicom
import torch


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", type=Path, required=True)
    parser.add_argument("--dob", type=date.fromisoformat, required=True)
    parser.add_argument("--crop", nargs=4, type=int, required=True,
                        metavar=("X0", "Y0", "X1", "Y1"),
                        help="Visually verified left-hand box, exclusive upper bounds")
    parser.add_argument("--output-prefix", type=Path, required=True)
    args = parser.parse_args()

    spec = importlib.util.spec_from_file_location(
        "bone_age_repository", Path(__file__).with_name("bone-age.py"))
    pipeline = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(pipeline)
    ds = pydicom.dcmread(args.image)
    sex = {"M": "male", "F": "female"}.get(str(ds.get("PatientSex", "")))
    if sex is None:
        raise ValueError("DICOM must specify PatientSex M or F")
    exam_date = datetime.strptime(str(ds.StudyDate), "%Y%m%d").date()
    if args.dob > exam_date:
        raise ValueError("Birth date is after exam date")
    if int(ds.get("NumberOfFrames", 1)) != 1:
        raise ValueError("Only single-frame radiographs are supported")

    torch.set_num_threads(4)
    print("Loading repository model on CPU...", flush=True)
    model, ref = pipeline.load_model()
    img = model.load_image_from_dicom(str(args.image))
    if img is None or img.ndim != 2:
        raise ValueError("Could not decode grayscale DICOM")
    x0, y0, x1, y1 = args.crop
    height, width = img.shape
    if not (0 <= x0 < x1 <= width and 0 <= y0 < y1 <= height):
        raise ValueError("Crop is outside image bounds")

    prefix = args.output_prefix.resolve()
    prefix.parent.mkdir(parents=True, exist_ok=True)
    crop_path = Path(f"{prefix}_left.png")
    processed_path = Path(f"{prefix}_processed.png")
    tensor_path = Path(f"{prefix}_input.png")
    for path, array in [(Path(f"{prefix}_full.png"), img),
                        (crop_path, img[y0:y1, x0:x1])]:
        if not cv2.imwrite(str(path), array):
            raise OSError(f"Could not save {path}")

    processed = pipeline.preprocess(str(crop_path), ref)
    cv2.imwrite(str(processed_path), processed)
    tensor_image = model.preprocess(processed)
    cv2.imwrite(str(tensor_path), tensor_image.astype(np.uint8))
    print(f"Input: {img.shape}; crop: {args.crop}; sex: {sex}; "
          f"tensor image: {tensor_image.shape}", flush=True)
    print("Running repository infer_bone_age()...", flush=True)
    age = pipeline.infer_bone_age(model, processed, sex)
    if not np.isfinite(age):
        raise ValueError("Model returned a non-finite prediction")
    chrono = (exam_date - args.dob).days / 30.4375
    rounded = round(age)
    revision = getattr(model.config, "_commit_hash", None)
    packages = ["torch", "torchvision", "transformers", "timm", "albumentations",
                "pydicom", "numpy", "opencv-python", "scikit-image", "huggingface-hub"]
    report = "\n".join([
        "# Inferência local de idade óssea", "",
        f"- Idade óssea: **{age:.4f} meses** ({age / 12:.4f} anos).",
        f"- Arredondamento: **{rounded // 12} anos e {rounded % 12} meses**.",
        f"- Nascimento informado pelo usuário: {args.dob.isoformat()}.",
        f"- Data do exame (DICOM): {exam_date.isoformat()}.",
        f"- Idade cronológica: {chrono:.4f} meses.",
        f"- Diferença estimada: {age - chrono:+.4f} meses.",
        f"- Sexo usado (DICOM): {sex}.", "",
        f"Modelo: `{pipeline.MODEL_ID}`; revisão `{revision}`; "
        f"{model.num_models} redes; dispositivo CPU; modo eval/inference.",
        "Inferência executada por `infer_bone_age()` de `bone-age.py`.",
        "Decodificação pelo leitor DICOM nativo do modelo (VOI LUT, inversão "
        "MONOCHROME1 e conversão uint8); recorte manual da mão esquerda; "
        "histogram matching pelo `preprocess()` do repositório; "
        "redimensionamento e padding 512×512 pelo modelo.", "",
        f"Fonte local: `{args.image.resolve()}`.",
        f"SHA256 do DICOM: `{hashlib.sha256(args.image.read_bytes()).hexdigest()}`.",
        f"Recorte [x0,y0,x1,y1], origem superior esquerda: `{args.crop}`.",
        f"Imagem recortada: [{crop_path.name}]({crop_path.name}).",
        f"Entrada 512×512: [{tensor_path.name}]({tensor_path.name}).", "",
        "Resultado experimental, sem validação clínica para este paciente. "
        "O MAE publicado do conjunto de teste não é um intervalo de confiança individual. "
        "A diferença acima não estabelece diagnóstico de atraso ou avanço de maturação.", "",
        "## Reprodução", "", "```sh",
        shlex.join([sys.executable, str(Path(__file__).resolve()), *sys.argv[1:]]),
        "```", "", "## Ambiente", "",
        *[f"- {name}=={version(name)}" for name in packages], "",
    ])
    report_path = Path(f"{prefix}_result.md")
    report_path.write_text(report, encoding="utf-8")
    print(report, flush=True)
    print(f"Saved: {report_path}", flush=True)


if __name__ == "__main__":
    main()
