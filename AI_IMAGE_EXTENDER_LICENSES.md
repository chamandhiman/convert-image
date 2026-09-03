# AI Image Extender — Licensing & Model Verification

This document provides verified licensing, model provenance, and attribution details for the **AI Image Extender** feature in Convert Image.

---

## 1. Primary AI Model: LaMa (Large Mask Inpainting & Outpainting)

### Model Identity
- **Model Name:** LaMa (Resolution-robust Large Mask Inpainting with Fast Fourier Convolutions)
- **Model Variant Used:** `lama_fp32.onnx` (512×512 FFC-based inpainting/outpainting engine)
- **File Location:** `/public/models/lama_fp32.onnx`
- **Model Size:** 208,044,816 bytes (~198.4 MB)

### Authors & Copyright
- **Authors:** Roman Suvorov, Elizaveta Logacheva, Anton Mashikhin, Anastasia Remizova, Arsenii Ashukha, Aleksei Silvestrov, Naejin Kong, Harshith Goka, Kiwoong Park, Victor Lempitsky
- **Copyright Holder:** Copyright © Samsung AI Center Moscow & Samsung Research
- **Research Paper:** "Resolution-robust Large Mask Inpainting with Fourier Convolutions" (WACV 2022)
- **Official Repository:** [https://github.com/saic-mdal/lama](https://github.com/saic-mdal/lama)

### Licensing & Commercial Use
- **Code License:** Apache License 2.0
- **Model Weights License:** Apache License 2.0
- **Commercial Use Allowed:** **YES** (Permitted under Apache 2.0 terms)
- **Redistribution Rights:** Full commercial redistribution permitted with required copyright notice and license copy.

### Required Notice
```
Copyright © Samsung AI Center Moscow
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```

---

## 2. Runtime & Inference Engine

### ONNX Runtime Web
- **Package:** `onnxruntime-web` (v1.20+)
- **Execution Backends:** WebGPU (Hardware Accelerated) with automatic fallback to WebAssembly SIMD (`ort-wasm-simd-threaded.wasm` / `ort-wasm-simd-threaded.jsep.wasm`)
- **Copyright:** Copyright © Microsoft Corporation
- **License:** MIT License
- **Repository:** [https://github.com/microsoft/onnxruntime](https://github.com/microsoft/onnxruntime)
- **Commercial Use Allowed:** **YES**

---

## 3. Privacy & Processing Architecture

- **100% Client-Side:** All neural inference, canvas operations, tensor generation, and blending execute strictly inside the user's browser via a dedicated Web Worker thread.
- **Zero Server Uploads:** No user images, pixels, or metadata are ever transmitted to any remote server or paid API.
- **Offline Capable:** Once cached by the browser's Cache API / IndexedDB, the model runs without an internet connection.

---

## 4. Verification Summary

| Component | License | Commercial Use | Third-Party Server Required | Browser Local |
| :--- | :--- | :--- | :--- | :--- |
| **LaMa (`lama_fp32.onnx`)** | Apache 2.0 | ✅ Permitted | ❌ No (100% Local) | ✅ WebGPU / WASM |
| **ONNX Runtime Web** | MIT | ✅ Permitted | ❌ No (100% Local) | ✅ Client-side |
