/**
 * Goal presets for the Smart Image Optimizer.
 *
 * Each preset defines user-facing descriptions and baseline optimization
 * parameters that guide the deterministic recommendation engine.
 */

export const OPTIMIZER_GOALS = [
  {
    id: 'website',
    label: 'Website',
    summary: 'Fast loading with excellent visual quality.',
    badge: 'Popular',
    icon: 'globe',
    preferredFormat: 'image/webp',
    defaultQuality: 82,
    maxWidth: 1600,
    rationale: 'Balanced for rapid web loading and Core Web Vitals while preserving crisp high-density display detail.',
  },
  {
    id: 'email',
    label: 'Email',
    summary: 'Reduce file size so the image is easier to send.',
    icon: 'mail',
    preferredFormat: 'image/jpeg',
    defaultQuality: 75,
    maxWidth: 1200,
    rationale: 'Ensures universal compatibility across all desktop and mobile email clients with minimal attachment weight.',
  },
  {
    id: 'social',
    label: 'Social media',
    summary: 'Keep the image sharp while reducing unnecessary file size.',
    icon: 'share',
    preferredFormat: 'image/jpeg',
    defaultQuality: 84,
    maxWidth: 1920,
    rationale: 'Sharp 1080p/2K resolution that renders cleanly in social feeds without triggering aggressive platform re-compression.',
  },
  {
    id: 'print',
    label: 'Print',
    summary: 'Preserve dimensions and visual detail.',
    icon: 'printer',
    preferredFormat: 'keep',
    defaultQuality: 92,
    maxWidth: null,
    rationale: 'Retains original native dimensions and rich tonal gradation for high-resolution physical printing.',
  },
  {
    id: 'messaging',
    label: 'Messaging',
    summary: 'Create a practical smaller copy for sharing.',
    icon: 'message',
    preferredFormat: 'image/jpeg',
    defaultQuality: 76,
    maxWidth: 1280,
    rationale: 'Lightweight and quick to send over chat apps and mobile data connections.',
  },
  {
    id: 'smaller',
    label: 'Just make it smaller',
    summary: 'Prioritize file-size reduction.',
    icon: 'minimize',
    preferredFormat: 'image/webp',
    defaultQuality: 70,
    maxWidth: 1200,
    rationale: 'Aggressive yet clean compression to achieve the smallest possible file footprint.',
  },
];

export const DEFAULT_GOAL_ID = 'website';
