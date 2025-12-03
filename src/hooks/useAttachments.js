import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export const useAttachments = () => {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  // Sanitizace názvu souboru - odstranění diakritiky a speciálních znaků
  const sanitizeFileName = (name) => {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // odstranit diakritiku
      .replace(/[^a-zA-Z0-9._-]/g, '_') // nahradit speciální znaky podtržítkem
      .replace(/_+/g, '_') // odstranit vícenásobná podtržítka
  }

  // Upload souboru
  const uploadFile = async (noteId, file) => {
    if (!user || !file) return { data: null, error: 'Chybí soubor nebo uživatel' }

    setUploading(true)
    setError(null)

    try {
      // Cesta k souboru: user_id/note_id/timestamp_filename
      const sanitizedName = sanitizeFileName(file.name)
      const fileName = `${Date.now()}_${sanitizedName}`
      const filePath = `${user.id}/${noteId}/${fileName}`

      // Upload do Storage
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file)

      if (uploadError) {
        setError(uploadError.message)
        setUploading(false)
        return { data: null, error: uploadError.message }
      }

      // Získání URL
      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath)

      // Uložení záznamu do DB
      const { data: attachment, error: dbError } = await supabase
        .from('attachments')
        .insert([
          {
            note_id: noteId,
            user_id: user.id,
            filename: file.name,
            file_url: filePath,
            file_type: file.type,
            file_size: file.size,
          },
        ])
        .select()
        .single()

      if (dbError) {
        // Rollback - smazat soubor ze storage
        await supabase.storage.from('attachments').remove([filePath])
        setError(dbError.message)
        setUploading(false)
        return { data: null, error: dbError.message }
      }

      setUploading(false)
      return { data: attachment, error: null }
    } catch (err) {
      setError(err.message)
      setUploading(false)
      return { data: null, error: err.message }
    }
  }

  // Smazání souboru
  const deleteFile = async (attachment) => {
    try {
      // Smazat ze Storage
      const { error: storageError } = await supabase.storage
        .from('attachments')
        .remove([attachment.file_url])

      if (storageError) {
        return { error: storageError.message }
      }

      // Smazat z DB
      const { error: dbError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachment.id)

      if (dbError) {
        return { error: dbError.message }
      }

      return { error: null }
    } catch (err) {
      return { error: err.message }
    }
  }

  // Získání URL pro stažení
  const getFileUrl = async (filePath) => {
    const { data, error } = await supabase.storage
      .from('attachments')
      .createSignedUrl(filePath, 3600) // 1 hodina

    if (error) {
      return null
    }

    return data.signedUrl
  }

  // Načtení příloh pro poznámku
  const fetchAttachments = async (noteId) => {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('note_id', noteId)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  }

  return {
    uploading,
    error,
    uploadFile,
    deleteFile,
    getFileUrl,
    fetchAttachments,
  }
}
