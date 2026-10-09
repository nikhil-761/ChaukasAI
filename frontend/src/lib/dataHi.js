// Demo/mock data ke dynamic strings ka Hindi (Real backend ke strings na mile to English hi dikhega)
const EXACT = {
  'Surface repaired, no visible damage': 'सतह की मरम्मत हुई, कोई नुकसान नहीं दिखता',
  'Severity score': 'गंभीरता स्कोर',
  'AI damage score': 'AI नुकसान स्कोर',
  'Routed to': 'भेजा गया',
  'Auto-drafted complaint': 'अपने-आप बना शिकायत पत्र',
  'Escalated: Critical priority': 'बढ़ाया गया: अति गंभीर प्राथमिकता',
  'Public Works Dept. (PWD)': 'लोक निर्माण विभाग (PWD)',
  'AFTER': 'बाद में',
  'Issue resolved · 92% confident': 'समस्या हल · 92% भरोसा',
  'Same place verified · 38 m from original': 'वही जगह सत्यापित · मूल से 38 मी.',
  'School within 120 m': '120 मी. में स्कूल',
  'PWD notified': 'PWD को सूचना',
  'Critical · 9/10': 'अति गंभीर · 9/10',
  'Dispatched · ID CS-1042': 'भेज दिया · ID CS-1042',
  'Valid civic issue': 'असली नागरिक समस्या',
  'Hazard to two-wheelers': 'दोपहिया के लिए ख़तरा',
  'School in frame': 'फ़ोटो में स्कूल',
  'Reported by 3 citizens': '3 नागरिकों ने बताया',
  'Main road': 'मुख्य सड़क',
  'POTHOLE · 94%': 'गड्ढा · 94%',
  'Vision agent': 'Vision एजेंट',
  'Pothole detected': 'गड्ढा मिला',
  '94% confidence': '94% भरोसा',
  'Critical': 'अति गंभीर',
  'Severity': 'गंभीरता',
  'School within 200 m · +2': '200 मी. में स्कूल · +2',
  'PWD · Roorkee': 'PWD · रुड़की',
  'Closure': 'समाधान',
  'Fix verified': 'सत्यापित समाधान',
  'Reported photo': 'रिपोर्ट की फ़ोटो',
  'Capture': 'कैप्चर',
  'Photo + GPS + Hindi voice': 'फ़ोटो + GPS + हिंदी आवाज़',
  'AI analysis': 'AI जाँच',
  'Vision agent is inspecting': 'Vision एजेंट जाँच रहा है',
  'Context-aware scoring': 'संदर्भ-आधारित स्कोर',
  'Route and draft': 'विभाग और पत्र',
  'Right department, formal letter': 'सही विभाग, औपचारिक पत्र',
  'Verified fix': 'सत्यापित समाधान',
  'After-photo + GPS check': 'बाद की फ़ोटो + GPS जाँच',
  'Photo + GPS + voice': 'फ़ोटो + GPS + आवाज़',
  // problems
  'Large pothole covering part of the lane': 'लेन के एक हिस्से में बड़ा गड्ढा',
  'Broken road edge with exposed gravel': 'सड़क का किनारा टूटा, बजरी बाहर',
  'Deep crater after waterlogging': 'जलभराव के बाद गहरा गड्ढा',
  'Overflowing garbage dump on roadside': 'सड़क किनारे कचरे का ढेर बाहर तक बहता हुआ',
  'Uncollected waste blocking footpath': 'न उठाया गया कचरा फ़ुटपाथ रोक रहा है',
  'Streetlight not working on main stretch': 'मुख्य सड़क पर स्ट्रीट लाइट बंद',
  'Pole light flickering and dark patch': 'खंभे की लाइट टिमटिमा रही, अँधेरा हिस्सा',
  'Main pipeline leaking onto the road': 'मुख्य पाइपलाइन से सड़क पर पानी रिस रहा',
  'Continuous water leakage near junction': 'चौराहे के पास लगातार पानी का रिसाव',
  'Open drain overflowing on the road': 'खुली नाली सड़क पर उफन रही है',
  'Blocked drain causing waterlogging': 'जाम नाली से जलभराव',
  // departments
  'Public Works Department (PWD)': 'लोक निर्माण विभाग (PWD)',
  'Municipal Corporation - Sanitation': 'नगर निगम - सफ़ाई',
  'Municipal Corporation / UPCL': 'नगर निगम / UPCL',
  'Uttarakhand Jal Sansthan': 'उत्तराखंड जल संस्थान',
  'Municipal Corporation - Drainage': 'नगर निगम - ड्रेनेज',
  'Nagar Palika - Sanitation': 'नगर पालिका - सफ़ाई',
  'Nagar Palika / Electricity Distribution': 'नगर पालिका / बिजली वितरण',
  'Jal Sansthan / Jal Nigam': 'जल संस्थान / जल निगम',
  'Nagar Palika - Drainage': 'नगर पालिका - ड्रेनेज',
  'PWD': 'PWD', 'Jal Sansthan': 'जल संस्थान', 'Nagar Nigam': 'नगर निगम',
  // evidence
  'Visible damage across the lane': 'लेन भर में नुकसान दिख रहा है',
  'Surrounding surface affected': 'आसपास की सतह भी प्रभावित',
  'Hazard to pedestrians and two-wheelers': 'पैदल यात्रियों और दोपहिया वाहनों के लिए ख़तरा',
  'Visible damage in the photo': 'फ़ोटो में नुकसान साफ़ दिख रहा है',
  'Public area affected': 'सार्वजनिक जगह प्रभावित',
  'Hazard to pedestrians': 'पैदल यात्रियों के लिए ख़तरा',
  // resolution
  'Surface repaired, no visible hole': 'सतह की मरम्मत हुई, कोई गड्ढा नहीं दिखता',
  'Main road (+1)': 'मुख्य सड़क (+1)',
  'School within 200 m (+2)': '200 मी. में स्कूल (+2)',
  'Safety words in citizen note (+1)': 'नागरिक के नोट में सुरक्षा शब्द (+1)',
}
const AREA_WORDS = [
  ['IIT Roorkee Gate', 'आईआईटी रुड़की गेट'], ['Civil Lines', 'सिविल लाइन्स'], ['Solani Park', 'सोलानी पार्क'], ['Railway Road', 'रेलवे रोड'],
  ['Ramnagar', 'रामनगर'], ['Medical Chowk', 'मेडिकल चौक'], ['Bhagwanpur Road', 'भगवानपुर रोड'], ['Landhaura Chowk', 'लंढौरा चौक'],
  ['Katarpur', 'कटारपुर'], ['Gurukul Narsan Road', 'गुरुकुल नारसन रोड'], ['Delhi Road', 'दिल्ली रोड'], ['Kachehri Road', 'कचहरी रोड'],
  ['New Mandi', 'नई मंडी'], ['Shamli Road', 'शामली रोड'], ['Bhopa Road', 'भोपा रोड'], ['Khatauli Road', 'खतौली रोड'], ['Gandhi Colony', 'गांधी कॉलोनी'],
  ['Ramlila Ground Road', 'रामलीला ग्राउंड रोड'], ['Sujru Road', 'सुजरू रोड'], ['Muzaffarnagar', 'मुज़फ़्फ़रनगर'], ['Roorkee', 'रुड़की'],
]
const PATTERNS = [
  [/^AI damage score (\d+)$/, (m) => `AI नुकसान स्कोर ${m[1]}`],
  [/^Reported by (\d+) citizens \(\+(\d)\)$/, (m) => `${m[1]} नागरिकों ने बताया (+${m[2]})`],
  [/^(.*) reported by citizen$/, (m, cat) => `नागरिक द्वारा बताया गया: ${cat(m[1])}`],
]
const CAT_HI = { 'Road damage': 'सड़क खराब', Garbage: 'कचरा', Streetlight: 'स्ट्रीट लाइट', 'Water leakage': 'पानी का रिसाव', Drainage: 'नाली / ड्रेनेज', Other: 'अन्य' }

export function toHindi(s) {
  if (typeof s !== 'string') return s
  if (EXACT[s]) return EXACT[s]
  for (const [re, fn] of PATTERNS) { const m = s.match(re); if (m) return fn(m, (c) => CAT_HI[c] || c) }
  let out = s, changed = false
  for (const [en, hi] of AREA_WORDS) if (out.includes(en)) { out = out.replace(en, hi); changed = true }
  return changed ? out : s
}
