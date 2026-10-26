/** 그림 파일 주소. 데이터에는 "img/forest/forest-frog"처럼 앞부분만 적고, 여기서 파일 이름을 완성함
 *  사건·행동 카드는 한 장(800×600), 생물·비생물 카드는 256px 파일을 씀(Image-Prompts.md 6장) */
export function imageUrl(image: string) {
  return /^img\/(event|action)\//.test(image) ? `${image}.webp` : `${image}-256.webp`;
}
