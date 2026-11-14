#!/usr/bin/env python3
"""Sinh nhiệm vụ phụ viết tay: ghi vào quests.json, dialogues.json và tools/side_npcs.json (NPC giao việc, được make_maps.py nạp).
Chạy: python3 tools/side_quests.py && python3 tools/make_maps.py"""
import json, os
ROOT = os.path.join(os.path.dirname(__file__), '..')
def jl(p): return json.load(open(os.path.join(ROOT, p), encoding='utf8'))
def jd(o, p): json.dump(o, open(os.path.join(ROOT, p), 'w', encoding='utf8'), ensure_ascii=False, indent=1)

EXP = [100, 400, 1500, 8000, 40000, 150000, 600000, 2500000]
GOLD = [40, 150, 400, 900, 2500, 6000, 15000, 40000]

# (id, map, tier, npc{id,label,tex,x,y}, title, log, steps, offer[], wait, resolve{text, choices[{text,reply,do}]}, after, req(cond|None), idle)
Q = [
 dict(id='sq_thon_truong', map='thanh_ha', tier=0, npc=('Thôn Trưởng', 'npc_elder', 20, 10), title='Con trai thôn trưởng', steps=[dict(kind='battle', target='yeu_xa', n=3)],
  log='Thôn Trưởng nói con trai ông đi hái thuốc bị xà yêu dọa, không dám ra khỏi nhà. Hãy hạ 3 xà yêu quanh rừng.',
  offer='Con trai ta bị xà yêu dọa đến mất vía. Cậu giúp ta dẹp bớt đám xà yêu ngoài rừng nhé?', wait='Xà yêu ở phía đông, đường đất. Nhớ cẩn thận nọc độc.',
  resolve=('Thôn Trưởng', 'Cảm ơn cậu! ... À, thật ra thằng bé nói nó lẻn đi hái thuốc để bán lấy tiền chơi bài. Ta nên xử nó thế nào?',
   [('Bảo ông răn dạy con trai cho nghiêm.', 'Thôn Trưởng gật gù: Phải, phải. Cảm ơn cậu đã nói thẳng.', [dict(dao=1), dict(rel={'thon_truong': 8})]),
    ('Khuyên ông bỏ qua, ai cũng có lúc dại.', 'Thôn Trưởng cười: Cậu nhân hậu quá. Thôi, ta tặng cậu chút lộc.', [dict(gold=30), dict(dao=1)])]),
  after='Thằng bé dạo này chăm chỉ lắm. Cảm ơn cậu.'),
 dict(id='sq_ruou', map='thanh_ha', tier=0, npc=('Ông Bạch nấu rượu', 'npc_smith', 12, 16), title='Da sói cho thùng rượu', steps=[dict(kind='collect', target='da_soi', n=4)],
  log='Ông Bạch cần 4 miếng Da Sói để bọc thùng rượu ủ. Nộp vật phẩm cho ông (có sẵn trong túi là tự nộp).',
  offer='Rượu ta ủ ba năm sắp được rồi, chỉ thiếu mấy miếng da sói để bọc thùng. Cậu kiếm giúp 4 miếng được không?', wait='Da sói thì sói rừng có sẵn. Có đủ 4 miếng trong túi là ta nhận ngay.',
  resolve=('Ông Bạch', 'Hay quá! Rượu thành rồi. Cậu muốn thứ gì: tiền công, hay vài viên đan thuốc ta tự luyện?',
   [('Lấy tiền công 60 linh thạch.', 'Ông Bạch móc túi: Đây, cầm lấy.', [dict(gold=60)]),
    ('Nhận 2 viên Hồi Huyết Đan.', 'Ông Bạch cười lớn: Đan của ta ngon lắm đấy!', [dict(item=('hoi_huyet_dan', 2)), dict(dao=1)])]),
  after='Rượu thành rồi, chưa dám uống. Chờ cậu đến uống cùng.'),
 dict(id='sq_bia_mo', map='thanh_ha', tier=0, npc=('Bà Cụ Thủy', 'npc_girl', 8, 12), title='Hoa cúng Diệp gia', steps=[dict(kind='collect', target='linh_thao', n=3)],
  log='Bà Cụ Thủy muốn dựng bia mộ cho Diệp gia nhưng thiếu 3 cây Linh Thảo làm hoa cúng.',
  offer='Ba mươi sáu người Diệp gia chưa có nổi một tấm bia. Ta già rồi, chỉ muốn làm điều ấy trước khi nhắm mắt. Cậu giúp ta 3 cây Linh Thảo làm hoa cúng được không?', wait='Linh Thảo mọc nhiều ven đường. Có 3 cây trong túi cứ đưa ta.',
  resolve=('Bà Cụ Thủy', 'Bia đã dựng xong. Dưới tro tàn, ta tìm thấy một tín vật của cha cậu... Cậu muốn làm gì?',
   [('Chôn lại tín vật cùng bia mộ.', 'Bà Cụ Thủy khóc: Cha mẹ cậu sẽ yên lòng.', [dict(dao=4), dict(exp=60)]),
    ('Giữ lấy tín vật làm kỷ niệm.', 'Bà Cụ Thủy gật đầu: Cũng phải. Cậu mang theo, coi như họ vẫn đi cùng.', [dict(exp=140), dict(dao=-1), dict(flag='kept_diep_relic')])]),
  after='Bia mộ đứng đó, lặng lẽ. Ta thấy lòng nhẹ hẳn.'),
 dict(id='sq_de_tu_yeu', map='thanh_van_tong', tier=1, npc=('Tiểu Sư Đệ', 'npc_disciple', 16, 16), title='Sư đệ bị thương', steps=[dict(kind='collect', target='hoi_huyet_dan', n=2)],
  log='Một sư đệ ngoại môn bị bắt nạt đến bị thương, cần 2 viên Hồi Huyết Đan.',
  offer='Sư huynh... đệ bị mấy tên nội môn đánh. Đệ không có tiền mua đan. Sư huynh có thể cho đệ 2 viên Hồi Huyết Đan được không?', wait='Đệ vẫn đau lắm... Sư huynh có đan không?',
  resolve=('Tiểu Sư Đệ', 'Đệ khỏi rồi! Sư huynh, đệ muốn học đánh để không bị bắt nạt nữa.',
   [('Dạy cậu vài chiêu cơ bản.', 'Tiểu Sư Đệ mắt sáng rực: Đệ sẽ nhớ ơn sư huynh suốt đời!', [dict(exp=150), dict(rep=dict(chinh_dao=2)), dict(dao=2)]),
    ('Bảo cậu tự rèn luyện mà tự lo.', 'Tiểu Sư Đệ cúi đầu: Vâng... đệ hiểu rồi.', [dict(dao=-1)])]),
  after='Nhờ sư huynh, đệ đã đủ can đảm đứng lên rồi.', req=dict(minChapter=2)),
 dict(id='sq_duoc_vien', map='thanh_van_tong', tier=1, npc=('Dược Đồng Ngoại Môn', 'npc_alch', 32, 26), title='Dược viên bị phá', steps=[dict(kind='collect', target='linh_thao', n=8)],
  log='Dược viên ngoại môn bị thú rừng giẫm nát, cần 8 Linh Thảo để trồng lại. Đổi lại được học phương Thanh Tâm Đan.',
  offer='Dược viên của tông môn bị thú rừng phá nát hết! Nếu sư huynh đem giúp 8 cây Linh Thảo, đệ sẽ dạy lại phương Thanh Tâm Đan cho.', wait='8 cây Linh Thảo nhé, sư huynh.',
  resolve=None, after='Dược viên xanh tốt trở lại rồi, đa tạ sư huynh!', reward_extra=dict(recipe='thanh_tam_dan'), req=dict(minChapter=2)),
 dict(id='sq_no_tien', map='phuong_thi', tier=2, npc=('Chủ Tiệm Nhỏ', 'npc_shop', 16, 18), title='Món nợ bị cướp', steps=[dict(kind='battle', target='cuop_duong', n=3)],
  log='Chủ một tiệm nhỏ bị cướp đường lấy mất tiền hàng. Hãy hạ 3 tên cướp đường ở ngoại ô.',
  offer='Bọn cướp đường ngoài rìa phố cướp hết tiền hàng của ta. Nhờ ngươi dạy chúng một bài học, ta sẽ có thưởng.', wait='Cướp thường lảng vảng phía nam và đông phố.',
  resolve=('Chủ Tiệm Nhỏ', 'Ngươi lấy lại được cả túi tiền này! Ta... ta chia thế nào đây?',
   [('Trả lại toàn bộ cho ông.', 'Ông ôm túi tiền khóc: Ân nhân! Ta không biết lấy gì đền đáp.', [dict(dao=3), dict(rel={'tap_hoa': 10}), dict(rep=dict(tan_tu=1))]),
    ('Giữ một nửa làm công.', 'Ông thở dài: Cũng phải... Cho ngươi đó.', [dict(gold=120), dict(dao=-2)])]),
  after='Cảm ơn ngươi đã giúp lúc ta bí nhất.', req=dict(minChapter=2)),
 dict(id='sq_bit_mat', map='phuong_thi', tier=2, npc=('Người Đàn Ông Bịt Mặt', 'npc_merchant', 33, 17), title='Lá thư của kẻ lạ', steps=[dict(kind='battle', target='ma_tu_lang_thang', n=1)],
  log='Một người bịt mặt nhờ hạ Ma Tu lang thang đang truy sát hắn, đổi lại sẽ đưa một lá thư.',
  offer='Có một Ma Tu đang truy sát ta. Hạ hắn giúp ta, ta đưa ngươi một lá thư, thứ ngươi sẽ muốn đọc.', wait='Hắn ở ngoại ô phố, đứng cẩn thận.',
  resolve=('Người Đàn Ông Bịt Mặt', 'Ngươi giỏi thật. Đây là lá thư. Nó nhắc đến một cái tên mà ngươi đang tìm kiếm.',
   [('Mở thư ra đọc.', 'Trong thư: "Mọi việc ở Thanh Vân Tông vẫn theo kế hoạch của L." Ngươi ghi nhớ chữ L đó.', [dict(flag='luc_hint'), dict(exp=300)]),
    ('Đốt thư, không muốn dây vào.', 'Ngọn lửa liếm lên giấy. Ngươi không muốn thêm gánh nặng.', [dict(dao=1), dict(gold=100)])]),
  after='Ta đã chạy khỏi đây từ lâu, hẹn gặp lại.', req=dict(minRealm=1)),
 dict(id='sq_quang_ren', map='phuong_thi', tier=2, npc=('Học Trò Thiết Phong', 'npc_smith', 14, 16), title='Thợ rèn thiếu quặng', steps=[dict(kind='collect', target='huyen_thiet', n=8)],
  log='Thiết Phong Lâu cần 8 Huyền Thiết cho một đơn hàng gấp. Nộp cho học trò để lấy lòng chủ tiệm.',
  offer='Sư phụ ta nhận đơn gấp mà thiếu quặng. Nếu ngươi mang giúp 8 Huyền Thiết, sư phụ sẽ nhớ ơn ngươi.', wait='Huyền Thiết thì rơi từ quái hoặc mua ở lò rèn.',
  resolve=None, after='Sư phụ khen ngươi đấy.', reward_extra=dict(rel={'thiet_phong': 15}), req=dict(minChapter=2)),
 dict(id='sq_lac_da', map='hoang_mac', tier=2, npc=('Lữ Khách Lạc Đoàn', 'npc_merchant', 12, 20), title='Đoàn lạc đà', steps=[dict(kind='battle', target='sa_trung', n=2)],
  log='Một lữ khách bị Sa Trùng chặn đường, cần hạ 2 con.',
  offer='Sa Trùng chặn đường đoàn lạc đà của ta. Giúp ta hạ hai con, ta cảm ơn xứng đáng.', wait='Sa Trùng ở vùng cát phía đông bắc.',
  resolve=('Lữ Khách Lạc Đoàn', 'Đường thông rồi! Ta có thể đưa ngươi một túi vàng, hoặc cho người của ta đi cùng ngươi vài ngày.',
   [('Lấy túi vàng.', 'Lữ khách đưa túi vàng nặng trĩu.', [dict(gold=350)]),
    ('Để đoàn đi cùng, bảo vệ họ.', 'Đoàn lạc đà thắp lửa cảm ơn ngươi. Ngươi thấy lòng ấm lên.', [dict(dao=3), dict(exp=500)])]),
  after='Đường cát đã thông, nhờ ngươi.', req=dict(minRealm=2)),
 dict(id='sq_bang_ho_ly', map='bang_nguyen', tier=3, npc=('Thợ Săn Băng', 'npc_guard', 33, 31), title='Ngọn lửa trong băng', steps=[dict(kind='battle', target='bang_yeu', n=2)],
  log='Thợ săn nhờ hạ hai Băng Yêu đang hại đàn trâu băng của làng.',
  offer='Hai con Băng Yêu cứ rình đàn trâu băng của làng ta. Giúp ta một tay, ta trả tiền.', wait='Chúng hay ở hồ băng phía đông nam.',
  resolve=('Thợ Săn Băng', 'Lạ thật, ta thấy sau lưng chúng có một hồ ly băng con, run rẩy, như đang canh giữ ổ trứng. Ngươi định thế nào?',
   [('Để hồ ly con yên.', 'Hồ ly con ngước nhìn ngươi, rồi biến mất vào tuyết. Ngươi tìm thấy một viên ngọc nhỏ nơi nó đứng.', [dict(dao=4), dict(item=('huyet_tham', 3)), dict(flag='spared_fox')]),
    ('Lấy da hồ ly, bán lấy tiền.', 'Tấm da trắng muốt ấm áp... và nặng nề.', [dict(gold=400), dict(dao=-3)])]),
  after='Ngọc thì thầm trong tuyết. Cảm ơn ngươi.', req=dict(minRealm=3)),
 dict(id='sq_thu_kiem', map='thien_phong', tier=4, npc=('Kiếm Đồng', 'npc_disciple', 24, 31), title='Thử kiếm Thiên Phong', steps=[dict(kind='battle', target='kiem_hon', n=3)],
  log='Kiếm Đồng thách thức: hạ 3 Kiếm Hồn ở Kiếm Trủng để chứng minh kiếm đạo.',
  offer='Ai vào Thiên Phong cũng phải thử kiếm. Hạ ba Kiếm Hồn trong Kiếm Trủng đi, ta sẽ báo cho sư phụ.', wait='Kiếm Hồn ở phía bắc thành. Đừng khinh địch.',
  resolve=None, after='Kiếm đạo của ngươi đã được công nhận.', req=dict(minRealm=4)),
 dict(id='sq_huyet_tham', map='thien_phong', tier=4, npc=('Học Đồ Linh Đan Các', 'npc_alch', 38, 31), title='Đan các thiếu Huyết Sâm', steps=[dict(kind='collect', target='huyet_tham', n=8)],
  log='Linh Đan Các cần 8 Huyết Sâm gấp để luyện một mẻ đan hộ kiếp.',
  offer='Sư phụ cần tám cây Huyết Sâm luyện mẻ đan hộ kiếp gấp. Ngươi có thể đưa giúp không?', wait='Huyết Sâm có thể mua ở các tiệm đan hoặc rơi từ boss.',
  resolve=None, after='Mẻ đan hộ kiếp thành rồi, cảm ơn ngươi.', reward_extra=dict(item=('pha_canh_dan', 1)), req=dict(minRealm=4)),
 dict(id='sq_hu_anh', map='hu_khong', tier=5, npc=('Lữ Giả Trẻ', 'npc_rival', 20, 29), title='Bóng ảnh quấy nhiễu', steps=[dict(kind='battle', target='hu_anh', n=4)],
  log='Hư Ảnh quấy nhiễu lối đi. Hạ 4 con để mở đường.',
  offer='Lũ Hư Ảnh cứ nhái giọng người rồi dụ lữ giả ngã xuống hư không. Ngươi giúp ta diệt bớt được không?', wait='Chúng ở các đảo mây xung quanh.',
  resolve=('Lữ Giả Trẻ', 'Tiếng nhái cuối cùng đã tắt. ... Ngươi có nghe thấy không? Một Hư Ảnh còn sót lại đang xin tha.',
   [('Diệt tận gốc, không để lại hậu họa.', 'Tiếng khóc cuối cùng tắt hẳn. Hư Không yên ắng.', [dict(dao=-1), dict(exp=40000)]),
    ('Tha cho nó đi.', 'Hư Ảnh biến mất, để lại một tiếng cảm ơn vang vọng.', [dict(dao=3), dict(exp=25000)])]),
  after='Hư Không yên tĩnh hơn nhiều rồi.', req=dict(minRealm=5)),
 dict(id='sq_di_vat', map='co_chien_truong', tier=6, npc=('Hồn Binh Lạc Lối', 'npc_guard', 10, 21), title='Di vật chiến sĩ', steps=[dict(kind='collect', target='huyen_thiet', n=12)],
  log='Hồn Binh muốn 12 Huyền Thiết để rèn lại một tấm bia cho đồng đội đã ngã.',
  offer='Chúng ta chết ở đây không có bia mộ. Giúp ta 12 Huyền Thiết để rèn một tấm bia cho những người đã ngã xuống.', wait='Huyền Thiết có thể rơi từ Chiến Hồn.',
  resolve=('Hồn Binh Lạc Lối', 'Bia đã xong. Trong đống quặng còn sót lại một thanh kiếm gãy của một đại năng. Ngươi muốn làm gì với nó?',
   [('Chôn cùng tấm bia.', 'Hồn Binh quỳ xuống: Cảm ơn ngươi.', [dict(dao=4), dict(exp=300000)]),
    ('Giữ thanh kiếm gãy để nghiên cứu.', 'Ngươi cảm nhận được một chút kiếm ý còn sót.', [dict(exp=800000), dict(dao=-2)])]),
  after='Bia mộ đứng đó, chúng ta có thể yên nghỉ.', req=dict(minRealm=6)),
 dict(id='sq_ke_xin_len', map='thien_mon', tier=7, npc=('Tu Sĩ Lạc Lối', 'npc_merchant', 30, 29), title='Kẻ xin lên Tiên Giới', steps=[dict(kind='battle', target='thien_binh', n=3)],
  log='Một tu sĩ bị Thiên Binh chặn lại không cho lên Thiên Môn, nhờ hạ 3 Thiên Binh.',
  offer='Ta đã đợi ở đây ba trăm năm mà Thiên Binh không cho qua. Ngươi mạnh hơn ta, giúp ta dọn đường với!', wait='Thiên Binh canh các đài quanh Thiên Môn.',
  resolve=('Tu Sĩ Lạc Lối', 'Đường mở rồi! Nhưng ta chợt hiểu, ta chưa sẵn sàng. Ngươi nghĩ ta nên làm gì?',
   [('Ở lại tu thêm, đừng vội.', 'Tu sĩ gật đầu: Ngươi nói đúng, ta đã vội quá lâu.', [dict(dao=3), dict(exp=1000000)]),
    ('Cứ đi, đường đã mở.', 'Tu sĩ run rẩy bước lên đài... rồi biến mất trong ánh sáng.', [dict(exp=600000), dict(gold=10000)])]),
  after='Cảm ơn ngươi, dù ta chọn thế nào.', req=dict(minRealm=7)),
]

def eff(e):
    out = []
    for d in e:
        for k, v in d.items():
            if k == 'dao': out.append({'dao': v})
            elif k == 'gold': out.append({'gold': v})
            elif k == 'exp': out.append({'exp': v})
            elif k == 'rep': out.append({'rep': v})
            elif k == 'rel': out.append({'rel': v})
            elif k == 'flag': out.append({'flag': v})
            elif k == 'item': out.append({'item': {'id': v[0], 'n': v[1]}})
    return out

def main():
    quests = jl('src/data/quests.json'); dl = jl('src/data/dialogues.json')
    ids = {q['id'] for q in Q}
    quests = [q for q in quests if q['id'] not in ids]
    for k in [k for k in dl if k.startswith('sq_')]: del dl[k]
    side_npcs = {}
    for q in Q:
        t = q['tier']; qid = q['id']
        reward = {'exp': EXP[t], 'linh_thach': GOLD[t]}
        if q.get('reward_extra', {}).get('recipe'): reward['recipe'] = q['reward_extra']['recipe']
        if q.get('reward_extra', {}).get('item'): reward['item'] = q['reward_extra']['item'][0]; reward['n'] = q['reward_extra']['item'][1]
        quests.append({'id': qid, 'type': 'side', 'chapter': 1, 'title': q['title'], 'desc': q['log'], 'steps': q['steps'], 'reward': reward})
        who = q['npc'][0]
        dl[qid + '_offer'] = {'start': 'a', 'nodes': {'a': {'who': who, 'text': q['offer'], 'choices': [{'text': 'Được, để ta lo.', 'goto': 'ok', 'do': [{'quest': qid}]}, {'text': 'Để lúc khác.', 'goto': None}]},
                                                      'ok': {'who': who, 'text': 'Cảm ơn ngươi nhiều!', 'next': None}}}
        dl[qid + '_wait'] = {'start': 'a', 'nodes': {'a': {'who': who, 'text': q['wait'], 'next': None}}}
        dl[qid + '_after'] = {'start': 'a', 'nodes': {'a': {'who': who, 'text': q['after'], 'next': None}}}
        dl[qid + '_idle'] = {'start': 'a', 'nodes': {'a': {'who': who, 'text': 'Ta đang có chút việc... Ngươi quay lại khi mạnh hơn nhé.', 'next': None}}}
        talk = []
        if q.get('resolve'):
            w, text, choices = q['resolve']
            nodes = {'a': {'who': w, 'text': text, 'choices': [{'text': c[0], 'goto': f'c{i}', 'do': eff(c[2]) + [{'flag': qid + '_res'}]} for i, c in enumerate(choices)]}}
            for i, c in enumerate(choices): nodes[f'c{i}'] = {'who': w, 'text': c[1], 'next': None}
            dl[qid + '_res'] = {'start': 'a', 'nodes': nodes}
            talk.append({'if': {'questDone': qid, 'notFlag': qid + '_res'}, 'id': qid + '_res'})
        talk.append({'if': {'questDone': qid}, 'id': qid + '_after'})
        talk.append({'if': {'questActive': qid}, 'id': qid + '_wait'})
        offer_if = dict(q['req']) if q.get('req') else {}
        offer_if['noQuest'] = qid
        talk.append({'if': offer_if, 'id': qid + '_offer'})
        talk.append({'id': qid + '_idle'})
        side_npcs.setdefault(q['map'], []).append({'id': 'n_' + qid, 'label': who, 'tex': q['npc'][1], 'x': q['npc'][2], 'y': q['npc'][3], 'talk': talk})
    jd(quests, 'src/data/quests.json'); jd(dl, 'src/data/dialogues.json'); jd(side_npcs, 'tools/side_npcs.json')
    print(len(Q), 'nhiệm vụ phụ')

main()
