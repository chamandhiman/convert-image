import ConvertPage from '@/pages/ConvertPage';
import PngToJpgContent from './PngToJpgContent';

export function PngToJpgPage() {
  return (
    <ConvertPage
      title="Convert PNG to JPG Online"
      subtitle="Convert heavy PNG images to compact, lightweight JPEG photos. Fast, 100% free, and completely private."
      documentTitle="Convert PNG to JPG Online — Free & Fast JPEG Converter"
      initialSourceFormat="image/png"
      initialOutputFormat="image/jpeg"
      contentComponent={PngToJpgContent}
    />
  );
}

export default PngToJpgPage;

