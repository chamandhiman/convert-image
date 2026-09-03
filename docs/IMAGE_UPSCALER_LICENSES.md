# AI Image Upscaler — Licensing & Provenance Documentation

This document records the exact licensing, origin, and legal verification for all model weights, export pipelines, and runtime dependencies used in the **AI Image Upscaler** feature (`/image-upscaler`) of the Convert Image web application.

---

## 1. Model Name
**`realesr-general-x4v3`** (SRVGGNetCompact Architecture, 4× Super-Resolution)

- **Input**: `[1, 3, height, width]` (RGB, float32 normalized in `[0, 1]`), dynamic spatial axes.
- **Output**: `[1, 3, 4*height, 4*width]` (RGB, float32).
- **Weight Size**: 4,866,417 bytes (~4.64 MB).
- **File Name**: `realesr-general-x4v3.onnx`.

---

## 2. Exact Model Source URL
- **Hugging Face Repository**: [CoderViking/realesr-general-x4v3-onnx](https://huggingface.co/CoderViking/realesr-general-x4v3-onnx)
- **Direct Download URL**: `https://huggingface.co/CoderViking/realesr-general-x4v3-onnx/resolve/main/realesr-general-x4v3.onnx`
- **Hosted Locally**: `public/models/realesr-general-x4v3.onnx` (served same-origin for zero network latency and complete privacy).

---

## 3. Exact Model License
**BSD 3-Clause "New" or "Revised" License**
- **SPDX Identifier**: `BSD-3-Clause`
- **Permits**: Commercial use, modification, redistribution, and sublicensing.
- **Conditions**: Retention of the original copyright notice and disclaimer.

---

## 4. Original Model License & Provenance
- **Original Source Weights**: `realesr-general-x4v3.pth` from the official Real-ESRGAN v0.2.5.0 release:
  - Repository: [xinntao/Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN)
  - Release Asset: `https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-x4v3.pth`
  - SHA256: `8dc7edb9ac80ccdc30c3a5dca6616509367f05fbc184ad95b731f05bece96292`
- **Original Author & Copyright**:
  - Copyright (c) 2021-2022, Xintao Wang and Real-ESRGAN Authors.
  - Licensed under the **BSD 3-Clause License**.

---

## 5. ONNX Conversion Source
- **Conversion Pipeline**: Clean, reproducible PyTorch 2.8.0 TorchScript exporter script `export_realesr.py` (CoderViking / AllPrivate).
- **Opset Version**: Opset 17 (`Add, Constant, Conv, DepthToSpace, PRelu, Resize`).
- **Graph Portability**: Free of non-standard operators, layout transposes, or unsupported clips; fully compatible with both WebGPU and WASM execution providers in ONNX Runtime Web.
- **Conversion License**: BSD 3-Clause (inherited directly from Real-ESRGAN).

---

## 6. ONNX Runtime Web License
- **Runtime**: `onnxruntime-web` (v1.21.0)
- **Publisher**: Microsoft Corporation
- **License**: **MIT License**
- **Permits**: Unrestricted commercial use and redistribution.

---

## 7. New NPM Dependencies
**None**. The upscaler reuses the existing `onnxruntime-web` dependency already present in the workspace. No additional packages were installed.

---

## 8. Summary of All Software & Asset Licenses

| Component | Asset / Package | License | Commercial Use Permitted? |
|---|---|---|---|
| Original Model Weights | `realesr-general-x4v3.pth` | BSD-3-Clause | **Yes** |
| ONNX Export | `realesr-general-x4v3.onnx` | BSD-3-Clause | **Yes** |
| Runtime Engine | `onnxruntime-web` | MIT | **Yes** |
| Web Application Code | Convert Image UI & Engine | Proprietary / Site Owner | **Yes** |

---

## 9. Why Commercial Use Is Permitted
Both **BSD 3-Clause** and **MIT** are permissive, non-copyleft open-source licenses. Neither license contains non-commercial restrictions (`-NC`), share-alike copyleft obligations (`-SA`), or viral copyleft clauses (such as GPL/AGPL). They explicitly grant permission to use, distribute, and monetize software and derived models in commercial web applications and AdSense-supported sites, subject only to maintaining copyright and disclaimer notices.

---

## 10. Required Attribution & Copyright Notice

The BSD 3-Clause license requires preserving the following notice in documentation and redistributions:

```text
Copyright (c) 2021-2022, Xintao Wang.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors
   may be used to endorse or promote products derived from this software without
   specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```
