import {
  Sliders,
  RotateCw,
  Layout,
  Type,
  Eraser,
  Shapes,
  ShieldCheck,
  Zap,
  RotateCcw,
} from 'lucide-react';
import ToolContentSection from '@/components/tool-content/ToolContentSection';
import SeoHead from '@/components/seo/SeoHead';

const steps = [
  {
    title: '1. Upload Your Image',
    desc: 'Select or drag-and-drop any JPG, PNG, WebP, SVG, GIF, or AVIF image into the dark editing workspace.',
  },
  {
    title: '2. Choose Your Editing Tool',
    desc: 'Switch between Resize, Crop, Rotate, Canvas, Add Text, Erase, and Shapes directly from the top toolbar.',
  },
  {
    title: '3. Customize Settings & Layers',
    desc: 'Use the contextual right-side panel to adjust dimensions, typography, rotation angles, brush hardness, or shape styles.',
  },
  {
    title: '4. Download Full-Quality Output',
    desc: 'Export your final composition in high resolution with alpha transparency preserved. Single-click instant download.',
  },
];

const features = [
  {
    title: 'Photoshop-Inspired Workspace',
    desc: 'All 7 professional editing tools in one unified studio screen. Switch modes seamlessly without page reloads.',
    icon: <Sliders size={24} />,
  },
  {
    title: 'Precise Crop & Rotate',
    desc: 'Rule-of-thirds grid, aspect ratio presets, 90° quick turns, arbitrary angle rotation, and horizontal/vertical mirroring.',
    icon: <RotateCw size={24} />,
  },
  {
    title: 'Multi-Layer Typography',
    desc: 'Add multiple text layers with custom fonts, colors, stroke outlines, drop shadows, opacity, and draggable handles.',
    icon: <Type size={24} />,
  },
  {
    title: 'Real Pixel Eraser',
    desc: 'Erase unwanted pixels with adjustable brush size, hardness, and opacity, revealing true alpha transparency.',
    icon: <Eraser size={24} />,
  },
  {
    title: 'Vector Design Shapes',
    desc: 'Insert rectangles, rounded rects, circles, ellipses, lines, arrows, triangles, and stars with customizable stroke and fill.',
    icon: <Shapes size={24} />,
  },
  {
    title: 'Independent Canvas Resizing',
    desc: 'Expand or trim the canvas workspace with a 9-point anchor grid and transparent, black, white, or custom backgrounds.',
    icon: <Layout size={24} />,
  },
  {
    title: 'Non-Destructive History',
    desc: 'Full Undo (Ctrl+Z), Redo (Ctrl+Y), and Reset to Original. Work with confidence knowing your original image is safe.',
    icon: <RotateCcw size={24} />,
  },
  {
    title: '100% In-Browser Privacy',
    desc: 'High-speed HTML5 Canvas and WebGL execution entirely in your local browser sandbox. Zero images sent to servers.',
    icon: <ShieldCheck size={24} />,
  },
  {
    title: 'Instant Crisp Export',
    desc: 'Flattens base edits and overlay layers into high-resolution PNG, JPG, or WebP formats with pixel-perfect accuracy.',
    icon: <Zap size={24} />,
  },
];

const faqs = [
  {
    q: 'What is the Smart Image Editor?',
    a: 'Smart Image Editor is a complete in-browser photo and image editing suite that unifies Resize, Crop, Rotate, Canvas resizing, Text overlay, Pixel Eraser, and Vector Shapes into one seamless desktop-grade workspace.',
  },
  {
    q: 'How does the Erase tool work?',
    a: 'The Erase tool removes actual pixels directly from the image surface using canvas destination-out compositing, revealing the underlying transparency checkerboard. You can adjust brush size, hardness (soft feathered vs. crisp edge), and opacity. Every stroke is recorded in the history stack for instant undo.',
  },
  {
    q: 'Can I add multiple text and shape layers?',
    a: 'Yes. You can add as many text and shape layers as needed. Each layer can be independently moved, scaled, rotated, colored, or deleted. Layers remain editable until you export the final image.',
  },
  {
    q: 'Does rotating by arbitrary angles crop my image?',
    a: 'No. The Smart Image Editor automatically calculates the exact mathematical bounding box required for the rotated angle, ensuring no corners or edges are clipped unexpectedly.',
  },
  {
    q: 'Can I keep transparency when saving my edited image?',
    a: 'Yes. If your canvas has transparent areas (from erasing, transparent canvas padding, or PNG backgrounds), the editor exports as a transparent PNG file.',
  },
  {
    q: 'Are my images uploaded to any remote server?',
    a: 'No. All editing, drawing, erasing, rendering, and exporting run 100% locally on your computer via client-side JavaScript and HTML5 Canvas.',
  },
];

export function EditImageContent() {
  return (
    <>
      <SeoHead
        title="Smart Image Editor — Complete Online Photo Editing Suite"
        description="Free in-browser Smart Image Editor. Resize, crop, rotate, expand canvas, add text layers, erase pixels to transparency, and draw vector shapes. 100% private."
        canonicalUrl="https://image.webtoolocean.com/edit-image"
      />

      <ToolContentSection
        title="Smart Image Editor – Advanced Online Creative Studio"
        subtitle="A fast, lightweight, and powerful browser image editor designed for creators, developers, designers, and photographers."
        steps={steps}
        features={features}
        faqs={faqs}
      />
    </>
  );
}

export default EditImageContent;
