import SeoHead from '@/components/seo/SeoHead';
import HeroSection from '@/components/home/HeroSection';
import SupportedFormats from '@/components/home/SupportedFormats';
import ImageTools from '@/components/home/ImageTools';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import ConversionSteps from '@/components/home/ConversionSteps';
import FinalCTA from '@/components/home/FinalCTA';

export function HomePage() {
  const homeFaqs = [
    { q: 'Is Image Convert free to use?', a: 'Yes, 100% free with no subscriptions, usage limits, or hidden fees. All tools execute locally on your device.' },
    { q: 'Are my images uploaded to any server?', a: 'Never. Image Convert processes all images entirely inside your browser using HTML5 Canvas, WebAssembly, and WebGPU. Your files never leave your machine.' },
    { q: 'What image formats are supported?', a: 'We support all major image formats including JPG, PNG, WebP, GIF, BMP, TIFF, SVG, and HEIC.' },
  ];

  return (
    <>
      <SeoHead
        title="Image Convert — Free Online Image Converter by WebToolOcean"
        description="Convert, resize, compress, crop, restore, and optimize your images online for free. Supports JPG, PNG, WebP, GIF, BMP, TIFF, SVG, and HEIC — fast, secure, and 100% private."
        canonicalPath="/"
        keywords="image convert, free image converter, convert images online, webtoolocean, photo editor online, transparent png, image compressor, resize image"
        toolName="Image Convert Suite"
        faqs={homeFaqs}
      />
      {/* 1. Hero Section with Reference Dashboard Mockup */}
      <HeroSection />

      {/* 2. Supported Formats Badges */}
      <SupportedFormats />

      {/* 3. All Essential Image Tools at One Place (3x3 Grid) */}
      <ImageTools />

      {/* 4. Why Use Image Convert? (4 Feature Columns) */}
      <WhyChooseUs />

      {/* 5. Convert Images in 3 Easy Steps */}
      <ConversionSteps />

      {/* 6. Final Rounded CTA Banner */}
      <FinalCTA />
    </>
  );
}

export default HomePage;
