/* Nội dung cuộc phiêu lưu – chuyển thể từ "The Last Lantern Ferry" (Bộ chơi + Cuộc phiêu lưu, bản tiếng Việt). */

const GHT_Q = [
  'Bạn để ý thấy điều gì ở mình?',
  'Bạn đang vui vì điều gì?',
  'Bạn sẽ nấu món gì cho hai ta?',
  'Bạn đã tự hứa với mình điều gì?',
  'Có điều gì bạn chưa từng nói?',
  'Điều ngốc nghếch nào ở mình mà bạn thương?'
];
const REL = [
  'Vợ chồng, và chuyến phà này chính là nơi hai người gặp nhau',
  'Mới yêu nhau, chưa dám nói thành lời',
  'Bạn thân lâu năm, lúc nào cũng cãi nhau vặt',
  'Đối tác làm ăn phà, mệt đến mức chẳng buồn giữ lịch sự',
  'Gia đình tự chọn, đã giữ bí mật cho nhau suốt bao năm',
  'Hai đối thủ lặng lẽ trở thành bạn'
];
/* Sương mù: fx = adv | dis | ght | heal | insp | null */
const FOG = {
  1: [
    { t: 'Hương từ đinh hương và mưa.' },
    { t: 'Tiếng chuông. Kiểm tra kế tiếp: **Lợi thế**.', fx: 'adv' },
    { t: 'Đàn cá phát sáng. Một lượt **Giữa Hai Ta** miễn phí.', fx: 'ght' },
    { t: 'Các ngọn đèn sáng rực hơn.' },
    { t: 'Một ngón tay lạnh lẽo. Kiểm tra kế tiếp: **Bất lợi**.', fx: 'dis' },
    { t: 'Một khúc ru. Mỗi người hồi **1d4 Điểm máu**.', fx: 'heal' }
  ],
  2: [
    { t: 'Những vì sao bên dưới mặt nước.' },
    { t: 'Tiếng chuông. Kiểm tra kế tiếp: **Lợi thế**.', fx: 'adv' },
    { t: 'Đàn bướm đêm phát sáng. Một lượt **Giữa Hai Ta** miễn phí.', fx: 'ght' },
    { t: 'Màn sương vàng. Mỗi người hồi **1d4 Điểm máu**.', fx: 'heal' },
    { t: 'Sương lạnh. Kiểm tra kế tiếp: **Bất lợi**.', fx: 'dis' },
    { t: 'Tên hai bạn được thì thầm. Mỗi người nhận **Cảm hứng Anh hùng**.', fx: 'insp' }
  ]
};

/* shorthand: o(nhân vật, kỹ năng, mod) */
const o = (c, skill, mod) => ({ c, skill, mod });
const flag = (k, v = true) => () => { S.f[k] = v; };

/* ------------------------------------------------------------------ */
/* Gặp gỡ: Bóng Vọng + Bầy Dơi, và Fen. Cấu hình trận đánh / lựa chọn nhẹ nhàng */
const ENC = {
  specter: {
    title: 'Bóng Vọng (Specter) & Bầy Dơi (Swarm of Bats)',
    foes: [
      { id: 'sp', name: 'Bóng Vọng', ac: 12, hp: 22, bloodied: 11, init: 2, save: 2, bonus: 4, dmg: [2, 6, 0], sprite: 'specter', main: true },
      { id: 'bt', name: 'Bầy Dơi', ac: 12, hp: 11, bloodied: 5, init: 2, save: 2, bonus: 4, dmg: [2, 4, 0], dmgLow: [1, 4, 0], sprite: 'bat1' }
    ],
    intro: 'Bóng Vọng là một **Specter** (bóng ma). Bầy dơi là những người thuê trợ đang bực bội. Cả hai chịu một nửa sát thương từ chùy, kiếm và mũi tên; thánh quang gây đủ sát thương.',
    maxRounds: 6,
    endTxt: 'Bóng Vọng dừng lại, bối rối; bầy dơi tản đi, chùng xuống mệt mỏi. "Làm ơn," ông nói.',
    cozy: {
      title: 'Xoa dịu Bóng Vọng', win: 3, lose: 2,
      items: [
        { id: 'sooth', title: 'Lời nói dịu dàng', desc: 'Nói với ông thật nhẹ nhàng.', check: { opts: [o('T', 'Thuyết phục', 4), o('W', 'Thuyết phục', 0)], dc: 10 } },
        { id: 'hum', title: 'Ngân nga một giai điệu của người thắp đèn', desc: 'Dễ hơn nếu hai bạn đã nghe giai điệu của Sơ Maude (Cảnh 2).',
          check: { opts: [o('T', 'Thấu hiểu', 5), o('T', 'Biểu diễn', 2), o('W', 'Thấu hiểu', 3), o('W', 'Biểu diễn', 0)], dc: () => S.f.maude ? 10 : 12 } },
        { id: 'light', title: 'Niệm Light lên cái móc trống, hoặc Calm Emotions', desc: 'Tamsin làm, không cần tung.', auto: { label: '✦ Tamsin niệm phép — thành công' } },
        { id: 'coat', title: 'Xem xét chiếc áo khoác của ông để tìm manh mối', desc: '', check: { opts: [o('T', 'Tôn giáo', 4), o('W', 'Điều tra', 1)], dc: 12 } },
        { id: 'truth', title: 'Nói tên mình và vì sao chuyến phà này quan trọng với hai bạn', desc: 'Không cần tung: thành công miễn phí, nếu đó là sự thật.', auto: { label: '♥ Hai bạn nói thật — thành công' } }
      ]
    }
  },
  fen: {
    title: 'Fen (Will-o\'-Wisp, con số của đêm nay)',
    foes: [
      { id: 'fen', name: 'Fen', ac: 15, hp: 20, bloodied: 10, init: 9, save: 9, bonus: 4, dmg: [2, 8, 2], sprite: 'fen', main: true, fen: true }
    ],
    intro: 'Fen (Will-o\'-Wisp) đêm nay có **20 Điểm máu** (Trọng thương ở 10) và **Hạng giáp 15**, không bao giờ dùng Consume Life hay Vanish. Cô đang ngái ngủ và sương làm ánh sáng của cô mờ đi.',
    endTxt: 'Fen Trọng thương: cô dừng lại, thở dốc, ánh sáng lắng xuống.',
    lantern: true,
    cozy: {
      title: 'Thử Thách của Người Làm Đèn', win: 3, lose: 2,
      items: [
        { id: 'lights', title: 'Thắp mọi ngọn đèn lồng', desc: 'Vừa thắp vừa nói một cái tên cho mỗi ngọn: một người hai bạn yêu, hoặc một điều hai bạn biết ơn.',
          check: { opts: [o('T', 'Tôn giáo', 4), o('T', 'Thuyết phục', 4), o('W', 'Tôn giáo', 1), o('W', 'Thuyết phục', 0)], dc: 10 } },
        { id: 'whistle', title: 'Thổi còi của Bóng Vọng', desc: 'Có còi: thành công tự động. Không có còi: cần tung.',
          auto: { label: '🎵 Thổi còi — thành công', if: () => S.inv.whistle },
          check: { opts: [o('T', 'Biểu diễn', 2), o('W', 'Biểu diễn', 0)], dc: 12, if: () => !S.inv.whistle } },
        { id: 'hold', title: 'Giữ vững ngọn đèn trước cơn gió của Fen', desc: '', check: { opts: [o('W', 'Khéo tay', 5), o('T', 'Điền kinh', 0)], dc: 12 } },
        { id: 'truth', title: 'Nói với Fen một điều thật về nhau', desc: 'Không cần tung: thành công miễn phí.', auto: { label: '♥ Nói điều thật — thành công' } }
      ]
    }
  }
};

const FEN_Q = [
  { q: 'Bóng Vọng', a: '"Odo là người bạn đầu tiên của tôi trong số các lữ khách. Ông ấy hứa sẽ mang ngọn lửa trở lại. Ông ấy không giữ được lời hứa, nhưng chưa bao giờ ngừng cố gắng."' },
  { q: 'Ngọn Đèn Cuối', a: '"Nó được thắp ở đây, bằng tay, từ một vì sao rơi xuống hồ. Tôi là người giữ nó đầu tiên."' },
  { q: 'Sương của hồ', a: '"Đó là điều hồ làm khi nó buồn ngủ và hiền lành. Chiếc đèn nhờ nó, thật khẽ khàng, rẽ ra."' },
  { q: 'Nếu ngọn đèn tắt', a: '"Chẳng có gì tệ hại. Sương sẽ khép lại. Các phà sẽ đợi. Vài lữ khách sẽ không tìm được đường cho tới sáng."' },
  { q: 'Cô có cô đơn không', a: 'Cô ngập ngừng. "Có lẽ. Tôi muốn có ai đó để kể."' }
];

/* ------------------------------------------------------------------ */
const SCENES = {
  /* ============ CHƯƠNG MỘT ============ */
  s1: {
    n: 1, ch: 1, title: 'Dawnrest Landing', min: 7, reader: 'T', art: 'dock', artP: {},
    blocks: [
      { k: 'read', t: 'Dawnrest Landing thoang thoảng mùi hắc ín, dây thừng ướt và những chiếc bánh cuộn quế mà bà Hettie thợ làm bánh bán từ chiếc xe đẩy của bà cho tới tiếng chuông cuối. Những ngọn đèn treo cột rải các vòng sáng ấm lên ván gỗ. Ở cuối **Bến tàu (Pier)**, chiếc phà *Marigold* đang đợi, bụng tròn, mới sơn màu hoa cúc vạn thọ, với một ngọn đèn đồng thau duy nhất tỏa sáng trên Cột đèn. Sương tựa vào bức tường bến cảng như một chú mèo kiên nhẫn. Một viên quản bến mặc áo xanh tên là **Marl** giơ tay chào, rồi hạ xuống, cau mày nhìn lên ngọn đèn.' },
      { k: 'txt', t: '**Chuyện đang diễn ra.** Đây là khoảng lặng trước buổi tối. Hãy để nó trôi chậm. Tamsin đang loay hoay với Ngọn Đèn Cuối; Wren đang tháo dây neo cho chiếc *Marigold*. Hãy nói xem tối nay hai người đã chào nhau thế nào.' },
      { k: 'tries', items: [
        { id: 'marl', title: 'Gặp Marl ở Quầy vé', desc: 'Ông quản bến già đang bồn chồn.',
          auto: { label: '☎ Nói chuyện với Marl', text: '"Ngọn lửa cứ chập chờn," ông nói. "Đêm nay giữ nó cho vững nhé, được không?" Ông ấn một **hộp thiếc nhỏ đựng bấc đèn** vào tay Tamsin.', fx: () => { S.inv.tin = true; toast('Nhận: hộp thiếc bấc đèn'); } } },
        { id: 'gaze', title: 'Ngắm ngọn đèn', desc: 'Tamsin có thể thử.',
          check: { opts: [o('T', 'Thấu hiểu', 5), o('T', 'Tôn giáo', 4)], dc: 10,
            win: 'Cô nhận ra ngọn lửa hơi nghiêng, rất khẽ, về phía mặt nước mở, như thể nó muốn đi đâu đó.', lose: 'Với cô, đó chỉ là một ngọn lửa bình thường, vững vàng.' } },
        { id: 'buns', title: 'Mua bánh', desc: 'Wren có thể mặc cả với bà Hettie.',
          check: { opts: [o('W', 'Lừa dối', 2), o('W', 'Thuyết phục', 0)], dc: 10,
            win: 'Hai cái bánh với giá một cái. Hãy kể xem ai được nửa cái to hơn.', lose: 'Một cái bánh, giá đầy đủ. Bà Hettie khịt mũi, nhưng vẫn gói bánh thật tử tế.' } },
        { id: 'sneak', title: 'Nhổ neo', desc: 'Trong lúc tháo dây, Wren có thể nhìn quanh.',
          check: { opts: [o('W', 'Quan sát', 5)], dc: 10,
            win: 'Wren thấy một dãy **dấu chân nhỏ xíu còn ướt**, đi từ Nhà thuyền ra Bến tàu rồi lên Cầu lên phà. Nhỏ quá, không phải của hai bạn. Chưa ai khác để ý thấy.',
            lose: 'Không có gì khác thường. Chọn Lối đi 1.', onWin: flag('footprints') } }
      ] },
      { k: 'ght', opt: true, label: 'Nếu hai bạn tới cuối cảnh mà vẫn chưa nói chuyện với nhau trong vai nhân vật' },
      { k: 'read', t: 'Tiếng chuông cuối vang lên. Marl khum tay lại. "Nước lên rồi, đi thôi!" Những hành khách đầu tiên lục đục kéo về phía cầu lên phà, và sương khép lại quanh Bến tàu sau lưng hai bạn.' },
      { k: 'tip', t: 'Nếu hai người chơi còn e dè, hãy đóng vai Marl và hỏi mỗi người một câu thẳng: "Tamsin, cô ăn gì chưa? Wren, cô kiểm tra dây hai lần chưa?" Bà Hettie đưa lời khuyên hay nhất cùng tiền thối: "Đêm nay hồ nhờ gì, cứ từ từ mà đồng ý."' },
      { k: 'exits', opts: [
        { label: 'Lên phà bằng cầu lên phà', desc: 'Cùng các hành khách. → Cảnh 2', to: 's2' },
        { label: 'Lần theo dấu chân chui vào Cửa hầm hàng', desc: 'Cần đã thấy dấu chân (Nhổ neo). Hai bạn lỡ mất các hành khách, và trong lúc đang ở dưới, ngọn đèn biến mất mà không có hai bạn. → Cảnh 3',
          locked: () => S.f.footprints ? null : 'Cần thấy dấu chân (thử "Nhổ neo")', fx: flag('cargo'), to: 's3',
          check: { title: 'Lối đi 2: Cửa hầm hàng', opts: [o('W', 'Nhào lộn', 5), o('W', 'Điền kinh', -1), o('T', 'Nhào lộn', 1), o('T', 'Điền kinh', 0)], dc: 10, once: true,
            win: 'Hai bạn leo xuống thang hầm không trượt chân.', lose: 'Hai bạn trượt xuống thang hầm rồi cười trừ.', note: 'Một trong hai người, một lần tung. Dù thế nào → Cảnh 3.' } }
      ] }
    ]
  },

  s2: {
    n: 2, ch: 1, title: 'Boong Hành Khách', min: 12, reader: 'W', art: 'deck', artP: { lamp: true },
    blocks: [
      { k: 'read', t: 'Chiếc *Marigold* rời bến và trượt vào màn sương. Chưa đầy một phút, bến cảng đã biến mất; chỉ còn tiếng gỗ kẽo kẹt, tiếng nước vỗ, và vầng sáng vàng quanh Ngọn Đèn Cuối. Trên các Ghế dài, bốn lữ khách yên vị dưới một ngọn đèn dầu treo. Một chiếc phích đựng thứ gì đó nóng hổi đã được chuyển tay nhau.' },
      { k: 'fog' },
      { k: 'txt', t: '**Ai ở trên phà.** Hãy tả mỗi người trong một câu, rồi để nhân vật của hai bạn nói chuyện với ai. Mỗi người trao một món quà nhỏ hoặc một manh mối.' },
      { k: 'tries', items: [
        { id: 'maude', title: 'Sơ Maude', desc: 'Một bà cụ người rung chuông, khoác chiếc khăn choàng chắp vá, đang đan len.',
          auto: { label: '🧶 Trò chuyện với Sơ Maude', text: '"Trước Ngọn Đèn Cuối còn có một người gác khác. **Odo Fennick.** Anh ấy thề trông thêm một chuyến vượt hồ nữa, rồi chẳng bao giờ xuống phà." Bà biết một giai điệu của người thắp đèn và sẽ ngân nga nếu được nhờ, chỉ một lần. Bà nhớ Odo là một chàng trai trầm lặng hay huýt sáo khi làm việc: "Anh ấy hay nói, một chiếc đèn lồng chưa thành ngọn đèn cho tới khi ai đó yêu nó."', fx: flag('maude') } },
        { id: 'twins', title: 'Pell và Pim', desc: 'Hai anh em sinh đôi mang một thùng đom đóm phát sáng, đang trên đường dự đám cưới em gái ở Far Shore.',
          buttons: [{ label: '✦ Tamsin ban lời chúc phúc (Bless, −1 ô cấp 1)', text: 'Pim vui vẻ; Pell lo lắng. Họ tặng cô một lọ đom đóm sáng như đèn lồng cho tới sáng.', fx: () => { spendSlot(); S.inv.fireflies = true; }, if: () => totalSlots() > 0 },
                    { label: '♥ Chỉ vài lời tử tế', text: 'Pell và Pim cười. Hai bạn nhận một lọ đom đóm nhỏ làm quà.', fx: () => { S.inv.fireflies = true; } }] },
        { id: 'orrin', title: 'Thuyền trưởng Lotte Orrin', desc: 'Một hoa tiêu phà đã nghỉ hưu giữ cô đi nhờ, và bà nhận ra Wren. Bà chia sẻ mẹo đọc dòng nước nếu Wren hỏi khéo.',
          check: { title: 'Nhờ thuyền trưởng Orrin chỉ mẹo', opts: [o('W', 'Thuyết phục', 0)], dc: 10, help: 'T',
            win: 'Orrin chỉ mẹo cho hai bạn. **Mẹo của Orrin**: hai bạn sẽ có Lợi thế ở "Đọc dòng nước" trong Cảnh 5. Bà ngờ rằng hòn đảo chỉ hiện ra với người đang mang theo thứ quý giá. "Tôi chưa từng mang gì cả," bà nói. "Nhưng tôi vẫn sẽ mang lại đúng thứ ấy, nhớ đấy."',
            lose: 'Orrin chỉ nháy mắt. Lần này không có mẹo.', onWin: flag('orrinTip') } },
        { id: 'grey', title: 'Một lữ khách áo xám trầm lặng', desc: 'Đội mũ trùm, nhìn chằm chằm vào Ngọn Đèn Cuối. Đừng giải thích về họ. Nếu ai bắt chuyện, họ chỉ thầm đúng một từ: "Nhà." Rồi chỉ còn một chiếc ghế trống với một vệt nước ấm.',
          check: { title: 'Lắng nghe', opts: [o('W', 'Thấu hiểu', 3)], dc: 10,
            win: 'Wren nhận ra lữ khách áo xám đang run, dù không phải vì lạnh.', lose: 'Không biết thêm gì về họ ngoài chiếc mũ trùm và ánh nhìn lặng lẽ.' } },
        { id: 'tea', title: 'Trà và một ly chúc', desc: 'Chia nhau chiếc phích. Mỗi người tả vị trà bằng một từ.', auto: { label: '☕ Nâng ly', text: 'Cả phà cùng nâng ly. Một khoảnh khắc ấm áp trước khi sương đổi sắc.' } },
        { id: 'tin', title: 'Hộp thiếc bấc đèn', desc: 'Tamsin tỉa đèn và thay bấc mới (không cần tung).', if: () => S.inv.tin,
          auto: { label: '🕯 Thay bấc đèn', text: 'Ngọn lửa vững lại trong vài phút, và cả hai thấy rõ nó quan trọng đến nhường nào.' } }
      ] },
      { k: 'ght', label: 'Vào khoảnh khắc yên ắng nhất, khi cả con phà xì xào' },
      { k: 'run', fn: () => Art.patch({ lamp: false }) },
      { k: 'read', t: 'Chiếc *Marigold* ra tới giữa hồ. "Chuông tàu điểm ba tiếng. Ngọn Đèn Cuối chập chờn... rồi nó lụi dần, và ngọn lửa vươn ra như chú chim sắp bay. Trong một nhịp tim, cả con phà tối đen. Khi ánh sáng trở lại, cái móc trên Cột đèn trống trơn. Một vệt tia lửa xanh mỏng lơ lửng bay dọc boong về phía Phòng lái, và hai bạn nghe thấy âm thanh khẽ khàng từ phía đời: một tiếng huýt sáo của người thắp đèn, xa dần."' },
      { k: 'tip', t: 'Hãy cho mỗi hành khách một cử chỉ đáng nhớ thay vì một bài nói dài: kim đan của bà Maude không bao giờ ngừng, Pell kiểm tra nắp thùng, Pim ngân nga, thuyền trưởng Orrin đặt một tay lên lan can như thể vẫn đang cầm lái. Nếu người chơi làm điều gì kịch tính khi đèn tắt (niệm phép Light, chộp lấy một hành khách, hét lên), cứ nói "được".' },
      { k: 'txt', t: '**Đây là ngã rẽ lớn đầu tiên.** Hãy cùng quyết định. Lựa chọn này định hình Chương Hai.' },
      { k: 'exits', opts: [
        { label: 'THEO DẤU (Follow the Trail)', desc: 'Đuổi theo những tia lửa xanh ngay lập tức. Lợi thế ở lần kiểm tra đầu tiên của Cảnh 5. → Cảnh 3', fx: flag('trail'), to: 's3' },
        { label: 'GIỮ HƯỚNG (Hold the Course)', desc: 'Trấn an hành khách, giữ vững con phà cùng thuyền trưởng Orrin, và tìm kiếm có phương pháp. Pell trao cho hai bạn một Potion of Healing (thuốc chữa lành). → Cảnh 3', fx: () => { S.f.hold = true; S.inv.potion++; toast('Nhận: Potion of Healing'); }, to: 's3' }
      ] }
    ]
  },

  s3: {
    n: 3, ch: 1, title: 'Phòng Lái', min: 13, reader: 'T', art: 'wheelhouse', artP: { ghost: true, bats: true },
    blocks: [
      { k: 'read', t: 'Những tia lửa dẫn tới **Phòng lái**, một căn phòng chật hẹp đầy phụ kiện đồng thau, hải đồ và phao thủy tinh. Trong này lạnh, kiểu lạnh như trong một nhà thờ. Lơ lửng giữa sàn, nơi không ánh sáng nào chạm tới, là hình hài một người đàn ông trong chiếc áo khoác dài của người thắp đèn, bàn tay khum lại như đang che một ngọn lửa. Ông quay lại nhìn hai bạn, và đôi mắt ông rất buồn. Phía trên ông, trên xà nhà, có thứ gì nhỏ xíu sột soạt. Rồi nhiều thứ hơn nữa.' },
      { k: 'fog' },
      { k: 'txt', t: '**Đây là ai.** Đây là **Bóng Vọng của Odo Fennick (Echo of Odo Fennick)**, người thắp đèn đã ở lại phà khi Ngọn Đèn Cuối vỡ lần trước, ba mươi năm về trước, và không bao giờ hoàn thành chuyến vượt hồ cuối của mình. Ông lấy chiếc đèn không phải để làm hại ai, mà để mang ngọn lửa về nhà, tới **Mist Isle**, nơi nó được thắp lần đầu. Ông không hiểu mình đã làm hai bạn sợ.' },
      { k: 'txt', if: () => S.f.cargo, t: 'Hai bạn vào bằng Cửa hầm hàng: Bóng Vọng đã cầm chiếc đèn, giật mình vì sự xuất hiện của hai bạn. Bầy dơi vẫn ở đó.' },
      { k: 'enc', id: 'specter' },
      { k: 'run', fn: () => Art.patch({ bats: false }) },
      /* thành công / Trọng thương */
      { k: 'read', if: () => S.f.spec === 'peace', t: '**Bóng Vọng cất tiếng.** "Tôi chỉ muốn hoàn thành chuyến vượt hồ. Tôi đã hứa sẽ mang ngọn lửa về nhà. Tôi không biết vẫn còn người đang giữ nó." Ông nhìn hai bạn, và có điều gì đó trên gương mặt ông dịu đi. "Hai người biết chăm sóc nhau. Phải như thế mới đúng."' },
      { k: 'run', if: () => S.f.spec === 'peace', fn: () => { S.inv.whistle = true; toast('Nhận: chiếc còi đèn'); } },
      { k: 'txt', if: () => S.f.spec === 'peace', t: 'Ông để lại cho hai bạn **chiếc còi đèn (lantern-whistle)**, một chiếc còi thiếc nhỏ xấu xí. Nếu hai bạn thổi nó tại Mist Isle, ông sẽ đáp lại từ rất xa.' },
      { k: 'tip', if: () => S.f.spec === 'peace', t: 'Điều hành căn phòng: Bóng Vọng hiện và chậm. Thỉnh thoảng ông nói với người không có ở đó ("Giơ đèn cao hơn chút nữa, chàng trai"). Nhắc tới việc ông nhìn biểu tượng thánh của Tamsin, rồi bàn tay Wren đặt trên vô-lăng, rồi nhìn cả hai người cùng nhau: ông đang nhớ về chuyến vượt hồ của chính mình, và về người đã từng đứng bên ông. Nếu Bóng Vọng được xoa dịu sớm, hãy để ông kể câu chuyện về chuyến vượt hồ cuối: chiếc đèn vỡ trong bão, sương khép lại, và vì sao ông quyết định tự mình để một hành khách thiếu ánh sáng. "Tôi tưởng mình sẽ về trước bình minh," ông nói, gần như bật cười. "Đó là ba mươi năm trước, tôi nghĩ vậy."' },
      { k: 'ght', if: () => S.f.spec === 'peace', label: 'Khi Bóng Vọng đã dịu lại' },
      { k: 'exits', if: () => S.f.spec === 'peace', opts: [
        { label: 'Theo bàn tay chỉ của Bóng Vọng về phía đuôi, tới Xuồng cứu sinh', desc: '→ Cảnh 4', to: 's4' },
        { label: 'Tìm trong Phòng lái trước', desc: 'Một lần tung. Dù thế nào cũng đến Cảnh 4. (Nhật ký cho phép hai bạn hỏi Fen câu thứ hai ở Cảnh 6.)', to: 's4',
          check: { title: 'Lối đi 2: tìm trong Phòng lái', opts: [o('W', 'Quan sát', 5), o('W', 'Điều tra', 1), o('T', 'Quan sát', 3), o('T', 'Điều tra', -1)], dc: 10, once: true,
            win: 'Hai bạn tìm thấy **nhật ký phà** với dòng cuối của Odo: *Mist Isle, ngọn đèn thứ ba tính từ bãi lau.*', lose: 'Không có nhật ký. Hai bạn vẫn đến Cảnh 4.',
            onWin: () => { S.inv.journal = true; toast('Nhận: nhật ký phà'); }, note: 'Một trong hai người, một lần tung.' } }
      ] },
      /* thất bại: cả hai ngủ / xoa dịu thất bại */
      { k: 'txt', if: () => S.f.spec === 'ko', t: 'Bầy dơi tản đi và Bóng Vọng tan vào sương. Hai bạn theo những tia lửa tới Cảnh 4, **không có chiếc còi đèn** (và không có nhật ký).' },
      { k: 'exits', if: () => S.f.spec === 'ko', opts: [{ label: 'Theo những tia lửa tới Đuôi phà', desc: '→ Cảnh 4', to: 's4' }] }
    ]
  },

  s4: {
    n: 4, ch: 1, title: 'Đuôi Phà Yên Tĩnh', min: 10, reader: 'W', art: 'stern', artP: {},
    blocks: [
      { k: 'read', t: 'Đuôi phà tối và lặng. Xuồng cứu sinh treo trên mặt nước nơi giá cẩu, thân xuồng ướt sương. Trong sự tĩnh lặng, hai bạn chỉ nghe tiếng thì thầm của hồ và hơi thở của nhau. Ngọn Đèn Cuối nằm trong xuồng, cháy nhỏ và xanh, ngọn nghiêng đi, tránh xa hai bạn, về phía cùng một máng sương. Xa xa, trong màu trắng, ba đốm sáng mờ nhấp nhô thành hàng.' },
      { k: 'txt', t: '**Chuyện đang diễn ra.** Bóng Vọng đã mang đèn đến đây nhưng không thể đi xa hơn. Ngọn lửa muốn tới Mist Isle. Chiếc *Marigold* không thể rời luồng nếu không có đèn, nên phà sẽ ở lại chờ, với thuyền trưởng Orrin và Sơ Maude trông coi hành khách. Hai bạn phải chèo xuồng ra, mang theo ngọn lửa, rồi hoặc đưa nó về nhà, hoặc tự quyết định phải làm gì với nó.' },
      { k: 'tries', items: [
        { id: 'down', title: 'Hạ xuống', desc: 'Wren quay tời.', check: { opts: [o('W', 'Khéo léo (Nhào lộn)', 3), o('W', 'Sức mạnh', -1)], dc: 10,
          win: 'Xuồng trượt êm xuống mặt nước.', lose: 'Xuồng va vào thân phà cái bộp; các hành khách vẫn reo hò. Dù thế nào, tiếp theo hai bạn cũng ở trên mặt nước.' } },
        { id: 'hold', title: 'Cầm đèn', desc: 'Nó ấm và ngân khe khẽ, không nóng. Tamsin có thể thử cảm nhận xem nó muốn gì.', check: { opts: [o('T', 'Thấu hiểu', 5), o('T', 'Tôn giáo', 4)], dc: 10,
          win: 'Cô nhận ra ngọn lửa không phải tù nhân. Nó muốn về nhà, nhưng sẽ sẵn lòng quay lại nếu ai đó hỏi nó khéo.', lose: 'Nó ấm và ngân khe khẽ; cô chưa biết nó muốn gì.' } },
        { id: 'calm', title: 'Trấn an hành khách', desc: 'Tamsin có thể ban phước cho họ; Wren có thể hứa sẽ mang ánh sáng của phà về nhà.', auto: { label: '♥ Trấn an họ', text: 'Tiếng reo hò xa dần trong sương, nghe nhẹ nhõm hơn.' } }
      ] },
      { k: 'tip', t: 'Lời bên lan can: nếu hai bạn cần điều gì để nói, Người Đọc có thể đưa ra những câu sau, từng câu một:\n• (Nếu hai bạn đã gặp Bóng Vọng) "Ông nói hai người biết chăm sóc nhau. Điều gì ở người ấy mà bạn mong họ đừng bao giờ ngừng làm?"\n• "Nếu ngọn đèn biết nói, nó sẽ kể nó đã thấy hai bạn làm gì trên chuyến phà này?"\n• "Bạn muốn làm gì vào buổi sáng đầu tiên sau mùa sương mù?"\nVề ngọn đèn: nếu Tamsin hỏi, Người Đọc có thể đọc điều cuốn sổ của những người gác đèn đã viết: "Chiếc đèn chỉ là phần của ánh sáng mà bạn cầm được." Không ai đồng ý nó có nghĩa gì. Hãy để người chơi tự quyết định.' },
      { k: 'ght' },
      { k: 'exits', opts: [
        { label: 'Chèo vào bãi lau', desc: '→ Cảnh 5', to: 's5' },
        { label: 'Rung chuông tàu ba tiếng trước', desc: 'Wren; không cần tung. Hồ đáp lại bằng một tiếng chuông xa xăm. → Cảnh 5', to: 's5' }
      ] }
    ]
  },

  /* ============ CHƯƠNG HAI ============ */
  s5: {
    n: 5, ch: 2, title: 'Bãi Lau', min: 8, reader: 'T', art: 'reeds', artP: {},
    blocks: [
      { k: 'read', t: 'Chiếc xuồng trượt giữa những bức tường lau sậy thì thầm. Ngọn Đèn Cuối rọi một tia vàng dài về phía trước, và sương xoáy quanh nó như kem trong ly cà phê. Những đốm sáng xanh nhạt bé xíu nhấp nhô giữa các thân lau. Chúng giữ khoảng cách. Hai bạn có cảm giác cả mặt hồ đang nín thở.' },
      { k: 'fog' },
      { k: 'txt', t: '**Chuyện đang diễn ra.** Đây là một cảnh tìm đường, không phải một trận đánh. Bãi lau là một mê cung, và những đốm sáng nhỏ là những ánh sáng lạc của hồ, nhút nhát như hươu nai. Hãy để chúng trôi lại gần, rồi vụt đi. Hai bạn phải tìm đường tới Bến đáp, nên cứ thử cho tới khi tìm ra. Thất bại chỉ đổi cách hai bạn đến nơi.' },
      { k: 'cozy', id: 'reeds', cfg: {
        title: 'Tìm đường', win: 3, lose: 2, firstAdv: () => S.f.trail, firstAdvNote: 'THEO DẤU: Lợi thế ở lần tung đầu tiên',
        items: [
          { id: 'water', title: 'Đọc dòng nước', desc: 'Lợi thế nếu hai bạn có mẹo của Orrin.', check: { opts: [o('T', 'Sinh tồn', 3), o('W', 'Sinh tồn / Tự nhiên', 1)], dc: 10, adv: () => S.f.orrinTip, advNote: 'Mẹo của Orrin' } },
          { id: 'feel', title: 'Lái theo cảm giác', desc: '', check: { opts: [o('W', 'Nhào lộn', 5), o('T', 'Nhào lộn', 1)], dc: 10 } },
          { id: 'trust', title: 'Tin vào ngọn đèn', desc: 'Tamsin giơ đèn lên và nói mình muốn đi đâu.', check: { opts: [o('T', 'Thấu hiểu', 5)], dc: 10 } },
          { id: 'talk', title: 'Nói chuyện với những đốm sáng', desc: '', check: { opts: [o('T', 'Thuyết phục', 4), o('W', 'Thuyết phục / Biểu diễn', 0)], dc: 12 } }
        ],
        winTxt: 'Ba lần thành công: hai bạn tới **Bến đáp**.',
        loseTxt: 'Hai lần thất bại: xuồng mắc cạn trên một bãi cát mềm. Xuống đẩy thôi. Chỉ tốn chút thể diện, và vài đốm sáng đi theo hai bạn, khúc khích cười.'
      } },
      { k: 'ght', label: 'Nếu không khí cần một hơi thở. Chèo cùng nhau là chỗ rất hợp' },
      { k: 'txt', t: '**Những điều nhỏ trong lau sậy** (dùng làm sắc màu, nếu hai người đang thích mặt nước): một chú bói cá đậu lơ lửng trong ánh sáng và thả một con cá nhỏ bạc xuống xuống như thể trả phí qua đò. Một chiếc phao chuông rung trong đám lau, gỉ sét mà đẹp. Nó rung một tiếng cho mỗi người chạm vào.' },
      { k: 'tip', t: 'Nếu hai bạn bí, ngọn đèn sẽ giải quyết: ngọn lửa nghiêng về một khe hở trong đám lau. Người Đọc nói: "Ánh sáng nghiêng sang trái," và hỏi ai sẵn lòng tin nó.' },
      { k: 'exits', opts: [
        { label: 'Cập vào Bến đáp bằng gỗ ở bờ nam', desc: '→ Cảnh 6', to: 's6' },
        { label: 'Theo các đốm sáng thẳng tới Vòng Đá', desc: 'Tung trước. → Cảnh 6', to: 's6',
          check: { title: 'Lối đi 2: theo các đốm sáng', opts: [o('W', 'Ẩn nấp', 7), o('T', 'Thuyết phục', 4)], dc: 12, once: true,
            win: 'Hai bạn đến thẳng Vòng Đá và bỏ qua Bến đáp.', lose: 'Các đốm sáng tản đi và hai bạn cập vào Bến đáp, như Lối đi 1.', note: 'Một người tung, để không làm chúng giật mình.' } }
      ] }
    ]
  },

  s6: {
    n: 6, ch: 2, title: 'Vòng Đá', min: 12, reader: 'W', art: 'stones', artP: { lit: 0, fen: true },
    blocks: [
      { k: 'read', t: 'Trên đảo, sương mỏng và bạc. Một vòng cổng đá cổ đứng trong lùm bạch dương trắng, mỗi cổng treo hàng trăm chiếc đèn lồng thủy tinh nhỏ xíu, tất cả đều chưa thắp. Bên kia Vòng Đá, giữa Tàn tích đền, có một bồn đá rộng ú rêu. Ngọn lửa của Ngọn Đèn Cuối bật lên hướng về phía đó. Trong bồn có một sinh vật bằng ánh sáng rất nhỏ, rất già, to không hơn một con mèo, cuộn tròn như một cục than hồng buồn ngủ. Ánh sáng của nó xanh dịu.' },
      { k: 'fog' },
      { k: 'txt', t: '**Chuyện đang diễn ra.** Đây là nơi ngọn lửa đầu tiên được nhóm lên. Sinh vật trong bồn là **Fen**, người canh giữ lùm cây và là ánh sáng lạc lâu đời nhất của hồ. Cô không thù địch. Cô đơn, và dè chừng, và khi thấy Ngọn Đèn Cuối, cô tỉnh dậy, khát khao hơi ấm của nó.' },
      { k: 'tries', items: [
        { id: 'look', title: 'Nhìn quanh', desc: 'Wren có thể thử.', check: { opts: [o('W', 'Quan sát', 5), o('W', 'Điều tra', 1)], dc: 10,
          win: 'Hai bạn tìm thấy cái móc trống trên cổng đá trung tâm, nơi chiếc đèn từng treo, và một tấm biển: *Thắp bằng tay, giữ bằng tay.*', lose: 'Chỉ có bạch dương, sự im lặng và hàng trăm chiếc đèn lồng thủy tinh chưa thắp.' } },
        { id: 'greet', title: 'Chào Fen', desc: 'Tamsin có thể thử.', check: { opts: [o('T', 'Thuyết phục', 4), o('T', 'Tôn giáo', 4)], dc: 10,
          win: 'Fen ngáp và chớp mắt, bay lên không, và nói bằng giọng như chuông gió: "Các bạn mang ông ấy tới. Các bạn mang ngọn lửa tới. Đã đến lúc rồi sao?"', lose: 'Fen chỉ nhút nhát nhìn hai bạn một lát, rồi nói đúng những lời ấy.' } },
        { id: 'light', title: 'Thắp một ngọn đèn lồng', desc: 'Wren (không cần tung).', auto: { label: '🏮 Thắp một ngọn', text: 'Một làn sóng ánh sáng lặng lẽ lan qua những hàng cây.', fx: () => { S.lanterns++; Art.patch({ lit: S.lanterns }); } } },
        { id: 'want', title: 'Hỏi ngọn lửa muốn gì', desc: '', auto: { label: '🔥 Hỏi ngọn lửa', text: 'Fen giải thích: ngọn lửa được làm ra để dẫn lữ khách qua hồ, và nó đã cháy hàng thế kỷ. Nó có thể nhà ở bồn đá và nghỉ ngơi, mang theo những ánh sáng dẫn đường, với hồ trở lại bóng tối tự nhiên của nó; hoặc nó có thể quay về phà và cháy tiếp như trước, với lời hứa rằng sẽ có người giữ nó bằng tình yêu.' } },
        { id: 'tower', title: 'Đi lang thang tới Tháp Đèn Cũ', desc: 'Một ngôi tháp đá thấp, buông đèn trống và một cầu thang xoắn mòn nhẵn.', auto: { label: '🗼 Leo tháp', text: 'Bệ cửa sổ có hàng chục vết xước nhỏ, mỗi vết cho một người gác đèn từng trông ngóng chuyến phà. Vết gần nhất còn mới. Nó ghi: ***Tamsin.*** *(Nếu bạn chơi Tamsin, đây là lúc để nói bạn nghĩ gì về điều đó.)*' } }
      ] },
      { k: 'ask' },
      { k: 'ght', label: 'Hãy thong thả. Vòng Đá là trái tim cảm xúc của cả chuyến đi' },
      { k: 'txt', t: '**Đây là ngã rẽ lớn thứ hai.** Hãy cùng bàn bạc. Không đáp án nào sai.' },
      { k: 'exits', opts: [
        { label: 'LẤY LẠI (RECLAIM)', desc: 'Mang chiếc đèn về *Marigold*. Fen sẽ thử thách hai bạn trước. → Cảnh 7', fx: flag('reclaim'), to: 's7' },
        { label: 'THẢ VỀ (RELEASE)', desc: 'Đặt ngọn lửa vào bồn đá và để nó đi. Fen vui mừng và rưng rưng. Tính như đã qua. → Cảnh 8', fx: flag('release'), to: 's8' },
        { label: 'CHỜ (WAIT)', desc: 'Nếu hai bạn không thể quyết định, hãy ngồi bên bồn đá cho tới bình minh. Nhảy tới Cảnh 9, Kết cục C (Trôi Dạt).', fx: flag('wait'), to: 's9' }
      ] }
    ]
  },

  s7: {
    n: 7, ch: 2, title: 'Thử Thách của Fen', min: 14, reader: 'T', art: 'stones', artP: { lit: 1, fen: true, fenBig: true },
    blocks: [
      { k: 'read', t: 'Fen bay khỏi bồn và lớn dần bằng một cột đèn đường, ánh sáng của cô chuyển từ xanh sang trắng rực. "Nếu các bạn muốn mang ngọn lửa đi, các bạn phải mang nó thật tử tế," cô nói. "Cho tôi xem." Những phiến đá đứng ngân vang. Những chiếc đèn lồng thủy tinh nhỏ rung rinh trong rặng bạch dương. Giọng cô dịu dàng, nhưng mặt đất cũng rung chuyển, và hai bạn biết cô không đùa.' },
      { k: 'txt', t: '**Chuyện đang diễn ra.** Fen vừa là người canh giữ vừa là một thử thách. Cô sẽ không bao giờ cố ý làm hại hai bạn, nhưng sức mạnh của cô bùng lên khi cô sợ hoặc cô đơn. Cảnh này chỉ dành cho LẤY LẠI. Hãy cùng quyết định cách đón nhận thử thách của cô: đánh nhau, hoặc chọn Lựa chọn nhẹ nhàng.' },
      { k: 'ght', label: 'Một lần, giữa hai lần thắp đèn, với những ánh sáng nhỏ bao quanh hai bạn' },
      { k: 'enc', id: 'fen' },
      { k: 'read', if: () => S.f.fenPass === true, t: 'Fen dịu lại. "Các bạn dũng cảm," cô nói, "và các bạn không ghét tôi. Thế là đủ." Hai bạn đã **VƯỢT QUA (PASSED)**.' },
      { k: 'read', if: () => S.f.fenPass === false, t: 'Ánh sáng mờ đi, Fen thở dài và nhẹ nhàng đưa hai bạn về Bến đáp. Cô không giận, chỉ buồn. Hai bạn đã **THẤT BẠI (FAILED)**.' },
      { k: 'txt', t: '**Sau thử thách,** Fen thu nhỏ lại bằng con mèo và yên vị trong bồn. Dù hai bạn có vượt qua hay không, cô vẫn kể cho hai bạn một bí mật về hồ: **rằng hồ biết mơ.**' },
      { k: 'exits', if: () => S.f.fenPass === true, opts: [{ label: 'Hai bạn đã VƯỢT QUA', desc: '→ Cảnh 8', to: 's8' }] },
      { k: 'exits', if: () => S.f.fenPass === false, opts: [{ label: 'Hai bạn đã THẤT BẠI', desc: 'Hai bạn tỉnh dậy ở Bến đáp, ngọn đèn nằm an toàn dưới chân, nhưng Fen chưa thể cho hai bạn mượn niềm tin của cô. Bỏ qua Cảnh 8 và đi thẳng tới Cảnh 9, Kết cục C.', to: 's9' }] }
    ]
  },

  s8: {
    n: 8, ch: 2, title: 'Trở Lại Mặt Nước', min: 8, reader: 'W', art: 'lake', artP: { mood: 'night', lamp: true },
    blocks: [
      { k: 'read', t: 'Sương đã dịch chuyển. Sau lưng hai bạn, trong Vòng Đá, hàng trăm chiếc đèn lồng nhỏ treo lặng lẽ giữa những cây bạch dương. Hai bạn đẩy chiếc xuồng ra khỏi bãi cát. Hồ rất lặng. Bên kia mặt nước có tiếng chuông ngân, một, hai, ba tiếng, và hai bạn biết đó là Sơ Maude, đang gọi hai bạn về nhà.' },
      { k: 'read', if: () => S.f.reclaim, t: 'Ánh sáng vàng tràn ra từ những chiếc đèn lồng sau lưng hai bạn.' },
      { k: 'fog' },
      { k: 'txt', t: () => '**Điều quyết định kết cục của hai bạn.** ' + ({ A: 'LẤY LẠI và VƯỢT QUA → Kết cục A, **Trở Về (Return)**.', B: 'THẢ VỀ → Kết cục B, **Thả Bay (Release)**.', C: 'Hai bạn không có mặt ở đây theo cách khác: kết cục sẽ là C, **Trôi Dạt (Drift)**.' })[ending()] },
      { k: 'tries', items: [
        { id: 'ferry', title: 'Tìm chiếc phà', desc: 'Một trong hai người có thể thử (một lần tung).', check: { opts: [o('T', 'Sinh tồn', 3), o('W', 'Nhào lộn', 5)], dc: 10, once: true,
          win: 'Hai bạn thấy ngay ngọn đèn của chiếc *Marigold*.', lose: 'Không mất gì; chỉ thêm một phút và vài câu đùa ngớ ngẩn.' } },
        { id: 'fenlast', title: 'Lời cuối với Fen', desc: 'Fen gửi theo một ánh sáng nhỏ như một món quà.', auto: { label: '✨ Nhận món quà của Fen', text: 'Một đốm sáng nhỏ nhập vào lòng bàn tay hai bạn, ấm như hơi thở. Hãy nói điều gì đó với cô trước khi đi.' } }
      ] },
      { k: 'ght', label: 'Một lượt Giữa Hai Ta cuối cùng. Mặt nước yên, ánh vàng sau lưng, tiếng chuông phía trước' },
      { k: 'tip', t: 'Cảnh này ngắn có chủ ý. Đây là hơi thở giữa cao trào và kết cục. Hãy để người chơi giữ sự im lặng thêm một chút. Nếu hai bạn muốn nán lại, Người Đọc có thể tả Vòng Đá mờ dần sau lưng vào màu trắng, và, nếu hai bạn đã gặp ông, lần nhìn cuối về phía Bóng Vọng nơi mép nước, tay cầm mũ, vẫy chào. (Nếu hai bạn chọn LẤY LẠI, hãy hỏi ai đang đặt tay lên ngọn lửa.)' },
      { k: 'exits', opts: [
        { label: 'Chèo về phía tiếng chuông', desc: '→ Cảnh 9', to: 's9' },
        { label: 'Chèo về phía ánh sáng, và ngoái nhìn lại một lát trước', desc: '→ Cảnh 9', to: 's9' }
      ] }
    ]
  },

  s9: {
    n: 9, ch: 2, title: 'Các Kết Cục', min: 5, reader: null, art: 'lake', artP: {},
    blocks() {
      const e = ending();
      const peace = S.f.spec === 'peace';
      const B = [];
      if (e === 'A') {
        B.push({ k: 'run', fn: () => Art.set('lake', { mood: 'gold', ferryLight: true, path: true }) });
        B.push({ k: 'h', t: 'Kết cục A: Trở Về (chiếc đèn về nhà)' });
        B.push({ k: 'read', t: 'Sương rẽ ra, và chiếc *Marigold* ở đó, nhấp nhô trong bóng tối, ngọn đèn dầu của phà sáng như một vì sao cô đơn. Sơ Maude nắm chặt dây chuông; Pell và Pim reo hò; thuyền trưởng Orrin cúi chào. Hai bạn trèo lên phà và treo Ngọn Đèn Cuối lên móc trống, và ngọn lửa bốc lên, vững vàng, rực rỡ và vàng ấm. Sương lùi lại trước nó. Một con đường ánh sáng mở ra trên mặt hồ, đi mãi tới Far Shore, nơi những ngọn đèn trên cột nháy sáng để đón hai bạn.' });
        if (peace) B.push({ k: 'txt', t: 'Bóng Vọng của Odo đứng ở đuôi phà, tay cầm mũ, cuối cùng đã mỉm cười. "Cảm ơn hai người vì chuyến vượt hồ," ông nói, rồi tan vào ánh sáng đầu tiên của bình minh.' });
        if (S.f.fenPass) B.push({ k: 'txt', t: 'Ánh sáng nhỏ của Fen ở lại Cột đèn một lát, rồi lắng vào lớp kính của chiếc đèn, một tia xanh nhỏ trong màu vàng.' });
        B.push({ k: 'txt', t: '*Hai bạn đứng bên Cột đèn, nhìn ánh đèn của Far Shore đến gần dần. Điều đầu tiên hai bạn sẽ nói với nhau khi bước lên bến là gì?* Hãy nói to lên.' });
        B.push({ k: 'read', t: '**Hết.** Hai bạn đã xứng đáng có giấc ngủ ngon nhất đời mình.' });
      } else if (e === 'B') {
        B.push({ k: 'run', fn: () => Art.set('lake', { mood: 'gold', sparks: true, path: true, lamp: false }) });
        B.push({ k: 'h', t: 'Kết cục B: Thả Bay (ngọn lửa về nhà)' });
        B.push({ k: 'read', t: 'Nhìn lại hòn đảo, hai bạn thấy ngọn lửa mình đặt trong bồn đá vươn dài, bay lên, và lan vào từng chiếc đèn lồng thủy tinh trong Vòng Đá cùng một lúc. Trong một khoảnh khắc, cả hòn đảo bừng lên ánh vàng dịu. Rồi nó loãng ra thành một đám tia lửa trôi bay khỏi hòn đảo, và sương sáng lên từ bên trong, rực như một cánh đồng đèn lồng. Ngọn đèn dầu của chiếc *Marigold* là tất cả những gì còn lại của ánh sáng cũ của hai bạn, nhưng hai bạn không cần thêm. Những tia lửa tạo thành một con đường băng qua mặt nước.' });
        B.push({ k: 'txt', t: 'Những ánh sáng lạc dẫn chiếc phà nhẹ nhàng tới Far Shore. Fen bay bên vai hai bạn suốt dọc đường, to không hơn một con mèo, tỏa ánh xanh. Tại bến, cô cúi chào. "Từ nay hồ sẽ giữ lấy những ánh sáng của riêng mình," cô nói. "Hãy ghé thăm chúng tôi vào mùa sương mù."' });
        if (peace) B.push({ k: 'txt', t: 'Bóng Vọng của Odo thổi một nốt cuối trên chiếc còi ở đuôi phà. Sương, đáp lại, cất tiếng hát.' });
        B.push({ k: 'txt', t: '*Tamsin mất một ngọn đèn và tìm thấy cả một hồ đầy đèn. Điều đó thay đổi gì giữa hai bạn?* Hãy nói to lên.' });
        B.push({ k: 'read', t: '**Hết.** Hồ sẽ nhớ hai bạn.' });
      } else {
        B.push({ k: 'run', fn: () => Art.set('lake', { mood: 'drift', lamp: true }) });
        B.push({ k: 'h', t: 'Kết cục C: Trôi Dạt (một đêm dài, một bình minh dịu dàng)' });
        B.push({ k: 'read', t: 'Sương khép lại, nhưng không dày đặc. Ngọn Đèn Cuối dưới chân hai bạn cháy nhỏ, như ngọn nến, như thể nó cũng mệt. Không thấy bóng dáng chiếc *Marigold*. Vài ánh sáng lạc trôi gần đó, tò mò chứ không ác ý. Hai bạn quấn mình trong tấm chăn của phà và nhìn sương từ từ đổi từ màu bạc sang màu ngọc trai rồi màu hồng.' });
        B.push({ k: 'txt', t: 'Bình minh đến. Sương mỏng dần, và bên kia mặt nước hai bạn thấy chiếc *Marigold* đang neo, các hành khách vẫy tay từ lan can. Sơ Maude đã bắc ấm nước lên.' });
        B.push({ k: 'txt', t: 'Ngọn Đèn Cuối mở nhưng còn sống. Có thể phải mất một mùa nó mới hồi phục ngọn lửa. Hai bạn có đôi tay của mình, có nhau, và một câu chuyện sẽ kể suốt nhiều năm.' });
        B.push({ k: 'txt', t: '*Lần sau hai bạn sẽ làm khác đi điều gì? Và sẽ giữ nguyên điều gì?* Hãy nói to lên.' });
        B.push({ k: 'read', t: '**Hết.** Không phải chuyến vượt hồ nào cũng hoàn hảo. Chuyến này là của riêng hai bạn.' });
      }
      B.push({ k: 'txt', t: '**Sau Kết Cục.** Trước khi gấp sách lại, mỗi người hãy nói một khoảnh khắc đêm nay mà mình muốn giữ lại, và một điều người kia làm khiến mình mỉm cười. Bóng Vọng (nếu hai bạn đã gặp ông), Fen và chiếc *Marigold* vẫn sẽ ở đó nếu hai bạn muốn ra khơi lần nữa.' });
      B.push({ k: 'end', ending: e });
      return B;
    }
  }
};

function ending() {
  if (S.f.wait) return 'C';
  if (S.f.release) return 'B';
  if (S.f.reclaim && S.f.fenPass) return 'A';
  return 'C';
}
const ENDING_NAMES = { A: 'Kết cục A · Trở Về', B: 'Kết cục B · Thả Bay', C: 'Kết cục C · Trôi Dạt' };

/* ------------------------------------------------------------------ */
/* Tham khảo: nhân vật, luật */
const SKILLS = {
  T: [['Nhào lộn', 1], ['Điền kinh', 0], ['Thấu hiểu', 5, 1], ['Y học', 5, 1], ['Biểu diễn', 2], ['Khéo tay', 1], ['Điều khiển thú', 3], ['Lừa dối', 2], ['Đe dọa', 2], ['Tự nhiên', -1], ['Thuyết phục', 4, 1], ['Ẩn nấp', 1], ['Huyền học', -1], ['Lịch sử', -1], ['Điều tra', -1], ['Quan sát', 3], ['Tôn giáo', 4, 1], ['Sinh tồn', 3]],
  W: [['Nhào lộn', 5, 1], ['Điền kinh', -1], ['Thấu hiểu', 3, 1], ['Y học', 1], ['Biểu diễn', 0], ['Khéo tay', 5, 1], ['Điều khiển thú', 1], ['Lừa dối', 2, 1], ['Đe dọa', 0], ['Tự nhiên', 1], ['Thuyết phục', 0], ['Ẩn nấp', 7, 1], ['Huyền học', 1], ['Lịch sử', 1], ['Điều tra', 1], ['Quan sát', 5, 1], ['Tôn giáo', 1], ['Sinh tồn', 1]]
};
const SHEETS = {
  T: `<p class="sub"><i>Người gác Ngọn Đèn Cuối. Ấm áp, thực tế, hơi hay sai bảo người khác.</i> Là <b>Người chơi 1</b>.</p>
<div class="stats"><div>STR<b>10</b>+0</div><div>DEX<b>12</b>+1</div><div>CON<b>14</b>+2</div><div>INT<b>8</b>−1</div><div>WIS<b>17</b>+3</div><div>CHA<b>14</b>+2</div></div>
<table class="t"><tr><td>Hạng giáp (AC)</td><td>16 (áo giáp xích + khiên)</td></tr><tr><td>Điểm máu</td><td>27</td></tr><tr><td>Tốc độ</td><td>30 ft.</td></tr><tr><td>Thứ tự lượt</td><td>+1</td></tr><tr><td>Điểm thành thạo</td><td>+2</td></tr><tr><td>DC phép / đòn tấn công phép</td><td>DC 13 / +5</td></tr></table>
<p><b>Chống chịu:</b> Thông thái +5, Lôi cuốn +4.</p>
<h3>Đến lượt, chọn một</h3>
<ul class="bul"><li><b>Sacred Flame (ngọn lửa thiêng)</b> (cantrip, tầm 60 ft): mục tiêu chống chịu Khéo léo (DC 13) nếu không chịu 1d8 sát thương thánh quang. Dùng miễn phí.</li>
<li><b>Guiding Bolt (tia sáng dẫn đường)</b> (tốn ô cấp 1, 120 ft): +5 để trúng, 4d6 thánh quang; đòn tấn công kế tiếp vào mục tiêu có Lợi thế.</li>
<li><b>Chữa lành</b> (tốn một ô phép): Cure Wounds 2d8+6, hoặc Healing Word (hành động phụ) 2d4+6.</li></ul>
<p class="sub">Hết phép? Vung chiếc chùy: +2 để trúng, 1d6 sát thương đập.</p>
<h3>Đặc biệt</h3>
<ul class="bul"><li><b>Channel Divinity (2 lần):</b> Turn Undead (xua đuổi xác sống) hoặc Preserve Life (bảo toàn sự sống: hồi tối đa 15 Điểm máu chia cho các sinh vật Trọng thương).</li>
<li><b>Disciple of Life:</b> phép chữa lành hồi thêm Điểm máu (đã tính sẵn).</li><li><b>Dwarf:</b> Darkvision 120 ft; kháng sát thương độc.</li></ul>
<p class="sub">Phép nhỏ: Guidance, Light, Sacred Flame, Spare the Dying, Mending, Thaumaturgy. Đã chuẩn bị: Aid, Bless, Cure Wounds, Lesser Restoration, Healing Word, Guiding Bolt, Shield of Faith, Sanctuary, Spiritual Weapon, Calm Emotions, Detect Magic.</p>`,
  W: `<p class="sub"><i>Hoa tiêu của chiếc Marigold. Nhanh nhẹn, hóm hỉnh, hơi tự hào về tay lái của mình.</i> Là <b>Người chơi 2</b>.</p>
<div class="stats"><div>STR<b>8</b>−1</div><div>DEX<b>17</b>+3</div><div>CON<b>15</b>+2</div><div>INT<b>13</b>+1</div><div>WIS<b>12</b>+1</div><div>CHA<b>10</b>+0</div></div>
<table class="t"><tr><td>Hạng giáp (AC)</td><td>14 (áo giáp da)</td></tr><tr><td>Điểm máu</td><td>24</td></tr><tr><td>Tốc độ</td><td>30 ft.</td></tr><tr><td>Thứ tự lượt</td><td>+5</td></tr><tr><td>Điểm thành thạo</td><td>+2</td></tr><tr><td>Sneak Attack</td><td>2d6</td></tr></table>
<p><b>Chống chịu:</b> Khéo léo +5, Trí tuệ +3. <b>Dụng cụ:</b> Thieves' Tools +5.</p>
<h3>Đến lượt, chọn một</h3>
<ul class="bul"><li><b>Strike (ra đòn):</b> kiếm ngắn hoặc cung ngắn: +5 để trúng, 1d6+3 sát thương xuyên. Cộng <b>Sneak Attack +2d6</b> một lần mỗi lượt nếu bạn có Lợi thế, hoặc nếu Tamsin đứng trong phạm vi 5 ft quanh mục tiêu.</li>
<li><b>Steady Aim, rồi Strike:</b> đừng di chuyển. Hành động phụ Steady Aim cho Lợi thế ở đòn tấn công kế tiếp. Sau đó ra đòn. Sneak Attack được cộng tự động.</li>
<li><b>Giúp một tay:</b> hành động Hỗ trợ (Help) để Tamsin có Lợi thế ở kiểm tra hoặc đòn tấn công kế tiếp.</li></ul>
<h3>Đặc biệt</h3>
<ul class="bul"><li><b>Cunning Action:</b> Dash, Disengage hoặc Hide bằng Hành động phụ.</li><li><b>Halfling:</b> Luck (tung lại 1 tự nhiên), Brave, Halfling Nimbleness, Naturally Stealthy.</li>
<li><b>Weapon Mastery (Vex):</b> trúng đòn thì đòn kế tiếp vào mục tiêu đó có Lợi thế.</li><li><b>Alert:</b> Thứ tự lượt được cộng Điểm thành thạo.</li><li><b>Chuyên môn:</b> Ẩn nấp, Quan sát.</li></ul>`
};
const RULES = `
<h2>Cách chơi</h2>
<p>Hai người chơi, không cần Quản trò. Một người <b>đọc</b>, người kia <b>giúp</b>. Hai bạn đổi vai ở mỗi cảnh. Trong game, cảnh lẻ do <b>Người chơi 1</b> đọc, cảnh chẵn do <b>Người chơi 2</b> đọc.</p>
<ol>
<li><b>Ngồi xuống và chọn.</b> Người chơi 1 là Tamsin, Người chơi 2 là Wren.</li>
<li><b>Người Đọc đọc to cảnh.</b> Người Đồng Hành làm việc của mình: nhấn các nút TUNG, hỏi câu Giữa Hai Ta. Mục "Thử xem" là việc tùy chọn.</li>
<li><b>Có hộp TUNG?</b> Chỉ tung xúc xắc khi có hộp TUNG bảo bạn tung. Cộng số đã in rồi so với "cần".</li>
<li><b>Đọc kết quả.</b> Thành công hoặc Thất bại: đều tiếp tục câu chuyện. Thất bại không bao giờ làm hỏng câu chuyện.</li>
<li><b>Chọn một Lối đi.</b> Cùng chọn, rồi đổi vai.</li></ol>
<h3>Giữa Hai Ta</h3>
<p>Người Đồng Hành tung d6 và hỏi câu tương ứng. Người Đọc trả lời đúng vai và nhận <b>Cảm hứng Anh hùng</b> (giữ tối đa một): tung lại bất kỳ viên d20 nào, và dùng kết quả mới.</p>
<h3>Giao tranh</h3>
<p>Dùng luật SRD 5.2: tung Thứ tự lượt, đến lượt mình chọn MỘT hành động. Bất cứ lúc nào, hãy nói <b>"Nhẹ nhàng!"</b> để chuyển sang Lựa chọn nhẹ nhàng: ba lần thành công trước hai thất bại, mỗi cách chỉ dùng một lần.</p>
<p><b>Nhẹ tay.</b> Khi về 0 Điểm máu, nhân vật chỉ ngủ thiếp đi, và tỉnh lại với 1 Điểm máu sau khi cảnh kết thúc.</p>
<h3>Sương mù</h3>
<p>Tại mỗi [SƯƠNG MÙ], Người Đồng Hành tung d6: có thể cho Lợi thế/Bất lợi cho kiểm tra kế tiếp, một lượt Giữa Hai Ta miễn phí, hồi máu, hoặc Cảm hứng Anh hùng.</p>`;
const GLOSS = `
<h2>Thuật ngữ</h2>
<p><b>d20 + 5</b> = tung d20 rồi cộng 5. "cần 10" = tổng phải đạt hoặc vượt 10.</p>
<p><b>DC</b>: Rất dễ 5 · Dễ 10 · Trung bình 15 · Khó 20 · Rất khó 25.</p>
<p><b>Lợi thế</b>: tung hai d20, lấy cao hơn. <b>Bất lợi</b>: tung hai d20, lấy thấp hơn. Cả hai cùng có thì triệt tiêu.</p>
<p><b>Hạng giáp (AC)</b>: con số đòn tấn công phải đạt. <b>Chống chịu</b>: lần tung để né một mối đe dọa.</p>
<p><b>Trọng thương</b>: còn một nửa Điểm máu hoặc ít hơn. <b>Ô phép</b>: tài nguyên của phép (Tamsin: 4 ô cấp 1, 2 ô cấp 2).</p>
<p><b>Kháng sát thương</b>: chịu một nửa sát thương (chùy, kiếm, mũi tên lên các sinh vật ma quái); thánh quang gây đủ sát thương.</p>
<p><b>Hỗ trợ (Help)</b>: bạn giúp người kia có Lợi thế ở kiểm tra hoặc đòn tấn công kế tiếp.</p>
<p><b>Potion of Healing</b>: hành động phụ, hồi 2d4+2 Điểm máu.</p>
<p><b>Cảm hứng Anh hùng</b>: tung lại bất kỳ viên xúc xắc nào ngay sau khi tung, và phải dùng kết quả mới.</p>`;
const CREDITS = `
<h2>Công khai AI & Ghi công</h2>
<p><b>Sử dụng AI.</b> Câu chuyện, đồ dùng khi chơi và bản đồ đều do AI (Claude) soạn thảo. Bản dịch tiếng Việt cũng do AI dịch từ bản tiếng Anh. Phiên bản web pixel này do AI chuyển thể từ cuốn sách PDF. Các đoạn luật được dịch từ SRD 5.2.1; mọi chỉ số, phép và tính năng đã được đối chiếu với SRD 5.2.1 (bản gốc); trang bị và tiền khởi đầu được giản lược cho dễ chơi.</p>
<p><b>Ghi công SRD 5.2.1.</b> This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode. Bản tiếng Việt là bản dịch/chuyển thể của nội dung trên.</p>
<p><b>Tuyên bố miễn trừ.</b> Đây là một tác phẩm độc lập. Sản phẩm này không liên kết, không được bảo trợ, không được tài trợ và không được Wizards of the Coast LLC chấp thuận đặc biệt. Cụm "tương thích 5e" chỉ dùng để cho biết nội dung luật tương thích với luật phiên bản thứ năm.</p>
<p><b>Bản tiếng Việt – chia sẻ miễn phí, không bán.</b> MeoHoangStudio · Duet Evenings · Tập 1.</p>`;
