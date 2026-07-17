# SWADE Dominion Train

Foundry VTT v13 icin SWADE Dominion tren yonetim modulu.

## Ozellikler

- `I` tusu ile acilan tren yonetim paneli
- Talion, Food, Water, Fuel ve Amenities takibi
- Vagon ekleme, duzenleme, aktif/pasif yapma ve kapasite hesabi
- Yolcu/insan gruplari ve kisi basi tur tuketimi
- Local Markets ekrani ile Talion karsiligi kaynak satin alma
- Route, destination, moving/stopped ve kalan tur takibi
- Plains, Desert, Snow, Tundra ve Industrial Wastes biome carpanlari
- Biome image URL alanlari ve Dashboard biome gorseli
- Scavenge sekmesi ile Food, Water, Fuel ve Amenities icin ayri SWADE tarzinda trait die + wild die ve d50 event sonucu
- GM-only Events sekmesi ile biome, kaynak turu, tier filtresi, reward roll ve over-10 extra dice formullerine gore Scavenge event havuzlarini duzenleme
- People sekmesinde passenger group portre URL alanlari
- Settings sekmesinden GM current turn duzeltmesi
- Population, Storage, Fuel ve Special wagon rolleri
- Fuel icin Fuel Wagon cap, Food/Water/Amenities icin ortak Storage Wagon cap
- Mouse ile cevrilen 80.0-120.0 MHz Radio alicisi, 1.00-5.00 Signal Gain ayari ve tum acik oyuncu panellerinde canli kontrol senkronu
- GM yayin editoru, tur araligi, parca/tam mesaj, SWADE skill zari ve Raise bilgisi
- GM signal-lock izinleri, oyuncu lock talebi, Radio Log ve yayin cevaplari
- Kullaniciya ozel Mute ve butun masa icin GM kontrollu receiver Power dugmeleri
- PC'leri ve player-owned actorleri one alan aramali Radio operator secici
- Yerlesik Tier 1 Static, Tier 2 Close ve Tier 3 Understandable sesleriyle oynatma konumunu koruyan uc katmanli crossfade sistemi
- Advance Turn otomasyonu
- GM tam yetki; oyuncular icin kontrollu Radio tuning, lock talebi ve izinli signal lock
- Oyuncularin gorecegi kaynak/rota/vagon/grup detaylarini ayarlama
- Chat output modu: None, GM Only, Public Summary veya Both

## Kurulum

`swade-dominion-train` klasorunu Foundry kullanici veri klasorundeki `Data/modules` klasorune koyun ve Foundry icinde modulu etkinlestirin.

## Kullanim

GM paneli actiktan sonra Dashboard uzerinden kaynaklari elle duzenleyebilir ve `Advance Turn` ile otomatik tuketim yaptirabilir.

Fuel hesabi:

```text
Fuel Cost Per Turn = Base Fuel Per Turn x (1 + Fuel Multiplier Per Wagon x Active Wagon Count)
```

Tren duruyorsa fuel tuketilmez ve rota ilerlemez; Food, Water ve Amenities yine tuketilir. Destination reached olsa bile stopped veya station turu atilabilir.

Biome carpanlari Settings ekranindan duzenlenir. Route ekraninda secilen biome, Dashboard uzerinde gorunur ve Advance Turn tuketimlerine uygulanir.

Scavenge sekmesinde GM Food, Water, Fuel veya Amenities kartindan bir actor secer, skill adini ve istenen zari girer. Mod actor uzerinde ilgili skill die'i bulmaya calisir; GM isterse actor skill die yerine secili zari kullandirabilir. Skill yoksa Unskilled attempt olarak d4 ve otomatik -2 modifier kullanilir. Sonuc SWADE mantiginda ace'li trait die ve wild die ile atilir, event tier'i 1-10 arasina kilitlenir ve ayrica d50 event secilir.

Events sekmesi sadece GM'e gorunur. Burada Food, Water, Fuel ve Amenities event havuzlari her biome icin ayri ayri satir satir duzenlenebilir. Scavenge sonucu, Route ekraninda secili olan mevcut biome'un event havuzundan secilir. Tier 1-10 filtreleriyle tek tier gorulebilir. 10 ustu roll sonucunda Settings'teki Raise Extra Dice ayari, mumkunse reward formulundeki ayni zar havuzuna eklenir. Satir formati:

```text
title | text
```

Her tier'in Reward Roll alani kaynak miktarini belirler. Ornek: `10x6d10`, `4d8+5`, `-2d6`.

Eski `resource amount | title | text` satirlari okunmaya devam eder, ama miktar Reward Roll tarafindan belirlenir. Amenities icin `amenity` veya `amenities` yazilabilir; Talion scavenge tarafindan otomatik verilmez.

Wagon cap sistemi: Population Wagon capacity toplam pop cap verir. Fuel Wagon capacity Fuel cap verir. Storage Wagon capacity Food, Water ve Amenities icin ortak depodur; bu uc resource'un toplami storage cap'i asamaz. Special Wagon resource veya pop cap vermez, not ve ozel kullanim icindir.

Radio sekmesinde tum oyuncular ortak frekans dugmesini mouse ile cevirir; mouse wheel ve yon tuslari ince ayar yapar. Radio sekmesi acik olan diger oyuncular frekans ve Gain degisimini canli gorur. Tasiyiciya yaklasirken zayif sinyal izi ve parca mesaj kelimeleri kademeli belirir. Gain, dogru frekans bulunana kadar sonuc veya ses ipucu vermez. Tasiyici frekansi bulunduktan sonra dikey 1.00-5.00 Signal Gain kontrolu GAIN LOW, GAIN HIGH ve GAIN ALIGNED geri bildirimi verir. Yalnizca frekans ile GM'in yayin icin belirledigi Target Gain birlikte tutturuldugunda stabilizasyon baslar.

Operator Actor alani arama yaparak calisir ve tek seferde en fazla 12 eslesme gosterir. Oyunculara User Configuration uzerinden atanmis karakterler once, diger player-owned actorler sonra listelenir. Lock Signal zari yalnizca GM veya GM'in Signal-Lock Permission tiki verdigi oyuncu tarafindan atilabilir. Secilen actorde yayinin Skill Name degeri bulunursa o skill zari kullanilir; skill yoksa radyo otomatik olarak SWADE Unskilled `d4-2` atisi yapar. Izni olmayan oyuncu aktorunu secip GM'e lock talebi gonderir. Basarili SWADE zari tam mesaji, Raise ise ek istihbarati acar.

Mute dugmesi yalnizca basan kullanicinin radyo seslerini yumusakca sifira indirir; looplar durdurulmadigi icin Unmute yapildiginda sesler bastan baslamadan ayni oynatma konumundan geri gelir. Frekans, Gain ve stabilizasyon ilerlemeye devam eder. GM Power Off yaptiginda receiver butun masa icin kapanir: sesler durur, kontroller degistirilemez, lock veya response gonderilemez ve receiver offline uyarisi gosterir.

GM Radio Control bolumu Broadcasts, Receiver ve Access sekmelerine ayrilir. Yayinlar kapali ozet satirlarinda On Air durumu, frekans, Gain ve source bilgisiyle listelenir; secilen yayin acilarak duzenlenir. Her yayinda Target Gain, Gain Tolerance, Skill Name ve signed Modifier degerleri ayarlanabilir. Requires Signal Lock kapatildiginda yayin acik kanal olur: oyuncu frekans ve Gain'i hizaladiginda tam metin aktor, izin, stabilizasyon veya SWADE zari gerektirmeden acilir. Responses alani bos birakilabilir. Gecersiz modifier degerleri `0` olarak temizlenir; radio icin ayri bir Fallback Die yoktur. Radio yayinlari biome ile sinirlanmaz; On Air tiki ve istege bagli turn araligi yayinin ne zaman alinabilecegini belirler. Receiver sekmesinden lock deneme sayisi, stabilizasyon suresi, ses seviyesi ve uc loop dosyasi ayarlanir. Mod Tier 1 Static, Tier 2 Close ve Tier 3 Understandable seslerini varsayilan olarak getirir; klasor dugmeleri Foundry V13 FilePicker'i acar. Bir yayindaki Broadcast Tier 3 Override alani doluysa, dogru frekans bulundugunda global Tier 3 yerine bu dosya loop olarak calar. Her yeni baglantida tek bir ortak rastgele konum ve sunucu zamani kaydedilir; Radio sekmesine bakan herkes ayni ses saniyesini duyar ve sekmeyi sonradan acan oyuncu yayini ilerlemis konumundan yakalar. Ayni yayinda Gain degistirmek, Mute/Unmute yapmak veya panelin yenilenmesi konumu sifirlamaz. Alan bossa global Tier 3 kullanilir. Yayin sesi zar sonrasinda ikinci kez oynatilmaz. Uc loop Radio sekmesi acikken birlikte calisir; frekans ve Gain degistikce ses seviyeleri birbirine gecerek degisir ve dosyalar bastan baslamaz. Radio sekmesinden cikilinca butun radyo sesleri durur.

Hazir biome event taslaklari `docs/scavenge-biome-events.txt` dosyasinda tutulur.
