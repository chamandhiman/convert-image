import { SlidersHorizontal, ShieldCheck, Zap, Lock, Crop, FileImage, Scissors } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import ToolContentSection from '@/components/tool-content/ToolContentSection';
import SeoHead from '@/components/seo/SeoHead';

const steps = [
  {
    title: 'Upload Images',
    desc: 'Drag & drop one or multiple JPG, PNG, WebP, GIF, or SVG images into the resize zone.',
  },
  {
    title: 'Choose Mode & Size',
    desc: 'Select "Dimensions" to specify exact pixel width and height, or "Percentage" to scale down or up proportionally.',
  },
  {
    title: 'Lock Aspect Ratio',
    desc: 'Keep the aspect ratio lock enabled to automatically preserve natural proportions and prevent image distortion.',
  },
  {
    title: 'Resize & Download',
    desc: 'Click "Resize Images" to process files instantly in your browser, then download individual images or a ZIP archive.',
  },
];

const features = [
  {
    title: 'Sub-Pixel Precision',
    desc: 'High-quality bicubic resampling ensures sharp text, smooth diagonal edges, and natural gradients when scaling down or up.',
    icon: <SlidersHorizontal size={24} />,
  },
  {
    title: 'Aspect Ratio Lock',
    desc: 'Automatically recalculates proportional height when you change width (or vice versa), guaranteeing zero squishing or stretching.',
    icon: <Lock size={24} />,
  },
  {
    title: 'High-Speed Batch Resizing',
    desc: 'Resize tens of photos simultaneously to the exact same dimension or percentage with a single click.',
    icon: <Zap size={24} />,
  },
  {
    title: '100% In-Browser Privacy',
    desc: 'Image scaling occurs entirely on your device via HTML5 Canvas. Your photos never leave your computer or upload to servers.',
    icon: <ShieldCheck size={24} />,
  },
];

const useCases = [
  {
    title: 'Social Media Posts & Headers',
    desc: 'Resize photos to exact platform standards: Instagram posts (1080×1080), YouTube thumbnails (1280×720), and Twitter banners (1500×500).',
  },
  {
    title: 'E-Commerce Product Uniformity',
    desc: 'Standardize catalog listings across Shopify, Amazon, and WooCommerce with consistent square or rectangular pixel dimensions.',
  },
  {
    title: 'Email Newsletters & Documents',
    desc: 'Downscale heavy 24-megapixel camera photos to compact 800px widths to comply with email client attachment restrictions.',
  },
  {
    title: 'Web Banners & Hero Containers',
    desc: 'Match responsive CSS container slots exactly to eliminate layout shift (CLS) and maximize Google PageSpeed scores.',
  },
];

const faqs = [
  {
    q: 'What is the difference between resizing by dimensions vs percentage?',
    a: 'Resizing by dimensions lets you define explicit pixel targets (e.g., exactly 1200 pixels wide by 630 pixels tall), which is ideal for social media banners or fixed UI containers. Resizing by percentage scales the image relative to its original size (e.g., 50% reduces both width and height by half), which is perfect for general downscaling.',
  },
  {
    q: 'Will resizing make my images blurry or distorted?',
    a: 'Downscaling (making an image smaller) actually increases perceived sharpness when done with high-quality bicubic resampling. Upscaling (making an image significantly larger than its native resolution) with basic interpolation can look soft; for extreme enlargement, we recommend using our AI Image Upscaler tool.',
  },
  {
    q: 'Why should I lock the aspect ratio?',
    a: 'Aspect ratio is the proportional relationship between an image\'s width and height (e.g., 16:9, 4:3, 1:1). Locking the aspect ratio ensures that changing one dimension automatically adjusts the other proportionally, preventing your subject from looking squished or unnaturally stretched.',
  },
  {
    q: 'Does resizing reduce the file size of my image?',
    a: 'Yes! Reducing pixel dimensions directly cuts the total number of pixels that must be encoded. For example, scaling an image from 4000×3000 to 2000×1500 reduces total pixel count by 75%, resulting in dramatically smaller file sizes.',
  },
  {
    q: 'What file formats can I resize?',
    a: 'You can upload and resize all standard web image formats: JPG, JPEG, PNG, WebP, GIF, and SVG. Output can be saved as lossless PNG or quality-tuned JPG/WebP.',
  },
  {
    q: 'Is there any limit on how many images I can resize?',
    a: 'No. Because the resizing calculations happen entirely inside your browser using your device\'s local CPU and GPU, you can process unlimited photos completely free.',
  },
  {
    q: 'Are my images secure and private?',
    a: 'Completely. Your photos are never uploaded to any remote server or stored in the cloud. All operations execute inside your browser\'s sandbox.',
  },
];

const relatedTools = [
  {
    name: 'Compress Image',
    description: 'Shrink file sizes while maintaining native pixel dimensions.',
    href: ROUTES.compress,
    icon: <Zap size={20} />,
  },
  {
    name: 'Crop Image',
    description: 'Trim borders and crop to custom aspect ratios.',
    href: ROUTES.crop,
    icon: <Crop size={20} />,
  },
  {
    name: 'Image Converter',
    description: 'Convert between JPG, PNG, WebP, GIF, and SVG formats.',
    href: ROUTES.convert,
    icon: <FileImage size={20} />,
  },
  {
    name: 'Remove Background',
    description: 'Isolate subjects and create transparent cutouts instantly.',
    href: ROUTES.removeBackground,
    icon: <Scissors size={20} />,
  },
];

function ResizeVisual() {
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
            4000 × 3000 px
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
            1920 × 1080 px
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E1B4B' }}>Bicubic Canvas Resampling</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Aspect Ratio Lock · Sub-Pixel Precision</div>
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
          ✓ 100% In-Browser Scaling
        </span>
      </div>
    </div>
  );
}

export function ResizeContent() {
  return (
    <>
      <SeoHead
        title="Resize Images Online Free — Change Image Dimensions"
        description="Resize images online for free. Change image dimensions by exact pixels or percentage with aspect ratio lock. Batch resize JPG, PNG, and WebP 100% privately in your browser."
        canonicalPath={ROUTES.resize}
        keywords="resize image, resize photos, change image dimensions, pixel resizer, scale image, batch image resize, free image resizer"
        toolName="Image Resizer"
        faqs={faqs}
      />
      <ToolContentSection
        badge="Free · In-Browser Resizer"
        title="Resize Images Online by Pixels or Percentage"
        lead="Easily adjust image width, height, and scale while preserving aspect ratio and crisp visual quality. Process single images or entire batches with 100% privacy."
        primaryCtaText="Resize Images Now"
        primaryCtaHref="#tool"
        secondaryCtaText="How Resizing Works"
        secondaryCtaHref="#what-is"
        whatIsTitle="What is Image Resizing?"
        whatIsLead="Understand how pixel interpolation reshapes digital images without causing blurriness or distortion."
        whatIsContent={[
          'Image resizing is the mathematical process of recalculating the pixel grid dimensions of a digital graphic. When you scale an image down, the resampling algorithm analyzes clusters of neighboring source pixels and calculates an optimal weighted average (using bilinear or bicubic interpolation) to produce a crisp, downsampled output.',
          'Unlike CSS scaling—which only changes how large an image is rendered on a display while forcing the browser to download the original full-weight file—true pixel resizing alters the underlying file matrix. This dramatically reduces file weights, eliminates excessive GPU texture rendering on mobile devices, and satisfies Google Core Web Vitals criteria.',
          'Image Convert performs all image resampling locally in your browser using optimized HTML5 Canvas 2D contexts. Your images are never transmitted to third-party servers, guaranteeing zero upload delays, complete confidentiality, and instant downloads.',
        ]}
        whatIsVisual={<ResizeVisual />}
        stepsTitle="How to Resize Images in 4 Easy Steps"
        stepsLead="Scale images to exact dimensions in seconds without downloading heavy software."
        steps={steps}
        featuresTitle="Why Choose Our Image Resizer"
        featuresLead="Built for precision, high performance, and total user privacy."
        features={features}
        useCasesTitle="Common Image Resizing Scenarios"
        useCasesLead="Prepare images for web layouts, marketing campaigns, and social media feeds."
        useCases={useCases}
        privacyTitle="100% Private In-Browser Image Resizing"
        privacyText="Your personal photos and sensitive graphics remain strictly on your computer. All resampling mathematics are computed inside your browser sandbox using HTML5 Canvas—never sent to cloud servers or stored in remote databases."
        faqsTitle="Frequently Asked Questions"
        faqsLead="Answers to common questions about resizing images online."
        faqs={faqs}
        relatedTitle="Explore More Free Image Tools"
        relatedLead="Complete suite of browser-based utilities to edit, optimize, and enhance your photos."
        relatedTools={relatedTools}
      />
    </>
  );
}

export default ResizeContent;
