export default function SectionWrapper({ children, className = '', id }) {
  return (
    <section
      id={id}
      className={`section-wrap px-5 py-20 sm:py-28 md:px-12 lg:px-24 ${className}`}
    >
      {children}
    </section>
  )
}
