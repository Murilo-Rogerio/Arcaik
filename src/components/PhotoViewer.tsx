import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import type { Attachment } from '../lib/types'

type Props = {
  /** Fotos (anexos de imagem) a exibir */
  photos: Attachment[]
  /** Índice da foto que foi clicada */
  startIndex?: number
  onClose: () => void
}

/**
 * Visualizador de fotos em tela cheia com zoom — pinça no celular,
 * duplo toque, scroll no desktop e botões de aproximar/afastar.
 */
export default function PhotoViewer({ photos, startIndex = 0, onClose }: Props) {
  const slides = photos.filter((p) => p.url).map((p) => ({ src: p.url as string, alt: p.name }))
  if (slides.length === 0) return null

  return (
    <Lightbox
      open
      close={onClose}
      index={Math.min(Math.max(0, startIndex), slides.length - 1)}
      slides={slides}
      plugins={[Zoom]}
      zoom={{ maxZoomPixelRatio: 5 }}
      carousel={{ finite: true }}
      labels={{ Close: 'Fechar', 'Zoom in': 'Aproximar', 'Zoom out': 'Afastar' }}
    />
  )
}
