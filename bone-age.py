#!/usr/bin/env python3
import argparse
import sys
from datetime import date
from pathlib import Path

import cv2
import numpy as np
import torch
from huggingface_hub import hf_hub_download
from skimage.exposure import match_histograms
from transformers import AutoModel

MODEL_ID = "ianpan/bone-age"
MODEL_MAE_MONTHS = 4.16


def load_model():
    model = AutoModel.from_pretrained(MODEL_ID, trust_remote_code=True).eval()
    ref_path = hf_hub_download(MODEL_ID, "ref_img.png")
    ref = cv2.imread(ref_path, 0)
    if ref is None:
        raise FileNotFoundError(f"Failed to load reference image from {ref_path}")
    return model, ref


def preprocess(image_path: str, ref: np.ndarray) -> np.ndarray:
    img = cv2.imread(image_path, 0)
    if img is None:
        raise FileNotFoundError(f"Image not found: {image_path}")
    return match_histograms(img, ref).astype(np.uint8)


def infer_bone_age(model, img: np.ndarray, sex: str) -> float:
    x = torch.from_numpy(model.preprocess(img)).unsqueeze(0).unsqueeze(0).float()
    female = torch.tensor([1 if sex == "female" else 0])
    with torch.inference_mode():
        return model(x, female).item()


def build_report(patient: str, dob: date, sex: str, exam_date: date,
                 image: str, bone_age: float) -> str:
    chrono = (exam_date - dob).days / 30.4375
    diff = bone_age - chrono

    if abs(diff) <= MODEL_MAE_MONTHS:
        color, status = "\033[32m", "WITHIN MODEL ERROR MARGIN"
    elif abs(diff) <= 12:
        color, status = "\033[33m", "WITHIN NORMAL VARIATION (±12 months)"
    else:
        color, status = "\033[31m", "ABOVE EXPECTED NORMAL VARIATION"

    B, D, C_, R = "\033[1m", "\033[2m", "\033[36m", "\033[0m"
    hr = lambda c="─": f"{c * 64}"

    lines = []
    lines.append(f"{C_}{hr('━')}{R}")
    lines.append(f"{B}{C_}  BONE AGE ASSESSMENT — EXPERIMENTAL INFERENCE{R}")
    lines.append(f"{C_}{hr('━')}{R}")
    lines.append("")

    rows = [
        ("Patient", patient),
        ("Date of birth", dob.strftime("%d/%m/%Y")),
        ("Sex", sex),
        ("Exam date", exam_date.strftime("%d/%m/%Y")),
        ("Chronological age", f"{chrono:.1f} months ({chrono / 12:.2f} years)"),
        ("Inferred bone age", f"\033[35m{bone_age:.1f} months ({bone_age / 12:.2f} years){R}"),
        ("Difference", f"{'+' if diff >= 0 else '−'}{abs(diff):.1f} months vs. chronological"),
        ("Status", f"{color}● {status}{R}"),
    ]
    for k, v in rows:
        lines.append(f"  {B}{k:<19}{R} {v}")

    lines.append("")
    lines.append(f"{B}  Model:{R} {MODEL_ID} · ConvNeXtV2-tiny 3-model ensemble (84.1M params)")
    lines.append(f"  {B}Training:{R} RSNA Pediatric Bone Age 2017 · 14,036 left-hand PA radiographs")
    lines.append(f"  {B}Performance:{R} MAE {MODEL_MAE_MONTHS} months on RSNA test set")
    lines.append(f"  {B}Preprocessing:{R} histogram matching · grayscale + sex input")
    lines.append("")
    lines.append(f"  {D}Experimental inference — no clinical validity.{R}")
    lines.append(f"  {D}Screen photo input, not original DICOM.{R}")
    lines.append(f"  {D}Only the radiologist's report has diagnostic value.{R}")
    lines.append("")

    return "\n".join(lines)


def strip_ansi(text: str) -> str:
    import re
    return re.sub(r"\033\[[0-9;]*m", "", text)


def main():
    parser = argparse.ArgumentParser(
        description="Bone age assessment from hand radiographs (experimental)"
    )
    parser.add_argument("--patient", default="Patient Example", help="Patient name/identifier")
    parser.add_argument("--dob", default="2023-07-17", help="Date of birth (YYYY-MM-DD)")
    parser.add_argument("--sex", default="female", choices=["male", "female"], help="Biological sex")
    parser.add_argument("--exam-date", help="Exam date (YYYY-MM-DD), defaults to today")
    parser.add_argument("--image", default="example.png", help="Path to hand X-ray image (PNG)")
    args = parser.parse_args()

    try:
        dob = date.fromisoformat(args.dob)
    except ValueError:
        sys.exit(f"Error: invalid date format for --dob: {args.dob}. Use YYYY-MM-DD.")

    exam_date = date.today()
    if args.exam_date:
        try:
            exam_date = date.fromisoformat(args.exam_date)
        except ValueError:
            sys.exit(f"Error: invalid date format for --exam-date: {args.exam_date}. Use YYYY-MM-DD.")

    if not Path(args.image).exists():
        sys.exit(f"Error: image not found: {args.image}")

    print("Loading model...", file=sys.stderr)
    try:
        model, ref = load_model()
    except Exception as e:
        sys.exit(f"Error loading model: {e}")

    print("Preprocessing image...", file=sys.stderr)
    try:
        img = preprocess(args.image, ref)
    except Exception as e:
        sys.exit(f"Error preprocessing image: {e}")

    processed_path = Path(args.image).stem + "_processed.png"
    cv2.imwrite(processed_path, img)

    print("Running inference...", file=sys.stderr)
    try:
        bone_age = infer_bone_age(model, img, args.sex)
    except Exception as e:
        sys.exit(f"Error during inference: {e}")

    report = build_report(args.patient, dob, args.sex, exam_date, args.image, bone_age)

    # Write result
    md_path = Path(__file__).resolve().parent / f"{Path(args.image).stem}_result.md"
    md_path.write_text(strip_ansi(report), encoding="utf-8")
    print(f"Saved: {md_path}", file=sys.stderr)

    # Print to terminal
    print(report)


if __name__ == "__main__":
    main()
