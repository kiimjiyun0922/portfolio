export default function NotebookOrnaments({ variant, marks = [] }) {
  return (
    <div className={`notebook-ornaments notebook-ornaments--${variant}`} aria-hidden="true">
      {marks.map((mark) => (
        <i key={mark} className={`notebook-mark notebook-mark--${mark}`} />
      ))}
    </div>
  )
}
