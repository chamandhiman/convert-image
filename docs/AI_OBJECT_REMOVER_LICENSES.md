# AI Object Remover — Licensing & Provenance Documentation

This document records the exact licensing, provenance, and legal verification for all model weights, export repositories, and runtime dependencies used in the **AI Object Remover** feature (`/object-remover`) of the Convert Image web application.

---

## 1. Model Name & Specifications
- **Model Name**: Large Mask Inpainting with Fourier Convolutions (LaMa)
- **Model Checkpoint**: `big-lama` (Resolution-robust Large Mask Inpainting)
- **Exact File Name**: `lama_fp32.onnx`
- **File Size**: 208,044,816 bytes (~198.4 MB)
- **SHA-256 Checksum**: `1faef5301d78db7dda502fe59966957ec4b79dd64e16f03ed96913c7a4eb68d6`
- **Input Dimensions**:
  - `image`: `[1, 3, 512, 512]` `float32` in `[0.0, 1.0]` (NCHW format)
  - `mask`: `[1, 1, 512, 512]` `float32` in `{0.0, 1.0}` (NCHW format, 1.0 = area to inpaint)
- **Output Dimensions**:
  - `output`: `[1, 3, 512, 512]` `float32` in `[0.0, 255.0]` (NCHW format)
- **Local Storage Path**: `public/models/lama_fp32.onnx` (served same-origin for privacy and offline capability)

---

## 2. Model Provenance & Authorship Trail
1. **Original Research Project**:
   - **Repository**: [advimman/lama](https://github.com/advimman/lama)
   - **Research Paper**: *"Resolution-robust Large Mask Inpainting with Fourier Convolutions"*, WACV 2022
   - **Authors**: Roman Suvorov, Elizaveta Logacheva, Anton Mashikhin, Anastasia Remizova, Arsenii Ashukha, Aleksei Silvestrov, Naejin Kong, Harshith Goka, Kiwoong Park, Victor Lempitsky
   - **Affiliation**: Samsung Research / Skoltech
2. **ONNX Export Project**:
   - **Repository**: [Carve-Photos/lama](https://github.com/Carve-Photos/lama)
   - **Hugging Face Model Card**: [Carve/LaMa-ONNX](https://huggingface.co/Carve/LaMa-ONNX)
   - **Revision / SHA**: `c3c0c9e468934d62e79c329e35d82dd09ff8c444`

---

## 3. License Verification

### Original LaMa License
- **License**: **Apache License 2.0**
- **Copyright**: `Copyright (c) 2021 Samsung Research`
- **Official Repository License**: [advimman/lama LICENSE](https://github.com/advimman/lama/blob/main/LICENSE)

### ONNX Export License
- **License**: **Apache License 2.0**
- **Official Export Repository License**: [Carve-Photos/lama LICENSE](https://github.com/Carve-Photos/lama/blob/main/LICENSE)
- **Hugging Face Tag**: `license:apache-2.0`

### Runtime Dependency License
- **Runtime**: `onnxruntime-web` (v1.21.0)
- **Publisher**: Microsoft Corporation
- **License**: **MIT License**

---

## 4. Summary Table of Licenses

| Component | Asset / Package | Author / Organization | License | Commercial Use Permitted? |
|---|---|---|---|---|
| Inpainting Model | `big-lama` | Roman Suvorov et al. (Samsung Research) | Apache-2.0 | **Yes** |
| ONNX Export | `lama_fp32.onnx` | Carve Photos | Apache-2.0 | **Yes** |
| Inference Engine | `onnxruntime-web` | Microsoft Corporation | MIT | **Yes** |
| Application Shell | Convert Image UI | Site Owner | Proprietary | **Yes** |

---

## 5. Dataset Attribution & Commercial-Use Assessment

The original LaMa model was trained on the Places2 Challenge dataset (MIT) under permissive terms. Both the **Apache License 2.0** and the **MIT License** are permissive, non-copyleft open-source licenses that explicitly permit commercial use, redistribution, modification, and monetization on commercial/AdSense platforms without viral copyleft obligations. Neither license contains non-commercial restrictions (`-NC`), research-only clauses, or share-alike caveats.

---

## 6. Required Copyright & Attribution Notices

Under Section 4 of the Apache License 2.0, the copyright and disclaimer notices are reproduced as follows:

```text
Copyright 2021 Samsung Research
Copyright 2023 Carve Photos

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
