import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const renderedGuide = readFileSync(new URL('../src/components/AdminDesignSystem.jsx', import.meta.url), 'utf8')
const markdownGuide = readFileSync(new URL('../docs/DESIGN_SYSTEM.md', import.meta.url), 'utf8')

const repeatableRowRules = [
  '반복 편집 행의 모든 필드는 행의 위쪽 기준선에 맞추고 단일 입력·선택은 42px 높이를 공유합니다. 여러 줄 입력만 내용에 따라 아래로 확장하며, 이 때문에 다른 필드를 행의 수직 중앙으로 내리지 않습니다.',
  '삭제·복제·이동 같은 행 관리는 독립된 끝 열로 멀리 떼어 놓지 않습니다. 마지막 관련 필드와 하나의 관리 그룹으로 묶어 8px 간격으로 배치하고, 텍스트 삭제 버튼은 Desktop 42px·Mobile 44px 이상의 조작 높이를 사용합니다.',
  '반복 편집 행이 한 열로 전환되면 각 필드 라벨을 복원하고 ‘마지막 필드 | 관리 행동’의 인접 관계를 유지합니다. 삭제 버튼만 번호 옆이나 행 반대쪽 모서리로 이동시키지 않습니다.',
  '넓은 화면의 안내 문장은 사용 가능한 폭을 쓰며 임의 max-width 때문에 한두 글자만 다음 줄로 보내지 않습니다. 화면이 좁을 때만 단어 단위로 자연스럽게 줄바꿈합니다.',
  '페이지 제목과 첫 패널 제목이 같은 대상을 가리키면 패널 제목을 반복하지 않고, 바로 하위 편집 그룹이나 데이터 목록을 시작합니다.',
  '한 페이지에 병렬 패널이 둘 이상이면 각 패널의 서로 다른 작업 범위를 서브 제목으로 표시합니다.',
  '상위 선택이 아래 작업 범위를 바꾸면 활성 항목에 ‘현재 편집 중’을 표시하고, 선택기와 공통 액션 바를 하나의 연결된 작업 묶음으로 표현합니다.',
  '테마 적용 대상 버튼을 목록의 유일한 타이틀로 사용하고, 선택 패널 안에서 같은 대상명을 다시 제목으로 반복하지 않습니다.',
  '미리보기 진입은 각 테마 카드 하단에만 두며 카드 목록 위에 전체 미리보기 버튼을 중복하지 않습니다.',
  '접힌 요약 행은 회사명·직함·프로젝트 수·기간에 공통 열 토큰을 사용하고, 내용 길이가 달라도 각 열의 시작선이 행마다 움직이지 않습니다.',
]

test('repeatable-row rules stay synchronized between the rendered guide and Markdown', () => {
  for (const rule of repeatableRowRules) {
    assert.ok(renderedGuide.includes(rule), `Rendered guide is missing: ${rule}`)
    assert.ok(markdownGuide.includes(rule), `Markdown guide is missing: ${rule}`)
  }
})
