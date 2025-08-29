import React, { useEffect, useMemo, useRef, useState } from 'react'

type CalObj = 'card' | 'a4short' | 'a4long' | 'custom'

const CARD_CM = 8.56
const A4_SHORT_CM = 21.0
const A4_LONG_CM = 29.7

function deviceKey() {
  const o = (screen.orientation && 'type' in screen.orientation) ? (screen.orientation as any).type : (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
  return `realcm:${navigator.userAgent}:${screen.width}x${screen.height}:dpr${window.devicePixelRatio}:${o}`
}

function usePxPerCm() {
  const [pxPerCm, setPxPerCm] = useState<number | null>(null)
  const key = useMemo(() => deviceKey(), [])
  useEffect(() => {
    const v = localStorage.getItem(key)
    if (v) setPxPerCm(Number(v))
  }, [key])
  const save = (v: number) => { localStorage.setItem(key, String(v)); setPxPerCm(v) }
  return { pxPerCm, save, key }
}

export default function App() {
  const { pxPerCm, save } = usePxPerCm()
  const [calChoice, setCalChoice] = useState<CalObj>('card')
  const [customCm, setCustomCm] = useState<number>(10)
  const [dragPx, setDragPx] = useState<number>(200)
  const knownCm = calChoice === 'card' ? CARD_CM : calChoice === 'a4short' ? A4_SHORT_CM : calChoice === 'a4long' ? A4_LONG_CM : customCm
  const currentPxPerCm = dragPx / knownCm

  const handleRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = handleRef.current
    if (!el) return
    let startX = 0
    let startW = 0
    const onDown = (e: PointerEvent) => {
      (e.target as Element).setPointerCapture(e.pointerId)
      startX = e.clientX
      startW = el.clientWidth
    }
    const onMove = (e: PointerEvent) => {
      if (startX === 0) return
      const w = Math.max(20, startW + (e.clientX - startX))
      setDragPx(w)
    }
    const onUp = () => { startX = 0 }
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  const [inputCm, setInputCm] = useState<number>(5)

  return (
    <div className='container'>
      <h1>Real CM – schermkalibratie</h1>
      {!pxPerCm && (
        <div className='card'>
          <h2>1) Kalibreer</h2>
          <select className='select' value={calChoice} onChange={e => setCalChoice(e.target.value as CalObj)}>
            <option value='card'>Bankpas (8.56 cm)</option>
            <option value='a4short'>A4 korte zijde (21.0 cm)</option>
            <option value='a4long'>A4 lange zijde (29.7 cm)</option>
            <option value='custom'>Eigen lengte (cm)</option>
          </select>
          {calChoice === 'custom' && (
            <input className='input' type='number' step='0.1' min='0.1'
                   value={customCm} onChange={e => setCustomCm(Number(e.target.value||0))} />
          )}
          <div className='ruler-wrap'>
            <div className='hint'>Sleep de balk tot de lengte gelijk is aan het object.</div>
            <div ref={handleRef} className='handle' style={{width: `${dragPx}px`}}/>
            <button className='btn' onClick={() => save(currentPxPerCm)}>Opslaan</button>
          </div>
        </div>
      )}

      {pxPerCm && (
        <div className='card'>
          <h2>Test: {inputCm} cm</h2>
          <input className='input' type='number' step='0.1' min='0.1'
                 value={inputCm} onChange={e => setInputCm(Number(e.target.value||0))} />
          <CmBar cm={inputCm} pxPerCm={pxPerCm}/>
          <button className='btn' onClick={() => localStorage.clear()}>Herkalibreer</button>
        </div>
      )}
    </div>
  )
}

function CmBar({ cm, pxPerCm }: { cm: number, pxPerCm: number }) {
  const px = Math.max(1, cm * pxPerCm)
  return <div className='handle' style={{width: px}}/>
}