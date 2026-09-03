#!/usr/bin/env python3
"""One-shot content expander: appends curated words/phrases to data/langs/*.ts
until each pack reaches 100 words + 30 phrases (dedup by English gloss)."""
import re, io, sys

LANG_DIR = "data/langs"

# (word, roman, en, ur)
NEW = {
"turkish": {
 "words": [
  ("çay","çay","tea","چائے"),("süt","süt","milk","دودھ"),("yumurta","yumurta","egg","انڈا"),
  ("et","et","meat","گوشت"),("pilav","pilav","rice dish","پلاؤ"),("tuz","tuz","salt","نمک"),
  ("şeker","şeker","sugar","چینی"),("elma","elma","apple","سیب"),("portakal","portakal","orange","سنترا"),
  ("üzüm","üzüm","grapes","انگور"),("domates","domates","tomato","ٹماٹر"),("soğan","soğan","onion","پیاز"),
  ("balık","balık","fish","مچھلی"),("kapı","kapı","door","دروازہ"),("pencere","pencere","window","کھڑکی"),
  ("masa","masa","table","میز"),("sandalye","sandalye","chair","کرسی"),("yatak","yatak","bed","بستر"),
  ("oda","oda","room","کمرہ"),("mutfak","mutfak","kitchen","باورچی خانہ"),
  ("araba","araba","car","گاڑی"),("otobüs","otobüs","bus","بس"),("tren","tren","train","ریل گاڑی"),
  ("uçak","uçak","airplane","جہاز"),("yol","yol","road","سڑک"),("şehir","şehir","city","شہر"),
  ("köy","köy","village","گاؤں"),("para","para","money","پیسہ"),("iş","iş","work","کام"),
  ("zaman","zaman","time","وقت"),("gün","gün","day","دن"),("hafta","hafta","week","ہفتہ"),
  ("ay","ay","month","مہینہ"),("yıl","yıl","year","سال"),("güzel","güzel","beautiful","خوبصورت"),
  ("büyük","büyük","big","بڑا"),("küçük","küçük","small","چھوٹا"),("yeni","yeni","new","نیا"),
  ("eski","eski","old","پرانا"),("hızlı","hızlı","fast","تیز"),("yavaş","yavaş","slow","آہستہ"),
  ("uzun","uzun","tall / long","لمبا"),("kısa","kısa","short","چھوٹا (قد)"),
  ("gelmek","gelmek","to come","آنا"),("gitmek","gitmek","to go","جانا"),("yemek","yemek","to eat","کھانا"),
  ("içmek","içmek","to drink","پینا"),("okumak","okumak","to read","پڑھنا"),("yazmak","yazmak","to write","لکھنا"),
  ("konuşmak","konuşmak","to speak","بولنا"),("sevmek","sevmek","to love","محبت کرنا"),
  ("çalışmak","çalışmak","to work","کام کرنا"),("uyumak","uyumak","to sleep","سونا"),
  ("kalp","kalp","heart","دل"),("göz","göz","eye","آنکھ"),("el","el","hand","ہاتھ"),
 ],
 "phrases": [
  ("Günaydın","günaydın","Good morning","صبح بخیر"),("İyi akşamlar","iyi akşamlar","Good evening","شام بخیر"),
  ("Görüşürüz","görüşürüz","See you","پھر ملیں گے"),("Buyurun","buyurun","Here you go","یہ لیجیے"),
  ("Afedersiniz","afedersiniz","Excuse me","معاف کیجیے"),("Teşekkür ederim","teşekkür ederim","Thank you","شکریہ"),
  ("Bir şey değil","bir şey değil","You're welcome","کوئی بات نہیں"),
  ("Yardım edin","yardım edin","Help me","میری مدد کریں"),
  ("Çok güzel","çok güzel","Very beautiful","بہت خوبصورت"),
  ("Benim adım Ali","benim adım ali","My name is Ali","میرا نام علی ہے"),
  ("Nerede?","nerede","Where is...?","کہاں ہے؟"),("Ne zaman?","ne zaman","When?","کب؟"),
  ("Hadi gidelim","hadi gidelim","Let's go","چلو چلیں"),("Kendine iyi bak","kendine iyi bak","Take care","اپنا خیال رکھنا"),
  ("Türkçe bilmiyorum","türkçe bilmiyorum","I don't know Turkish","مجھے ترکی نہیں آتی"),
 ],
},
"arabic": {
 "words": [
  ("نَبِيّ","nabiyy","prophet","نبی"),("مَسْجِد","masjid","mosque","مسجد"),("صَلَاة","salah","prayer","نماز"),
  ("صَدَقَة","sadaqah","charity","صدقہ"),("زَكَاة","zakah","zakat (obligatory alms)","زکوٰۃ"),("صَوْم","sawm","fasting","روزہ"),
  ("حَجّ","hajj","Hajj (pilgrimage)","حج"),("جَنَّة","jannah","paradise","جنت"),("نَار","nar","hellfire","جہنم"),
  ("مَلَك","malak","angel","فرشتہ"),("عِلْم","ilm","knowledge","علم"),("حِكْمَة","hikmah","wisdom","حکمت"),
  ("نُور","noor","light","نور"),("مَاء","maa","water","پانی"),("شَمْس","shams","sun","سورج"),
  ("قَمَر","qamar","moon","چاند"),("نَجْم","najm","star","ستارہ"),("أَرْض","ard","earth","زمین"),
  ("سَمَاء","samaa","sky","آسمان"),("بَحْر","bahr","sea","سمندر"),("جَبَل","jabal","mountain","پہاڑ"),
  ("شَجَر","shajar","tree","درخت"),("زَهْرَة","zahrah","flower","پھول"),("قَلْب","qalb","heart","دل"),
  ("عَيْن","ayn","eye","آنکھ"),("يَد","yad","hand","ہاتھ"),("رَأْس","ra's","head","سر"),
  ("لُغَة","lugha","language","زبان"),("جُمْلَة","jumlah","sentence","جملہ"),("كَلِمَة","kalimah","word","لفظ"),
  ("حَرْف","harf","letter (alphabet)","حرف"),("سُؤَال","su'aal","question","سوال"),("جَوَاب","jawab","answer","جواب"),
  ("وَقْت","waqt","time","وقت"),("عَمَل","amal","deed","عمل"),("صَبْر","sabr","patience","صبر"),
 ],
 "phrases": [
  ("وَعَلَيْكُمُ السَّلَام","wa alaykum as-salam","And peace be upon you (reply)","وعلیکم السلام"),
  ("شُكْرًا جَزِيلًا","shukran jazilan","Thank you very much","بہت بہت شکریہ"),
  ("عَفْوًا","afwan","You're welcome / excuse me","معاف کیجیے"),
  ("مَا اسْمُكَ؟","ma ismuk","What is your name?","آپ کا نام کیا ہے؟"),
  ("اسْمِي أَحْمَد","ismi Ahmad","My name is Ahmed","میرا نام احمد ہے"),
  ("مِنْ أَيْنَ أَنْتَ؟","min ayna anta","Where are you from?","آپ کہاں سے ہیں؟"),
  ("أَيْنَ الْمَسْجِدُ؟","ayna al-masjid","Where is the mosque?","مسجد کہاں ہے؟"),
  ("كَمْ هَذَا؟","kam hadha","How much is this?","یہ کتنے کا ہے؟"),
  ("لَا أَفْهَم","la afham","I don't understand","میں نہیں سمجھا"),
  ("تَكَلَّمْ بِبُطْءٍ","takallam bi-but'","Speak slowly","آہستہ بولیں"),
  ("إِنْ شَاءَ اللَّه","in sha Allah","God willing","ان شاء اللہ"),
  ("الْحَمْدُ لِلَّه","alhamdulillah","Praise be to Allah","الحمد للہ"),
  ("بِسْمِ اللَّه","bismillah","In the name of Allah","بسم اللہ"),
  ("مَعَ السَّلَامَة","ma'a as-salama","Goodbye (go safely)","خدا حافظ"),
  ("أَنَا مِنْ بَاكِسْتَان","ana min Pakistan","I am from Pakistan","میں پاکستان سے ہوں"),
 ],
},
"chinese": {
 "words": [
  ("茶","chá","tea","چائے"),("米饭","mǐfàn","cooked rice","چاول"),("肉","ròu","meat","گوشت"),
  ("鸡蛋","jīdàn","egg","انڈا"),("盐","yán","salt","نمک"),("糖","táng","sugar","چینی"),
  ("苹果","píngguǒ","apple","سیب"),("橙子","chéngzi","orange","سنترا"),("葡萄","pútáo","grapes","انگور"),
  ("西红柿","xīhóngshì","tomato","ٹماٹر"),("鱼","yú","fish","مچھلی"),("门","mén","door","دروازہ"),
  ("窗","chuāng","window","کھڑکی"),("桌子","zhuōzi","table","میز"),("椅子","yǐzi","chair","کرسی"),
  ("床","chuáng","bed","بستر"),("房间","fángjiān","room","کمرہ"),
  ("汽车","qìchē","car","گاڑی"),("公交车","gōngjiāochē","bus","بس"),("火车","huǒchē","train","ریل گاڑی"),
  ("飞机","fēijī","airplane","جہاز"),("路","lù","road","سڑک"),("城市","chéngshì","city","شہر"),
  ("钱","qián","money","پیسہ"),("工作","gōngzuò","work","کام"),("时间","shíjiān","time","وقت"),
  ("天","tiān","day / sky","دن"),("星期","xīngqī","week","ہفتہ"),("月","yuè","month / moon","مہینہ"),
  ("年","nián","year","سال"),("漂亮","piàoliang","beautiful","خوبصورت"),("大","dà","big","بڑا"),
  ("小","xiǎo","small","چھوٹا"),("新","xīn","new","نیا"),("旧","jiù","old","پرانا"),
  ("快","kuài","fast","تیز"),("慢","màn","slow","آہستہ"),
  ("吃","chī","to eat","کھانا"),("喝","hē","to drink","پینا"),("看","kàn","to see / watch","دیکھنا"),
  ("说话","shuōhuà","to speak","بولنا"),("读","dú","to read","پڑھنا"),("写","xiě","to write","لکھنا"),
  ("学习","xuéxí","to study","پڑھائی کرنا"),("去","qù","to go","جانا"),("来","lái","to come","آنا"),
  ("爱","ài","to love","محبت کرنا"),("睡觉","shuìjiào","to sleep","سونا"),
  ("心","xīn","heart","دل"),("眼睛","yǎnjing","eye","آنکھ"),("手","shǒu","hand","ہاتھ"),
 ],
 "phrases": [
  ("早上好","zǎoshang hǎo","Good morning","صبح بخیر"),("晚上好","wǎnshang hǎo","Good evening","شام بخیر"),
  ("再见","zàijiàn","Goodbye","خدا حافظ"),("谢谢你","xièxie nǐ","Thank you","شکریہ"),
  ("不客气","bú kèqi","You're welcome","کوئی بات نہیں"),("对不起","duìbuqǐ","Sorry","معاف کیجیے"),
  ("没关系","méi guānxi","It's okay","کوئی بات نہیں"),
  ("我叫阿里","wǒ jiào Alì","My name is Ali","میرا نام علی ہے"),
  ("你从哪里来？","nǐ cóng nǎlǐ lái","Where are you from?","آپ کہاں سے ہیں؟"),
  ("多少钱？","duōshao qián","How much is it?","کتنے پیسے ہیں؟"),
  ("我不懂","wǒ bù dǒng","I don't understand","میں نہیں سمجھا"),
  ("请说慢一点","qǐng shuō màn yìdiǎn","Please speak slowly","آہستہ بولیں"),
  ("帮助我","bāngzhù wǒ","Help me","میری مدد کریں"),
  ("很好吃","hěn hǎochī","Very tasty","بہت مزیدار"),
  ("我爱你","wǒ ài nǐ","I love you","میں تم سے محبت کرتا ہوں"),
 ],
},
"french": {
 "words": [
  ("le lait","lait","milk","دودھ"),("l'œuf","œuf","egg","انڈا"),("la viande","viande","meat","گوشت"),
  ("le riz","riz","rice","چاول"),("le sel","sel","salt","نمک"),("le sucre","sucre","sugar","چینی"),
  ("la pomme","pomme","apple","سیب"),("l'orange","orange","orange","سنترا"),("le raisin","raisin","grapes","انگور"),
  ("la tomate","tomate","tomato","ٹماٹر"),("le poisson","poisson","fish","مچھلی"),
  ("la porte","porte","door","دروازہ"),("la fenêtre","fenêtre","window","کھڑکی"),("la table","table","table","میز"),
  ("la chaise","chaise","chair","کرسی"),("le lit","lit","bed","بستر"),("la chambre","chambre","room","کمرہ"),
  ("la cuisine","cuisine","kitchen","باورچی خانہ"),
  ("la voiture","voiture","car","گاڑی"),("le bus","bus","bus","بس"),("le train","train","train","ریل گاڑی"),
  ("l'avion","avion","airplane","جہاز"),("la route","route","road","سڑک"),("la ville","ville","city","شہر"),
  ("l'argent","argent","money","پیسہ"),("le travail","travail","work","کام"),("le temps","temps","time","وقت"),
  ("le jour","jour","day","دن"),("la semaine","semaine","week","ہفتہ"),("le mois","mois","month","مہینہ"),
  ("l'année","année","year","سال"),("beau","beau","beautiful","خوبصورت"),("grand","grand","big","بڑا"),
  ("petit","petit","small","چھوٹا"),("nouveau","nouveau","new","نیا"),("vieux","vieux","old","پرانا"),
  ("rapide","rapide","fast","تیز"),("lent","lent","slow","آہستہ"),
  ("manger","manger","to eat","کھانا"),("boire","boire","to drink","پینا"),("lire","lire","to read","پڑھنا"),
  ("écrire","écrire","to write","لکھنا"),("parler","parler","to speak","بولنا"),("aimer","aimer","to love","محبت کرنا"),
  ("travailler","travailler","to work","کام کرنا"),("dormir","dormir","to sleep","سونا"),
  ("venir","venir","to come","آنا"),("aller","aller","to go","جانا"),
  ("le cœur","cœur","heart","دل"),("l'œil","œil","eye","آنکھ"),("la main","main","hand","ہاتھ"),
 ],
 "phrases": [
  ("Bonsoir","bonsoir","Good evening","شام بخیر"),("À bientôt","à bientôt","See you soon","جلد ملیں گے"),
  ("Merci beaucoup","merci beaucoup","Thank you very much","بہت بہت شکریہ"),
  ("De rien","de rien","You're welcome","کوئی بات نہیں"),("Excusez-moi","excusez-moi","Excuse me","معاف کیجیے"),
  ("Je m'appelle Ali","je m'appelle ali","My name is Ali","میرا نام علی ہے"),
  ("Comment ça va?","comment ça va","How are you?","آپ کیسے ہیں؟"),
  ("Je ne comprends pas","je ne comprends pas","I don't understand","میں نہیں سمجھا"),
  ("Parlez lentement","parlez lentement","Speak slowly","آہستہ بولیں"),
  ("Combien ça coûte?","combien ça coûte","How much does it cost?","یہ کتنے کا ہے؟"),
  ("Où est la gare?","où est la gare","Where is the station?","اسٹیشن کہاں ہے؟"),
  ("J'ai faim","j'ai faim","I am hungry","مجھے بھوک لگی ہے"),
  ("C'est délicieux","c'est délicieux","It's delicious","یہ مزیدار ہے"),
  ("Bonne nuit","bonne nuit","Good night","شب بخیر"),
  ("S'il vous plaît","s'il vous plaît","Please","مہربانی"),
 ],
},
"spanish": {
 "words": [
  ("la leche","leche","milk","دودھ"),("el huevo","huevo","egg","انڈا"),("la carne","carne","meat","گوشت"),
  ("el arroz","arroz","rice","چاول"),("la sal","sal","salt","نمک"),("el azúcar","azúcar","sugar","چینی"),
  ("la manzana","manzana","apple","سیب"),("la naranja","naranja","orange","سنترا"),("la uva","uva","grapes","انگور"),
  ("el tomate","tomate","tomato","ٹماٹر"),("el pescado","pescado","fish","مچھلی"),
  ("la puerta","puerta","door","دروازہ"),("la ventana","ventana","window","کھڑکی"),("la mesa","mesa","table","میز"),
  ("la silla","silla","chair","کرسی"),("la cama","cama","bed","بستر"),("la cocina","cocina","kitchen","باورچی خانہ"),
  ("el coche","coche","car","گاڑی"),("el autobús","autobús","bus","بس"),("el tren","tren","train","ریل گاڑی"),
  ("el avión","avión","airplane","جہاز"),("el camino","camino","road","سڑک"),("la ciudad","ciudad","city","شہر"),
  ("el dinero","dinero","money","پیسہ"),("el trabajo","trabajo","work","کام"),("el tiempo","tiempo","time","وقت"),
  ("el día","día","day","دن"),("la semana","semana","week","ہفتہ"),("el mes","mes","month","مہینہ"),
  ("el año","año","year","سال"),("bonito","bonito","beautiful","خوبصورت"),("grande","grande","big","بڑا"),
  ("pequeño","pequeño","small","چھوٹا"),("nuevo","nuevo","new","نیا"),("viejo","viejo","old","پرانا"),
  ("rápido","rápido","fast","تیز"),("lento","lento","slow","آہستہ"),
  ("comer","comer","to eat","کھانا"),("beber","beber","to drink","پینا"),("leer","leer","to read","پڑھنا"),
  ("escribir","escribir","to write","لکھنا"),("hablar","hablar","to speak","بولنا"),("amar","amar","to love","محبت کرنا"),
  ("trabajar","trabajar","to work","کام کرنا"),("dormir","dormir","to sleep","سونا"),
  ("venir","venir","to come","آنا"),("ir","ir","to go","جانا"),
  ("el corazón","corazón","heart","دل"),("el ojo","ojo","eye","آنکھ"),("la mano","mano","hand","ہاتھ"),
 ],
 "phrases": [
  ("Buenos días","buenos días","Good morning","صبح بخیر"),("Buenas noches","buenas noches","Good night","شب بخیر"),
  ("Hasta luego","hasta luego","See you later","پھر ملیں گے"),
  ("Muchas gracias","muchas gracias","Thank you very much","بہت بہت شکریہ"),
  ("De nada","de nada","You're welcome","کوئی بات نہیں"),("Perdón","perdón","Sorry","معاف کیجیے"),
  ("¿Cómo te llamas?","cómo te llamas","What's your name?","آپ کا نام کیا ہے؟"),
  ("Me llamo Ali","me llamo ali","My name is Ali","میرا نام علی ہے"),
  ("¿De dónde eres?","de dónde eres","Where are you from?","آپ کہاں سے ہیں؟"),
  ("¿Cuánto cuesta?","cuánto cuesta","How much is it?","یہ کتنے کا ہے؟"),
  ("No entiendo","no entiendo","I don't understand","میں نہیں سمجھا"),
  ("Habla despacio","habla despacio","Speak slowly","آہستہ بولیں"),
  ("Ayúdame","ayúdame","Help me","میری مدد کریں"),
  ("Está delicioso","está delicioso","It's delicious","یہ مزیدار ہے"),
  ("Te quiero","te quiero","I love you","میں تم سے محبت کرتا ہوں"),
 ],
},
"korean": {
 "words": [
  ("물","mul","water","پانی"),("밥","bap","cooked rice","چاول"),("김치","kimchi","kimchi","کمچی"),
  ("우유","uyu","milk","دودھ"),("계란","gyeran","egg","انڈا"),("고기","gogi","meat","گوشت"),
  ("소금","sogeum","salt","نمک"),("설탕","seoltang","sugar","چینی"),("사과","sagwa","apple","سیب"),
  ("배","bae","pear","ناشپاتی"),("포도","podo","grapes","انگور"),("토마토","tomato","tomato","ٹماٹر"),
  ("생선","saengseon","fish","مچھلی"),("문","mun","door","دروازہ"),("창문","changmun","window","کھڑکی"),
  ("책상","chaeksang","desk","میز"),("의자","uija","chair","کرسی"),("침대","chimdae","bed","بستر"),
  ("방","bang","room","کمرہ"),
  ("자동차","jadongcha","car","گاڑی"),("버스","beoseu","bus","بس"),("기차","gicha","train","ریل گاڑی"),
  ("비행기","bihaenggi","airplane","جہاز"),("길","gil","road","سڑک"),("도시","dosi","city","شہر"),
  ("돈","don","money","پیسہ"),("일","il","work","کام"),("시간","sigan","time","وقت"),
  ("날","nal","day","دن"),("주","ju","week","ہفتہ"),("달","dal","month / moon","مہینہ"),
  ("해","hae","year / sun","سال"),("예쁘다","yeppeuda","pretty","خوبصورت"),("크다","keuda","big","بڑا"),
  ("작다","jakda","small","چھوٹا"),("새로운","saeroun","new","نیا"),("오래된","oraedoen","old","پرانا"),
  ("빠르다","ppareuda","fast","تیز"),("느리다","neurida","slow","آہستہ"),
  ("먹다","meokda","to eat","کھانا"),("마시다","masida","to drink","پینا"),("보다","boda","to see","دیکھنا"),
  ("말하다","malhada","to speak","بولنا"),("읽다","ikda","to read","پڑھنا"),("쓰다","sseuda","to write","لکھنا"),
  ("배우다","baeuda","to learn","سیکھنا"),("가다","gada","to go","جانا"),("오다","oda","to come","آنا"),
  ("사랑하다","saranghada","to love","محبت کرنا"),("자다","jada","to sleep","سونا"),
  ("일하다","ilhada","to work","کام کرنا"),("마음","maeum","heart","دل"),("눈","nun","eye","آنکھ"),
 ],
 "phrases": [
  ("안녕히 가세요","annyeonghi gaseyo","Goodbye (to one leaving)","خدا حافظ"),
  ("감사합니다","gamsahamnida","Thank you","شکریہ"),
  ("천만에요","cheonmaneyo","You're welcome","کوئی بات نہیں"),
  ("죄송합니다","joesonghamnida","Sorry","معاف کیجیے"),
  ("괜찮아요","gwaenchanayo","It's okay","ٹھیک ہے"),
  ("저는 알리예요","jeoneun alliyeyo","I am Ali","میں علی ہوں"),
  ("이거 얼마예요?","igeo eolmayeyo","How much is this?","یہ کتنے کا ہے؟"),
  ("화장실 어디예요?","hwajangsil eodiyeyo","Where is the bathroom?","باتھ روم کہاں ہے؟"),
  ("모르겠어요","moreugesseoyo","I don't know","مجھے نہیں پتہ"),
  ("천천히 말해주세요","cheoncheonhi malhaejuseyo","Please speak slowly","آہستہ بولیں"),
  ("도와주세요","dowajuseyo","Please help me","میری مدد کریں"),
  ("맛있어요","masisseoyo","It's delicious","یہ مزیدار ہے"),
  ("사랑해요","saranghaeyo","I love you","میں تم سے محبت کرتا ہوں"),
  ("잘 자요","jal jayo","Good night","شب بخیر"),
  ("또 만나요","tto mannayo","See you again","پھر ملیں گے"),
 ],
},
"japanese": {
 "words": [
  ("水","mizu","water","پانی"),("お茶","ocha","tea","چائے"),("ご飯","gohan","cooked rice","چاول"),
  ("肉","niku","meat","گوشت"),("卵","tamago","egg","انڈا"),("塩","shio","salt","نمک"),
  ("砂糖","satō","sugar","چینی"),("りんご","ringo","apple","سیب"),("みかん","mikan","orange","سنترا"),
  ("ぶどう","budō","grapes","انگور"),("トマト","tomato","tomato","ٹماٹر"),("魚","sakana","fish","مچھلی"),
  ("ドア","doa","door","دروازہ"),("窓","mado","window","کھڑکی"),("テーブル","tēburu","table","میز"),
  ("椅子","isu","chair","کرسی"),("ベッド","beddo","bed","بستر"),("部屋","heya","room","کمرہ"),
  ("車","kuruma","car","گاڑی"),("バス","basu","bus","بس"),("電車","densha","train","ریل گاڑی"),
  ("飛行機","hikōki","airplane","جہاز"),("道","michi","road","سڑک"),("町","machi","town","قصبہ"),
  ("お金","okane","money","پیسہ"),("仕事","shigoto","work","کام"),("時間","jikan","time","وقت"),
  ("日","hi","day","دن"),("週","shū","week","ہفتہ"),("月","tsuki","month / moon","مہینہ"),
  ("年","toshi","year","سال"),("新しい","atarashii","new","نیا"),("古い","furui","old","پرانا"),
  ("大きい","ōkii","big","بڑا"),("小さい","chiisai","small","چھوٹا"),("速い","hayai","fast","تیز"),
  ("遅い","osoi","slow","آہستہ"),("美しい","utsukushii","beautiful","خوبصورت"),
  ("食べる","taberu","to eat","کھانا"),("飲む","nomu","to drink","پینا"),("見る","miru","to see","دیکھنا"),
  ("話す","hanasu","to speak","بولنا"),("読む","yomu","to read","پڑھنا"),("書く","kaku","to write","لکھنا"),
  ("学ぶ","manabu","to learn","سیکھنا"),("行く","iku","to go","جانا"),("来る","kuru","to come","آنا"),
  ("愛する","aisuru","to love","محبت کرنا"),("寝る","neru","to sleep","سونا"),
  ("働く","hataraku","to work","کام کرنا"),("心","kokoro","heart","دل"),("目","me","eye","آنکھ"),
 ],
 "phrases": [
  ("おはようございます","ohayō gozaimasu","Good morning","صبح بخیر"),
  ("こんばんは","konbanwa","Good evening","شام بخیر"),
  ("またね","mata ne","See you","پھر ملیں گے"),
  ("ありがとうございます","arigatō gozaimasu","Thank you","بہت شکریہ"),
  ("どういたしまして","dō itashimashite","You're welcome","کوئی بات نہیں"),
  ("すみません","sumimasen","Excuse me / sorry","معاف کیجیے"),
  ("大丈夫です","daijōbu desu","It's okay","ٹھیک ہے"),
  ("私の名前はアリです","watashi no namae wa Ari desu","My name is Ali","میرا نام علی ہے"),
  ("おいくらですか","o ikura desu ka","How much is it?","یہ کتنے کا ہے؟"),
  ("わかりません","wakarimasen","I don't understand","میں نہیں سمجھا"),
  ("ゆっくり話してください","yukkuri hanashite kudasai","Please speak slowly","آہستہ بولیں"),
  ("助けて","tasukete","Help me","میری مدد کریں"),
  ("おいしい","oishii","Delicious","مزیدار"),
  ("おやすみなさい","oyasuminasai","Good night","شب بخیر"),
  ("頑張って","ganbatte","Good luck / do your best","خوش قسمتی"),
 ],
},
}

def process(slug, data):
    path = f"{LANG_DIR}/{slug}.ts"
    txt = open(path, encoding="utf-8").read()
    existing_en = {m.group(1).lower() for m in re.finditer(r'en:\s*"([^"]+)"', txt)}

    def fmtw(w): return f'    {{ word: "{w[0]}", roman: "{w[1]}", en: "{w[2]}", ur: "{w[3]}" }},'
    def fmtf(p): return f'    {{ phrase: "{p[0]}", roman: "{p[1]}", en: "{p[2]}", ur: "{p[3]}" }},'

    # count current words vs phrases (entries before "phrases: [" are words)
    phr_marker = txt.index("  phrases: [")
    n_words = len(re.findall(r'en:\s*"', txt[:phr_marker]))
    n_phr = len(re.findall(r'en:\s*"', txt[phr_marker:]))

    # words to add (dedupe by en, cap at needed)
    seen = set(existing_en)
    add_w = []
    for w in data["words"]:
        if w[2].lower() in seen: continue
        seen.add(w[2].lower()); add_w.append(w)
    add_w = add_w[: max(0, 100 - n_words)]
    add_p = []
    for p in data["phrases"]:
        if p[2].lower() in seen: continue
        seen.add(p[2].lower()); add_p.append(p)
    add_p = add_p[: max(0, 30 - n_phr)]

    # insert words before the "  ]," that closes the words array
    words_close = txt.rindex("  ],", 0, phr_marker)
    txt = txt[:words_close] + "\n".join(fmtw(w) for w in add_w) + "\n" + txt[words_close:]

    # insert phrases before the last "  ]," in file (closes phrases)
    phr_close = txt.rindex("  ],")
    txt = txt[:phr_close] + "\n".join(fmtf(p) for p in add_p) + "\n" + txt[phr_close:]

    open(path, "w", encoding="utf-8").write(txt)
    phr2 = txt.index("  phrases: [")
    n_words2 = len(re.findall(r'en:\s*"', txt[:phr2]))
    n_phr2 = len(re.findall(r'en:\s*"', txt[phr2:]))
    print(f"{slug}: words {n_words}->{n_words2}, phrases {n_phr}->{n_phr2} (skipped dupes: {len(data['words'])-len(add_w)+len(data['phrases'])-len(add_p)})")

for slug, data in NEW.items():
    process(slug, data)
print("DONE")
