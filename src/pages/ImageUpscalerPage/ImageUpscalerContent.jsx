import { ShieldCheck, Cpu, Zap, Sparkles, Scissors, SlidersHorizontal } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import ToolContentSection from '@/components/tool-content/ToolContentSection';
import SeoHead from '@/components/seo/SeoHead';

const steps = [
  {
    title: 'Upload Low-Res Photo',
    desc: 'Drag & drop any JPG, PNG, or WebP photo into the upscale workspace from your computer or mobile device.',
  },
  {
    title: 'Select Upscale Factor',
    desc: 'Choose 2× for fast web optimization or 4× for maximum detail synthesis and high-DPI print preparation.',
  },
  {
    title: 'Run In-Browser Neural Model',
    desc: 'Click "Upscale Image" to execute Real-ESRGAN super-resolution shaders locally via WebGPU and WebAssembly.',
  },
  {
    title: 'Compare & Download',
    desc: 'Slide the before-and-after comparison divider to inspect synthesized details, then download your crisp HD image.',
  },
];

const features = [
  {
    title: 'Neural Super-Resolution',
    desc: 'Trained on millions of real-world photographic degradations to reconstruct fine hair, sharp text, and realistic textures.',
    icon: <Sparkles size={24} />,
  },
  {
    title: '100% Client-Side Privacy',
    desc: 'The entire neural network runs locally inside your browser. Your images never leave your machine or upload to external servers.',
    icon: <ShieldCheck size={24} />,
  },
  {
    title: 'Tiled Memory Processing',
    desc: 'Overlapping tile convolutions ensure steady browser memory management without crashing on massive 4000px source photos.',
    icon: <Cpu size={24} />,
  },
  {
    title: 'Completely Free Forever',
    desc: 'No credit systems, subscription paywalls, watermarks, or sign-up hurdles. Upscale unlimited images at zero cost.',
    icon: <Zap size={24} />,
  },
];

const useCases = [
  {
    title: 'High-DPI Print Preparation',
    desc: 'Enlarge digital camera snapshots and graphics to 300 DPI canvas sizes for crisp physical poster, frame, and apparel printing.',
  },
  {
    title: 'Digital Art & Illustrations',
    desc: 'Sharpen digital drawings, anime wallpapers, and renders without chromatic aberration or blurry interpolation halos.',
  },
  {
    title: 'E-Commerce Product Zoom',
    desc: 'Boost resolution on product catalog thumbnails so online shoppers can inspect material textures and details up close.',
  },
  {
    title: 'Archival & Old Photo Enhancement',
    desc: 'Reconstruct low-resolution vintage scans, phone camera snaps, and compressed web graphics into crystal-clear images.',
  },
];

const faqs = [
  {
    q: 'How does AI super-resolution differ from standard photo resizing?',
    a: 'Traditional photo resizing (like bilinear or bicubic interpolation) simply duplicates or averages neighboring pixel values, which inevitably makes enlarged photos look fuzzy or blurry. In contrast, AI super-resolution (powered by deep convolutional neural networks) understands real-world shapes, textures, and lighting, synthesizing plausible high-frequency details that were lost during capture or compression.',
  },
  {
    q: 'Are my images uploaded to any remote server or stored in the cloud?',
    a: 'No. The neural network runs entirely inside your web browser using WebAssembly and WebGPU hardware acceleration. Your images never leave your device, ensuring total privacy for sensitive client media and personal photographs.',
  },
  {
    q: 'Why does the first upscale take a few moments to initialize?',
    a: 'On your very first use, your browser downloads the compact ~4.6 MB AI model weights into its local browser cache. Once cached, subsequent upscales initialize almost instantaneously from local memory.',
  },
  {
    q: 'How does 2× upscaling work when the base neural model is 4×?',
    a: 'Our engine runs the neural network to synthesize razor-sharp details at 4×, and then downsamples the resulting high-frequency tensor to 2× using high-precision bicubic filtering. This produces an exceptionally sharp, clean 2× image with zero interpolation artifacts.',
  },
  {
    q: 'What is the maximum resolution image I can upscale?',
    a: 'Because our engine utilizes an overlapping tiled architecture, it comfortably processes images up to 3000×3000 pixels on most desktop devices without exceeding browser memory limits.',
  },
  {
    q: 'Are there any watermarks or hidden charges on the downloaded images?',
    a: 'None whatsoever. All tools on Image Convert by WebToolOcean are completely free with no watermarks, subscriptions, or restrictions.',
  },
  {
    q: 'Can I use upscaled images for commercial merchandise and printing?',
    a: 'Yes! You retain 100% intellectual property ownership of your original and upscaled images. You may freely use them for commercial e-commerce, print-on-demand merchandise, and advertising.',
  },
];

const relatedTools = [
  {
    name: 'AI Photo Restorer',
    description: 'Sharpen blurry photos, repair faded vintage prints, and fix scratches.',
    href: ROUTES.photoRestorer,
    icon: <Sparkles size={20} />,
  },
  {
    name: 'Remove Background',
    description: 'Isolate subjects and create transparent cutouts instantly with AI.',
    href: ROUTES.removeBackground,
    icon: <Scissors size={20} />,
  },
  {
    name: 'Compress Image',
    description: 'Reduce file size by up to 80% without noticeable quality loss.',
    href: ROUTES.compress,
    icon: <Zap size={20} />,
  },
  {
    name: 'Resize Image',
    description: 'Change pixel dimensions or percentage with aspect ratio lock.',
    href: ROUTES.resize,
    icon: <SlidersHorizontal size={20} />,
  },
];

function UpscalerVisual() {
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
              background: '#e2e8f0',
              color: '#475569',
              fontWeight: 700,
              fontSize: '12px',
            }}
          >
            500 × 500 px
          </div>
          <span style={{ fontSize: '18px', color: '#7C3AED', fontWeight: 'bold' }}>➔</span>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #D946EF 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
            }}
          >
            2000 × 2000 px (4× HD)
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E1B4B' }}>Real-ESRGAN Super-Resolution</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Sub-Pixel Synthesis · 300 DPI Ready</div>
        </div>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '9999px',
            background: 'rgba(124, 58, 237, 0.1)',
            color: '#7C3AED',
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          ✓ WebGPU Shaders · 100% In-Browser
        </span>
      </div>
    </div>
  );
}

export function ImageUpscalerContent() {
  return (
    <>
      <SeoHead
        title="AI Image Upscaler Online Free — 2x & 4x Super-Resolution"
        description="Upscale images online for free with AI. Enhance resolution by 2x or 4x without losing quality. 100% private in-browser neural super-resolution powered by WebGPU."
        canonicalPath={ROUTES.upscaler}
        keywords="ai image upscaler, upscale image free, image super resolution, enlarge image without losing quality, 4k image enhancer, 4x upscaler online"
        toolName="AI Image Upscaler"
        faqs={faqs}
      />
      <ToolContentSection
        badge="Neural Super-Resolution · Free"
        title="Upscale Images Online with AI Super-Resolution"
        lead="Enlarge photos by 2× or 4× while synthesizing sharp details and textures in seconds. 100% private, accelerated by your device's GPU."
        primaryCtaText="Upscale Image Now"
        primaryCtaHref="#tool"
        secondaryCtaText="How AI Upscaling Works"
        secondaryCtaHref="#what-is"
        whatIsTitle="What is AI Image Super-Resolution?"
        whatIsLead="Understand how deep neural networks reconstruct lost high-frequency details from low-resolution source files."
        whatIsContent={[
          'AI Image Super-Resolution is a computational technique that generates a plausible high-resolution image from a low-resolution input. Unlike legacy interpolation algorithms that simply calculate intermediate color averages, neural networks understand semantic visual structures—such as eyelash contours, fabric weaves, brick patterns, and tree foliage.',
          'Our pipeline uses the state-of-the-art Real-ESRGAN architecture, which utilizes high-capacity residual dense blocks trained with perceptual and adversarial loss functions. It effectively reverses blur, camera sensor noise, and JPEG blockiness simultaneously.',
          'With Image Convert by WebToolOcean, the entire model is executed directly within your web browser using WebGPU compute shaders and WebAssembly. Your photos are never uploaded across external networks, ensuring absolute privacy, zero latency, and limitless high-resolution exports.',
        ]}
        whatIsVisual={<UpscalerVisual />}
        stepsTitle="How to Upscale Images in 4 Easy Steps"
        stepsLead="Transform low-resolution graphics into razor-sharp 4K images in seconds."
        steps={steps}
        featuresTitle="Why Choose Our AI Image Upscaler"
        featuresLead="Cutting-edge neural synthesis combined with absolute on-device privacy."
        features={features}
        useCasesTitle="Common AI Upscaling Use Cases"
        useCasesLead="Prepare images for physical printing, high-res displays, and digital art portfolios."
        useCases={useCases}
        privacyTitle="100% Private In-Browser AI Upscaling"
        privacyText="Your private photos, artwork, and client media remain strictly on your computer. All neural network tensors and shader computations execute locally via WebGPU inside your browser sandbox—never sent to cloud servers or stored in remote databases."
        faqsTitle="Frequently Asked Questions"
        faqsLead="Answers to common questions about upscaling images online with AI."
        faqs={faqs}
        relatedTitle="Explore More Free Image Tools"
        relatedLead="Complete suite of browser-based utilities to edit, optimize, and enhance your photos."
        relatedTools={relatedTools}
      />
    </>
  );
}

export default ImageUpscalerContent;
