import { Maximize, ShieldCheck, Zap, Sparkles, Scissors, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import ToolContentSection from '@/components/tool-content/ToolContentSection';
import SeoHead from '@/components/seo/SeoHead';

const steps = [
  {
    title: 'Upload Source Photo',
    desc: 'Select or drag & drop any JPG, PNG, or WebP photo into the outpainting workspace.',
  },
  {
    title: 'Choose Target Aspect Ratio',
    desc: 'Select your desired output framing: 16:9 Widescreen, 4:5 Instagram Portrait, 9:16 Vertical Story, or Custom Canvas.',
  },
  {
    title: 'Run In-Browser Outpainting',
    desc: 'Click "Extend Image" to execute LaMa neural outpainting shaders locally using WebGPU and WebAssembly.',
  },
  {
    title: 'Review & Download',
    desc: 'Inspect the seamlessly extended canvas boundaries, then download your full-resolution extended photo.',
  },
];

const features = [
  {
    title: 'Neural Background Synthesis',
    desc: 'Deep convolutional networks analyze lighting vectors, edge textures, and scene geometry to synthesize seamless canvas expansions.',
    icon: <Sparkles size={24} />,
  },
  {
    title: '100% Client-Side Privacy',
    desc: 'All neural model weights execute locally in your browser. Your images never leave your computer or upload to external servers.',
    icon: <ShieldCheck size={24} />,
  },
  {
    title: 'Social & Video Presets',
    desc: '1-click presets for YouTube banners (16:9), Instagram posts (4:5, 1:1), and mobile phone wallpapers (9:16).',
    icon: <Maximize size={24} />,
  },
  {
    title: 'Completely Free Forever',
    desc: 'No subscription tiers, credit meters, or watermarks. Extend as many images as you need with zero restrictions.',
    icon: <Zap size={24} />,
  },
];

const useCases = [
  {
    title: 'Portrait to Landscape Adaptation',
    desc: 'Convert vertical smartphone shots into cinematic 16:9 landscape wallpapers and desktop backgrounds.',
  },
  {
    title: 'Social Media Headers & Banners',
    desc: 'Extend background horizons to create wide Twitter headers, LinkedIn banners, and YouTube channel art.',
  },
  {
    title: 'E-Commerce Hero Containers',
    desc: 'Expand product photos horizontally to fit wide website hero sections and promotional landing page carousels.',
  },
  {
    title: 'Uncropping Tight Camera Frames',
    desc: 'Add breathing room around tightly cropped portraits, pets, or architectural photos without zooming out.',
  },
];

const faqs = [
  {
    q: 'What is AI image outpainting (uncropping)?',
    a: 'AI image outpainting—often called uncropping or image extension—is a neural vision technique that generates realistic visual content outside the original boundaries of a photograph. Rather than blurring or stretching edge pixels, the AI analyzes the visual patterns, textures, and lighting in your photo and synthesizes a natural continuation of the scene.',
  },
  {
    q: 'How does this tool process photos without uploading to a cloud server?',
    a: 'Image Convert runs a lightweight, optimized version of the LaMa (Large Mask Inpainting) model directly in your web browser using WebAssembly and WebGPU. Your device\'s local hardware computes the image pixels, ensuring complete confidentiality for your media.',
  },
  {
    q: 'What aspect ratios can I extend my images to?',
    a: 'We provide popular 1-click presets including 16:9 Widescreen (YouTube / TV), 4:5 Portrait (Instagram feed), 9:16 Vertical (Stories / TikTok), 1:1 Square, and fully customizable custom canvas margins.',
  },
  {
    q: 'Will the extended edges look blurry or artificial?',
    a: 'Our neural model utilizes Fast Fourier Convolutions designed specifically for high-receptive field texture synthesis. It naturally recreates complex backgrounds such as sky, grass, water, walls, and architectural structures with consistent lighting and grain.',
  },
  {
    q: 'What image file formats and dimensions are supported?',
    a: 'You can upload standard JPG, PNG, and WebP images up to 25 MB. Output can be saved as lossless PNG or compressed JPG.',
  },
  {
    q: 'Can I extend an image multiple times?',
    a: 'Yes! You can extend an image, download the result, and extend it further in any direction if needed.',
  },
  {
    q: 'Is this service completely free?',
    a: 'Yes, 100% free with no watermarks, daily quotas, or subscription fees.',
  },
];

const relatedTools = [
  {
    name: 'AI Object Remover',
    description: 'Erase unwanted people, wires, or watermarks using neural inpainting.',
    href: ROUTES.objectRemover,
    icon: <RefreshCw size={20} />,
  },
  {
    name: 'Convert Image',
    description: 'Convert between JPG, PNG, WebP, GIF, and modern formats.',
    href: ROUTES.convert,
    icon: <Sparkles size={20} />,
  },
  {
    name: 'Remove Background',
    description: 'Isolate subjects and create transparent cutouts instantly with AI.',
    href: ROUTES.removeBackground,
    icon: <Scissors size={20} />,
  },
  {
    name: 'Resize Image',
    description: 'Change pixel dimensions or percentage with aspect ratio lock.',
    href: ROUTES.resize,
    icon: <SlidersHorizontal size={20} />,
  },
];

function ExtenderVisual() {
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
            1:1 Square
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
            16:9 Widescreen
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E1B4B' }}>Neural Outpainting Engine</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Scene Continuity · WebGPU Shaders</div>
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
          ✓ 100% In-Browser Outpainting
        </span>
      </div>
    </div>
  );
}

export function ImageExtenderContent() {
  return (
    <>
      <SeoHead
        title="AI Image Extender Online Free — Outpaint & Expand Photos"
        description="Expand photo backgrounds and uncrop images online for free with AI. Extend to 16:9, 4:5, or custom canvas sizes with 100% private in-browser neural outpainting."
        canonicalPath={ROUTES.imageExtender}
        keywords="ai image extender, uncrop image online, outpainting free, expand photo background, extend canvas ai, widescreen photo extender"
        toolName="AI Image Extender"
        faqs={faqs}
      />
      <ToolContentSection
        badge="Neural Outpainting · Free"
        title="Expand Image Borders with AI Outpainting"
        lead="Uncrop photos and generate realistic background extensions to fit 16:9, 4:5, or custom aspect ratios in seconds. 100% private in your browser."
        primaryCtaText="Extend Photo Now"
        primaryCtaHref="#tool"
        secondaryCtaText="How Outpainting Works"
        secondaryCtaHref="#what-is"
        whatIsTitle="What is AI Image Outpainting?"
        whatIsLead="Learn how neural networks synthesize realistic environments beyond the original edges of a camera frame."
        whatIsContent={[
          'AI Image Outpainting (also called uncropping or image expansion) is an advanced computer vision technique that extends a picture\'s canvas beyond its original borders. Instead of simply mirroring or blurring border pixels, deep neural networks analyze the semantic structure of the scene—such as horizon orientation, perspective, architectural lines, and foliage—and generate a plausible continuation of the environment.',
          'Our client-side implementation uses Fast Fourier Convolutions (LaMa architecture) to capture global scene context. This allows the model to synthesize broad background features (like sweeping skies, ocean water, or wooden flooring) with realistic texture consistency and continuous lighting.',
          'With Image Convert by WebToolOcean, all outpainting calculations execute locally inside your web browser via WebGPU and WebAssembly. Your photos never leave your device, ensuring complete privacy, zero queue delays, and unlimited high-resolution exports.',
        ]}
        whatIsVisual={<ExtenderVisual />}
        stepsTitle="How to Extend Images in 4 Easy Steps"
        stepsLead="Expand photos to any aspect ratio in seconds without Photoshop."
        steps={steps}
        featuresTitle="Why Choose Our AI Image Extender"
        featuresLead="Advanced neural synthesis combined with absolute on-device privacy."
        features={features}
        useCasesTitle="Common AI Outpainting Scenarios"
        useCasesLead="Adapt existing photos to widescreen displays, social banners, and digital ads."
        useCases={useCases}
        privacyTitle="100% Private In-Browser AI Outpainting"
        privacyText="Your private photos, portraits, and creative assets remain strictly on your computer. All neural outpainting tensors and shader computations execute locally via WebGPU inside your browser sandbox—never sent to cloud servers or stored in remote databases."
        faqsTitle="Frequently Asked Questions"
        faqsLead="Answers to common questions about extending images online with AI."
        faqs={faqs}
        relatedTitle="Explore More Free Image Tools"
        relatedLead="Complete suite of browser-based utilities to edit, optimize, and enhance your photos."
        relatedTools={relatedTools}
      />
    </>
  );
}

export default ImageExtenderContent;
