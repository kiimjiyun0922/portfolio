import { useState } from 'react'
import { Field, MediaField, SelectField } from './AdminUI'
import { CASE_BLOCK_PLACEMENTS, createCaseBlock } from '../../utils/caseBlocks'

const TYPE_LABELS = {
  media: '이미지·영상',
  compare: '전후 비교 슬라이더',
  stats: '숫자 카드',
  tiles: '디테일 타일',
  annotated: '주석 이미지',
}

const PLACEMENT_LABELS = {
  brief: 'Brief 다음',
  problem: '01 Problem 다음',
  userFlow: '02 IA / User Flow 다음',
  solution: '03 Design Solution 다음',
  validation: '04 Validation 다음',
  designSystem: '05 Design System 다음',
}

const IMAGE_GUIDE = '권장 2000px 이상 · WebP/JPEG/PNG/AVIF · 최대 8MB'

function swap(list, from, to) {
  const next = [...list]
  ;[next[from], next[to]] = [next[to], next[from]]
  return next
}

function ItemList({ label, addLabel, items, onChange, createItem, confirmDelete, renderFields, columns = 3 }) {
  const update = (index, value) => {
    const next = [...items]
    next[index] = value
    onChange(next)
  }
  const remove = async (index) => {
    if (!(await confirmDelete(`${label} 삭제`, `${label} ${index + 1}`))) return
    onChange(items.filter((_, itemIndex) => itemIndex !== index))
  }
  return (
    <div className="admin-case-items">
      <header>
        <b>{label}</b>
        <button type="button" className="admin-toolbar-button" onClick={() => onChange([...items, createItem()])}>{addLabel}</button>
      </header>
      {items.map((item, index) => (
        <div key={index} className="admin-case-item">
          <span>{String(index + 1).padStart(2, '0')}</span>
          <div className="admin-case-item__fields" style={{ '--admin-case-cols': columns }}>
            {renderFields(item, (value) => update(index, value))}
            <div className="admin-case-item__actions">
              <button type="button" className="admin-row-delete" aria-label={`${label} ${index + 1} 삭제`} onClick={() => remove(index)}>삭제</button>
            </div>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="admin-empty-row">등록된 항목이 없습니다.</p>}
    </div>
  )
}

function BlockFields({ block, onChange, upload, confirmDelete }) {
  const set = (patch) => onChange({ ...block, ...patch })

  if (block.type === 'media') {
    const isVideo = block.kind === 'video'
    return (
      <>
        <div className="admin-case-block__fields">
          <SelectField label="종류" value={block.kind || 'auto'} options={[{ value: 'auto', label: '주소로 자동 판단' }, { value: 'image', label: '이미지' }, { value: 'video', label: '영상 (mp4·webm)' }]} onChange={(v) => set({ kind: v })} />
          <SelectField label="프레임" value={block.frame || 'plain'} options={[{ value: 'plain', label: '없음' }, { value: 'browser', label: '브라우저 창' }]} onChange={(v) => set({ frame: v })} />
          {block.frame === 'browser' && <Field label="창 주소 표시" value={block.frameLabel || ''} onChange={(v) => set({ frameLabel: v })} hint="예: example.com/product" />}
          <Field label="대체 텍스트" value={block.alt || ''} onChange={(v) => set({ alt: v })} />
        </div>
        {isVideo ? (
          <div className="admin-case-block__fields">
            <Field label="영상 주소" value={block.url || ''} onChange={(v) => set({ url: v })} hint="mp4·webm 파일 주소. Firebase 콘솔 Storage에 올린 뒤 다운로드 URL을 붙여 넣습니다." className="is-wide" />
            <MediaField label="영상 대표 이미지" value={block.poster || ''} onChange={(v) => set({ poster: v })} onUpload={(file) => upload(file, 'blocks')} guide={IMAGE_GUIDE} className="is-wide" />
          </div>
        ) : (
          <div className="admin-case-block__fields">
            <MediaField label="이미지" value={block.url || ''} onChange={(v) => set({ url: v })} onUpload={(file) => upload(file, 'blocks')} guide={IMAGE_GUIDE} className="is-wide" />
          </div>
        )}
      </>
    )
  }

  if (block.type === 'compare') {
    return (
      <div className="admin-case-block__fields">
        <MediaField label="Before 이미지" value={block.beforeUrl || ''} onChange={(v) => set({ beforeUrl: v })} onUpload={(file) => upload(file, 'blocks')} guide={IMAGE_GUIDE} className="is-wide" />
        <Field label="Before 대체 텍스트" value={block.beforeAlt || ''} onChange={(v) => set({ beforeAlt: v })} />
        <Field label="Before 라벨" value={block.beforeLabel || ''} onChange={(v) => set({ beforeLabel: v })} hint="방문자 화면 표시 · 기본값 Before" />
        <MediaField label="After 이미지" value={block.afterUrl || ''} onChange={(v) => set({ afterUrl: v })} onUpload={(file) => upload(file, 'blocks')} guide="Before와 같은 비율로 준비합니다" className="is-wide" />
        <Field label="After 대체 텍스트" value={block.afterAlt || ''} onChange={(v) => set({ afterAlt: v })} />
        <Field label="After 라벨" value={block.afterLabel || ''} onChange={(v) => set({ afterLabel: v })} hint="방문자 화면 표시 · 기본값 After" />
      </div>
    )
  }

  if (block.type === 'stats') {
    return (
      <ItemList
        label="숫자"
        addLabel="+ 숫자 추가"
        items={block.items || []}
        onChange={(items) => set({ items })}
        createItem={() => ({ value: '', label: '', source: '' })}
        confirmDelete={confirmDelete}
        renderFields={(item, update) => (
          <>
            <Field label="값" value={item.value || ''} onChange={(v) => update({ ...item, value: v })} hint="예: 83.7%" />
            <Field label="설명" value={item.label || ''} onChange={(v) => update({ ...item, label: v })} />
            <Field label="출처" value={item.source || ''} onChange={(v) => update({ ...item, source: v })} hint="예: Beusable" />
          </>
        )}
      />
    )
  }

  if (block.type === 'tiles') {
    return (
      <ItemList
        label="타일"
        addLabel="+ 타일 추가"
        columns={2}
        items={block.items || []}
        onChange={(items) => set({ items })}
        createItem={() => ({ url: '', alt: '', eyebrow: '', title: '', text: '' })}
        confirmDelete={confirmDelete}
        renderFields={(item, update) => (
          <>
            <MediaField label="이미지" value={item.url || ''} onChange={(v) => update({ ...item, url: v })} onUpload={(file) => upload(file, 'blocks')} guide={IMAGE_GUIDE} className="is-wide" />
            <Field label="보조 라벨" value={item.eyebrow || ''} onChange={(v) => update({ ...item, eyebrow: v })} hint="예: 01 · Talk-first" />
            <Field label="제목" value={item.title || ''} onChange={(v) => update({ ...item, title: v })} />
            <Field label="설명" value={item.text || ''} onChange={(v) => update({ ...item, text: v })} rows={2} className="is-wide" />
            <Field label="대체 텍스트" value={item.alt || ''} onChange={(v) => update({ ...item, alt: v })} className="is-wide" />
          </>
        )}
      />
    )
  }

  if (block.type === 'annotated') {
    return (
      <>
        <div className="admin-case-block__fields">
          <MediaField label="이미지" value={block.url || ''} onChange={(v) => set({ url: v })} onUpload={(file) => upload(file, 'blocks')} guide={IMAGE_GUIDE} className="is-wide" />
          <Field label="대체 텍스트" value={block.alt || ''} onChange={(v) => set({ alt: v })} className="is-wide" />
        </div>
        <ItemList
          label="주석"
          addLabel="+ 주석 추가"
          items={block.pins || []}
          onChange={(pins) => set({ pins })}
          createItem={() => ({ x: 50, y: 50, note: '' })}
          confirmDelete={confirmDelete}
          renderFields={(pin, update) => (
            <>
              <Field label="가로 위치 (%)" type="number" value={String(pin.x ?? '')} onChange={(v) => update({ ...pin, x: v === '' ? '' : Number(v) })} hint="왼쪽 0 · 오른쪽 100" />
              <Field label="세로 위치 (%)" type="number" value={String(pin.y ?? '')} onChange={(v) => update({ ...pin, y: v === '' ? '' : Number(v) })} hint="위 0 · 아래 100" />
              <Field label="설명" value={pin.note || ''} onChange={(v) => update({ ...pin, note: v })} />
            </>
          )}
        />
      </>
    )
  }

  return null
}

export default function CaseBlocksEditor({ blocks = [], onChange, upload, confirmDelete }) {
  const [newType, setNewType] = useState('media')
  const update = (index, value) => {
    const next = [...blocks]
    next[index] = value
    onChange(next)
  }
  const remove = async (index) => {
    const block = blocks[index]
    if (!(await confirmDelete('케이스 블록 삭제', block?.title || `${TYPE_LABELS[block?.type] || '블록'} ${index + 1}`))) return
    onChange(blocks.filter((_, blockIndex) => blockIndex !== index))
  }

  return (
    <div>
      <div className="admin-case-blocks__add">
        <p>영상, 전후 비교, 숫자, 디테일 타일, 주석 이미지를 케이스 스터디 원하는 위치에 넣습니다.</p>
        <div>
          <SelectField ariaLabel="추가할 블록 종류" value={newType} options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))} onChange={setNewType} />
          <button type="button" className="admin-secondary-button" onClick={() => onChange([...blocks, createCaseBlock(newType)])}>블록 추가</button>
        </div>
      </div>
      <div className="space-y-3">
        {blocks.map((block, index) => (
          <article key={block.id || index} className="admin-gallery-row admin-case-block">
            <header>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <b>{TYPE_LABELS[block.type] || '알 수 없는 블록'}</b>
              <div>
                <button type="button" aria-label={`블록 ${index + 1} 위로 이동`} disabled={index === 0} onClick={() => onChange(swap(blocks, index, index - 1))}>↑</button>
                <button type="button" aria-label={`블록 ${index + 1} 아래로 이동`} disabled={index === blocks.length - 1} onClick={() => onChange(swap(blocks, index, index + 1))}>↓</button>
                <button type="button" onClick={() => remove(index)} className="admin-row-delete">삭제</button>
              </div>
            </header>
            <div className="admin-case-block__fields">
              <SelectField label="표시 위치" value={block.placement || 'solution'} options={CASE_BLOCK_PLACEMENTS.map((value) => ({ value, label: PLACEMENT_LABELS[value] }))} onChange={(v) => update(index, { ...block, placement: v })} />
              <Field label="블록 제목 (선택)" value={block.title || ''} onChange={(v) => update(index, { ...block, title: v })} />
              <Field label="캡션 (선택)" value={block.caption || ''} onChange={(v) => update(index, { ...block, caption: v })} className="is-wide" />
            </div>
            <BlockFields block={block} onChange={(value) => update(index, value)} upload={upload} confirmDelete={confirmDelete} />
          </article>
        ))}
        {blocks.length === 0 && (
          <div className="admin-empty-state">
            <span>00</span>
            <b>케이스 블록이 없습니다</b>
            <p>프로토타입 영상이나 전후 비교처럼 글만으로 전달하기 어려운 장면을 추가하세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}
