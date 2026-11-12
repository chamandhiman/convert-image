import { Layers, ShieldCheck, Zap, FileImage, Scissors } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import ToolContentSection from '@/components/tool-content/ToolContentSection';
import SeoHead from '@/components/seo/SeoHead';

const steps = [
  {
    title: 'Upload JPG Files',
    desc: 'Drag & drop single or multiple JPG / JPEG images into the converter box. Batch conversion is fully supported.',
  },
  {
    title: 'PNG Selected Automatically',
    desc: 'The output target is automatically set to lossless 24-bit/32-bit PNG for optimal raster quality.',
  },
  {
    title: 'Client-Side Processing',
    desc: 'Click "Convert Images" to transform your photos locally in your browser memory using HTML5 Canvas.',
  },
  {
    title: 'Download Crisp PNGs',
    desc: 'Download your converted PNG photos immediately or save the entire batch organized in a single ZIP file.',
  },
];

const features = [
  {
    title: 'Lossless Visual Precision',
    desc: 'Converting JPG to PNG eliminates further generation loss, locking in high-contrast text and crisp graphic edges.',
    icon: <Zap size={24} />,
  },
  {
    title: 'Batch JPG Conversion',
    desc: 'Convert dozens of JPEG photos into PNG format simultaneously with one single click and no queue wait times.',
    icon: <Layers size={24} />,
  },
  {
    title: 'Universal Software Compatibility',
    desc: 'Export standard PNG images fully compatible with Photoshop, Figma, Canva, Illustrator, and all web browsers.',
    icon: <FileImage size={24} />,
  },
  {
    title: '100% In-Browser Privacy',
    desc: 'Your photos are processed completely on your own machine. Files never upload to external servers or cloud databases.',
    icon: <ShieldCheck size={24} />,
  },
];

const useCases = [
  {
    title: 'Graphic Design & Editing',
    desc: 'Convert JPG illustrations and logos into PNG before editing in vector and photo editing apps to prevent re-compression artifacts.',
  },
  {
    title: 'Website Icons & Assets',
    desc: 'Transform raster product shots and web buttons into standard PNG assets ready for composite layouts.',
  },
  {
    title: 'Presentations & Slides',
    desc: 'Embed crisp PNG images into Google Slides, PowerPoint, and Keynote presentations with maximum legibility.',
  },
  {
    title: 'Print & Digital Publishing',
    desc: 'Prepare uncompressed PNG graphics for print catalogs, brochure layouts, and digital publication documents.',
  },
];

const faqs = [
  {
    q: 'Will converting a JPG to PNG make the background transparent?',
    a: 'No. Standard JPG files do not contain an alpha transparency channel. To make the background transparent after converting, use our free Remove Background tool.',
  },
  {
    q: 'Why should I convert a JPG to PNG format?',
    a: 'PNG uses lossless compression (DEFLATE). Once in PNG format, you can re-save and edit the image multiple times without any additional compression degradation that JPEG files suffer from.',
  },
  {
    q: 'Will converting JPG to PNG increase the file size?',
    a: 'Often yes, because PNG is a lossless format that stores every pixel without discardable compression artifacts. For web optimization where small size is paramount, consider our Image to WebP tool.',
  },
  {
    q: 'Are my JPG photos uploaded to any remote server?',
    a: 'No. All conversion algorithms execute inside your web browser using HTML5 Canvas. Your photos never leave your device.',
  },
  {
    q: 'Is this JPG to PNG converter completely free?',
    a: 'Yes, 100% free with unlimited conversions, no registration, and no watermarks.',
  },
];

const relatedTools = [
  {
    name: 'PNG to JPG',
    desc: 'Convert PNG graphics into lightweight JPG images for faster sharing.',
    href: ROUTES.pngToJpg,
    icon: <FileImage size={20} />,
  },
  {
    name: 'Image to WebP',
    desc: 'Convert images to ultra-efficient WebP for maximum web page speed.',
    href: ROUTES.imageToWebp,
    icon: <Zap size={20} />,
  },
  {
    name: 'Compress Image',
    desc: 'Reduce file size by up to 80% while retaining crisp visual quality.',
    href: ROUTES.compress,
    icon: <Layers size={20} />,
  },
  {
    name: 'Remove Background',
    desc: 'Automatically remove photo backgrounds and export transparent PNGs.',
    href: ROUTES.removeBackground,
    icon: <Scissors size={20} />,
  },
];

export function JpgToPngContent() {
  return (
    <>
      <SeoHead
        title="Convert JPG to PNG Online — Free & Fast Photo Converter"
        description="Convert JPG to PNG online for free. Transform JPEG photos into high-quality lossless PNG format with crisp clarity and universal compatibility. 100% private."
        canonicalPath={ROUTES.jpgToPng}
        toolName="JPG to PNG Converter"
        faqs={faqs}
      />
      <ToolContentSection
        badge="FREE · IN-BROWSER"
        title="Convert JPG to PNG Online"
        lead="Transform JPEG photos into lossless PNG format with crisp clarity, zero server uploads, and instant batch processing."
        primaryCtaText="Convert JPG Now"
        primaryCtaHref="#tool"
        secondaryCtaText="Learn More"
        secondaryCtaHref="#how-it-works"
        whatIsTitle="What is JPG to PNG Conversion?"
        whatIsLead="Upgrade lossy JPEG photos to lossless raster PNG files."
        whatIsContent="JPEG is a lossy image format optimized for compact photography, while PNG is a lossless format designed for crisp graphics, sharp text, and editing flexibility. Converting JPG to PNG halts further generation loss, allowing you to edit, annotate, and reuse your graphics across professional editing suites without quality loss."
        stepsTitle="How to Convert JPG to PNG in 4 Steps"
        stepsLead="Fast, private, and effortless client-side conversion."
        steps={steps}
        featuresTitle="Why Choose Our JPG to PNG Converter"
        featuresLead="Lossless precision, batch conversions, and complete data privacy."
        features={features}
        useCasesTitle="Common Uses for JPG to PNG Conversion"
        useCasesLead="Practical workflows for designers, developers, and photographers."
        useCases={useCases}
        privacyTitle="100% Private In-Browser Conversion"
        privacyText="Your images never leave your computer or phone. All conversion math runs in your browser memory via HTML5 Canvas."
        faqsTitle="Frequently Asked Questions"
        faqsLead="Everything you need to know about converting JPG to PNG."
        faqs={faqs}
        relatedTitle="Related Image Tools"
        relatedLead="Explore more free browser-based tools in our suite."
        relatedTools={relatedTools}
      />
    </>
  );
}

export default JpgToPngContent;
