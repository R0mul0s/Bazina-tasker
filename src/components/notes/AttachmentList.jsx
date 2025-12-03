import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CButton,
  CSpinner,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilFile,
  cilImage,
  cilCloudDownload,
  cilTrash,
  cilZoomIn,
} from '@coreui/icons'
import { formatFileSize } from '../../lib/utils'

// Kontrola, zda je soubor obrázek
const isImageFile = (mimeType) => {
  return mimeType?.startsWith('image/')
}

// Ikona podle typu souboru
const getFileIcon = (mimeType) => {
  if (isImageFile(mimeType)) return cilImage
  return cilFile
}

const AttachmentList = ({
  attachments,
  onDownload,
  onDelete,
  getFileUrl,
}) => {
  const { t } = useTranslation('common')
  const [imageUrls, setImageUrls] = useState({})
  const [loadingUrls, setLoadingUrls] = useState({})
  const [lightboxImage, setLightboxImage] = useState(null)

  // Načtení URL pro náhledy obrázků
  useEffect(() => {
    const loadImageUrls = async () => {
      const imageAttachments = attachments.filter((a) => isImageFile(a.file_type))

      for (const attachment of imageAttachments) {
        // Přeskočit, pokud už máme URL nebo se načítá
        if (imageUrls[attachment.id] || loadingUrls[attachment.id]) continue

        setLoadingUrls((prev) => ({ ...prev, [attachment.id]: true }))

        try {
          const url = await getFileUrl(attachment.file_url)
          if (url) {
            setImageUrls((prev) => ({ ...prev, [attachment.id]: url }))
          }
        } catch (error) {
          console.error('Error loading image URL:', error)
        }

        setLoadingUrls((prev) => ({ ...prev, [attachment.id]: false }))
      }
    }

    if (attachments.length > 0) {
      loadImageUrls()
    }
  }, [attachments, getFileUrl])

  const handleImageClick = async (attachment) => {
    // Otevřít lightbox s plným obrázkem
    const url = imageUrls[attachment.id] || await getFileUrl(attachment.file_url)
    if (url) {
      setLightboxImage({ url, filename: attachment.filename })
    }
  }

  if (attachments.length === 0) {
    return null
  }

  return (
    <>
      <div className="attachment-grid">
        {attachments.map((attachment) => {
          const isImage = isImageFile(attachment.file_type)
          const imageUrl = imageUrls[attachment.id]
          const isLoading = loadingUrls[attachment.id]

          return (
            <div key={attachment.id} className="attachment-card">
              {/* Náhled / ikona */}
              <div
                className={`attachment-card__preview ${isImage ? 'attachment-card__preview--image' : ''}`}
                onClick={() => isImage && handleImageClick(attachment)}
              >
                {isImage ? (
                  isLoading ? (
                    <CSpinner size="sm" color="secondary" />
                  ) : imageUrl ? (
                    <>
                      <img
                        src={imageUrl}
                        alt={attachment.filename}
                        className="attachment-card__image"
                      />
                      <div className="attachment-card__zoom">
                        <CIcon icon={cilZoomIn} />
                      </div>
                    </>
                  ) : (
                    <CIcon icon={cilImage} size="xl" />
                  )
                ) : (
                  <CIcon icon={getFileIcon(attachment.file_type)} size="xl" />
                )}
              </div>

              {/* Info */}
              <div className="attachment-card__info">
                <div className="attachment-card__name" title={attachment.filename}>
                  {attachment.filename}
                </div>
                <div className="attachment-card__size">
                  {formatFileSize(attachment.file_size)}
                </div>
              </div>

              {/* Akce */}
              <div className="attachment-card__actions">
                <CButton
                  color="light"
                  size="sm"
                  onClick={() => onDownload(attachment)}
                  title={t('actions.download')}
                >
                  <CIcon icon={cilCloudDownload} size="sm" />
                </CButton>
                <CButton
                  color="light"
                  size="sm"
                  className="text-danger"
                  onClick={() => onDelete(attachment)}
                  title={t('actions.delete')}
                >
                  <CIcon icon={cilTrash} size="sm" />
                </CButton>
              </div>
            </div>
          )
        })}
      </div>

      {/* Lightbox pro zobrazení plného obrázku */}
      <CModal
        visible={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        size="xl"
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>{lightboxImage?.filename}</CModalTitle>
        </CModalHeader>
        <CModalBody className="text-center p-0">
          {lightboxImage && (
            <img
              src={lightboxImage.url}
              alt={lightboxImage.filename}
              style={{ maxWidth: '100%', maxHeight: '80vh' }}
            />
          )}
        </CModalBody>
      </CModal>
    </>
  )
}

export default AttachmentList
