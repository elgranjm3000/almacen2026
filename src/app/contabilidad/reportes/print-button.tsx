'use client'

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md border border-ink/25 px-4 py-2 text-[13.5px] font-550 text-ink transition-colors hover:border-ink/50 hover:bg-ink/5"
    >
      Imprimir / Guardar PDF
    </button>
  )
}
