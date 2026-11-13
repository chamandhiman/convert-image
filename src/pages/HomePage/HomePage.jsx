import SeoHead from '@/components/seo/SeoHead';
import HeroSection from '@/components/home/HeroSection';
import FeatureStrip from '@/components/home/FeatureStrip';
import ImageTools from '@/components/home/ImageTools';
import ConversionSteps from '@/components/home/ConversionSteps';
import SupportedFormats from '@/components/home/SupportedFormats';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import HomeFAQ from '@/components/home/HomeFAQ';
import FinalCTA from '@/components/home/FinalCTA';

export function HomePage() {
  const homeFaqs = [
    {
      q: 'Is Image Convert completely free to use?',
      a: 'Yes, 100% free with no subscriptions, usage limits, or hidden fees. All tools execute locally on your device.',
    },
    {
      q: 'Are my images uploaded to any server?',
      a: 'Never. Image Convert processes all images entirely inside your browser using HTML5 Canvas, WebAssembly, and WebGPU. Your files never leave your machine.',
    },
    {
      q: 'Can I convert multiple images at once (Batch Convert)?',
      a: 'Yes! Select or drag and drop multiple images to convert them in parallel and download all as a ZIP file.',
    },
    {
      q: 'What image formats are supported?',
      a: 'We support JPG, PNG, WebP, GIF, SVG, BMP, TIFF, and HEIC with complete quality and dimension controls.',
    },
  ];

  return (
    <>
      <SeoHead
        title="Convert Images to Any Format — Free Online Image Converter by WebToolOcean"
        description="Fast, free and high-quality image conversion. Convert, edit and optimize your images online — no software required. Supports JPG, PNG, WebP, GIF, SVG, HEIC & BMP."
        canonicalPath="/"
        keywords="image convert, free image converter, convert images online, any format, webtoolocean, photo editor online, transparent png, image compressor, resize image, batch convert"
        toolName="Image Convert Suite"
        faqs={homeFaqs}
      />

      {/* 1. Hero Section with 3D Image-to-Format Illustration */}
      <HeroSection />

      {/* 2. Feature Strip: 4 Key Value Props */}
      <FeatureStrip />

      {/* 3. Popular Image Tools (Convert, Resize, Crop, Compress) + Full Directory */}
      <ImageTools />

      {/* 4. How It Works (3 Simple Steps) */}
      <ConversionSteps />

      {/* 5. Supported Image Formats */}
      <SupportedFormats />

      {/* 6. Why Choose Image Convert (4 Pillars) */}
      <WhyChooseUs />

      {/* 7. Frequently Asked Questions Accordion */}
      <HomeFAQ />

      {/* 8. Final Call to Action */}
      <FinalCTA />
    </>
  );
}

export default HomePage;
