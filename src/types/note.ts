export interface Note {
  _id: string
  title: string
  content: string
  userId: string
  customerId: string
  createdAt: string
  updatedAt: string
}

export interface NotesResponse {
  notes: Note[]
}

export interface CreateNoteRequest {
  title: string
  content: string
}

export interface UpdateNoteRequest {
  title?: string
  content?: string
}
