export default function AcioliLogo({ className = '' }: { className?: string }) {
  return <img
    src="/acioli-logo.png"
    alt="Acioli"
    className={className}
    style={{ filter: 'brightness(0) invert(1)' }}
  />;
}
