/**
 * Large dimensional racing-wheel visual for the Wheel Settings hero.
 * Dedicated photoreal asset on an illuminated holographic platform.
 */
export default function R79HeroWheel() {
  return (
    <span className="r79-hero-wheel">
      <img
        className="r79-hero-wheel__img"
        src="/assets/objects/hero-wheel.webp"
        alt=""
        width={220}
        height={220}
        decoding="async"
        fetchPriority="high"
        draggable={false}
      />
    </span>
  );
}
