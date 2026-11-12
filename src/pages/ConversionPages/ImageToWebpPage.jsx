import ConvertPage from '@/pages/ConvertPage';
import ImageToWebpContent from './ImageToWebpContent';

export function ImageToWebpPage() {
  return (
    <ConvertPage
      title="Convert Image to WebP Online"
      subtitle="Convert JPG, PNG, and GIF images to modern lightweight WebP format. Fast, 100% free, and completely private."
      documentTitle="Convert Image to WebP Online — Next-Gen Fast Format"
      initialSourceFormat="image/jpeg"
      initialOutputFormat="image/webp"
      contentComponent={ImageToWebpContent}
    />
  );
}

export default ImageToWebpPage;

