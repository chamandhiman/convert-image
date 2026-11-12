import { RotateCw, FlipHorizontal, ShieldCheck, Zap, Sliders, Scissors, FileImage, Layers } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import ToolContentSection from '@/components/tool-content/ToolContentSection';
import SeoHead from '@/components/seo/SeoHead';

const steps = [
  {
    title: 'Upload Your Image',
    desc: 'Select or drag & drop any JPG, PNG, WebP, or GIF photo into the rotate workspace.',
  },
  {
    title: 'Choose Rotation & Flip',
    desc: 'Click Rotate 90° Clockwise, 90° Counter-Clockwise, or 180°, or flip horizontally or vertically with one click.',
  },
  {
    title: 'Preview in Real-Time',
    desc: 'Inspect the transformed orientation instantly in the high-resolution interactive viewport.',
  },
  {
    title: 'Download Rotated Image',
    desc: 'Export your corrected photo in original quality or choose your preferred format (PNG, JPG, or WebP).',
  },
];

const features = [
  {
    title: '90° & 180° Exact Rotation',
    desc: 'Turn landscape photos into portrait or correct upside-down pictures with mathematically precise angle rotation.',
    icon: <RotateCw size={24} />,
  },
  {
    title: 'Horizontal & Vertical Mirroring',
    desc: 'Flip photos horizontally for mirror selfies or vertically for creative geometric reflections with zero distortion.',
    icon: <FlipHorizontal size={24} />,
  },
  {
    title: 'Lossless Pixel Precision',
    desc: 'Canvas matrix transformations preserve 100% of the original photo sub-pixels and color channels without resampling blur.',
    icon: <Zap size={24} />,
  },
  {
    title: '100% Client-Side Privacy',
    desc: 'All image calculations execute directly in your browser. Your images never upload to external servers or cloud storage.',
    icon: <ShieldCheck size={24} />,
  },
];

const useCases = [
  {
    title: 'Fix Incorrect Phone Orientation',
    desc: 'Correct photos that camera sensors accidentally saved sideways or upside-down due to misread gyroscope EXIF data.',
  },
  {
    title: 'Mirror Selfies & Portraits',
    desc: 'Flip front-camera smartphone selfies horizontally so text on clothing and background elements appear in natural orientation.',
  },
  {
    title: 'E-Commerce Product Alignments',
    desc: 'Standardize catalog listings by ensuring all merchandise photos face the uniform direction across product galleries.',
  },
  {
    title: 'Creative Layout & Social Media',
    desc: 'Produce symmetrical patterns, mirrored social cards, and rotated artwork for Instagram grids and marketing banners.',
  },
];

const faqs = [
  {
    q: 'Does rotating an image reduce its sharpness or clarity?',
    a: 'No! Exact 90-degree and 180-degree rotations simply remap pixel coordinate rows and columns. There is zero resampling, softening, or resolution loss.',
  },
  {
    q: 'Why did my phone take a picture sideways in the first place?',
    a: 'Smartphones record orientation in EXIF metadata based on their internal gyroscope. Sometimes desktop browsers or apps ignore these EXIF tags, causing the picture to appear sideways. Our Rotate Image tool rewrites the actual pixel buffer so the image opens upright everywhere.',
  },
  {
    q: 'Can I rotate transparent PNG images without losing transparency?',
    a: 'Yes! Full 32-bit RGBA alpha transparency is retained when rotating and exporting PNG images.',
  },
  {
    q: 'What is the difference between rotating and flipping an image?',
    a: 'Rotating turns the image around a central anchor point by an angle (such as 90° or 180°). Flipping creates a mirror reflection across the horizontal (left-to-right) or vertical (top-to-bottom) axis.',
  },
  {
    q: 'Are my photos uploaded to any server when I rotate them?',
    a: 'Never. All operations happen in your browser memory using client-side HTML5 Canvas. Your images stay on your device at all times.',
  },
  {
    q: 'Is there a file size or quantity limit on Rotate Image?',
    a: 'There is no limit on usage! Image Convert is 100% free with unlimited photo processing, no registration, and no watermarks.',
  },
];

const relatedTools = [
  {
    name: 'Crop Image',
    desc: 'Trim boundaries and crop photos to standard 1:1, 16:9, or custom aspect ratios.',
    href: ROUTES.crop,
    icon: <Scissors size={20} />,
  },
  {
    name: 'Resize Image',
    desc: 'Change image dimensions in pixels or percentages while locking aspect ratio.',
    href: ROUTES.resize,
    icon: <Sliders size={20} />,
  },
  {
    name: 'Convert Image',
    desc: 'Convert photos between JPG, PNG, WebP, GIF, BMP, and TIFF formats.',
    href: ROUTES.convert,
    icon: <FileImage size={20} />,
  },
  {
    name: 'Compress Image',
    desc: 'Reduce file size by up to 80% while retaining crisp visual quality.',
    href: ROUTES.compress,
    icon: <Layers size={20} />,
  },
];

export function RotateContent() {
  return (
    <>
      <SeoHead
        title="Rotate Image Online — Free 90°, 180° & Flip Photo Editor"
        description="Rotate images online for free. Rotate 90 degrees clockwise or counter-clockwise, 180 degrees, and flip horizontally or vertically without losing quality. 100% private."
        canonicalPath={ROUTES.rotate}
        toolName="Rotate Image"
        faqs={faqs}
      />
      <ToolContentSection
        badge="FREE · IN-BROWSER"
        title="Rotate & Flip Images Online with Zero Quality Loss"
        lead="Turn sideways photos upright, mirror portraits, and correct camera orientations in seconds — completely free and 100% private in your browser."
        primaryCtaText="Rotate Image Now"
        primaryCtaHref="#tool"
        secondaryCtaText="Learn More"
        secondaryCtaHref="#how-it-works"
        whatIsTitle="What is the Online Image Rotator?"
        whatIsLead="The easiest way to correct image orientation, flip mirrors, and rotate pictures."
        whatIsContent="Whether your smartphone captured a photo sideways or you need to mirror a graphic for a creative design layout, our Rotate Image tool allows you to turn photos by 90-degree increments and flip them horizontally or vertically. Processing happens entirely on your machine using GPU-accelerated HTML5 Canvas, ensuring instant results and complete privacy."
        stepsTitle="How to Rotate an Image in 4 Steps"
        stepsLead="Fast, easy, and intuitive — rotate and download in under 10 seconds."
        steps={steps}
        featuresTitle="Why Choose Our Image Rotator"
        featuresLead="Precision angle alignment, mirror reflections, and crystal-clear output."
        features={features}
        useCasesTitle="Common Uses for Rotating & Flipping Photos"
        useCasesLead="Everyday photography and graphic design scenarios."
        useCases={useCases}
        privacyTitle="100% Local In-Browser Processing"
        privacyText="Your images never leave your computer or phone. Unlike other online editors that upload your pictures to remote servers, our rotator renders everything in your browser memory via HTML5 Canvas."
        faqsTitle="Frequently Asked Questions"
        faqsLead="Answers to common questions about rotating and flipping photos online."
        faqs={faqs}
        relatedTitle="Related Image Editing Tools"
        relatedLead="Explore more free browser-based tools in our suite."
        relatedTools={relatedTools}
      />
    </>
  );
}

export default RotateContent;
