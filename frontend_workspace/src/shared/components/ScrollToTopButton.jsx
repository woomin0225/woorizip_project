const scrollTopButtonStyle = {
  position: "fixed",
  right: "24px",
  bottom: "104px",
  zIndex: 1200,
  padding: "10px 14px",
  border: "1px solid #ddd",
  borderRadius: "999px",
  background: "#fff",
  color: "#222",
  lineHeight: 1,
  fontWeight: 700,
  cursor: "pointer",
};

export default function ScrollToTopButton() {
  function onScrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button type="button" onClick={onScrollToTop} style={scrollTopButtonStyle} aria-label="scroll to top">
      {"\u2191"}
    </button>
  );
}
