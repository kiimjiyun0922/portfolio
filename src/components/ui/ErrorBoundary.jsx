import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[UI error boundary]', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
        <section className="max-w-md text-center rounded-2xl border border-gray-800 bg-gray-900 p-8">
          <h1 className="text-xl font-semibold mb-3">화면을 불러오지 못했습니다</h1>
          <p className="text-sm text-gray-400 mb-6">네트워크가 잠시 끊겼거나 새 버전이 배포되었습니다. 다시 불러오면 대부분 해결됩니다.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-accent text-white cursor-pointer">다시 불러오기</button>
        </section>
      </main>
    )
  }
}
