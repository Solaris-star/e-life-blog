import styles from "./HeroGardenImage.module.css";
import SolarisGarden from "./SolarisGarden";

export default function HeroGardenImage() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <SolarisGarden />
    </div>
  );
}
