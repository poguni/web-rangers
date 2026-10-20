# 먹이그물 탐험대 그림 생성 프롬프트 (image-prompts.md)

| 항목 | 내용 |
|---|---|
| 문서 버전 | v0.4 |
| 작성일 | 2026-10-19 |
| 대상 PRD | `../prd-ecosystem-foodweb.md` (v0.5) 5.5절 |
| 권장 도구 | Google Gemini 이미지 생성(나노바나나). 다른 도구도 같은 프롬프트로 쓸 수 있습니다. |
| 필요한 그림 | 생물 42장(숲 16, 강 12, 바다 13, 외래종 1) + 분류 놀이용 3장 + 비생물 요소 4장 + 사건 18장 + 관리인 행동 6장 + 기타 6장 = **79장** |
| 변경 | v0.2: 테마를 교과서 43~45쪽과 같은 숲·강·바다로 변경(논·갯벌 그림 삭제), 분류 놀이용 교과서 47쪽 생물 3장 추가 | / v0.3: 앱 이름 변경(먹이그물 탐험대)에 맞춰 마스코트를 어린이 탐험대원으로, 앱 아이콘에 나침반 추가 / v0.4: 강에 교과서 44쪽 물고기 송사리(`river-medaka`) 추가

> 이 개발 환경에서는 이미지를 직접 만들 수 없어서, 생성 도구에 그대로 붙여 넣을 수 있는 프롬프트를 정리했습니다. 프롬프트는 영어로 쓰면 결과가 더 안정적이라 영어로 쓰고, 확인할 점은 한국어로 적었습니다.

---

## 1. 작업 순서

1. **기준 그림 만들기**: 2장의 "공통 스타일"과 `forest-frog`(개구리) 프롬프트로 먼저 1장을 만듭니다. 마음에 들 때까지 다시 생성합니다.
2. **기준 그림을 함께 넣어 생성**: 나머지 그림을 만들 때마다 기준 그림을 첨부하고, 프롬프트 맨 앞에 아래 문장을 붙입니다.
   > `Use the attached image only as a style reference (same watercolor and colored-pencil technique, line weight, lighting and level of detail). Do not copy its subject.`
3. **한 대화에서 한 테마씩**: 숲 16장을 한 대화에서 이어서 만들면 화풍이 잘 유지됩니다. 테마가 바뀌면 새 대화를 열고 기준 그림을 다시 첨부합니다.
4. **검수**: 그림마다 5장의 점검표로 확인하고, 틀린 부분은 "고쳐 줘" 프롬프트(4장)로 수정합니다.
5. **후처리**: 배경 제거 → 정사각형 자르기 → WebP 변환(512px, 256px 두 크기) → 파일 이름 규칙에 맞게 저장(6장).

---

## 2. 공통 스타일 (모든 생물·비생물 카드)

모든 생물 카드 프롬프트 뒤에 아래 문단을 **그대로 붙입니다.**

```
STYLE: Scientific nature illustration for a Korean 4th-grade science card game.
Soft watercolor with fine colored-pencil linework, like a children's field guide
or a Korean elementary science textbook. Anatomically accurate shape, proportions,
markings and natural colors. Friendly and gentle mood, but NOT cartoonish, NOT chibi,
no big cute eyes, no human expressions, no clothes.
COMPOSITION: One single subject, centered, whole body visible, 3/4 side view,
filling about 75% of the square frame, with even margins.
BACKGROUND: Plain pure white background (#FFFFFF). Only a very faint soft shadow
under the subject. No scenery, no ground texture.
DO NOT include any text, letters, numbers, labels, logos, borders, frames or watermarks.
FORMAT: Square 1:1, 1024 x 1024.
```

### 사건·행동 카드 공통 스타일
사건 카드와 관리인 행동 카드는 장면 그림이므로 아래 문단을 붙입니다.

```
STYLE: Same soft watercolor and colored-pencil technique as a Korean elementary
science textbook. Simple, calm scene that a 10-year-old can understand at a glance.
Child-safe: no blood, no injured or dead animals shown, no scary faces, no people's
faces in close-up. Show "disappearance" as an empty habitat or a faded silhouette.
COMPOSITION: One clear focal point in the center, uncluttered background,
soft natural light.
DO NOT include any text, letters, numbers, labels, logos, borders or watermarks.
FORMAT: Landscape 4:3, 1600 x 1200.
```

---

## 3. 그림 목록과 프롬프트

표의 **프롬프트(주제)** 뒤에 2장의 공통 스타일을 붙여서 넣습니다. **확인할 점**은 생성 뒤 검수할 때 봅니다.

### 3.1 숲 — 교과서 49쪽 먹이그물 (16장)

| 파일 이름 | 생물 | 프롬프트(주제) | 확인할 점 |
|---|---|---|---|
| `forest-grass` | 풀 | A clump of common wild green grass with thin long leaf blades and a few foxtail-like seed heads, as found at a Korean forest edge. | 꽃이 화려하지 않은 평범한 풀 |
| `forest-clover` | 토끼풀 | White clover (Trifolium repens) plant: several three-part round leaflets with pale V-shaped marks, and two round white flower heads on thin stems. | 잎이 3장, 흰 공 모양 꽃 |
| `forest-cornus` | 산수유 | A branch of Korean cornelian cherry (Cornus officinalis) with glossy oblong bright red berries hanging in small clusters and oval leaves with curved veins. | 빨간 열매가 길쭉한 타원형 |
| `forest-acorn` | 도토리(상수리나무) | Three acorns of sawtooth oak (Quercus acutissima) with large cups covered in long curly spiky scales, beside a long narrow leaf with bristle-tipped saw-teeth. | 깍정이(모자)에 털 같은 비늘, 잎 가장자리 톱니 끝이 바늘처럼 뾰족 |
| `forest-grasshopper` | 메뚜기 | A rice grasshopper (Oxya chinensis): slender bright green body with a brown stripe from eye to wing, short antennae, six legs with long jumping hind legs. | 다리 6개, 더듬이 짧음, 뒷다리 굵고 김 |
| `forest-caterpillar` | 애벌레 | A smooth bright green butterfly caterpillar on a small leaf, segmented body, three pairs of true legs at the front and fleshy prolegs at the rear, small head. | 털 없는 초록 애벌레, 마디 구분 |
| `forest-rabbit` | 토끼 | A wild Korean hare (Lepus coreanus) sitting: grayish-brown fur, long ears with dark tips, large dark eye, white belly. | 집토끼처럼 흰색·통통하지 않게, 야생 갈색 |
| `forest-squirrel` | 다람쥐 | A Siberian chipmunk (Tamias sibiricus) sitting upright and holding an acorn: orange-brown fur with five dark stripes along the back, striped face, bushy tail. | 등에 검은 줄 5개(청설모가 아님) |
| `forest-frog` | 개구리 | A black-spotted pond frog (Pelophylax nigromaculatus), Korean "참개구리": green to olive back with irregular black spots, a thin pale yellow-green stripe down the middle of the back, long striped hind legs. | 등 가운데 연한 줄, 검은 점무늬, 앞발가락 4개·뒷발가락 5개 |
| `forest-bulbul` | 직박구리 | A brown-eared bulbul (Hypsipetes amaurotis) perched on a twig: gray body, distinct chestnut-brown patch on the cheek behind the eye, slightly shaggy crown, long tail, dark slender bill. | 뺨의 밤색 무늬, 꼬리 김 |
| `forest-duck` | 오리 | An eastern spot-billed duck (Anas zonorhyncha), Korean "흰뺨검둥오리", standing: dark brown scaly body, pale buff face with a dark eye stripe, black bill with a bright yellow tip, orange legs. | 부리 끝만 노랑, 흰 얼굴에 검은 눈선 |
| `forest-snake` | 뱀 | A Korean steppe ratsnake (Elaphe dione), Korean "누룩뱀", in a relaxed S-curve: light gray-brown body with dark-edged brown blotches along the back, round pupils, calm pose, mouth closed. | 입 다물고 위협적이지 않게, 무늬 |
| `forest-weasel` | 족제비 | A Siberian weasel (Mustela sibirica) standing on all fours: long slender body, bright orange-brown fur, dark brown mask around the eyes, white muzzle and chin, short legs, long bushy tail. | 눈 주위 짙은 갈색, 흰 턱, 몸이 길쭉 |
| `forest-falcon` | 매 | A peregrine falcon (Falco peregrinus) perched: slate blue-gray back and wings, white chest with fine dark horizontal bars, dark "moustache" stripe below the eye, yellow feet and eye ring, hooked bill. | 눈 아래 검은 수염 무늬, 가슴 가로 줄무늬 |
| `forest-mushroom` | 버섯 | A small group of brown wild mushrooms growing from a mossy piece of fallen, decaying log, with visible gills under the caps. | 썩은 나무에서 자라는 모습(분해자) |
| `forest-mold` | 곰팡이 | A fallen brown oak leaf partly covered with soft gray-green fuzzy mold, and a circular magnifying-lens inset at the upper right showing thin branching mold threads with round spore heads. | 확대 원 안에 실 모양 균사 |

### 3.2 강 — 교과서 44쪽 (12장 + 외래종 1장)
"추가"는 교과서에 없지만 먹이그물에 꼭 필요해 넣은 생물입니다.

| 파일 이름 | 생물 | 프롬프트(주제) | 확인할 점 |
|---|---|---|---|
| `river-closterium` | 반달말 | A circular magnifying-lens view of Closterium, Korean "반달말": several bright green crescent-moon-shaped single-celled algae with rounded tips, floating in clear water. | 초승달 모양 초록 세포, 확대 원 안(교과서 130배) |
| `river-hornwort` | 붕어마름 | Rigid hornwort (Ceratophyllum demersum), Korean "붕어마름", under water: long stems with whorls of stiff, forked, dark green needle-like leaves. | 물속에 잠긴 줄기, 바늘 같은 잎이 돌려남 |
| `river-cattail` | 부들 | A clump of cattail (Typha orientalis), Korean "부들", at the water's edge: tall flat sword-like leaves and brown sausage-shaped flower spikes on long stems. | 갈색 소시지 모양 이삭 |
| `river-daphnia` | 물벼룩(추가) | A circular magnifying-lens view of a water flea (Daphnia): transparent oval body with visible insides, one large dark compound eye, long branched antennae used for swimming. | 투명한 몸, 갈라진 더듬이 |
| `river-melania` | 다슬기 | Two freshwater snails (Semisulcospira libertina), Korean "다슬기", on a smooth stream stone: tall narrow cone-shaped dark brown to black spiral shells, body and tentacles out. | 길쭉한 원뿔 모양 짙은 껍데기 |
| `river-nymph` | 잠자리 애벌레(추가) | A dragonfly nymph (larva) under water on a stone: stout brownish body, six legs, large eyes, short wing pads on the back, no wings. | 날개 없음, 다리 6개 |
| `river-crucian` | 붕어(추가) | A crucian carp (Carassius auratus), Korean "붕어": deep, rounded body, silvery olive-gold scales, no whiskers (barbels), forked tail. | 입수염 없음(잉어와 구별) |
| `river-medaka` | 송사리 | A small group of Japanese rice fish (Oryzias latipes), Korean "송사리", swimming near the water surface: tiny slender translucent pale olive-brown bodies, large eyes on top of the head, upturned mouth, dorsal fin set far back near the tail. | 몸길이 3~4cm의 작은 물고기, 등지느러미가 꼬리 쪽에 있음, 큰 눈 |
| `river-duck` | 오리 | (숲 `forest-duck` 그림을 그대로 써도 됩니다.) Eastern spot-billed duck swimming on a calm river. | 숲 오리와 같은 종 |
| `river-heron` | 왜가리 | A grey heron (Ardea cinerea) standing in shallow water: gray back and wings, white head and neck with a black stripe from eye to a black crest plume, long yellow dagger-like bill, long legs. | 머리의 검은 줄과 댕기, 노란 부리 |
| `river-falcon` | 매 | (숲 `forest-falcon` 그림을 그대로 써도 됩니다.) | 숲 매와 같은 종 |
| `river-bacteria` | 세균(추가) | Dead leaves on wet riverbed mud with a circular magnifying-lens inset showing many tiny rod-shaped and round bacteria. | 확대 원 안의 세균 |
| `invasive-bass` | 큰입배스(외래종) | A largemouth bass (Micropterus salmoides): olive-green back, a dark broken stripe along the side, white belly, very large mouth with the jaw reaching past the eye. | 눈 뒤까지 오는 큰 입, 옆구리 짙은 줄 |

### 3.3 바다 — 교과서 45쪽 (13장)

| 파일 이름 | 생물 | 프롬프트(주제) | 확인할 점 |
|---|---|---|---|
| `sea-phytoplankton` | 식물 플랑크톤(추가) | A circular magnifying-lens view of marine phytoplankton: several transparent golden-brown diatoms of different shapes (round, boat-shaped, chain-like) floating in blue-green water. | 현미경으로 본 모습 |
| `sea-wakame` | 미역 | Wakame seaweed (Undaria pinnatifida), Korean "미역", attached to a rock: brownish-green wide frond divided into feather-like blades with a central midrib. | 가운데 줄기, 깃털처럼 갈라진 잎 |
| `sea-hijiki` | 톳 | Hijiki seaweed (Sargassum fusiforme), Korean "톳", on a rock: dark olive-brown branches covered with many small spindle-shaped, bead-like leaflets. | 통통한 작은 잎이 줄기에 많이 붙음 |
| `sea-zooplankton` | 동물 플랑크톤(추가) | A circular magnifying-lens view of marine zooplankton: several transparent copepods with long antennae and tiny shrimp-like larvae swimming in blue water. | 긴 더듬이가 있는 작은 동물 |
| `sea-coral` | 산호 | A colony of soft coral on a rock, as found in Korean waters near Jeju: pinkish-orange branches covered with many small flower-like polyps with eight tentacles each. | 꽃처럼 보이지만 촉수 달린 폴립(동물)이 보이게 |
| `sea-jellyfish` | 해파리 | A moon jellyfish (Aurelia aurita): translucent bell-shaped dome with four pinkish horseshoe-shaped rings inside, short fringe tentacles and four frilly oral arms. | 반투명한 갓, 안쪽 고리 4개 |
| `sea-mackerel` | 고등어 | A chub mackerel (Scomber japonicus), Korean "고등어": streamlined body, blue-green back with dark wavy stripes, silvery belly, small finlets near the forked tail. | 등의 물결무늬, 꼬리 앞 작은 지느러미 |
| `sea-crab` | 게 | A swimming crab (Portunus trituberculatus), Korean "꽃게": wide grayish-green to purple shell with a long sharp spine on each side, one pair of claws, last pair of legs shaped like paddles. | 다리 8개 + 집게 2개, 마지막 다리가 노 모양 |
| `sea-turtle` | 바다거북 | A green sea turtle (Chelonia mydas), Korean "푸른바다거북", swimming: smooth heart-shaped olive-brown shell with patterned plates, four long flippers, small rounded head. | 다리 대신 지느러미발 |
| `sea-ray` | 가오리 | A red stingray (Hemitrygon akajei), Korean "노랑가오리", seen from above: flat diamond-shaped brown body with orange underside edges, eyes on top, long thin whip-like tail. | 납작한 마름모 몸, 긴 꼬리 |
| `sea-dolphin` | 돌고래 | An Indo-Pacific bottlenose dolphin (Tursiops aduncus), Korean "남방큰돌고래", leaping slightly out of the water: gray body, short beak, curved dorsal fin. | 짧은 주둥이, 굽은 등지느러미 |
| `sea-gull` | 갈매기 | A black-tailed gull (Larus crassirostris), Korean "괭이갈매기", standing: white head and body, dark gray wings, yellow bill with a red and black tip, black band on the white tail, yellow legs. | 부리 끝 빨강·검정, 꼬리의 검은 띠 |
| `sea-bacteria` | 세균(추가) | Seabed sand with bits of dead seaweed and a circular magnifying-lens inset showing many tiny rod-shaped and round bacteria. | 확대 원 안의 세균 |

### 3.3-1 분류 놀이용 — 교과서 47쪽 예시 (3장)
교과서 47쪽에 나오는 생산자·소비자 예시입니다(애벌레·버섯·곰팡이는 숲 그림을 함께 씁니다).

| 파일 이름 | 생물 | 프롬프트(주제) | 확인할 점 |
|---|---|---|---|
| `sort-woodsorrel` | 괭이밥 | Creeping woodsorrel (Oxalis corniculata), Korean "괭이밥": low creeping plant with three heart-shaped leaflets per leaf and small five-petaled yellow flowers. | 하트 모양 잎 3장, 노란 꽃잎 5장 |
| `sort-fleabane` | 개망초 | Annual fleabane (Erigeron annuus), Korean "개망초": branching stem with several small daisy-like flowers with thin white petals and yellow centers. | 계란프라이 같은 작은 꽃 |
| `sort-tit` | 박새 | A Japanese tit (Parus minor), Korean "박새", perched: black head with large white cheek patches, black stripe running down the middle of a whitish belly, gray back with a greenish upper back. | 흰 뺨, 배 가운데 검은 세로줄 |

### 3.4 비생물 요소 (4장)
분류 놀이(교과서 42쪽)에 씁니다. 생물 카드와 같은 공통 스타일을 씁니다.

| 파일 이름 | 요소 | 프롬프트(주제) |
|---|---|---|
| `abiotic-sun` | 햇빛 | Warm sunlight: a soft glowing sun with gentle rays shining down on a single small green sprout. |
| `abiotic-water` | 물 | Clear water: a few large clean water drops and a small ripple, light blue. |
| `abiotic-air` | 공기 | Air: soft swirling light-blue wind lines around a few floating dandelion seeds. |
| `abiotic-soil` | 흙 | A small mound of dark brown forest soil with crumbly texture, small pebbles and a few dry leaves. |

### 3.5 사건 카드 (18장)
2장의 "사건·행동 카드 공통 스타일"을 붙입니다.

| 파일 이름 | 사건 | 프롬프트(주제) |
|---|---|---|
| `event-forest-frog-gone` | 개구리가 모두 사라졌어요 | A quiet forest stream bank with grass and stones but no frogs; one faint gray see-through silhouette of a frog on a stone to suggest it is gone. |
| `event-forest-bulbul-gone` | 직박구리가 사라졌어요 | A Korean cornelian cherry branch full of red berries with an empty perch; a faint gray silhouette of a brown-eared bulbul where the bird used to sit. |
| `event-forest-decomposer-gone` | 버섯과 곰팡이가 사라졌어요 | A forest floor piled high with fallen leaves and old logs that are not rotting, looking untidy and dry, with no mushrooms anywhere. |
| `event-forest-drought` | 가뭄 | A dry forest edge under a hot sun: cracked dry ground, yellowed drooping grass and clover, a dried-up small stream bed. |
| `event-forest-longrain` | 오랜 장마 | A forest under heavy gray rain clouds with steady rain for many days, dim light, grass bent under water drops. |
| `event-forest-road` | 숲에 길을 냈어요 | A new paved road cutting through the middle of a green forest, with trees on both sides, seen from a slight height. |
| `event-forest-snake-poaching` | 뱀을 마구 잡아갔어요 | A forest floor with an empty wire trap and a cloth sack left behind on the ground, no animals in view. |
| `event-forest-rabbit-boom` | 토끼가 크게 늘었어요 | A forest meadow with many wild brown hares eating grass, the grass looking short and thin. |
| `event-river-heron-gone` | 왜가리가 사라졌어요 | A quiet river bank with tall reeds and shallow water but no herons; one faint gray see-through silhouette of a grey heron standing in the water. |
| `event-river-pollution` | 강물이 더러워졌어요 | A river with murky gray-green water and white foam near a drain pipe on the bank, water plants looking pale, no dead animals shown. |
| `event-river-bass` | 큰입배스가 들어왔어요 | A large largemouth bass swimming under water in a Korean river, small crucian carp keeping their distance among the water plants. |
| `event-river-drought` | 강물이 줄었어요 | A shrunken stream under a hot sun, exposed dry stones and cracked mud along the banks, little water left. |
| `event-river-overfish` | 붕어를 너무 많이 잡았어요 | Fishing nets and full buckets of crucian carp left on a river bank, seen from a distance, no people's faces. |
| `event-sea-turtle-fewer` | 바다거북이 크게 줄었어요 | A blue sea with plastic bags drifting that look like jellyfish, and only one green sea turtle far in the distance. |
| `event-sea-overfish` | 고등어를 너무 많이 잡았어요 | A fishing boat seen from a distance lifting a huge net full of silvery mackerel out of the sea. |
| `event-sea-warm` | 바닷물이 따뜻해졌어요 | A bright, hot sunlit shallow sea with pale bleached coral and thin, sparse seaweed on the rocks. |
| `event-sea-oil` | 기름이 흘렀어요 | A rocky seashore with a dark shiny oil slick spreading over the water and rocks, cleanup buoys in the distance, no animals shown. |
| `event-sea-jelly-boom` | 해파리가 크게 늘었어요 | A blue sea crowded with many moon jellyfish drifting near the surface. |

### 3.6 관리인 행동 카드 (6장)

| 파일 이름 | 행동 | 프롬프트(주제) |
|---|---|---|
| `action-reintroduce` | 되살리기 | A small open wooden box on the grass by a stream, with a few frogs hopping out into the habitat. |
| `action-remove-invasive` | 외래종 잡기 | A fishing net lifting a largemouth bass out of a river at the bank, ready to be taken away, no people's faces. |
| `action-protect` | 보호 구역 정하기 | A wooden signpost with a green leaf emblem in a forest, a low rope fence around a protected green area. |
| `action-water` | 물 대 주기 | Clear water flowing from an irrigation channel into dry ground, green sprouts recovering. |
| `action-clean-river` | 강물 깨끗하게 하기 | Clear water flowing in a river again, collected trash bags on the bank, hornwort and freshwater snails recovering in the clean water. |
| `action-clean-sea` | 바다 쓰레기 치우기 | Collected bags of plastic trash lined up on a clean beach, a sea turtle swimming in clear water nearby. |

### 3.7 기타 (6장)

| 파일 이름 | 용도 | 프롬프트(주제) |
|---|---|---|
| `ui-mascot` | 탐험대 배지(마스코트) | A friendly gender-neutral child nature explorer of about 10 years old wearing a navy blue field vest with many pockets and a wide-brim explorer hat, small binoculars around the neck, holding a big golden magnifying glass, a small backpack, half-body, smiling. Same watercolor style, plain white background, square. |
| `ui-app-icon` | 앱 아이콘 | A golden compass needle over a simple web of thin lines connecting five small dots (leaf, grasshopper, frog, snake, falcon silhouettes), on a navy blue rounded square. Flat, bold, readable at 48 px, no text. Square. |
| `ui-bg-forest` | 숲 테마 배경 | A wide soft watercolor landscape of a Korean forest edge with a small stream, oak trees and a grassy bank, light and airy colors, lots of empty space at the top, no animals. Landscape 16:9. |
| `ui-bg-river` | 강 테마 배경 | A wide soft watercolor landscape of a calm Korean river with reeds and cattails on the banks and low hills, light colors, empty space at the top, no animals. Landscape 16:9. |
| `ui-bg-sea` | 바다 테마 배경 | A wide soft watercolor seascape of the Korean coast with clear blue water, a rocky shore and a distant island, light colors, empty space at the top, no animals. Landscape 16:9. |
| `ui-card-back` | 카드 뒷면 | A repeating pattern of small leaves, footprints and mushrooms in soft cream and navy, with a golden magnifying glass in the center. Square, no text. |

---

## 4. 고쳐 달라고 할 때 쓰는 프롬프트

생성된 그림이 틀렸을 때, 그림을 그대로 둔 채 아래처럼 고쳐 달라고 합니다.

| 문제 | 프롬프트 예시 |
|---|---|
| 글자가 들어감 | `Remove all text and letters from the image. Keep everything else exactly the same.` |
| 다리 수가 틀림 | `The insect must have exactly six legs: three on each side. Fix the legs only.` |
| 너무 귀엽게 나옴 | `Make it more realistic like a field guide illustration: smaller natural eyes, accurate proportions. Keep the watercolor style.` |
| 배경이 들어감 | `Replace the background with plain pure white. Keep the subject unchanged.` |
| 무늬가 틀림 | `The Siberian chipmunk must have five dark stripes along its back. Fix the stripes only.` |
| 화풍이 다름 | `Redraw this in the exact style of the attached reference image.` (기준 그림 첨부) |

---

## 5. 그림 검수 점검표

Claude가 개발 중 1차 검수를 돕고, 최종 확인은 선생님이 합니다(PRD 5.6).

- [ ] 생물의 종이 맞는가(예: 다람쥐 ≠ 청설모, 붕어 ≠ 큰입배스, 산호는 동물이므로 촉수가 보이게)
- [ ] 다리·날개·더듬이·지느러미 수가 맞는가(곤충 다리 6개, 거미 다리 8개, 게 다리 8개 + 집게 2개, 잠자리 애벌레 다리 6개)
- [ ] 특징 무늬가 보이는가(위 표의 "확인할 점")
- [ ] 글자, 숫자, 로고, 워터마크가 없는가
- [ ] 배경이 흰색이고 생물 하나만 있는가(생물 카드)
- [ ] 무섭거나 잔인한 표현이 없는가(사건 카드)
- [ ] 같은 테마의 그림끼리 화풍·밝기·선 굵기가 비슷한가
- [ ] 크롬북 화면에서 64px로 줄였을 때도 무엇인지 알아볼 수 있는가

---

## 6. 후처리와 파일 규칙

| 단계 | 방법 |
|---|---|
| 배경 제거 | 이미지 편집 도구의 배경 지우기 기능으로 투명 PNG를 만듭니다(생물·비생물 카드만). |
| 크기 | 생물·비생물 카드: 정사각형 512×512, 256×256 / 사건·행동 카드: 800×600 / 배경: 1920×1080 |
| 형식 | WebP(품질 80 안팎). 크롬·엣지 모두 지원하고 용량이 작아 오프라인 저장에 유리합니다. |
| 파일 이름 | `파일이름-512.webp`, `파일이름-256.webp` (예: `forest-frog-512.webp`) |
| 저장 위치 | `public/img/forest/`, `public/img/river/`, `public/img/sea/`, `public/img/sort/`, `public/img/abiotic/`, `public/img/event/`, `public/img/action/`, `public/img/ui/` |
| 기록 | 그림마다 생성 도구, 날짜, 검수자를 `public/img/credits.json`에 남깁니다. |

- Gemini로 만든 그림에는 눈에 보이지 않는 디지털 워터마크(SynthID)가 들어갑니다. 수업 자료로 쓰는 데는 문제가 없지만, 학교나 교육청에 AI 생성 그림 사용 지침이 있으면 그에 따릅니다.
