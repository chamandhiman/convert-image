import { Sparkles, ShieldCheck, Cpu, Sliders, Image, RefreshCw, Scissors, Layers } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import ToolContentSection from '@/components/tool-content/ToolContentSection';
import SeoHead from '@/components/seo/SeoHead';

const steps = [
  {
    title: 'Upload Degraded Photo',
    desc: 'Select or drag & drop any old, blurry, scratched, or faded JPG, PNG, or WebP photograph from your device.',
  },
  {
    title: 'Choose Restoration Mode',
    desc: 'Select "Balanced" for optical refocusing and tone recovery, or "Strong" for deep neural reconstruction of heavy archival damage.',
  },
  {
    title: 'Run In-Browser AI Engine',
    desc: 'Click "Restore Photo" to execute deep Real-ESRGAN super-resolution and histogram tone equalization powered by WebGPU.',
  },
  {
    title: 'Compare & Download',
    desc: 'Drag the before-and-after split slider to inspect restored fine details, then export your pristine photo in full resolution.',
  },
];

const features = [
  {
    title: 'Neural Face & Detail Synthesis',
    desc: 'Deep learning reconstructs natural facial features, skin tones, iris clarity, hair strands, and vintage fabric textures with realistic fidelity.',
    icon: <Sparkles size={24} />,
  },
  {
    title: '100% Client-Side Privacy',
    desc: 'All restoration shaders execute locally inside your web browser via WebGPU and multi-threaded WebAssembly. Your photos never touch external servers.',
    icon: <ShieldCheck size={24} />,
  },
  {
    title: 'Histogram Tone Equalization',
    desc: 'Automatically rebalances faded dynamic ranges, neutralizes yellowed aging casts, and restores deep natural black levels to historical prints.',
    icon: <Sliders size={24} />,
  },
  {
    title: 'Hardware Accelerated (WebGPU)',
    desc: 'Leverages your device\'s GPU compute shaders to deliver lightning-fast neural inference without waiting in cloud processing queues.',
    icon: <Cpu size={24} />,
  },
];

const useCases = [
  {
    title: 'Vintage Family Portraits',
    desc: 'Breathe new life into faded black-and-white or sepia photographs of grandparents and historical family milestones with authentic clarity.',
  },
  {
    title: 'Damaged & Scratched Prints',
    desc: 'Repair scanned heirloom prints affected by physical abrasions, yellowing, water damage, and archival storage aging.',
  },
  {
    title: 'Blurry Mobile & Low-Light Shots',
    desc: 'Recover precious out-of-focus smartphone snapshots, eliminating camera shake and sensor noise while retaining natural textures.',
  },
  {
    title: 'Digitized Newspaper & Microfilm',
    desc: 'Enhance scanned historical articles, historical certificates, and library microfilms for genealogical research and publication.',
  },
];

const faqs = [
  {
    q: 'How does AI photo restoration work without uploading images to a server?',
    a: 'Image Convert runs a lightweight, optimized version of the Real-ESRGAN General neural network directly inside your web browser using WebGPU and WebAssembly. Your device\'s local graphics card or CPU performs the mathematical convolutions, meaning your private photos are never uploaded to any remote server.',
  },
  {
    q: 'What is the difference between Balanced and Strong restoration?',
    a: 'Balanced mode focuses on dynamic range correction, mild deblurring, and subtle texture sharpening—ideal for lightly faded photos where you want to preserve vintage grain. Strong mode runs a deeper neural super-resolution pass, synthesizing high-frequency details for heavily blurred, low-resolution, or severely degraded pictures.',
  },
  {
    q: 'Will the AI alter recognizable facial features or look artificial?',
    a: 'Our models are specifically tuned for realistic photographic reconstruction. Rather than hallucinating artificial faces, the network uses contextual high-frequency synthesis to restore natural skin textures, eye contours, and gentle contrast gradients while faithfully preserving the original likeness.',
  },
  {
    q: 'Can I restore both color and black-and-white pictures?',
    a: 'Yes! The restoration engine processes RGB channels seamlessly. For black-and-white or sepia photographs, it deepens tonal contrast and eliminates aged discoloration. For color photographs, it revitalizes faded saturation and balances exposure.',
  },
  {
    q: 'What image formats and file sizes can I upload?',
    a: 'We support all standard photographic formats including JPG, JPEG, PNG, and WebP up to 25 MB. Images can be exported either as lossless PNG or high-quality compressed JPEG.',
  },
  {
    q: 'Do I need a high-end graphics card to run the restorer?',
    a: 'No. While WebGPU-compatible graphics cards offer the fastest processing times (typically 2–5 seconds), our engine automatically falls back to multi-threaded WebAssembly on CPU for older laptops, phones, and tablets.',
  },
  {
    q: 'Is this photo restoration service completely free?',
    a: 'Yes, 100% free with no watermarks, no subscriptions, and no limits on how many archival photos you can restore.',
  },
];

const relatedTools = [
  {
    name: 'Remove Background',
    description: 'Isolate subjects and create transparent cutouts instantly with AI.',
    href: ROUTES.removeBackground,
    icon: <Scissors size={20} />,
  },
  {
    name: 'AI Object Remover',
    description: 'Erase dust, stains, tears, or unwanted elements from photographs.',
    href: ROUTES.objectRemover,
    icon: <RefreshCw size={20} />,
  },
  {
    name: 'Image Upscaler',
    description: 'Enhance photo resolution by 2× or 4× for crystal-clear physical prints.',
    href: ROUTES.upscaler,
    icon: <Layers size={20} />,
  },
  {
    name: 'Image Converter',
    description: 'Convert between JPG, PNG, WebP, GIF, and modern image formats.',
    href: ROUTES.convert,
    icon: <Image size={20} />,
  },
];

function PhotoRestorerVisual() {
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
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          borderRadius: '16px',
          border: '1px solid rgba(124, 58, 237, 0.2)',
          boxShadow: '0 12px 32px rgba(124, 58, 237, 0.12)',
          maxWidth: '280px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: '#e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'blur(1px) grayscale(60%)',
              color: '#64748b',
            }}
          >
            <Image size={24} />
          </div>
          <span style={{ fontSize: '18px', color: '#7C3AED', fontWeight: 'bold' }}>➔</span>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #D946EF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 6px 16px rgba(124, 58, 237, 0.35)',
            }}
          >
            <Sparkles size={24} />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E1B4B' }}>Neural Restoration</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Deblur · Denoise · Tone Recover</div>
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
          ✓ Real-ESRGAN + WebGPU
        </span>
      </div>
    </div>
  );
}

export function PhotoRestorerContent() {
  return (
    <>
      <SeoHead
        title="AI Photo Restorer Online Free — Restore Old & Blurry Photos"
        description="Restore old, damaged, faded, or blurry photos online for free. Enhance faces, repair scratches, and revitalize vintage family photos with 100% private in-browser AI."
        canonicalPath={ROUTES.photoRestorer}
        keywords="ai photo restorer, restore old photos, fix blurry photo, vintage photo restoration, repair damaged photos, enhance old pictures, free photo restorer"
        toolName="AI Photo Restorer"
        faqs={faqs}
      />
      <ToolContentSection
        badge="AI Restoration · Free"
        title="Restore Old, Damaged & Blurry Photos Online"
        lead="Revive vintage family portraits, repair faded colors, and sharpen out-of-focus pictures in seconds using client-side AI."
        primaryCtaText="Restore Photo Now"
        primaryCtaHref="#tool"
        secondaryCtaText="How Restoration Works"
        secondaryCtaHref="#how-it-works"
        whatIsTitle="What is AI Photo Restoration?"
        whatIsLead="Explore how deep neural networks reconstruct lost high-frequency details from faded and damaged photographs."
        whatIsContent={[
          'AI Photo Restoration is a computational vision process that reverses photographic degradation such as motion blur, optical defocus, sensor grain, compression artifacts, and physical print aging. Instead of applying rudimentary sharpening filters that simply amplify noise, our neural network synthesizes authentic high-frequency details based on learned structural photographic patterns.',
          'Vintage printed photographs often suffer from chemical fading where silver halide or pigment layers oxidate, resulting in low contrast, yellow discoloration, and lost shadows. Our multi-stage pipeline first performs dynamic range histogram equalization to re-establish true black and white reference levels, then passes the image through a deep convolutional super-resolution network.',
          'With Image Convert by WebToolOcean, the entire model executes inside your web browser via WebGPU compute shaders. Your family memories, personal snapshots, and historical records remain 100% private on your own device—never sent to cloud servers.',
        ]}
        whatIsVisual={<PhotoRestorerVisual />}
        stepsTitle="How to Restore Photos in 4 Simple Steps"
        stepsLead="Transform blurred and vintage photographs into sharp, vibrant keepsakes."
        steps={steps}
        featuresTitle="Why Choose Our AI Photo Restorer"
        featuresLead="Advanced neural synthesis combined with absolute on-device privacy."
        features={features}
        useCasesTitle="Common Photo Restoration Scenarios"
        useCasesLead="Preserve family heritage, genealogical archives, and cherished photographic memories."
        useCases={useCases}
        privacyTitle="100% Private In-Browser AI Restoration"
        privacyText="Old family photographs, portraits, and personal documents contain private memories. With Image Convert, all neural enhancement algorithms execute entirely in your browser using WebGPU and WebAssembly. Your photos are never uploaded or stored on any remote cloud server."
        faqsTitle="Frequently Asked Questions"
        faqsLead="Answers to common questions about restoring old, blurry, and damaged photographs."
        faqs={faqs}
        relatedTitle="Explore More Free Image Tools"
        relatedLead="Complete suite of browser-based utilities to edit, optimize, and enhance your photos."
        relatedTools={relatedTools}
      />
    </>
  );
}

export default PhotoRestorerContent;
