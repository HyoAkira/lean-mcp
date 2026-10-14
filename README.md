# Lean MCP

Lean 4 kodunu yerel derleyicide çalıştıran ve derleyicinin geri bildirimini
yapılandırılmış bir yanıtla döndüren MCP sunucusu. Tek araç sunar: `lean_check`.

## Gereksinimler

| Bileşen | Sürüm |
|---|---|
| Node.js | ≥ 20 |
| Lean 4 (elan ile) | `v4.34.1` |
| Mathlib | `v4.34.1` |

## Kurulum

```bash
npm install
npm run build

# Lean araç zinciri
elan toolchain install leanprover/lean4:v4.34.1

# Mathlib bağımlılığını indir ve önceden derlenmiş .olean dosyalarını çek
cd lean-project
lake exe cache get
lake build
```

`lake build` bir kez çalıştırıldıktan sonra `lean_check` aracı Mathlib'e karşı
kod derleyebilir. Derleme süresi Mathlib önbelleğinin alınmasına bağlıdır.

## OpenCode'a bağlama

`~/.config/opencode/opencode.json` içine ekleyin:

```json
{
  "mcp": {
    "servers": {
      "lean": {
        "type": "local",
        "command": ["node"],
        "environment": {
          "LEAN_MCP_PROJECT_DIR": "/path/to/lean-mcp/lean-project"
        },
        "enabled": true
      }
    }
  }
}
```

Sunucu stdio üzerinden konuşur. Lean MCP, teorem arama işini **yeniden
uygulamaz**; bunun için `lean-explore` hosted MCP ayrı bir sunucu olarak
tanımlanır ve `lean_check` LeanExplore olmadan da çalışır.

## Araç sözleşmesi

### `lean_check`

**Girdi**

```json
{ "code": "theorem add_two : 1 + 1 = 2 := by rfl" }
```

> Not: `example` Lean'de ayrılmış bir anahtar kelimedir; `theorem example : ...`
> geçersizdir. İsimli teorem yazarken `theorem add_two : ...`, isimsiz yazarken
> `example : ...` kullanın.

**Başarılı yanıt**

```json
{
  "status": "success",
  "summary": "Lean kodu başarıyla derlendi.",
  "diagnostics": []
}
```

**Hatalı yanıt**

```json
{
  "status": "error",
  "summary": "Lean kodu derlenemedi.",
  "diagnostics": ["3:11: error: Unknown constant `Nat.succcccc`"]
}
```

`status` yalnızca `success` veya `error` olur. Başarı, kodun gerçekten
derlenmesiyle belirlenir; modelin kendi değerlendirmesi dikkate alınmaz.

**`isError` semantiği.** Araç yalnızca *araç* başarısız olduğunda (`isError:
true`) işaretlenir: Lean araç zinciri yok ya da derleme zaman aşımına uğradı.
Derleyicinin kodu reddetmesi normal, beklenen bir sonuçtur ve `isError: false`
ile `status: "error"` olarak döner. Böylece model her başarısız denemeyi bir
araç arızası gibi değil, üzerinde yinelenecek bir derleyici kararı olarak görür.

**Bilgi ve uyarı mesajları.** `severity: "error"` dışındaki mesajlar
`diagnostics` içinde modele ulaşır. Bu, `#check`/`#print`/`#eval` çıktılarını
(ör. `#check Nat.add_comm` → `Nat.add_comm (n m : Nat) : n + m = m + n`) ve
`declaration uses `sorry`` uyarısını kapsar. `sorry` içeren bir dosya derlenir
(`status: "success"`) ama `summary` bunu açıkça belirtir, böylece boş bir ispat
tamamlanmış sanılmaz.

**Hata ipuçları.** Derleme başarısız olduğunda `summary` hatanın türüne göre
tek satırlık bir ipucu taşır (ör. `unsolved goals` → bir taktik önerisi;
`unknown identifier` → `#check`/`lean-explore` ile ad doğrulama; söz dizimi
hatası → notasyon kontrolü). Ayrıca hataya eşlik eden uyarı/bilgi mesajları da
`diagnostics` içinde korunur; böylece model aynı denemeden maksimum bağlam alır.

## Yapılandırma

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `LEAN_MCP_PROJECT_DIR` | `./lean-project` | Lean projesinin bulunduğu dizin |
| `LEAN_MCP_TIMEOUT_MS` | `180000` | Tek derleme denemesi için süre sınırı |
| `LEAN_MCP_MAX_OUTPUT_BYTES` | `262144` | Yakalanan derleyici çıktısı üst sınırı |
| `ELAN_HOME` | `~/.elan` | elan kurulum dizini; PATH'e otomatik eklenir |

## Tasarım notları

- **JSON çıktı ayrıştırma.** Snippet'ler `lake env lean --json` ile
  derlenir. Lean'in JSON mesajları güvenilir biçimde ayrıştırılabilir; alıcı,
  `severity: "error"` içeren bir mesaj varsa ispat başarısızdır. Yalnızca uyarı
  ve bilgi mesajları varsa kod başarıyla derlenmiş sayılır ve uyarılar
  `diagnostics` içinde döner.
- **Seri çalıştırma.** Eşzamanlı araç çağrıları bir kuyruk üzerinden sırayla
  yürütülür; böylece her çağrı kendi benzersiz geçici dosyasını alır ve
  scratch dosyaları birbirine karışmaz.
- **Zaman aşımı.** `simp`, `decide` ve `norm_num` çağrıları sonsuza kadar
  sürebilir. Süre aşımında süreç grubu SIGTERM, ardından SIGKILL ile
  sonlandırılır ve modele sadeleştirme önerisiyle `error` döner.
- **Geçici dosyalar.** Snippet'ler proje içindeki `.lean-mcp-tmp/` altına
  yazılır (Mathlib'in `LEAN_PATH` içinde görünmesi için) ve her çağrıdan sonra
  silinir. Sunucu başlarken önceki bir çökmeden kalan `Check_*.lean` dosyaları
  bir kez temizlenir.

## Üretim notları (operasyon)

- **Temiz kapanma.** Sunucu `SIGTERM`/`SIGINT`/`SIGHUP` ya da stdio
  bağlantısının kapanması durumunda devam eden tüm derlemeleri **süreç grubuyla
  birlikte** (sunucu → `lake` → `lean`) sonlandırır ve anında çıkar. Bu, takılı
  kalan bir taktiğin sunucu öldükten sonra sahipsiz (orphan) süreç olarak
  çalışmaya devam etmesini engeller. İşletim mesajları yalnızca **stderr**'e
  yazılır; stdout MCP protokolüne ayrılmıştır.
- **Başlangıç denetimi.** Sunucu açılırken `LEAN_MCP_PROJECT_DIR`'in varlığını
  ve `lake`'in erişilebilirliğini denetler; sorun varsa stderr'e uyarı basar
  (çalışmayı durdurmaz, her çağrı yapılandırılmış bir hata döndürür).
- **Yapılandırma hataları yapılandırılmış döner.** Proje dizini eksik veya
  yazılamaz olduğunda `lean_check`, ham bir işletim sistemi hatası yerine
  `isError: true` içeren şu yapıyı döndürür:
  `{"status":"error","summary":"Lean çalıştırılamadı.","diagnostics":[...]}` —
  hatanın nedeni ve proje dizini `diagnostics` içinde yer alır.
- **Güvenlik notu.** Bu sunucu, modelin/gönderen istemcinin verdiği **her Lean
  kodunu yerel makinede çalıştırır**; `#eval` keyfi hesaplama yürütür. Yalnızca
  güvenilen tarafa (güvenilen model sağlayıcısına) açılmalı, uzak/anonim
  istemcilere maruz bırakılmamalıdır.
- **Yeniden derleme.** `npm run build` sonrası çalışan MCP süreci eski kodu
  bellekte tutar; değişikliklerin etkili olması için sunucuyu yeniden başlatın
  (OpenCode: `/api/experimental/mcp/lean/connect` sonrası `reload`).

## Geliştirme

```bash
npm run build          # TypeScript derle
npm test               # ayrıştırıcı birim testleri (Lean gerektirmez)
npm run check          # tsc + birim testleri + smoke (hızlı CI)
npm run test:all       # check + entegrasyon + smoke:call + stress + robustness
npm run test:integration   # gerçek derleyiciye karşı testler
npm run smoke          # stdio el sıkışması ve araç şeması kontrolü
npm run smoke:call     # araç çağrısının baştan sona doğrulanması
npm run smoke:stress   # eşzamanlı çağrılar ve geçici dosya sızıntısı kontrolü
npm run robustness     # üretim davranışları: bozuk proje dizini, SIGTERM
                       # sırasında süreç ağacı temizliği, zaman aşımı regresyonu
```

Entegrasyon testleri `lake` PATH'te yoksa kendiliğinden atlanır. Mathlib'in
derlenmiş olup olmadığını ayrıca denetler; `.lake/packages/mathlib` henüz
indirilmemişse o tek test atlanır.

## Durum

Lean 4.34.1 ve Mathlib v4.34.1 kurulu, önbellek alınmış durumda.

Doğrulanan davranışlar:

- Araç sözleşmesi: yalnızca `lean_check`, yalnızca `code` girdisi,
  yalnızca `status` / `summary` / `diagnostics` çıktısı.
- Gerçek derleyici hatası `diagnostics` içinde, gerçek metniyle döner
  (ör. `2:29: error: unsolved goals ⊢ False`).
- `import Mathlib` ile `norm_num` ve `omega` gibi Mathlib taktikleri çalışır.
- `theorem x : P := by sorry` derlenir (Lean'in çıkış kodu 0) ama
  `declaration uses `sorry`` uyarısı `diagnostics` ile modele iletilir ve
  `summary` ispatın tamamlanmadığını belirtir; boş ispat tamamlanmış gibi
  görünmez.
- `#check` / `#print` / `#eval` gibi `information` seviyeli çıktılar
  `diagnostics` içinde döner; model lemma ifadelerini sorgulayabilir.
- Hatalı bir ispat `isError: false` ile `status: "error"` döner (araç normal
  çalıştı, kod derlenmedi); `isError: true` yalnızca araç zinciri eksik olduğunda
  veya zaman aşımında görülür.
- Zaman aşımı, kilitlenen taktiklerde sunucuyu asla kilitlemez; süreç
  sonlandırılır ve modele sadeleştirme önerilir.
- Eşzamanlı çağrılar serileştirilir; geçici dosya sızıntısı yoktur.
- Aynı snippet'ın Mathlib taktikli ve taktiksiz hâlleri farklı sonuç verir;
  yani içe aktarma yolunun gerçekten çalıştığı doğrulanır.

Henüz yapılmayanlar (bu geçişte kapsam dışı bırakıldı): OpenCode
yapılandırmasına bağlama ve OpenChamber üzerinden uçtan uca model denemesi.

## Lisans

GPL-3.0-only. Bu depoyu değiştirip dağıtırsanız türetilmiş çalışmanız da
GPL-3.0 ile lisanslanmak zorundadır. Kaynak kod tam metni için [LICENSE](LICENSE)
dosyasına bakın.

Lean, Mathlib ve MCP SDK kapsam dışıdır; bunlar kendi lisanslarıyla dağıtılır.