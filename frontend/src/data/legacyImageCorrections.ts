import { wikimediaImageUrl } from './wikimediaImage';

export const LEGACY_IMAGE_URL_CORRECTIONS: Record<string, string> = {
  'https://images.unsplash.com/photo-1528825871115-3581a5387f19?w=800':
    'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=800',
  'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800': wikimediaImageUrl(
    'Magdalena zona bananera.jpg'
  ),
  'https://images.unsplash.com/photo-1511643669359-9f7629382b38?w=800': wikimediaImageUrl(
    'Coffee tree in Hacienda Guayabal, Colombia.jpg'
  ),
  'https://images.unsplash.com/photo-1559525839-d9acfd5234d9?w=800':
    wikimediaImageUrl('Coffea arabica 2.jpg'),
  'https://images.unsplash.com/photo-1622383563227-04401ab4e9ea?w=800': wikimediaImageUrl(
    'Blond and green rice fields.jpg'
  ),
  'https://images.unsplash.com/photo-1590164813620-baa06a4dec7e?w=800': wikimediaImageUrl(
    'Oil palm plantation in Mersing District.jpg'
  ),
  'https://images.unsplash.com/photo-1601627387587-3004ae13e6c8?w=800':
    'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800',
  'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=800': wikimediaImageUrl(
    "Cacao fruit in Côte d'Ivoire (11).JPG"
  ),
  'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800': wikimediaImageUrl(
    'Theobroma cacao fruit.jpg'
  ),
  'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800': wikimediaImageUrl(
    'Sugarcane plantation 01.jpg'
  ),
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800': wikimediaImageUrl(
    'Coffea arabica, coffee beans .jpg'
  ),
};

export function resolveLegacyImageUrl(url: string): string {
  return LEGACY_IMAGE_URL_CORRECTIONS[url] ?? url;
}
