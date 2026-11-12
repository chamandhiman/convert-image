import { Crop, ShieldCheck, Zap, Sliders, Scissors, FileImage, SlidersHorizontal } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import ToolContentSection from '@/components/tool-content/ToolContentSection';
import SeoHead from '@/components/seo/SeoHead';

const steps = [
  {
    title: 'Upload Your Image',
    desc: 'Select or drag & drop any JPG, PNG, or WebP photo into the crop workspace.',
  },
  {
    title: 'Select Aspect Ratio',
    desc: 'Choose a standard preset like 1:1 Square, 16:9 Landscape, 4:3 Classic, or 9:16 Vertical Story, or use Freeform mode.',
  },
  {
    title: 'Adjust Crop Frame',
    desc: 'Drag the crop box and positioning handles over your subject using the rule-of-thirds grid for perfect composition.',
  },
  {
    title: 'Download Cropped Image',
    desc: 'Click "Crop Image" to execute client-side canvas cropping, then download your full-resolution cropped photo instantly.',
  },
];

const features = [
  {
    title: 'Aspect Ratio Presets',
    desc: 'Instant 1-click presets for Instagram (1:1, 4:5), YouTube thumbnails (16:9), TikTok/Reels (9:16), and standard print ratios (3:2, 4:3).',
    icon: <Crop size={24} />,
  },
  {
    title: 'Rule of Thirds Grid',
    desc: 'Interactive 3×3 compositional grid overlay helps you align focal points and horizon lines for professional photographic aesthetics.',
    icon: <Sliders size={24} />,
  },
  {
    title: 'Original Pixel Quality',
    desc: 'Canvas cropping extracts original sub-pixels directly from raw source memory without resampling blur or lossy compression degradation.',
    icon: <Zap size={24} />,
  },
  {
    title: '100% Local Privacy',
    desc: 'Cropping executes entirely within your browser via HTML5 Canvas. Your photos are never sent to external servers or cloud databases.',
    icon: <ShieldCheck size={24} />,
  },
];

const useCases = [
  {
    title: 'Social Media Profiles & Stories',
    desc: 'Crop square avatars for Twitter, LinkedIn, and Discord, or vertical 9:16 framing for Instagram Stories and TikTok clips.',
  },
  {
    title: 'E-Commerce Product Framing',
    desc: 'Remove unnecessary margins and center products in standardized square 1:1 ratios for Shopify, Amazon, and Etsy storefronts.',
  },
  {
    title: 'YouTube & Video Thumbnails',
    desc: 'Frame eye-catching 16:9 landscape crops that highlight expressions and action moments to maximize video click-through rates (CTR).',
  },
  {
    title: 'Print & Wall Art Framing',
    desc: 'Adapt digital camera photos to standard photo frame sizes (4×6, 5×7, 8×10) without uneven border cropping.',
  },
];

const faqs = [
  {
    q: 'How is cropping different from resizing an image?',
    a: 'Cropping cuts away unwanted outer areas of an image, changing the visible composition and boundary frame. Resizing changes the pixel dimensions of the entire image (shrinking or enlarging it) without cutting away any content.',
  },
  {
    q: 'Does cropping reduce the resolution or quality of my photo?',
    a: 'Cropping only removes the pixels outside your selected bounding box. The remaining pixels inside the cropped region retain 100% of their original camera sharpness, color depth, and clarity without any compression degradation.',
  },
  {
    q: 'What standard aspect ratios are available in the cropper?',
    a: 'We provide presets for Freeform (any custom rectangle), 1:1 (Square for Instagram/avatars), 16:9 (Widescreen for YouTube/displays), 4:3 (Standard photography/tablet), 9:16 (Vertical for Stories/TikTok), and 3:2 (Classic 35mm DSLR).',
  },
  {
    q: 'Can I crop PNG images with transparent backgrounds?',
    a: 'Yes! When cropping a transparent PNG, the alpha transparency channel is completely preserved throughout the canvas export.',
  },
  {
    q: 'Are my images uploaded to your server when I crop them?',
    a: 'No. All cropping mathematics are computed on your device using client-side HTML5 Canvas. Your photos never leave your computer or phone.',
  },
  {
    q: 'What is the Rule of Thirds and why is it useful?',
    a: 'The Rule of Thirds is a classic photographic composition guideline that divides an image into nine equal parts using two horizontal and two vertical lines. Placing your subject or horizon along these lines or their intersections creates more balanced, engaging, and dynamic images.',
  },
  {
    q: 'Is there any limit on how many photos I can crop?',
    a: 'No. Image Convert is 100% free with unlimited usage, no watermarks, and no sign-up requirements.',
  },
];

const relatedTools = [
  {
    name: 'Resize Image',
    description: 'Change pixel dimensions or percentage with aspect ratio lock.',
    href: ROUTES.resize,
    icon: <SlidersHorizontal size={20} />,
  },
  {
    name: 'Compress Image',
    description: 'Reduce file size by up to 80% without noticeable quality loss.',
    href: ROUTES.compress,
    icon: <Zap size={20} />,
  },
  {
    name: 'Remove Background',
    description: 'Isolate subjects and create transparent cutouts instantly.',
    href: ROUTES.removeBackground,
    icon: <Scissors size={20} />,
  },
  {
    name: 'Image Converter',
    description: 'Convert between JPG, PNG, WebP, GIF, and modern image formats.',
    href: ROUTES.convert,
    icon: <FileImage size={20} />,
  },
];

function CropVisual() {
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
            16:9 Landscape
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
            1:1 Square
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E1B4B' }}>Precision Aspect Framing</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Rule of Thirds · Lossless Canvas Crop</div>
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
          ✓ 100% In-Browser Cropping
        </span>
      </div>
    </div>
  );
}

export function CropContent() {
  return (
    <>
      <SeoHead
        title="Crop Image Online Free — Crop Photos to Any Aspect Ratio"
        description="Crop images online for free. Trim and frame photos to 1:1, 16:9, 4:3, or custom aspect ratios with a rule-of-thirds grid. 100% private in-browser cropping."
        canonicalPath={ROUTES.crop}
        keywords="crop image, crop photo online, crop picture, square crop, 16:9 crop, photo trimmer, free image cropper"
        toolName="Image Cropper"
        faqs={faqs}
      />
      <ToolContentSection
        badge="Free · In-Browser Cropper"
        title="Crop Images Online to Any Aspect Ratio"
        lead="Easily trim borders, center subjects, and adapt photos to popular social media and print dimensions in seconds with zero quality loss."
        primaryCtaText="Crop Image Now"
        primaryCtaHref="#tool"
        secondaryCtaText="How Cropping Works"
        secondaryCtaHref="#what-is"
        whatIsTitle="What is Image Cropping?"
        whatIsLead="Discover how composition framing transforms ordinary pictures into compelling visual stories."
        whatIsContent={[
          'Image cropping is the selective removal of outer edges from a photograph to alter its aspect ratio, eliminate distracting background elements, or enhance visual focus on the primary subject. By reframing a shot, you direct the viewer\'s eye directly to focal elements.',
          'Classical visual arts rely heavily on compositional principles such as the Rule of Thirds and the Golden Ratio. By positioning eyes, faces, or horizon lines along key grid intersections, you create visual tension and balance that feels natural to human psychology.',
          'With Image Convert by WebToolOcean, the cropping tool uses high-performance HTML5 Canvas APIs running locally on your computer or phone. Your photos are never sent to remote cloud servers, guaranteeing complete privacy and instantaneous processing.',
        ]}
        whatIsVisual={<CropVisual />}
        stepsTitle="How to Crop Images in 4 Easy Steps"
        stepsLead="Frame your photos with precision in seconds without downloading expensive software."
        steps={steps}
        featuresTitle="Why Choose Our Free Image Cropper"
        featuresLead="Preset ratios, compositional guides, and absolute client-side privacy."
        features={features}
        useCasesTitle="Common Image Cropping Scenarios"
        useCasesLead="Optimize photos for digital platforms, marketing collaterals, and print frames."
        useCases={useCases}
        privacyTitle="100% Private In-Browser Image Cropping"
        privacyText="Your private photos, portraits, and creative assets remain completely secure on your device. All canvas slice and blit operations execute in your browser—never sent to cloud servers or stored in remote databases."
        faqsTitle="Frequently Asked Questions"
        faqsLead="Answers to common questions about cropping images online."
        faqs={faqs}
        relatedTitle="Explore More Free Image Tools"
        relatedLead="Complete suite of browser-based utilities to edit, optimize, and enhance your photos."
        relatedTools={relatedTools}
      />
    </>
  );
}

export default CropContent;
