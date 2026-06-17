import Image from "next/image";
import styles from "./HeroGardenImage.module.css";
import SolarisGarden from "./SolarisGarden";

export default function HeroGardenImage() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <Image
        src="/images/garden/digital-garden-panel-v2.png"
        alt=""
        width={1536}
        height={1024}
        priority
        className={styles.image}
      />
      <SolarisGarden />
    </div>
  );
}
