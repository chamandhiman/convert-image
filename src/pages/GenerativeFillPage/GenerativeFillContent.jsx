import { Sparkles, ShieldCheck, Zap, RefreshCw, Scissors, Maximize } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import ToolContentSection from '@/components/tool-content/ToolContentSection';
import SeoHead from '@/components/seo/SeoHead';

const steps = [
  {
    title: 'Upload Your Image',
    desc: 'Select or drag & drop any JPG, PNG, or WebP photo into the generative canvas.',
  },
  {
    title: 'Brush Over Target Area',
    desc: 'Use the interactive brush tool to paint over the region you want to replace, fill, or alter.',
  },
  {
    title: 'Enter Prompt & Generate',
    desc: 'Describe what you want to generate in natural language or click generate for contextual inpainting.',
  },
  {
    title: 'Review & Download',
    desc: 'Compare the generated variation against the original photo, then download your finished artwork in full resolution.',
  },
];

const features = [
  {
    title: 'Contextual AI Inpainting',
    desc: 'Intelligent neural models match surrounding lighting, perspective, focal depth, and color palettes for photorealistic blending.',
    icon: <Sparkles size={24} />,
  },
  {
    title: '100% Client-Side Privacy',
    desc: 'All neural computations run locally in your browser sandbox using WebGPU and WebAssembly. Your photos never leave your device.',
    icon: <ShieldCheck size={24} />,
  },
  {
    title: 'Seamless Edge Blending',
    desc: 'Soft gradient mask blending eliminates telltale border seams, harsh cut lines, and color mismatches.',
    icon: <RefreshCw size={24} />,
  },
  {
    title: 'Completely Free Forever',
    desc: 'No credit packs, subscription paywalls, watermarks, or sign-up gates. Edit as many photos as you want at zero cost.',
    icon: <Zap size={24} />,
  },
];

const useCases = [
  {
    title: 'Creative Art & Concept Design',
    desc: 'Quickly experiment with new backgrounds, props, accessories, and atmospheric elements in digital compositions.',
  },
  {
    title: 'Product Staging & E-Commerce',
    desc: 'Add decorative accessories, realistic surface textures, or aesthetic context around studio product shots.',
  },
  {
    title: 'Fashion & Portrait Retouching',
    desc: 'Swap clothing colors, adjust hairstyles, or add jewelry and accessories to model portraits.',
  },
  {
    title: 'Fixing Composition Mistakes',
    desc: 'Replace distracting background clutter with natural scenery, complementary foliage, or clean textures.',
  },
];

const faqs = [
  {
    q: 'What is AI Generative Fill?',
    a: 'AI Generative Fill is a neural inpainting technology that allows you to brush over any part of an image and replace it with new, contextually aware content based on your text description or surrounding scene context. The AI seamlessly matches ambient lighting, shadows, focus depth, and texture grain.',
  },
  {
    q: 'How does Generative Fill protect my personal privacy?',
    a: 'Unlike server-based generative services that store your personal photos on cloud databases, Image Convert executes all neural inferences and texture syntheses locally on your machine via WebGPU and WebAssembly. Your photos never travel over the internet.',
  },
  {
    q: 'What should I do to get the most natural-looking results?',
    a: 'Make sure your brush stroke covers the entire object you wish to replace, plus a slight margin of the surrounding background. If replacing a subject that casts a shadow, be sure to paint over both the subject and its shadow on the floor or ground.',
  },
  {
    q: 'Can I generate multiple variations?',
    a: 'Yes! You can refine your prompt, regenerate, or paint over specific sub-areas multiple times until you achieve the exact look you want.',
  },
  {
    q: 'What file formats and image resolutions are supported?',
    a: 'You can upload JPG, JPEG, PNG, and WebP images up to 25 MB and 4000×4000 pixels. Output files can be exported as lossless PNG or compressed JPG.',
  },
  {
    q: 'Is there any limit on how many images I can generate?',
    a: 'No. Image Convert is completely free with no usage limits, no credit restrictions, and no watermarks.',
  },
  {
    q: 'Can I use generated images for commercial purposes?',
    a: 'Yes. You retain full ownership and rights to all original and edited imagery created with our tools.',
  },
];

const relatedTools = [
  {
    name: 'AI Object Remover',
    description: 'Erase unwanted tourists, clutter, or watermarks naturally.',
    href: ROUTES.objectRemover,
    icon: <RefreshCw size={20} />,
  },
  {
    name: 'AI Image Extender',
    description: 'Expand photo backgrounds and uncrop images to any aspect ratio.',
    href: ROUTES.imageExtender,
    icon: <Maximize size={20} />,
  },
  {
    name: 'AI Photo Restorer',
    description: 'Sharpen blurry photos and repair faded vintage family prints.',
    href: ROUTES.photoRestorer,
    icon: <Sparkles size={20} />,
  },
  {
    name: 'Remove Background',
    description: 'Isolate subjects and create transparent cutouts instantly.',
    href: ROUTES.removeBackground,
    icon: <Scissors size={20} />,
  },
];

function GenerativeVisual() {
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
            Masked Brush Area
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
            AI Inpainted Object
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E1B4B' }}>Prompt-Guided Synthesis</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Lighting Matched · Seamless Seams</div>
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
          ✓ WebGPU Shaders · 100% In-Browser
        </span>
      </div>
    </div>
  );
}

export function GenerativeFillContent() {
  return (
    <>
      <SeoHead
        title="AI Generative Fill Online Free — Replace & Inpaint Objects"
        description="Edit photos with AI Generative Fill online for free. Brush over any object to replace or transform it with 100% private in-browser AI inpainting powered by WebGPU."
        canonicalPath={ROUTES.generativeFill}
        keywords="generative fill, ai inpainting, generative ai photo editor, replace object in photo, magic brush, free generative fill online"
        toolName="AI Generative Fill"
        faqs={faqs}
      />
      <ToolContentSection
        badge="Generative AI · Free"
        title="Edit Photos with AI Generative Fill"
        lead="Brush over any object, describe what you want to change, and watch the AI synthesize photorealistic elements in seconds. 100% private in your browser."
        primaryCtaText="Start Generative Fill"
        primaryCtaHref="#tool"
        secondaryCtaText="How Generative Fill Works"
        secondaryCtaHref="#what-is"
        whatIsTitle="What is AI Generative Fill?"
        whatIsLead="Explore how neural diffusion and deep inpainting models synthesize realistic objects matching surrounding photo physics."
        whatIsContent={[
          'AI Generative Fill is a breakthrough photo manipulation technique that combines masked image inpainting with contextual texture synthesis. Instead of manually cutting and pasting elements from other photos—which often results in mismatched lighting, perspectives, and resolution—the AI analyzes the surrounding pixels and synthesizes new content that respects the original focal length, illumination, and camera grain.',
          'Our in-browser engine evaluates surrounding depth gradients and color distributions to ensure generated objects cast realistic contact shadows and blend seamlessly along brush boundary edges.',
          'With Image Convert by WebToolOcean, all AI computations run directly on your device via WebGPU and WebAssembly. Your photos are never uploaded across external networks, ensuring absolute privacy, zero latency, and limitless creative freedom.',
        ]}
        whatIsVisual={<GenerativeVisual />}
        stepsTitle="How to Use Generative Fill in 4 Easy Steps"
        stepsLead="Transform photos with simple brush gestures in seconds without complex editing skills."
        steps={steps}
        featuresTitle="Why Choose Our AI Generative Fill"
        featuresLead="Advanced neural synthesis combined with absolute on-device privacy."
        features={features}
        useCasesTitle="Common Generative Fill Use Cases"
        useCasesLead="From creative concept art to fixing everyday photographic imperfections."
        useCases={useCases}
        privacyTitle="100% Private In-Browser Generative AI"
        privacyText="Your private photos, portraits, and creative assets remain strictly on your computer. All neural generation tensors and shader computations execute locally via WebGPU inside your browser sandbox—never sent to cloud servers or stored in remote databases."
        faqsTitle="Frequently Asked Questions"
        faqsLead="Answers to common questions about using Generative Fill online."
        faqs={faqs}
        relatedTitle="Explore More Free Image Tools"
        relatedLead="Complete suite of browser-based utilities to edit, optimize, and enhance your photos."
        relatedTools={relatedTools}
      />
    </>
  );
}

export default GenerativeFillContent;
