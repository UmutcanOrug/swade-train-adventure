# SWADE Dominion Train

Foundry VTT v13 icin SWADE Dominion tren yonetim modulu.

## Ozellikler

- `O` tusu ile acilan tren yonetim paneli
- Talion, Food, Water, Fuel ve Amenities takibi
- Vagon ekleme, duzenleme, aktif/pasif yapma ve kapasite hesabi
- Yolcu/insan gruplari ve kisi basi tur tuketimi
- Local Markets ekrani ile Talion karsiligi kaynak satin alma
- Route, destination, moving/stopped ve kalan tur takibi
- Advance Turn otomasyonu
- GM tam yetki, oyuncular icin salt okunur panel
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

Tren duruyorsa varsayilan olarak fuel tuketilmez. Settings sekmesinden `Consume fuel while stopped` acilirsa stopped durumda da fuel gider.
