import { Layers, ShieldCheck, Zap, FileImage, Sliders } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import ToolContentSection from '@/components/tool-content/ToolContentSection';
import SeoHead from '@/components/seo/SeoHead';

const steps = [
  {
    title: 'Upload Any Image',
    desc: 'Select or drag & drop single or multiple JPG, PNG, GIF, or BMP images into the conversion workspace.',
  },
  {
    title: 'WebP Output Selected',
    desc: 'Next-generation WebP is automatically set as the target format with recommended 80% compression balance.',
  },
  {
    title: 'Client-Side Canvas Encoding',
    desc: 'Click "Convert Images" to encode your pictures to WebP locally in your browser with zero latency.',
  },
  {
    title: 'Download Lightweight WebPs',
    desc: 'Download your modern WebP files individually or as a single neatly organized ZIP archive.',
  },
];

const features = [
  {
    title: '30%–50% Smaller File Sizes',
    desc: 'WebP delivers superior lossy and lossless compression compared to legacy JPEG and PNG formats at equivalent visual fidelity.',
    icon: <Zap size={24} />,
  },
  {
    title: 'Full Transparency Support',
    desc: 'Unlike JPEG, WebP natively supports full 24-bit alpha channel transparency while maintaining tiny file sizes.',
    icon: <Layers size={24} />,
  },
  {
    title: 'Google Core Web Vitals Boost',
    desc: 'Serving WebP images dramatically cuts Largest Contentful Paint (LCP) time and improves overall SEO search rankings.',
    icon: <FileImage size={24} />,
  },
  {
    title: '100% In-Browser Privacy',
    desc: 'Encoding runs entirely inside your web browser. Your private pictures are never uploaded to any remote server.',
    icon: <ShieldCheck size={24} />,
  },
];

const useCases = [
  {
    title: 'Modern Website Optimization',
    desc: 'Convert high-resolution banners, hero graphics, and portfolio galleries to WebP to pass Google PageSpeed Insights tests.',
  },
  {
    title: 'E-Commerce Product Catalogs',
    desc: 'Accelerate Shopify, WooCommerce, and Magento stores by replacing legacy JPG/PNG product listings with lightweight WebP images.',
  },
  {
    title: 'Mobile Application Assets',
    desc: 'Slash mobile app download sizes by packaging lightweight WebP UI elements, illustrations, and backgrounds.',
  },
  {
    title: 'Email Newsletters & Landing Pages',
    desc: 'Improve email open speeds and click-through rates by keeping visual marketing assets small and snappy.',
  },
];

const faqs = [
  {
    q: 'What is WebP and why is it better than JPG and PNG?',
    a: 'WebP is a modern image format developed by Google that provides superior lossless and lossy compression for web images. WebP files are typically 25% to 35% smaller than comparable JPEGs and 26% smaller than PNGs while preserving identical visual quality.',
  },
  {
    q: 'Do all modern web browsers support WebP?',
    a: 'Yes! WebP is supported by over 97% of all web browsers globally, including Chrome, Safari, Edge, Firefox, and Opera on both desktop and mobile devices.',
  },
  {
    q: 'Can WebP preserve transparent backgrounds from PNGs?',
    a: 'Yes! WebP provides full 8-bit alpha transparency alongside 24-bit color, combining the best aspects of PNG and JPG in one compact file.',
  },
  {
    q: 'Are my images uploaded to external servers during conversion?',
    a: 'No. All conversion algorithms execute inside your web browser using HTML5 Canvas. Your photos never leave your device.',
  },
  {
    q: 'Is this WebP converter free with unlimited usage?',
    a: 'Yes, 100% free with unlimited batch conversions, no watermarks, and no registration required.',
  },
];

const relatedTools = [
  {
    name: 'Compress Image',
    desc: 'Reduce file size by up to 80% while retaining crisp visual quality.',
    href: ROUTES.compress,
    icon: <Layers size={20} />,
  },
  {
    name: 'JPG to PNG',
    desc: 'Convert JPG photos to lossless PNG format.',
    href: ROUTES.jpgToPng,
    icon: <FileImage size={20} />,
  },
  {
    name: 'PNG to JPG',
    desc: 'Convert PNG graphics into lightweight JPG images for faster sharing.',
    href: ROUTES.pngToJpg,
    icon: <FileImage size={20} />,
  },
  {
    name: 'Resize Image',
    desc: 'Change image dimensions in pixels or percentages while locking aspect ratio.',
    href: ROUTES.resize,
    icon: <Sliders size={20} />,
  },
];

export function ImageToWebpContent() {
  return (
    <>
      <SeoHead
        title="Convert Image to WebP Online — Next-Gen Fast Format"
        description="Convert JPG, PNG, and GIF images to lightweight modern WebP format online for free. Boost Google Core Web Vitals and website page speed with 30-50% smaller files."
        canonicalPath={ROUTES.imageToWebp}
        toolName="Image to WebP Converter"
        faqs={faqs}
      />
      <ToolContentSection
        badge="FREE · IN-BROWSER"
        title="Convert Images to WebP Online"
        lead="Upgrade JPG, PNG, and GIF images into next-generation WebP format for 30-50% smaller files and lightning-fast website load speeds."
        primaryCtaText="Convert to WebP Now"
        primaryCtaHref="#tool"
        secondaryCtaText="Learn More"
        secondaryCtaHref="#how-it-works"
        whatIsTitle="What is WebP Conversion?"
        whatIsLead="The next-generation image format built for the modern web."
        whatIsContent="Developed by Google, WebP uses advanced predictive encoding to achieve smaller file sizes than JPEG and PNG without sacrificing perceived quality. Converting your imagery to WebP improves Core Web Vitals, reduces bandwidth costs, and creates a snappier browsing experience for your visitors."
        stepsTitle="How to Convert Images to WebP in 4 Steps"
        stepsLead="Fast, private, and effortless client-side compression."
        steps={steps}
        featuresTitle="Why Choose Our WebP Converter"
        featuresLead="30-50% size reduction, transparency preservation, and zero server uploads."
        features={features}
        useCasesTitle="Common Uses for WebP Image Conversion"
        useCasesLead="Proven workflows for web developers, designers, and site owners."
        useCases={useCases}
        privacyTitle="100% Private In-Browser Conversion"
        privacyText="Your images never leave your computer or phone. All conversion calculations run in your browser memory via HTML5 Canvas."
        faqsTitle="Frequently Asked Questions"
        faqsLead="Answers to common questions about converting images to WebP."
        faqs={faqs}
        relatedTitle="Related Image Tools"
        relatedLead="Explore more free browser-based tools in our suite."
        relatedTools={relatedTools}
      />
    </>
  );
}

export default ImageToWebpContent;
