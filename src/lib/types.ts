export type Tag = {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export type TodoItem = { id: string; text: string; done: boolean }
export type NoteKind = 'note' | 'todo'

export type Note = {
  id: string
  user_id: string
  kind: NoteKind
  title: string
  content: string | null
  items: TodoItem[] | null
  due_at: string | null
  tag_ids: string[] | null
  created_at: string
  updated_at: string
}

export type MediaItem = {
  id: string
  user_id: string
  url: string
  provider: string
  title: string | null
  description: string | null
  thumbnail_url: string | null
  tag_ids: string[] | null
  created_at: string
}

export type Profile = {
  id: string
  display_name: string | null
  created_at: string
}

export const TAG_COLORS = [
  '#FF7A59', '#FFB454', '#F2DE5C', '#A6D96A', '#4FD1A1',
  '#54C0DC', '#6FA8E8', '#A99BE8', '#E88BB5', '#9AA4B2',
] as const
export type Attachment = {
  id: string
  user_id: string
  note_id: string
  storage_path: string
  name: string
  mime: string
  size: number
  created_at: string
  url?: string
}
