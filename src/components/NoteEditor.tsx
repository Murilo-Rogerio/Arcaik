import { Check, FileText, ImagePlus, ListTodo, PenLine, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useData } from '../store/DataContext'
import type { Note, NoteKind, TodoItem } from '../lib/types'
import { cn, todayStr } from '../lib/utils'
import PhotoViewer from './PhotoViewer'
import TagPicker from './TagPicker'
import { Button, ConfirmButton, Input, Modal, Textarea, useToast } from './ui'

type Props = {
  open: boolean
  note: Note | null
  defaultKind?: NoteKind
  defaultDue?: string | null
  onClose: () => void
}

const emptyItem = (): TodoItem => ({ id: crypto.randomUUID(), text: '', done: false })

/** Encolhe fotos antes do upload (uma foto de 5 MB vira ~300 KB). */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  try {
    const bitmap = await createImageBitmap(file)
    const max = 1600
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
    if (scale >= 1 && file.size <= 600 * 1024) return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85),
    )
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export default function NoteEditor({ open, note, defaultKind = 'note', defaultDue = null, onClose }: Props) {
  const { upsertNote, deleteNote, attachments, uploadAttachment, deleteAttachment } = useData()
  const toast = useToast()

  const [kind, setKind] = useState<NoteKind>(defaultKind)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [items, setItems] = useState<TodoItem[]>([emptyItem()])
  const [due, setDue] = useState('')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [focusId, setFocusId] = useState<string | null>(null)
  const [pending, setPending] = useState<File[]>([])
  const [viewer, setViewer] = useState<number | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    setKind(note?.kind ?? defaultKind)
    setTitle(note?.title ?? '')
    setContent(note?.content ?? '')
    setItems(note?.items?.length ? note.items : [emptyItem()])
    setDue(note?.due_at ?? defaultDue ?? '')
    setTagIds(note?.tag_ids ?? [])
    setPending([])
  }, [open, note, defaultKind, defaultDue])

  useEffect(() => {
    if (focusId) {
      document.getElementById(`todo-${focusId}`)?.focus()
      setFocusId(null)
    }
  }, [focusId, items])

  const existing = note ? attachments.filter((a) => a.note_id === note.id) : []
  const existingPhotos = existing.filter((a) => a.mime.startsWith('image/') && a.url)

  const addFiles = async (files: File[]) => {
    const ok: File[] = []
    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) {
        toast(`${f.name} passou de 10 MB e foi ignorado.`, 'error')
        continue
      }
      ok.push(await compressImage(f))
    }
    if (ok.length) setPending((p) => [...p, ...ok])
  }

  const removePending = (index: number) => setPending((p) => p.filter((_, i) => i !== index))

  const updateItem = (id: string, text: string) =>
    setItems((list) => list.map((i) => (i.id === id ? { ...i, text } : i)))

  const removeItem = (id: string) => setItems((list) => list.filter((i) => i.id !== id))

  const addItem = (afterId?: string) => {
    const item = emptyItem()
    setItems((list) => {
      const idx = afterId ? list.findIndex((i) => i.id === afterId) : list.length - 1
      const copy = [...list]
      copy.splice(idx + 1, 0, item)
      return copy
    })
    setFocusId(item.id)
  }

  const valid =
    title.trim() !== '' || content.trim() !== '' || items.some((i) => i.text.trim() !== '') || pending.length > 0

  const save = async () => {
    if (!valid || saving) return
    setSaving(true)
    try {
      const cleanItems = items
        .filter((i) => i.text.trim() !== '')
        .map((i) => ({ ...i, text: i.text.trim() }))
      const saved = await upsertNote({
        id: note?.id,
        kind,
        title: title.trim(),
        content: kind === 'note' ? content.trim() || null : null,
        items: kind === 'todo' ? cleanItems : null,
        due_at: due || null,
        tag_ids: tagIds,
      })
      if (!saved) return
      for (const file of pending) await uploadAttachment(saved.id, file)
      toast(note ? 'Nota atualizada' : 'Nota criada')
      onClose()
    } catch {
      toast('Algo falhou ao salvar — tente novamente.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={note ? 'Editar' : 'Nova nota'}>
        <div className="space-y-5">
          {!note && (
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-hairline/10 bg-surface/5 p-1">
              {[
                { k: 'note' as NoteKind, label: 'Nota', icon: PenLine },
                { k: 'todo' as NoteKind, label: 'Lista', icon: ListTodo },
              ].map((opt) => (
                <button
                  key={opt.k}
                  type="button"
                  onClick={() => setKind(opt.k)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-medium transition',
                    kind === opt.k
                      ? 'bg-surface/80 text-ink shadow-card dark:bg-surface/[0.1]'
                      : 'text-ink-2 hover:text-ink',
                  )}
                >
                  <opt.icon size={14} /> {opt.label}
                </button>
              ))}
            </div>
          )}

          <Input
            label="Título"
            placeholder="Ex.: Ideias para o vídeo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {kind === 'note' ? (
            <Textarea
              label="Conteúdo"
              placeholder="Escreva à vontade… (Ctrl+V cola imagem)"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={(e) => {
                const files = Array.from(e.clipboardData.files)
                if (files.length > 0) {
                  e.preventDefault()
                  addFiles(files)
                }
              }}
            />
          ) : (
            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Itens</span>
              <div className="space-y-2">
                {items.map((it) => (
                  <div key={it.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={it.done ? 'Desmarcar' : 'Concluir'}
                      onClick={() => setItems((l) => l.map((i) => (i.id === it.id ? { ...i, done: !i.done } : i)))}
                      className={cn(
                        'grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition active:scale-90',
                        it.done ? 'border-accent bg-accent text-accent-ink' : 'border-ink-3/50 hover:border-accent',
                      )}
                    >
                      {it.done ? <Check size={11} strokeWidth={3.5} /> : null}
                    </button>
                    <input
                      id={`todo-${it.id}`}
                      value={it.text}
                      onChange={(e) => updateItem(it.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addItem(it.id)
                        }
                        if (e.key === 'Backspace' && it.text === '' && items.length > 1) {
                          e.preventDefault()
                          removeItem(it.id)
                        }
                      }}
                      placeholder="Novo item"
                      className="field flex-1"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        className="icon-btn size-8"
                        aria-label="Remover item"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addItem()}
                className="mt-2.5 flex items-center gap-1 text-[13px] font-medium text-accent"
              >
                <Plus size={13} /> adicionar item
              </button>
            </div>
          )}

          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Anexos</span>
            <div className="flex flex-wrap gap-2.5">
              {existing.map((a) => (
                <div key={a.id} className="relative">
                  {a.mime.startsWith('image/') ? (
                    <button
                      type="button"
                      onClick={() => setViewer(Math.max(0, existingPhotos.findIndex((p) => p.id === a.id)))}
                      aria-label={`Ampliar ${a.name}`}
                      className="block overflow-hidden rounded-xl border border-hairline/10"
                    >
                      <img
                        src={a.url}
                        alt={a.name}
                        className="size-20 object-cover transition duration-300 hover:scale-105"
                      />
                    </button>
                  ) : (
                    <div className="flex h-20 w-32 shrink-0 items-center gap-1.5 rounded-xl border border-hairline/10 bg-surface/5 px-2.5 text-[11px] text-ink-2">
                      <FileText size={14} className="shrink-0 text-ink-3" />
                      <span className="truncate">{a.name}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteAttachment(a.id)}
                    aria-label="Remover anexo"
                    className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border border-hairline/10 bg-bg text-ink-2 shadow-card hover:text-red-400"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              {pending.map((f, i) => (
                <div key={f.name + i} className="relative">
                  {f.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(f)}
                      alt={f.name}
                      className="size-20 rounded-xl border border-dashed border-accent/50 object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-32 shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-accent/50 bg-surface/5 px-2.5 text-[11px] text-ink-2">
                      <FileText size={14} className="shrink-0 text-ink-3" />
                      <span className="truncate">{f.name}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removePending(i)}
                    aria-label="Remover"
                    className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border border-hairline/10 bg-bg text-ink-2 shadow-card hover:text-red-400"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex size-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-hairline/25 text-ink-3 transition hover:border-accent/40 hover:text-accent"
              >
                <ImagePlus size={18} />
                <span className="text-[10px] font-medium">anexar</span>
              </button>
            </div>
            <input
              ref={fileInput}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                addFiles(Array.from(e.target.files ?? []))
                e.target.value = ''
              }}
            />
            <p className="mt-2 font-mono text-[10px] text-ink-3">imagens e arquivos até 10 MB · toque numa foto para ampliar</p>
          </div>

          <div className="flex items-end gap-2.5">
            <label className="flex-1">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Agendar na rotina</span>
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="field" />
            </label>
            <Button type="button" size="sm" variant="ghost" onClick={() => setDue(todayStr())}>
              Hoje
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setDue('')}>
              Limpar
            </Button>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-2">Etiquetas</p>
            <TagPicker selected={tagIds} onChange={setTagIds} />
          </div>

          <div className="flex items-center justify-between border-t border-hairline/10 pt-4">
            {note ? (
              <ConfirmButton
                onConfirm={async () => {
                  await deleteNote(note.id)
                  toast('Nota excluída')
                  onClose()
                }}
              />
            ) : (
              <span />
            )}
            <div className="flex gap-2.5">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button loading={saving} disabled={!valid} onClick={save}>
                {note ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {viewer !== null && existingPhotos.length > 0 && (
        <PhotoViewer photos={existingPhotos} startIndex={viewer} onClose={() => setViewer(null)} />
      )}
    </>
  )
}
