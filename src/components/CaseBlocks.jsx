import { useEffect, useRef, useState } from 'react'
import { blockPlacement, clampPercent, cleanText as clean, isRenderableBlock, isVideoUrl } from '../utils/caseBlocks'

// Optional case-study blocks for archive projects. Every block reads only the
// shared data contract in src/utils/caseBlocks.js (documented in
// docs/FRONT_THEME_CONTRACT.md) and renders nothing when its media is missing.

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function BlockHeading({ block }) {
  const title = clean(block.title)
  if (!title) return null
  return <h3 className="case-block__title">{title}</h3>
}

function BlockCaption({ block }) {
  const caption = clean(block.caption)
  if (!caption) return null
  return <p className="case-block__caption">{caption}</p>
}

function CaseVideo({ url, poster, alt }) {
  const videoRef = useRef(null)
  const [paused, setPaused] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (prefersReducedMotion()) {
      video.pause()
      return
    }
    const attempt = video.play()
    if (attempt && typeof attempt.catch === 'function') attempt.catch(() => setPaused(true))
  }, [url])

  const toggle = () => {
    const video = videoRef.current
    if (!video) return
    // Follow the rendered state so the button label and the action always match.
    if (paused) {
      const attempt = video.play()
      if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {})
    } else {
      video.pause()
    }
  }

  return (
    <div className="case-block__video">
      <video
        ref={videoRef}
        src={url}
        poster={poster || undefined}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt || undefined}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
      />
      <button type="button" className="case-block__video-toggle" onClick={toggle}>
        {paused ? 'Play' : 'Pause'}
      </button>
    </div>
  )
}

function MediaBlock({ block }) {
  const [failed, setFailed] = useState(false)
  const url = clean(block.url)
  if (!url || failed) return null
  const video = isVideoUrl(url, block.kind)
  const framed = block.frame === 'browser'
  const media = video
    ? <CaseVideo url={url} poster={clean(block.poster)} alt={clean(block.alt)} />
    : <img src={url} alt={clean(block.alt)} loading="lazy" decoding="async" onError={() => setFailed(true)} />

  return (
    <figure className={`case-block case-block--media${framed ? ' case-block--framed' : ''}`}>
      <BlockHeading block={block} />
      <div className="case-block__stage">
        {framed && (
          <div className="case-block__frame-bar" aria-hidden="true">
            <i /><i /><i />
            {clean(block.frameLabel) && <span>{clean(block.frameLabel)}</span>}
          </div>
        )}
        {media}
      </div>
      {clean(block.caption) && <figcaption className="case-block__caption">{clean(block.caption)}</figcaption>}
    </figure>
  )
}

function CompareBlock({ block }) {
  const [position, setPosition] = useState(50)
  const beforeUrl = clean(block.beforeUrl)
  const afterUrl = clean(block.afterUrl)
  if (!beforeUrl || !afterUrl) return null
  const beforeLabel = clean(block.beforeLabel) || 'Before'
  const afterLabel = clean(block.afterLabel) || 'After'

  return (
    <figure className="case-block case-block--compare">
      <BlockHeading block={block} />
      <div className="case-block__compare" style={{ '--case-compare-position': `${position}%` }}>
        <img src={beforeUrl} alt={clean(block.beforeAlt)} loading="lazy" decoding="async" />
        <div className="case-block__compare-after">
          <img src={afterUrl} alt={clean(block.afterAlt)} loading="lazy" decoding="async" />
        </div>
        <span className="case-block__compare-label case-block__compare-label--before" aria-hidden="true">{beforeLabel}</span>
        <span className="case-block__compare-label case-block__compare-label--after" aria-hidden="true">{afterLabel}</span>
        <span className="case-block__compare-handle" aria-hidden="true" />
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={position}
          aria-label={`Compare ${beforeLabel} and ${afterLabel}`}
          onChange={(event) => setPosition(Number(event.target.value))}
        />
      </div>
      {clean(block.caption) && <figcaption className="case-block__caption">{clean(block.caption)}</figcaption>}
    </figure>
  )
}

function StatsBlock({ block }) {
  const items = (Array.isArray(block.items) ? block.items : []).filter((item) => clean(item?.value) && clean(item?.label))
  if (items.length === 0) return null
  const columns = items.length <= 4 ? items.length : 3
  const tabletColumns = columns === 3 ? 3 : Math.min(columns, 2)
  return (
    <div className="case-block case-block--stats" role="group" aria-label={clean(block.title) || 'Key figures'}>
      <BlockHeading block={block} />
      <dl className="case-block__stats" style={{ '--case-stat-cols': columns, '--case-stat-tablet-cols': tabletColumns }}>
        {items.map((item, index) => (
          <div key={`${item.label}-${index}`}>
            <dt>{clean(item.label)}</dt>
            <dd>
              <strong>{clean(item.value)}</strong>
              {clean(item.source) && <small>{clean(item.source)}</small>}
            </dd>
          </div>
        ))}
      </dl>
      <BlockCaption block={block} />
    </div>
  )
}

function TileItem({ item, wide }) {
  const [failed, setFailed] = useState(false)
  const url = clean(item.url)
  return (
    <article className={`case-block__tile${wide ? ' case-block__tile--wide' : ''}`}>
      <div className="case-block__tile-copy">
        {clean(item.eyebrow) && <span>{clean(item.eyebrow)}</span>}
        {clean(item.title) && <h4>{clean(item.title)}</h4>}
        {clean(item.text) && <p>{clean(item.text)}</p>}
      </div>
      {url && !failed && <img src={url} alt={clean(item.alt)} loading="lazy" decoding="async" onError={() => setFailed(true)} />}
    </article>
  )
}

function TilesBlock({ block }) {
  const items = (Array.isArray(block.items) ? block.items : []).filter((item) => clean(item?.url) || clean(item?.title))
  if (items.length === 0) return null
  const firstWide = items.length % 2 === 1
  return (
    <div className="case-block case-block--tiles" role="group" aria-label={clean(block.title) || 'Details'}>
      <BlockHeading block={block} />
      <div className="case-block__tiles">
        {items.map((item, index) => <TileItem key={`${item.title || item.url}-${index}`} item={item} wide={firstWide && index === 0} />)}
      </div>
      <BlockCaption block={block} />
    </div>
  )
}

function AnnotatedBlock({ block }) {
  const [failed, setFailed] = useState(false)
  const url = clean(block.url)
  if (!url || failed) return null
  const pins = (Array.isArray(block.pins) ? block.pins : []).filter((pin) => clean(pin?.note))
  return (
    <figure className="case-block case-block--annotated">
      <BlockHeading block={block} />
      <div className="case-block__annotated">
        <img src={url} alt={clean(block.alt)} loading="lazy" decoding="async" onError={() => setFailed(true)} />
        {pins.map((pin, index) => (
          <span
            key={`pin-${index}`}
            className="case-block__pin"
            aria-hidden="true"
            style={{ left: `${clampPercent(pin.x)}%`, top: `${clampPercent(pin.y)}%` }}
          >
            {index + 1}
          </span>
        ))}
      </div>
      {pins.length > 0 && (
        <ol className="case-block__notes">
          {pins.map((pin, index) => (
            <li key={`note-${index}`}><span aria-hidden="true">{index + 1}</span><p>{clean(pin.note)}</p></li>
          ))}
        </ol>
      )}
      {clean(block.caption) && <figcaption className="case-block__caption">{clean(block.caption)}</figcaption>}
    </figure>
  )
}

const RENDERERS = {
  media: MediaBlock,
  compare: CompareBlock,
  stats: StatsBlock,
  tiles: TilesBlock,
  annotated: AnnotatedBlock,
}

export function CaseBlock({ block }) {
  const Renderer = RENDERERS[block?.type]
  if (!Renderer) return null
  return <Renderer block={block} />
}

export default function CaseBlockList({ blocks, placement }) {
  const items = (Array.isArray(blocks) ? blocks : [])
    .filter((block) => isRenderableBlock(block) && RENDERERS[block.type])
    .filter((block) => blockPlacement(block) === placement)
  if (items.length === 0) return null
  return (
    <div className="case-blocks" data-placement={placement}>
      {items.map((block, index) => <CaseBlock key={block.id || `${placement}-${index}`} block={block} />)}
    </div>
  )
}
