const gradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
];

export default function PlaceholderCreative({ concept, index = 0, style = {} }) {
  const gradient = gradients[index % gradients.length];
  return (
    <div
      className="placeholder-creative"
      style={{ background: gradient, ...style }}
    >
      <div className="placeholder-creative__pattern" />
      <span className="placeholder-creative__label">{concept}</span>
    </div>
  );
}
