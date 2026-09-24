import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

let mermaidInitialized = false

function MermaidBlock({ code }) {
  const ref = useRef(null)
  const [svg, setSvg] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const mermaid = (await import('mermaid')).default
      if (!mermaidInitialized) {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          suppressErrorRendering: true,
          maxTextSize: 50000,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#3b82f6',
            primaryTextColor: '#e5e7eb',
            primaryBorderColor: '#3b82f6',
            lineColor: '#6b7280',
            secondaryColor: '#1f2937',
            tertiaryColor: '#111827',
            background: '#111827',
            mainBkg: '#1f2937',
            nodeBorder: '#3b82f6',
            clusterBkg: '#1f293766',
            clusterBorder: '#374151',
            titleColor: '#e5e7eb',
            edgeLabelBackground: '#1f2937',
            nodeTextColor: '#e5e7eb',
            actorTextColor: '#e5e7eb',
            actorBkg: '#1f2937',
            actorBorder: '#3b82f6',
            signalColor: '#e5e7eb',
            signalTextColor: '#e5e7eb',
            labelBoxBkgColor: '#1f2937',
            labelBoxBorderColor: '#374151',
            labelTextColor: '#e5e7eb',
            loopTextColor: '#e5e7eb',
            noteBkgColor: '#1e3a5f',
            noteTextColor: '#e5e7eb',
            noteBorderColor: '#3b82f6',
            sectionBkgColor: '#1f2937',
            altSectionBkgColor: '#111827',
            sectionBkgColor2: '#1f2937',
            taskBkgColor: '#3b82f6',
            taskTextColor: '#ffffff',
            taskTextLightColor: '#ffffff',
            taskBorderColor: '#2563eb',
            activeTaskBkgColor: '#2563eb',
            activeTaskBorderColor: '#1d4ed8',
            gridColor: '#374151',
            doneTaskBkgColor: '#065f46',
            doneTaskBorderColor: '#047857',
            critBkgColor: '#7f1d1d',
            critBorderColor: '#991b1b',
            todayLineColor: '#f59e0b',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          },
          flowchart: { curve: 'basis', padding: 16 },
          sequence: { mirrorActors: false },
        })
        mermaidInitialized = true
      }
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      try {
        const { svg: rendered } = await mermaid.render(id, code)
        if (!cancelled) setSvg(rendered)
      } catch {
        if (!cancelled) setSvg('')
      }
    })()
    return () => { cancelled = true }
  }, [code])

  if (!svg) return <pre className="text-gray-500 text-sm p-4 bg-gray-800 rounded-lg overflow-x-auto"><code>{code}</code></pre>

  return (
    <div
      ref={ref}
      className="my-4 flex justify-center [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

const components = {
  h1: ({ children }) => <h1 className="text-white font-bold text-xl mt-5 mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-white font-bold text-lg mt-5 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-white font-semibold mt-4 mb-1">{children}</h3>,
  h4: ({ children }) => <h4 className="text-white font-semibold mt-3 mb-1 text-sm">{children}</h4>,
  p: ({ children }) => <p className="text-gray-300 leading-relaxed mb-2">{children}</p>,
  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
  em: ({ children }) => <em className="text-gray-200">{children}</em>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{children}</a>,
  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 text-gray-300 mb-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 text-gray-300 mb-2">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-accent pl-4 my-2 text-gray-400 italic">{children}</blockquote>,
  table: ({ children }) => <div className="overflow-x-auto my-3"><table className="w-full text-sm text-gray-300">{children}</table></div>,
  thead: ({ children }) => <thead className="border-b border-gray-700 text-gray-400">{children}</thead>,
  th: ({ children }) => <th className="px-3 py-2 text-left font-medium">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 border-b border-gray-800">{children}</td>,
  hr: () => <hr className="border-gray-800 my-4" />,
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '')
    const lang = match?.[1]
    const codeStr = String(children).replace(/\n$/, '')

    if (lang === 'mermaid') {
      return <MermaidBlock code={codeStr} />
    }

    if (className) {
      return (
        <pre className="bg-gray-800 rounded-lg p-4 my-3 overflow-x-auto">
          <code className="text-gray-300 text-sm font-mono">{children}</code>
        </pre>
      )
    }

    return <code className="bg-gray-800 px-1.5 py-0.5 rounded text-accent text-sm font-mono" {...props}>{children}</code>
  },
  pre: ({ children }) => <>{children}</>,
}

export default function MarkdownRenderer({ content }) {
  if (!content) return null

  return (
    <div className="space-y-1">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
