// Caption + scene cue list for the Mother's Day tribute.
// Each entry fires when audio.currentTime >= time (seconds).
// `scene` swaps the active background photo (1..5).
// `en` shows on top, `tl` (Tagalog) shows beneath; either may be null to hide.
//
// Audio total length: ~389.8 s (6:29.80). To re-tune, edit `time` here only.
window.CUES = [
  { time:   0, scene: 1, en: "Today, we pause. We give thanks. We lift our eyes to God — the giver of life, the author of family.", tl: "Salamat sa Diyos sa buhay, sa pamilya, at sa Kanyang pagmamahal." },
  { time:  35, scene: 1, en: "Today, we thank Jesus Christ. Our Lord. Our Savior. Our hope, strength, and peace.",                  tl: "Panginoong Hesus, Ikaw ang aming pag-asa at kalakasan." },
  { time:  70, scene: 2, en: "Today, we honour mothers — with gratitude, respect, love, and honour. Mothers make it happen.",  tl: "Sa bawat ina, kayo ay biyaya ng Diyos." },
  { time: 110, scene: 2, en: "They carry families. They build homes. They pray in silence. They sacrifice in secret.",              tl: "Ang pagmamahal ng ina ay ilaw sa tahanan." },
  { time: 145, scene: 3, en: "When a child needs comfort, they are there. When a home needs peace, they are there.",                tl: "Ang panalangin ng ina ay lakas ng pamilya." },
  { time: 180, scene: 3, en: "Builders. Carriers. Protectors. Prayer warriors. Women of strength, faith, and love.",                tl: "Kayo ang puso ng tahanan, ang lakas ng pamilya." },
  { time: 215, scene: 4, en: "Today, we honour every mother, every grandmother, every wife, every daughter.",                       tl: "Pinaparangalan namin kayo, sa inyong sakripisyo at pagmamahal." },
  { time: 245, scene: 4, en: "Motherhood is not weakness — it is strength. Not ordinary — it is sacred.",                  tl: "Ang inyong buhay ay patotoo ng biyaya ng Diyos." },
  { time: 275, scene: 4, en: "A mother’s love holds a family together. Her prayer can cover a child for a lifetime.",          tl: "Mula sa isang henerasyon hanggang sa susunod, ang Diyos ay tapat." },
  { time: 305, scene: 5, en: "Thank you for carrying. For praying. For building. For loving. For standing.",                        tl: "Maraming salamat sa inyong pagmamahal, pagtitiis, at panalangin." },
  { time: 330, scene: 5, en: "You are seen. You are valued. You are loved. You are honoured.",                                      tl: "Nakikita kayo ng Diyos, at mahalaga kayo sa Kanya." },
  { time: 355, scene: 5, en: "To the mothers. To the grandmothers. To the women of faith. Today, we honour you.",                   tl: "Mahal namin kayo, at pinaparangalan namin kayo." },
  { time: 378, scene: 5, en: "All glory to God. Thank You, Jesus.",                                                                  tl: null }
];
