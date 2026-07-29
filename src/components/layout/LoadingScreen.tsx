import { BookOpenText, LoaderCircle } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-2xl shadow-primary/30">
          <BookOpenText className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-xl font-bold">Catalog Studio</h1>
        <p className="mt-2 text-sm text-slate-400">Recuperando tu espacio de trabajo</p>
        <LoaderCircle className="mx-auto mt-5 h-5 w-5 animate-spin text-primary-light" />
      </div>
    </div>
  )
}
