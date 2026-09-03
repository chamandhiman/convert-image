import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './LicensesPage.module.css';

/**
 * AI Models & Licenses page.
 *
 * Provides proper attribution and licensing information for all open-source
 * AI models and runtime libraries used by Convert Image.
 */
function LicensesPage() {
  useDocumentTitle('AI Models & Licenses');

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>AI Models &amp; Licenses</h1>
      <p className={styles.pageIntro}>
        Convert Image uses open-source software and machine-learning models to
        provide certain image-processing features. All processing happens
        entirely in your browser — no images are uploaded to any server. This
        page provides attribution and licensing information for those components.
      </p>

      <div className={styles.modelCards}>
        {/* ================================================================ */}
        {/*  LaMa — Object Remover                                          */}
        {/* ================================================================ */}
        <div className={styles.modelCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.modelName}>LaMa</h2>
            <span className={styles.licenseBadge}>Apache 2.0</span>
          </div>

          <dl className={styles.metaList}>
            <dt className={styles.metaLabel}>Full Name</dt>
            <dd className={styles.metaValue}>
              Resolution-robust Large Mask Inpainting with Fourier Convolutions
            </dd>

            <dt className={styles.metaLabel}>Used By</dt>
            <dd className={styles.metaValue}>AI Object Remover, AI Image Extender &amp; AI Generative Fill</dd>

            <dt className={styles.metaLabel}>Model File</dt>
            <dd className={styles.metaValue}>lama_fp32.onnx</dd>

            <dt className={styles.metaLabel}>Authors</dt>
            <dd className={styles.metaValue}>
              Roman Suvorov, Elizaveta Logacheva, Anton Mashikhin, Anastasia
              Remizova, Arsenii Ashukha, Aleksei Silvestrov, Naejin Kong,
              Harshith Goka, Kiwoong Park, Victor Lempitsky
            </dd>

            <dt className={styles.metaLabel}>Affiliation</dt>
            <dd className={styles.metaValue}>
              Samsung AI Center Moscow &amp; Samsung Research
            </dd>

            <dt className={styles.metaLabel}>License</dt>
            <dd className={styles.metaValue}>
              <a
                href="https://github.com/saic-mdal/lama/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
              >
                Apache License 2.0
              </a>
            </dd>

            <dt className={styles.metaLabel}>Source</dt>
            <dd className={styles.metaValue}>
              <a
                href="https://github.com/saic-mdal/lama"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/saic-mdal/lama
              </a>
            </dd>

            <dt className={styles.metaLabel}>Paper</dt>
            <dd className={styles.metaValue}>
              <a
                href="https://arxiv.org/abs/2109.07161"
                target="_blank"
                rel="noopener noreferrer"
              >
                arXiv:2109.07161 (WACV 2022)
              </a>
            </dd>
          </dl>

          <div className={styles.noticeBlock}>
            <p className={styles.noticeTitle}>Required Attribution</p>
            <p className={styles.noticeText}>
              {`Copyright © Samsung AI Center Moscow\nLicensed under the Apache License, Version 2.0.\nYou may obtain a copy of the License at\nhttps://www.apache.org/licenses/LICENSE-2.0`}
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/*  Real-ESRGAN — Image Upscaler                                   */}
        {/* ================================================================ */}
        <div className={styles.modelCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.modelName}>Real-ESRGAN</h2>
            <span className={styles.licenseBadge}>BSD-3-Clause</span>
          </div>

          <dl className={styles.metaList}>
            <dt className={styles.metaLabel}>Full Name</dt>
            <dd className={styles.metaValue}>
              Real-ESRGAN: Training Real-World Blind Super-Resolution with Pure
              Synthetic Data
            </dd>

            <dt className={styles.metaLabel}>Used By</dt>
            <dd className={styles.metaValue}>AI Image Upscaler &amp; AI Photo Restorer</dd>

            <dt className={styles.metaLabel}>Model File</dt>
            <dd className={styles.metaValue}>realesr-general-x4v3.onnx (4× upscaling)</dd>

            <dt className={styles.metaLabel}>Author</dt>
            <dd className={styles.metaValue}>Xintao Wang</dd>

            <dt className={styles.metaLabel}>License</dt>
            <dd className={styles.metaValue}>
              <a
                href="https://github.com/xinntao/Real-ESRGAN/blob/master/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
              >
                BSD 3-Clause License
              </a>
            </dd>

            <dt className={styles.metaLabel}>Source</dt>
            <dd className={styles.metaValue}>
              <a
                href="https://github.com/xinntao/Real-ESRGAN"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/xinntao/Real-ESRGAN
              </a>
            </dd>

            <dt className={styles.metaLabel}>Paper</dt>
            <dd className={styles.metaValue}>
              <a
                href="https://arxiv.org/abs/2107.10833"
                target="_blank"
                rel="noopener noreferrer"
              >
                arXiv:2107.10833 (ICCVW 2021)
              </a>
            </dd>
          </dl>

          <div className={styles.noticeBlock}>
            <p className={styles.noticeTitle}>Required BSD-3-Clause Notice</p>
            <p className={styles.noticeText}>
              {`Copyright (c) 2021, Xintao Wang\nAll rights reserved.\n\nRedistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:\n\n1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.\n\n2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.\n\n3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.\n\nTHIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`}
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/*  @imgly/background-removal — Background Remover                 */}
        {/* ================================================================ */}
        <div className={styles.modelCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.modelName}>@imgly/background-removal</h2>
            <span className={styles.licenseBadge}>AGPL-3.0</span>
          </div>

          <dl className={styles.metaList}>
            <dt className={styles.metaLabel}>Description</dt>
            <dd className={styles.metaValue}>
              Client-side background removal library using the IS-Net
              segmentation model (isnet_quint8 variant)
            </dd>

            <dt className={styles.metaLabel}>Used By</dt>
            <dd className={styles.metaValue}>Background Remover</dd>

            <dt className={styles.metaLabel}>Author</dt>
            <dd className={styles.metaValue}>IMG.LY GmbH</dd>

            <dt className={styles.metaLabel}>License</dt>
            <dd className={styles.metaValue}>
              <a
                href="https://github.com/imgly/background-removal-js/blob/main/LICENSE.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                GNU Affero General Public License v3.0
              </a>
            </dd>

            <dt className={styles.metaLabel}>Source</dt>
            <dd className={styles.metaValue}>
              <a
                href="https://github.com/imgly/background-removal-js"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/imgly/background-removal-js
              </a>
            </dd>
          </dl>

          <div className={styles.noticeBlock}>
            <p className={styles.noticeTitle}>Required Attribution</p>
            <p className={styles.noticeText}>
              {`Copyright © IMG.LY GmbH\nLicensed under the GNU Affero General Public License v3.0.\nhttps://www.gnu.org/licenses/agpl-3.0.html`}
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/*  Additional Runtime Libraries                                      */}
      {/* ================================================================== */}
      <div className={styles.additionalSection}>
        <h2 className={styles.sectionTitle}>Runtime Libraries</h2>
        <p className={styles.sectionText}>
          The AI models above run in your browser using the following
          open-source inference runtime:
        </p>
        <ul className={styles.runtimeList}>
          <li className={styles.runtimeItem}>
            <strong>ONNX Runtime Web</strong>
            <span>
              — MIT License ·{' '}
              <a
                href="https://github.com/microsoft/onnxruntime"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/microsoft/onnxruntime
              </a>
              {' '}· © Microsoft Corporation
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default LicensesPage;
