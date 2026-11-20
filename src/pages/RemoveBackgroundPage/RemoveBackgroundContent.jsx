import { ShieldCheck, Sparkles, Layers, Zap, Image, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import ToolContentSection from '@/components/tool-content/ToolContentSection';
import SeoHead from '@/components/seo/SeoHead';

const steps = [
  {
    title: 'Upload Your Image',
    desc: 'Drag & drop any JPG, PNG, or WebP photo or select a file from your computer or phone. Files up to 25 MB are supported.',
  },
  {
    title: 'Automatic AI Segmentation',
    desc: 'Our embedded deep-learning neural network detects your subject instantly and computes a high-precision alpha transparency mask in your browser.',
  },
  {
    title: 'Preview Transparent Cutout',
    desc: 'Inspect your cutout against an interactive checkerboard grid, solid studio white, or dark background to verify clean edges.',
  },
  {
    title: 'Download Transparent PNG',
    desc: 'Download your cutout as a full-resolution 32-bit RGBA transparent PNG or clean JPEG with zero compression loss.',
  },
];

const features = [
  {
    title: '100% Client-Side Privacy',
    desc: 'Your photos are processed entirely within your device via WebAssembly. No images are ever uploaded, saved, or sent over a network.',
    icon: <ShieldCheck size={24} />,
  },
  {
    title: 'Sub-Pixel Edge Matting',
    desc: 'Advanced segmentation neural networks capture challenging contours like flyaway hair, fur, delicate jewelry, and transparent glassware without halo borders.',
    icon: <Sparkles size={24} />,
  },
  {
    title: 'Full Original Resolution',
    desc: 'Unlike server-based tools that downsample images to 500px, Image Convert preserves your full camera resolution for professional printing.',
    icon: <Layers size={24} />,
  },
  {
    title: 'Fast & Free Forever',
    desc: 'No credit cards, sign-ups, or credit limits. Process unlimited product shots and portraits instantly with zero waiting queues.',
    icon: <Zap size={24} />,
  },
];

const useCases = [
  {
    title: 'E-Commerce & Amazon Listings',
    desc: 'Create clean, compliant white or transparent product photos for Shopify, Amazon, eBay, and Etsy listings that increase conversion rates.',
  },
  {
    title: 'Profile Photos & Headshots',
    desc: 'Isolate yourself from cluttered backgrounds to create polished headshots for LinkedIn, resumes, speaker bios, and team directories.',
  },
  {
    title: 'Ad Creatives & Marketing Graphics',
    desc: 'Extract subjects and place them cleanly onto promotional banners, flyers, social media ads, and presentation pitch decks.',
  },
  {
    title: 'Logos, Signatures & Digital Art',
    desc: 'Strip solid white backgrounds from scanned paper signatures, company badges, and graphic icons for clean document placement.',
  },
];

const faqs = [
  {
    q: 'How does in-browser AI background removal work without uploading files?',
    a: 'Image Convert runs a lightweight, quantized deep convolutional segmentation model directly in your browser using WebAssembly (Wasm) and WebGPU hardware acceleration. The model executes on your computer\'s CPU or GPU locally, so your image bytes never leave your machine.',
  },
  {
    q: 'Can I download the result with a transparent background?',
    a: 'Yes! By default, the result is saved as a 32-bit RGBA PNG file with an alpha transparency channel. You can also preview and export the subject on solid white or custom background colors if preferred.',
  },
  {
    q: 'What image file formats and dimensions are supported?',
    a: 'You can upload standard image formats including JPG, JPEG, PNG, and WebP. Photos up to 25 MB and dimensions up to 4000×4000 pixels are processed smoothly on modern devices.',
  },
  {
    q: 'How does the AI handle difficult edges like hair, fur, and glass?',
    a: 'Our neural segmentation network performs soft alpha matting rather than a binary threshold mask. It assigns fractional opacity values to individual pixels along translucent edges, producing natural transitions for flyaway hair, animal fur, and semi-transparent objects.',
  },
  {
    q: 'Is there any limit on how many images I can process?',
    a: 'No. Because all computation is performed locally on your own hardware without consuming server bandwidth or third-party API credits, you can remove backgrounds from unlimited images 100% free of charge.',
  },
  {
    q: 'Will removing the background lower my image quality or DPI?',
    a: 'No. The transparency mask is calculated and applied to the original pixel matrix of your photo. The output PNG preserves your image\'s native pixel dimensions and color depth without lossy re-compression.',
  },
  {
    q: 'Can I use the cutout images for commercial projects?',
    a: 'Yes. You retain 100% ownership of your original photos and exported cutouts. They can be freely used for commercial e-commerce stores, client work, marketing campaigns, and print materials.',
  },
];

const relatedTools = [
  {
    name: 'Edit Image',
    description: 'Full-featured canvas editor with layers, text, shapes, and filters.',
    href: ROUTES.edit,
    icon: <Sparkles size={20} />,
  },
  {
    name: 'AI Object Remover',
    description: 'Erase unwanted tourists, clutter, cables, or watermarks using neural inpainting.',
    href: ROUTES.objectRemover,
    icon: <RefreshCw size={20} />,
  },
  {
    name: 'Compress Image',
    description: 'Reduce image file size by up to 80% without noticeable quality loss.',
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

function RemoveBackgroundVisual() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {/* Background checkerboard representation */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.15,
          backgroundImage: 'linear-gradient(45deg, #7C3AED 25%, transparent 25%), linear-gradient(-45deg, #7C3AED 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #7C3AED 75%), linear-gradient(-45deg, transparent 75%, #7C3AED 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          borderRadius: 'inherit',
        }}
      />
      {/* Cutout graphic representation */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(8px)',
          borderRadius: '16px',
          border: '1px solid rgba(124, 58, 237, 0.2)',
          boxShadow: '0 12px 32px rgba(124, 58, 237, 0.12)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C3AED 0%, #D946EF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)',
          }}
        >
          <Image size={32} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E1B4B' }}>Transparent Cutout (RGBA)</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Alpha Matting · Zero Halo · Lossless</div>
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
          ✓ Background Removed
        </span>
      </div>
    </div>
  );
}

export function RemoveBackgroundContent() {
  return (
    <>
      <SeoHead
        title="Remove Background from Image Free Online"
        description="Automatically remove background from any image online for free. Create transparent PNG cutouts instantly with 100% private in-browser AI processing."
        canonicalPath={ROUTES.removeBackground}
        keywords="remove background, transparent png, background eraser, free background remover, cut out image, remove bg, photo cutout"
        toolName="Background Remover"
        faqs={faqs}
      />
      <ToolContentSection
        badge="Free · In-Browser AI"
        title="Remove Backgrounds from Images Online"
        lead="Automatically isolate subjects and generate razor-sharp, transparent PNG cutouts in seconds — 100% free and completely private in your browser."
        primaryCtaText="Remove Background Now"
        primaryCtaHref="#tool"
        secondaryCtaText="See How It Works"
        secondaryCtaHref="#how-it-works"
        whatIsTitle="What is AI Background Removal?"
        whatIsLead="Understand how modern deep semantic segmentation creates flawless, artifact-free cutouts in real-time."
        whatIsContent={[
          'An AI Background Remover uses advanced convolutional neural networks trained on millions of diverse imagery samples to recognize the primary foreground subject—whether a human portrait, an e-commerce retail product, a pet, a vehicle, or a piece of furniture—and separate it from its surroundings.',
          'Traditional photo editing required tedious manual path-tracing or magnetic lasso tools that struggled with complex edges like loose strands of hair, animal fur, or transparent glass. Modern AI segmentation computes a full 8-bit alpha channel transparency mask that assigns granular, fractional opacity values to edge pixels. This eliminates unnatural pixelation, harsh borders, and chromatic halos.',
          'With Image Convert by WebToolOcean, this deep neural network runs entirely on client-side WebAssembly inside your browser. No pictures are uploaded across external networks, guaranteeing 100% data security, zero wait times, and limitless high-resolution exports.',
        ]}
        whatIsVisual={<RemoveBackgroundVisual />}
        stepsTitle="How to Remove Image Background in 4 Simple Steps"
        stepsLead="Extract crisp, clean subject cutouts without needing Photoshop or complex software."
        steps={steps}
        featuresTitle="Why Choose Our AI Background Remover"
        featuresLead="Engineered for high fidelity, uncompromising privacy, and everyday ease of use."
        features={features}
        useCasesTitle="Common Use Cases for Background Removal"
        useCasesLead="From marketplace listings to corporate branding, transparent cutouts elevate every visual."
        useCases={useCases}
        privacyTitle="Complete Privacy with Local In-Browser Processing"
        privacyText="Unlike traditional cloud-based photo editors that upload your sensitive images to third-party servers, Image Convert runs all AI segmentation models locally in your web browser. Your personal photos, client files, and sensitive documents never leave your computer."
        faqsTitle="Frequently Asked Questions"
        faqsLead="Find answers to common questions about our free online background remover."
        faqs={faqs}
        relatedTitle="Explore More Free Image Tools"
        relatedLead="Enhance, restore, compress, and convert your photos with our complete suite of browser-based utilities."
        relatedTools={relatedTools}
      />
    </>
  );
}

export default RemoveBackgroundContent;
