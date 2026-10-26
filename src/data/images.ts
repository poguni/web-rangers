/** 그림 파일 주소. 데이터에는 "img/forest/forest-frog"처럼 앞부분만 적고, 여기서 파일 이름을 완성함
 *  사건·행동 카드는 한 장(800×600), 생물·비생물 카드는 256px·512px 두 파일(Image-Prompts.md 6장) */
const isScene = (image: string) => /^img\/(event|action)\//.test(image);

export function imageUrl(image: string, size: 256 | 512 = 256) {
  return isScene(image) ? `${image}.webp` : `${image}-${size}.webp`;
}

/** 전자칠판(화면 너비 1600px 이상)이나 고해상도 화면(배율 150% 이상)이면 512px 그림을 씀 */
export const BIG_SCREEN = "(min-width: 1600px), (min-resolution: 1.5dppx)";

/** <img>용: 브라우저가 BIG_SCREEN 조건일 때 512px을 고르도록 하는 srcset·sizes */
export function imageSrcSet(image: string) {
  if (isScene(image)) return {};
  return { srcSet: `${imageUrl(image)} 256w, ${imageUrl(image, 512)} 512w`, sizes: "(min-width: 1600px) 512px, 256px" };
}
