import Image from "next/image";
import Link from "next/link";
import { FC } from "react";
import styles from "./FeatureCard.module.scss";

interface FeatureCardProps {
  imageSrc: string;
  title: string;
  description: string;
  link: string;
  isExternal?: boolean;
}

const FeatureCard: FC<FeatureCardProps> = ({
  imageSrc,
  title,
  description,
  link,
  isExternal = false,
}) => {
  return (
    <div className={styles.featureCard}>
      {/* Background Image with Blur Effect */}
      <div 
        className={styles.backgroundImage}
        style={{
          backgroundImage: imageSrc
        }}
      />
      
      {/* Dark overlay that appears on hover */}
      <div className={styles.overlay}></div>
      
      {/* Title - always visible */}
      <div className={styles.title}>
        <h3>
          {title}
        </h3>
      </div>
      
      {/* Description and Link - slide up on hover */}
      <div className={styles.content}>
        <div className={styles.contentInner}>
          <p className={styles.description}>
            {description}
          </p>
          <div className={styles.linkContainer}>
            {isExternal ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                Перейти →
              </a>
            ) : (
              <Link 
                href={link} 
                className={styles.link}
              >
                Перейти →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;
