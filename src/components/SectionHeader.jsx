function SectionHeader({ eyebrow, title, description, align = "center" }) {
  return (
    <div className={`section-header section-header--${align}`}>
      {eyebrow ? <span className="section-eyebrow">{eyebrow}</span> : null}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export { SectionHeader };
