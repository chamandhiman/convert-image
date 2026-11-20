import { Zap, ShieldCheck, Sliders, Layers, FileImage, SlidersHorizontal, Scissors, Sparkles } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import ToolContentSection from '@/components/tool-content/ToolContentSection';
import SeoHead from '@/components/seo/SeoHead';

const steps = [
  {
    title: 'Upload Your Images',
    desc: 'Drag & drop one or multiple JPG, PNG, or WebP files from your phone or computer. Batch upload is fully supported.',
  },
  {
    title: 'Select Target Quality',
    desc: 'Choose your desired compression balance using the interactive slider from 10% to 100%, or choose an output format.',
  },
  {
    title: 'Compress Locally',
    desc: 'Click "Compress Images" to execute client-side discrete cosine transform and quantization without server latency.',
  },
  {
    title: 'Download Optimized Files',
    desc: 'Save your compressed images individually or download the full optimized batch in a single convenient ZIP file.',
  },
];

const features = [
  {
    title: 'Up to 80% Size Reduction',
    desc: 'Intelligent quantization reduces file weight dramatically while preserving photographic sharpness, vibrant colors, and smooth gradients.',
    icon: <Zap size={24} />,
  },
  {
    title: '100% Client-Side Privacy',
    desc: 'Compression runs directly inside your web browser via HTML5 Canvas. Your photos never upload to remote servers or third-party storage.',
    icon: <ShieldCheck size={24} />,
  },
  {
    title: 'Instant Batch Optimization',
    desc: 'Optimize dozens of photos in seconds. Process full image collections without waiting in server queues or paying for cloud API credits.',
    icon: <Layers size={24} />,
  },
  {
    title: 'Granular Quality Control',
    desc: 'Fine-tune quality percentages to balance file size against visual clarity for your exact website, printing, or archival needs.',
    icon: <Sliders size={24} />,
  },
];

const useCases = [
  {
    title: 'Website & Core Web Vitals',
    desc: 'Shrink massive hero banners and product images to drastically reduce Largest Contentful Paint (LCP) and boost SEO search rankings.',
  },
  {
    title: 'Email Attachments',
    desc: 'Compress camera captures and design exports to stay comfortably under standard 10 MB or 25 MB corporate email attachment limits.',
  },
  {
    title: 'Storage & Cloud Backup',
    desc: 'Save gigabytes of local and cloud storage by trimming unnecessary byte bloat from your photo galleries and project archives.',
  },
  {
    title: 'Mobile App Asset Bundling',
    desc: 'Reduce native iOS and Android application download bundle sizes by deploying optimized image assets.',
  },
];

const faqs = [
  {
    q: 'How does image compression work without losing quality?',
    a: 'Digital photos contain more mathematical color precision than the human eye can perceive. Intelligent lossy compression algorithms (like JPEG and WebP quantization) eliminate high-frequency redundant color variations while strictly retaining the primary luminance and edge structures that our eyes rely on for sharpness.',
  },
  {
    q: 'What is the ideal compression quality setting for web images?',
    a: 'For most website graphics and online galleries, an 80%–85% quality level hits the sweet spot. It typically reduces file size by 60%–75% while appearing virtually indistinguishable from the uncompressed original to viewers.',
  },
  {
    q: 'Can I compress PNG files with transparent backgrounds?',
    a: 'Yes! When you compress PNG images, Image Convert maintains the 32-bit RGBA alpha transparency channel, ensuring clean cutouts and logos without black or white halo artifacts.',
  },
  {
    q: 'Are my photos uploaded to your servers during compression?',
    a: 'No. Image Convert is built with a local-first philosophy. All compression mathematics execute inside your web browser\'s JavaScript engine using native Canvas APIs. Your photos never leave your device.',
  },
  {
    q: 'Can I compress multiple images at the same time?',
    a: 'Yes. You can upload dozens of photos simultaneously. The batch compressor applies your chosen settings across all items and provides both individual download buttons and a "Download All as ZIP" option.',
  },
  {
    q: 'Is there a file size limit or daily quota?',
    a: 'No. We enforce no arbitrary daily quotas, watermarks, or subscription paywalls. You can compress images up to 50 MB each as frequently as you like.',
  },
  {
    q: 'What is the difference between compressing and resizing?',
    a: 'Resizing alters the physical pixel dimensions of an image (e.g. from 4000×3000 px to 1920×1440 px). Compressing reduces the storage file size (in kilobytes or megabytes) by optimizing byte encoding while keeping the exact same pixel dimensions.',
  },
];

const relatedTools = [
  {
    name: 'Image Converter',
    description: 'Convert between JPG, PNG, WebP, GIF, and SVG formats.',
    href: ROUTES.convert,
    icon: <FileImage size={20} />,
  },
  {
    name: 'Resize Image',
    description: 'Change pixel dimensions or percentage with aspect ratio lock.',
    href: ROUTES.resize,
    icon: <SlidersHorizontal size={20} />,
  },
  {
    name: 'Remove Background',
    description: 'Isolate subjects and create transparent cutouts instantly.',
    href: ROUTES.removeBackground,
    icon: <Scissors size={20} />,
  },
  {
    name: 'Edit Image',
    description: 'Full-featured canvas editor with layers, text, shapes, and filters.',
    href: ROUTES.edit,
    icon: <Sparkles size={20} />,
  },
];

function CompressVisual() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(8px)',
          borderRadius: '16px',
          border: '1px solid rgba(124, 58, 237, 0.2)',
          boxShadow: '0 12px 32px rgba(124, 58, 237, 0.12)',
          maxWidth: '300px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#fee2e2',
              color: '#ef4444',
              fontWeight: 700,
              fontSize: '13px',
            }}
          >
            4.8 MB
          </div>
          <span style={{ fontSize: '18px', color: '#7C3AED', fontWeight: 'bold' }}>➔</span>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#dcfce7',
              color: '#15803d',
              fontWeight: 700,
              fontSize: '13px',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)',
            }}
          >
            640 KB (-87%)
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E1B4B' }}>Adaptive Quantization Engine</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Perceptual Clarity · Alpha Retained</div>
        </div>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#059669',
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          ✓ 100% In-Browser Compression
        </span>
      </div>
    </div>
  );
}

export function CompressContent() {
  return (
    <>
      <SeoHead
        title="Compress Images Online Free — Reduce Image File Size"
        description="Compress images online for free without losing quality. Shrink JPG, PNG, and WebP file sizes by up to 80% with 100% private in-browser optimization. Fast, batch support."
        canonicalPath={ROUTES.compress}
        keywords="compress image, compress photo, reduce image size, shrink image, photo compressor, image optimizer, free image compressor"
        toolName="Image Compressor"
        faqs={faqs}
      />
      <ToolContentSection
        badge="Free · In-Browser Optimizer"
        title="Compress Images Online Without Losing Quality"
        lead="Reduce image file size by up to 80% instantly while preserving crisp visual detail. 100% private in your browser with batch processing support."
        primaryCtaText="Compress Images Now"
        primaryCtaHref="#tool"
        secondaryCtaText="How Compression Works"
        secondaryCtaHref="#what-is"
        whatIsTitle="What is Image Compression?"
        whatIsLead="Explore the science behind perceptual image compression and how modern algorithms slash byte sizes."
        whatIsContent={[
          'Image compression is the process of encoding a graphic using fewer bytes than the raw pixel array. Uncompressed digital photos store 24 to 32 bits per pixel, leading to multi-megabyte file sizes that slow down web pages, consume mobile data, and fail email attachment size checks.',
          'Lossy compression techniques analyze spatial frequencies using Discrete Cosine Transforms (DCT) or wavelet decomposition, discarding imperceptible color nuances while preserving structural edges and luminance gradients. Lossless techniques, on the other hand, eliminate statistical redundancies via LZ77 dictionary encoding and Huffman trees without altering a single pixel value.',
          'With Image Convert by WebToolOcean, all compression routines run locally inside your browser using client-side Canvas and WebAssembly. Your photos are never uploaded to external servers, providing instantaneous compression without bandwidth wait times or privacy vulnerabilities.',
        ]}
        whatIsVisual={<CompressVisual />}
        stepsTitle="How to Compress Images in 4 Easy Steps"
        stepsLead="Optimize single photos or entire folders in seconds with zero complicated setup."
        steps={steps}
        featuresTitle="Why Choose Our Free Image Compressor"
        featuresLead="Maximum file reduction, uncompromising visual quality, and absolute privacy."
        features={features}
        useCasesTitle="Common Image Compression Use Cases"
        useCasesLead="Speed up web loading times, streamline file sharing, and reclaim disk space."
        useCases={useCases}
        privacyTitle="100% Private In-Browser Image Compression"
        privacyText="Your images contain private personal and business information. With Image Convert, all compression calculations execute locally on your device via HTML5 Canvas. Your files are never sent over the internet or stored on cloud servers."
        faqsTitle="Frequently Asked Questions"
        faqsLead="Answers to common questions about compressing image files online."
        faqs={faqs}
        relatedTitle="Explore More Free Image Tools"
        relatedLead="Complete suite of browser-based utilities to edit, optimize, and enhance your photos."
        relatedTools={relatedTools}
      />
    </>
  );
}

export default CompressContent;
