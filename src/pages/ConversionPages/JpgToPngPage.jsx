import ConvertPage from '@/pages/ConvertPage';
import JpgToPngContent from './JpgToPngContent';

export function JpgToPngPage() {
  return (
    <ConvertPage
      title="Convert JPG to PNG Online"
      subtitle="Convert JPG and JPEG images to lossless PNG format in your browser. Fast, 100% free, and completely private."
      documentTitle="Convert JPG to PNG Online — Free & Fast Photo Converter"
      initialSourceFormat="image/jpeg"
      initialOutputFormat="image/png"
      contentComponent={JpgToPngContent}
    />
  );
}

export default JpgToPngPage;

