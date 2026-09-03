# AI Photo Restorer — Licensing & Model Verification

This document provides verified licensing, model provenance, and attribution details for the **AI Photo Restorer** feature in Convert Image.

---

## 1. Primary Neural Restoration Model: Real-ESRGAN General (x4v3)

### Model Identity
- **Model Name:** Real-ESRGAN (General Photo Restoration & Super-Resolution)
- **Model Variant:** `realesr-general-x4v3.onnx` (Compact generalized restoration network)
- **Model Size:** 4,866,417 bytes (~4.64 MB)
- **File Location:** `/public/models/realesr-general-x4v3.onnx`

### Authors & Copyright
- **Author:** Xintao Wang (and contributors)
- **Copyright Holder:** Copyright (c) 2021, Xintao Wang
- **Official Repository:** [https://github.com/xinntao/Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN)
- **Research Paper:** "Real-ESRGAN: Training Real-World Blind Super-Resolution with Pure Synthetic Data" (ICCVW 2021)

### Licensing & Commercial Use
- **Software/Code License:** BSD 3-Clause License
- **Model Weights License:** BSD 3-Clause License
- **Commercial Use Allowed:** **YES** (Permitted under standard BSD-3-Clause terms)
- **Training Data Provenance:** Pure synthetic degradation pipeline (synthesizes blur, noise, compression, and sensor artifacts directly from permissively licensed base imagery without restrictive non-commercial datasets like FFHQ).

### Required BSD-3-Clause Notice
```
Copyright (c) 2021, Xintao Wang
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

---

## 2. Runtime & Inference Engine

### ONNX Runtime Web
- **Package:** `onnxruntime-web` (v1.20+)
- **Execution Providers:** WebGPU (Hardware Accelerated) with automatic fallback to WebAssembly SIMD (`ort-wasm-simd-threaded.jsep.wasm` / `ort-wasm-simd-threaded.wasm`)
- **Copyright:** Copyright © Microsoft Corporation
- **License:** MIT License
- **Repository:** [https://github.com/microsoft/onnxruntime](https://github.com/microsoft/onnxruntime)
- **Commercial Use Allowed:** **YES**

---

## 3. Privacy & Processing Architecture

- **100% Client-Side:** All neural inference, histogram dynamic range equalization, color cast correction, tensor tiling, and frequency synthesis execute strictly inside the user's browser via a dedicated Web Worker thread.
- **Zero Server Uploads:** No user images or pixels are ever transmitted to any remote server or third-party API.
- **Offline Capable:** The ultra-compact 4.64 MB model is cached locally by the browser's Cache API / IndexedDB.

---

## 4. Verification Summary

| Component | License | Commercial Use | Third-Party Server Required | Browser Local |
| :--- | :--- | :--- | :--- | :--- |
| **Real-ESRGAN General (`realesr-general-x4v3.onnx`)** | BSD-3-Clause | ✅ Permitted | ❌ No (100% Local) | ✅ WebGPU / WASM |
| **ONNX Runtime Web** | MIT | ✅ Permitted | ❌ No (100% Local) | ✅ Client-side |
