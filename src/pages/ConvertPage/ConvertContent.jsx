import { Layers, ShieldCheck, Zap, FileImage, SlidersHorizontal, Scissors, Sparkles } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import ToolContentSection from '@/components/tool-content/ToolContentSection';
import SeoHead from '@/components/seo/SeoHead';

const steps = [
  {
    title: 'Upload Your Images',
    desc: 'Drag & drop single or multiple JPG, PNG, WebP, GIF, or SVG files into the upload box. Batch upload is fully supported.',
  },
  {
    title: 'Choose Output Format',
    desc: 'Select your target format (PNG, JPG, WebP, GIF, BMP). If converting to lossy formats, customize the quality slider from 10% to 100%.',
  },
  {
    title: 'Convert in Browser',
    desc: 'Click "Convert Images" to transform your files instantly using client-side HTML5 Canvas and WebAssembly engines.',
  },
  {
    title: 'Download Converted Files',
    desc: 'Save individual converted images immediately or download your entire batch organized in a single ZIP archive.',
  },
];

const features = [
  {
    title: '100% Local Privacy',
    desc: 'All conversion math occurs inside your web browser using HTML5 Canvas. Your photos never leave your device or upload to cloud servers.',
    icon: <ShieldCheck size={24} />,
  },
  {
    title: 'High-Speed Batch Mode',
    desc: 'Convert tens of photos at once with unified format and quality settings. No server queue delays or bandwidth throttling.',
    icon: <Zap size={24} />,
  },
  {
    title: 'Universal Format Engine',
    desc: 'Seamlessly convert between JPG, PNG, WebP, GIF, SVG, BMP, and TIFF with intelligent color profile and transparency retention.',
    icon: <FileImage size={24} />,
  },
  {
    title: 'Custom Quality Controls',
    desc: 'Fine-tune output file sizes with real-time compression quality sliders, optimizing your pictures for web performance or print.',
    icon: <Layers size={24} />,
  },
];

const useCases = [
  {
    title: 'Website & SEO Optimization',
    desc: 'Convert heavy PNGs and JPGs to lightweight modern WebP format to dramatically improve Google Core Web Vitals and page speed.',
  },
  {
    title: 'Transparent Graphic Design',
    desc: 'Convert JPG logos, illustrations, and icons to PNG with full alpha channel support for easy compositing in Figma, Canva, or Photoshop.',
  },
  {
    title: 'Photography & Portfolio Sharing',
    desc: 'Convert raw or large camera exports into universal JPEG format with customized compression for email attachments and portfolio sites.',
  },
  {
    title: 'Archival & Print Prep',
    desc: 'Convert compressed web graphics into uncompressed formats or uniform dimensions ready for high-resolution physical printing.',
  },
];

const faqs = [
  {
    q: 'Is this image converter really 100% free with no limits?',
    a: 'Yes! Image Convert by WebToolOcean is completely free. There are no daily conversion quotas, file count restrictions, paywalls, or watermarks. Because all processing executes on your device, we don\'t incur cloud server compute costs that need to be passed on.',
  },
  {
    q: 'How are my files converted without being uploaded to a server?',
    a: 'Our converter leverages modern HTML5 Canvas, the File API, and WebAssembly. When you drop an image onto the page, the browser decodes the source pixel data into local memory and encodes it into the target format right on your machine.',
  },
  {
    q: 'What is the best format to convert my images to for the web?',
    a: 'For modern websites and applications, WebP is strongly recommended. WebP offers 25%–35% smaller file sizes than comparable JPEGs and PNGs while retaining high visual fidelity, full alpha transparency, and wide support across all modern browsers.',
  },
  {
    q: 'Will converting a JPG to a PNG create a transparent background?',
    a: 'Converting a JPG to PNG will change the file structure to the PNG standard, but it will not automatically make the background transparent because the original JPG has no transparency channel. To remove the background, use our dedicated AI Background Remover tool.',
  },
  {
    q: 'Can I convert multiple images simultaneously?',
    a: 'Yes. You can select or drop dozens of photos at once. You can customize quality for the entire batch and download all converted images individually or packed cleanly into a single ZIP file.',
  },
  {
    q: 'Does format conversion reduce image quality?',
    a: 'Converting to lossless formats like PNG preserves pixel data without degradation. Converting to lossy formats like JPG or WebP allows you to choose your desired balance between file size and visual fidelity via the interactive quality slider.',
  },
  {
    q: 'Can I convert images on my mobile phone or tablet?',
    a: 'Yes. Our converter is fully responsive and optimized for mobile Safari, Chrome, and Firefox on iOS and Android devices without requiring app installations.',
  },
];

const relatedTools = [
  {
    name: 'Compress Image',
    description: 'Reduce file size up to 80% without noticeable quality loss.',
    href: ROUTES.compress,
    icon: <Zap size={20} />,
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

function ConvertVisual() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(8px)',
          borderRadius: '16px',
          border: '1px solid rgba(124, 58, 237, 0.2)',
          boxShadow: '0 12px 32px rgba(124, 58, 237, 0.12)',
          maxWidth: '300px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: '#3b82f6',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '13px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}
          >
            JPG
          </div>
          <span style={{ fontSize: '18px', color: '#7C3AED', fontWeight: 'bold' }}>➔</span>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #D946EF 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '13px',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
            }}
          >
            WebP
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E1B4B' }}>Universal Multi-Format Engine</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>JPG · PNG · WebP · GIF · SVG · BMP</div>
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
          ✓ In-Browser HTML5 Canvas
        </span>
      </div>
    </div>
  );
}

export function ConvertContent() {
  return (
    <>
      <SeoHead
        title="Convert Image Online — Free Multi-Format Converter by WebToolOcean"
        description="Convert images online for free. Convert JPG to PNG, PNG to JPG, WebP, GIF, and more with 100% private in-browser processing. Fast, secure, batch support."
        canonicalPath={ROUTES.convert}
        keywords="image converter, convert image, convert image online, jpg to png, png to jpg, image to webp, convert photos online, batch image converter, free image converter"
        toolName="Convert Image"
        faqs={faqs}
      />
      <ToolContentSection
        badge="Free · In-Browser Multi-Format"
        title="Convert Image Online for Free"
        lead="Quickly convert pictures between JPG, PNG, WebP, GIF, SVG, BMP, and TIFF right in your browser. Batch processing, customizable quality, zero uploads."
        primaryCtaText="Convert Image Now"
        primaryCtaHref="#tool"
        secondaryCtaText="Supported Formats"
        secondaryCtaHref="#what-is"
        whatIsTitle="What is an Online Image Converter?"
        whatIsLead="Learn how digital image containers differ and why modern formats like WebP deliver superior speed and fidelity."
        whatIsContent={[
          'An Image Converter changes an image\'s digital file encoding from one format to another. Different image formats use distinct mathematical algorithms to represent colors, compression, and transparency. For example, JPEG uses Discrete Cosine Transform (DCT) lossy compression ideal for real-world photographic scenes, whereas PNG utilizes lossless Deflate compression with 8-bit alpha transparency ideal for UI graphics and logos.',
          'Modern formats like WebP and AVIF combine predictive coding and adaptive arithmetic compression to achieve significantly smaller file sizes without sacrificing perceptual clarity. Converting legacy formats to WebP can slash image bandwidth by 30% to 50%, accelerating website load times and improving mobile user experiences.',
          'With Image Convert by WebToolOcean, the conversion process runs locally using your browser\'s HTML5 Canvas, WebAssembly, and native codecs. Your photos never upload to remote servers, giving you total confidentiality, instantaneous conversions, and no bandwidth caps.',
        ]}
        whatIsVisual={<ConvertVisual />}
        stepsTitle="How to Convert Images in 4 Easy Steps"
        stepsLead="Convert one or hundreds of photos in seconds with simple intuitive controls."
        steps={steps}
        featuresTitle="Why Choose Our Free Image Converter"
        featuresLead="Fast, secure, batch-ready, and private by default."
        features={features}
        useCasesTitle="Common Image Conversion Use Cases"
        useCasesLead="Optimize web assets, prepare graphic designs, and simplify file sharing."
        useCases={useCases}
        privacyTitle="100% Private In-Browser Image Conversion"
        privacyText="Unlike cloud converters that store your images on remote servers, Image Convert processes all pixel operations locally inside your web browser. Your private photos, confidential designs, and personal media never leave your device."
        faqsTitle="Frequently Asked Questions"
        faqsLead="Answers to common questions about converting images online."
        faqs={faqs}
        relatedTitle="Explore More Free Image Tools"
        relatedLead="Complete suite of browser-based utilities to edit, optimize, and enhance your photos."
        relatedTools={relatedTools}
      />
    </>
  );
}

export default ConvertContent;
