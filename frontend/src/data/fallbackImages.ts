import type { CropType } from '../types/property';
import { wikimediaImageUrl } from './wikimediaImage';

const FALLBACK_IMAGES: Record<CropType, string> = {
  coffee: wikimediaImageUrl('Coffee tree in Hacienda Guayabal, Colombia.jpg'),
  cacao: wikimediaImageUrl("Cacao fruit in Côte d'Ivoire (11).JPG"),
  banana: wikimediaImageUrl('Magdalena zona bananera.jpg'),
  sugarcane: wikimediaImageUrl('Sugarcane plantation 01.jpg'),
  rice: wikimediaImageUrl('Blond and green rice fields.jpg'),
  corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=70',
  cassava: wikimediaImageUrl('Cassava plants.jpg'),
  oil_palm: wikimediaImageUrl('Oil palm plantation in Mersing District.jpg'),
};

const DEFAULT_FALLBACK_IMAGE = wikimediaImageUrl('Blond and green rice fields.jpg');

export function getCropFallbackImage(crop: string | undefined | null): string {
  if (!crop || !(crop in FALLBACK_IMAGES)) {
    return DEFAULT_FALLBACK_IMAGE;
  }
  return FALLBACK_IMAGES[crop as CropType];
}
