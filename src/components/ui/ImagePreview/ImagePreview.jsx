import styles from './ImagePreview.module.css';

/**
 * Displays a preview thumbnail of an image with an optional caption.
 *
 * @param {{ src: string, alt: string, caption?: string, className?: string }} props
 */
function ImagePreview({ src, alt, caption, className }) {
  return (
    <figure className={`${styles.figure} ${className ?? ''}`}>
      <img className={styles.image} src={src} alt={alt} loading="lazy" />
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}

export default ImagePreview;
