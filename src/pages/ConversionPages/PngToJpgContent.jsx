import { Layers, ShieldCheck, Zap, FileImage, Sliders } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import ToolContentSection from '@/components/tool-content/ToolContentSection';
import SeoHead from '@/components/seo/SeoHead';

const steps = [
  {
    title: 'Upload PNG Files',
    desc: 'Drag & drop single or multiple PNG images into the converter workspace. Batch upload is fully supported.',
  },
  {
    title: 'Customize Quality',
    desc: 'JPG is selected as the output format. Fine-tune the quality slider (70% - 95%) to balance sharpness and file size.',
  },
  {
    title: 'Instant Browser Processing',
    desc: 'Click "Convert Images" to transform your heavy PNGs into compact JPEGs in seconds without uploading to any server.',
  },
  {
    title: 'Download Optimized JPGs',
    desc: 'Download your smaller JPEG files individually or as a single neatly packaged ZIP archive.',
  },
];

const features = [
  {
    title: 'Dramatically Smaller Files',
    desc: 'Convert heavy PNG photos to JPG to slash file sizes by up to 70-80%, ideal for fast web loading and email sharing.',
    icon: <Zap size={24} />,
  },
  {
    title: 'Adjustable Compression',
    desc: 'Control exact output size and image fidelity with real-time compression quality sliders.',
    icon: <Sliders size={24} />,
  },
  {
    title: 'Smart White Background',
    desc: 'Transparent PNG areas are automatically and cleanly rendered with a crisp solid white background in the resulting JPEG.',
    icon: <FileImage size={24} />,
  },
  {
    title: '100% Client-Side Privacy',
    desc: 'Your photos stay in your browser. Files never touch external cloud servers or remote databases.',
    icon: <ShieldCheck size={24} />,
  },
];

const useCases = [
  {
    title: 'Website & Blog Speed Optimization',
    desc: 'Replace multi-megabyte PNG screenshots and images with lightweight JPEGs to boost page load times and mobile speeds.',
  },
  {
    title: 'Email Attachments & Messaging',
    desc: 'Shrink oversized PNG files so they fit under strict email attachment limits on Gmail, Outlook, and Apple Mail.',
  },
  {
    title: 'Social Media & Photo Sharing',
    desc: 'Prepare photos for Instagram, Facebook, and Twitter, which natively compress JPEG images with high visual fidelity.',
  },
  {
    title: 'Storage & Disk Space Savings',
    desc: 'Free up valuable device storage space by converting large uncompressed screenshots and camera exports into compact JPEGs.',
  },
];

const faqs = [
  {
    q: 'What happens to transparent backgrounds when converting PNG to JPG?',
    a: 'Because the JPEG format does not support transparency, any transparent areas in your PNG image will automatically be filled with a clean solid white background.',
  },
  {
    q: 'How much smaller will my file size be after converting PNG to JPG?',
    a: 'For photographs and complex images, converting PNG to JPG typically reduces file size by 60% to 85% with minimal visible quality loss.',
  },
  {
    q: 'Can I adjust the quality of the converted JPG?',
    a: 'Yes! You can adjust the quality slider from 10% to 100%. An 80-85% setting is ideal for the best balance between sharpness and small file size.',
  },
  {
    q: 'Are my PNG photos uploaded to your server?',
    a: 'Never. All conversions happen directly on your device using HTML5 Canvas in your web browser. Your images remain 100% private.',
  },
  {
    q: 'Is there a limit on how many PNG files I can convert to JPG?',
    a: 'No. Image Convert is completely free with no file limits, no registration, and no watermarks.',
  },
];

const relatedTools = [
  {
    name: 'JPG to PNG',
    desc: 'Convert JPG photos to lossless PNG format.',
    href: ROUTES.jpgToPng,
    icon: <FileImage size={20} />,
  },
  {
    name: 'Compress Image',
    desc: 'Reduce file size by up to 80% while retaining crisp visual quality.',
    href: ROUTES.compress,
    icon: <Layers size={20} />,
  },
  {
    name: 'Image to WebP',
    desc: 'Convert images to ultra-efficient WebP for maximum web page speed.',
    href: ROUTES.imageToWebp,
    icon: <Zap size={20} />,
  },
  {
    name: 'Resize Image',
    desc: 'Change image dimensions in pixels or percentages while locking aspect ratio.',
    href: ROUTES.resize,
    icon: <Sliders size={20} />,
  },
];

export function PngToJpgContent() {
  return (
    <>
      <SeoHead
        title="Convert PNG to JPG Online — Free & Fast JPEG Converter"
        description="Convert PNG to JPG online for free. Compress and shrink heavy PNG images into lightweight JPEG photos with customizable compression quality. 100% private."
        canonicalPath={ROUTES.pngToJpg}
        toolName="PNG to JPG Converter"
        faqs={faqs}
      />
      <ToolContentSection
        badge="FREE · IN-BROWSER"
        title="Convert PNG to JPG Online"
        lead="Shrink oversized PNG images into lightweight, shareable JPEGs with customizable compression and complete client-side privacy."
        primaryCtaText="Convert PNG Now"
        primaryCtaHref="#tool"
        secondaryCtaText="Learn More"
        secondaryCtaHref="#how-it-works"
        whatIsTitle="What is PNG to JPG Conversion?"
        whatIsLead="Transform heavy lossless PNGs into compact, universal JPEGs."
        whatIsContent="PNG files are fantastic for screenshots and icons but often produce unnecessarily large file sizes for photographs. Converting PNG to JPEG applies efficient perceptual compression, drastically reducing file size while preserving rich photographic details."
        stepsTitle="How to Convert PNG to JPG in 4 Steps"
        stepsLead="Fast, private, and effortless client-side compression."
        steps={steps}
        featuresTitle="Why Choose Our PNG to JPG Converter"
        featuresLead="Dramatic size reduction, quality control, and zero server uploads."
        features={features}
        useCasesTitle="Common Uses for PNG to JPG Conversion"
        useCasesLead="Practical workflows for web designers, photographers, and marketers."
        useCases={useCases}
        privacyTitle="100% Private In-Browser Conversion"
        privacyText="Your images never leave your computer or phone. All conversion calculations run in your browser memory via HTML5 Canvas."
        faqsTitle="Frequently Asked Questions"
        faqsLead="Answers to common questions about converting PNG to JPG."
        faqs={faqs}
        relatedTitle="Related Image Tools"
        relatedLead="Explore more free browser-based tools in our suite."
        relatedTools={relatedTools}
      />
    </>
  );
}

export default PngToJpgContent;
