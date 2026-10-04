import { wikimediaImageUrl } from './wikimediaImage';

export interface ImageCredit {
  author: string;
  license: string;
  licenseUrl: string;
  sourceLabel: string;
  sourceUrl: string;
}

const WIKIMEDIA_FILE_URL = 'https://commons.wikimedia.org/wiki/File:';

function wikimediaCredit(
  fileName: string,
  author: string,
  license: string,
  licenseUrl: string
): ImageCredit {
  const pageName = fileName.replace(/ /g, '_').replace(/'/g, '%27');
  return {
    author,
    license,
    licenseUrl,
    sourceLabel: 'Wikimedia Commons',
    sourceUrl: `${WIKIMEDIA_FILE_URL}${pageName}`,
  };
}

const CREDITS: Record<string, ImageCredit> = {
  [wikimediaImageUrl('Magdalena zona bananera.jpg')]: wikimediaCredit(
    'Magdalena zona bananera.jpg',
    'Claudia Marcela Bolaño Castro',
    'CC BY-SA 4.0',
    'https://creativecommons.org/licenses/by-sa/4.0'
  ),
  [wikimediaImageUrl('Coffee tree in Hacienda Guayabal, Colombia.jpg')]: wikimediaCredit(
    'Coffee tree in Hacienda Guayabal, Colombia.jpg',
    'Bernard Gagnon',
    'CC BY-SA 4.0',
    'https://creativecommons.org/licenses/by-sa/4.0'
  ),
  [wikimediaImageUrl('Coffea arabica 2.jpg')]: wikimediaCredit(
    'Coffea arabica 2.jpg',
    'Kızıldeniz',
    'CC BY-SA 4.0',
    'https://creativecommons.org/licenses/by-sa/4.0'
  ),
  [wikimediaImageUrl('Coffea arabica, coffee beans .jpg')]: wikimediaCredit(
    'Coffea arabica, coffee beans .jpg',
    'Renjusplace',
    'CC BY-SA 4.0',
    'https://creativecommons.org/licenses/by-sa/4.0'
  ),
  [wikimediaImageUrl('Blond and green rice fields.jpg')]: wikimediaCredit(
    'Blond and green rice fields.jpg',
    'Basile Morin',
    'CC BY-SA 4.0',
    'https://creativecommons.org/licenses/by-sa/4.0'
  ),
  [wikimediaImageUrl('Oil palm plantation in Mersing District.jpg')]: wikimediaCredit(
    'Oil palm plantation in Mersing District.jpg',
    'Wee Hong',
    'CC BY-SA 4.0',
    'https://creativecommons.org/licenses/by-sa/4.0'
  ),
  [wikimediaImageUrl("Cacao fruit in Côte d'Ivoire (11).JPG")]: wikimediaCredit(
    "Cacao fruit in Côte d'Ivoire (11).JPG",
    'Hanay',
    'CC BY-SA 4.0',
    'https://creativecommons.org/licenses/by-sa/4.0'
  ),
  [wikimediaImageUrl('Theobroma cacao fruit.jpg')]: wikimediaCredit(
    'Theobroma cacao fruit.jpg',
    'Bernard Gagnon',
    'CC BY-SA 3.0',
    'https://creativecommons.org/licenses/by-sa/3.0'
  ),
  [wikimediaImageUrl('Sugarcane plantation 01.jpg')]: wikimediaCredit(
    'Sugarcane plantation 01.jpg',
    "Filo gèn'",
    'CC BY-SA 4.0',
    'https://creativecommons.org/licenses/by-sa/4.0'
  ),
  [wikimediaImageUrl('Cassava plants.jpg')]: wikimediaCredit(
    'Cassava plants.jpg',
    'Munkaila Sulemana',
    'CC BY-SA 4.0',
    'https://creativecommons.org/licenses/by-sa/4.0'
  ),
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800': {
    author: 'Unsplash',
    license: 'Unsplash License',
    licenseUrl: 'https://unsplash.com/license',
    sourceLabel: 'Unsplash',
    sourceUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
  },
  'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=800': {
    author: 'Unsplash',
    license: 'Unsplash License',
    licenseUrl: 'https://unsplash.com/license',
    sourceLabel: 'Unsplash',
    sourceUrl: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224',
  },
  'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800': {
    author: 'Unsplash',
    license: 'Unsplash License',
    licenseUrl: 'https://unsplash.com/license',
    sourceLabel: 'Unsplash',
    sourceUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076',
  },
};

export function getImageCredit(imageUrl: string): ImageCredit | null {
  const direct = CREDITS[imageUrl];
  if (direct) return direct;

  const basePath = imageUrl.split('?')[0];
  const variant = Object.entries(CREDITS).find(([key]) => key.split('?')[0] === basePath);
  return variant ? variant[1] : null;
}
