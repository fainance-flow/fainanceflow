# FinanceFlow PWA aur Offline System — Poori Wazahat

Ye document is liye likha gaya hai ke FinanceFlow ka **PWA (installable app)** aur
**offline mode** (bina internet ke expense add karna) kaise kaam karta hai, sab
kuch simple Roman Urdu mein samjhaya gaya hai. Jab bhi is system mein koi
change karo, ye file bhi update kar dena.

---

## 1. Sab Kuch Ek Nazar Mein

FinanceFlow ek normal website hai (Next.js), lekin usmein kuch cheezein add ki
gayi hain taa ke wo:

1. Mobile pe **install** ho sake (jaisay ek real app) — Android aur iPhone dono pe.
2. **Bina internet ke bhi khul sake** (app shell load ho jaye).
3. Jab internet na ho, tab bhi **expense/income add karne dein**, aur jaisay hi
   net wapis aaye, wo khud-ba-khud database mein chali jaye.

Teeno cheezein alag-alag mechanisms se ban rahi hain — neeche har ek ka apna
section hai.

---

## 2. App ko Phone Pe Install Karna (PWA Install)

### Kya files involved hain

| File | Kaam |
|---|---|
| `frontend/src/app/manifest.ts` | App ka "pehchan card" — naam, icon, rang, kis tarah khulay (fullscreen jaisa) |
| `frontend/public/icons/*.png` | Asli app icon (PNG), `scripts/generate-pwa-icons.mjs` se banaye gaye |
| `frontend/src/components/providers/PWAInstallBanner.tsx` | Neeche "Install FinanceFlow" wala chhota banner |
| `frontend/src/components/providers/ServiceWorkerRegister.tsx` | Service worker ko register karta hai (neeche section 3 mein wazahat) |

### Ye kaam kaise karta hai

- **Android / Chrome / Edge**: Browser khud check karta hai ke app installable
  hai ya nahi (manifest + icons + service worker sab theek honay chahiye). Agar
  sab theek ho to browser ek `beforeinstallprompt` event bhejta hai — humara
  `PWAInstallBanner` isay pakar ke ek **"Install" button** dikhata hai. Button
  dabate hi phone ka apna install popup khul jata hai.

- **iPhone (iOS Safari)**: Apple browsers ko ye "auto install button" dene ki
  ijazat nahi deta — kabhi nahi. Isliye iPhone pe banner sirf instructions
  dikhata hai: **"Tap Share, then Add to Home Screen"**. Ye hamesha available
  hota hai, kisi manifest/criteria ki zaroorat nahi — bas Safari ka apna Share
  menu hai.

- Banner **root level** pe mount hai (`provider/index.tsx`), matlab ye login
  se **pehle** bhi dikhega — login ke baad wali screen tak wait nahi karta.
  (Pehle ye ghalti se sirf login ke baad wali screens pe tha, isliye kuch log
  install option dhoond nahi paa rahe thay.)

- Icons PNG mein isliye zaroori thay kyunke Chrome ka installability-check
  chahta hai ke icon ek exact size (jaise `"192x192"`) ka ho — sirf SVG
  (`sizes: "any"`) diya to Chrome chup-chap install-option hi nahi dikhata,
  koi error bhi nahi deta.

---

## 3. Service Worker — App Bina Internet Ke Kaise Khulta Hai

**File:** `frontend/public/sw.js`

Service worker ek chhota background script hai jo browser khud chalata hai,
jab bhi app khulti hai (sirf **production** mein — `next dev` mein nahi, sirf
asli deployed site pe kaam karta hai).

### Ye kya karta hai

1. **Install hote waqt** (`install` event): kuch zaroori pages pehle se save
   (precache) kar leta hai — Dashboard, Wallets, Transactions, Expenses,
   Budget, Goals, waghera. Taa ke agli baar bina internet ke bhi ye pages khul
   sakein, chahe aap ne unhein pehle visit na bhi kiya ho.

2. **Har page load pe** (`fetch` event, sirf GET requests ke liye):
   - Agar page hai (jaise `/dashboard`): pehle **internet se try** karta hai
     (taa ke hamesha latest version mile). Agar internet fail ho jaye, to
     **cache mein se wahi page** dikha deta hai. Agar cache mein bhi kuch na
     ho, to ek simple **"You're offline"** page dikhata hai.
   - Agar static file hai (images, CSS, JS files, icons): pehle cache se
     turant dikhata hai (fast), aur background mein check karta hai ke koi
     nayi version hai to agli baar ke liye save kar leta hai.

3. **API calls (backend se data)**: Service worker inhein bilkul touch nahi
   karta — chahe woh POST ho ya GET, aur chahe backend ek alag domain pe ho.
   Ye jaan-boojh kar aisa hai, kyunke API data har user ke liye alag hota hai
   (balance, transactions) — usay cache karna ghalat/purana data dikha sakta
   hai.

### Update kaise hota hai

Jab bhi naya code deploy hota hai, `sw.js` file khud change ho jati hai.
Phone jab agli baar app kholay:

1. Browser naye `sw.js` ko download karta hai (turant — hum `Cache-Control:
   no-cache` header lagatay hain isi file pe, taa ke ye kabhi purani na rahe).
2. Naya service worker "install" ho jata hai lekin **turant active nahi
   hota** — kyunke user kisi form mein type kar raha ho sakta hai, beech mein
   reload karna theek nahi.
3. User ko ek toast dikhta hai: **"A new version is available"** — "Reload"
   button ke saath. Jab tak woh khud reload na dabaye, purana version hi
   chalta rehta hai.

`CACHE_VERSION` (file ke shuru mein) badalne se purana cache automatically
delete ho jata hai — agar kabhi caching logic change karo to isay bhi badal
dena.

> **Zaroori baat:** Ek baar app install hone ke baad, agla update lene ke
> liye phone ko internet ke sath **ek baar khol kar** thoda wait karna padta
> hai (naya service worker download/install honay ke liye). Sirf app ko
> uninstall/reinstall karne se purana cache automatically clear nahi hota —
> agar masla ho to Android mein **App Info → Storage → Clear storage** karna
> sabse pakka tareeqa hai.

---

## 4. Offline Expense/Income Add Karna (Asli Feature)

Ye sabse important part hai — jab internet na ho, phir bhi transaction add ho
jaye aur baad mein khud sync ho jaye.

### Involved files

| File | Kaam |
|---|---|
| `frontend/src/lib/offline-queue.ts` | Phone ke andar ek chhoti local database (IndexedDB) mein pending transactions store karta hai |
| `frontend/src/services/transactions.ts` | Jab save karte waqt internet na ho, transaction ko queue mein daal deta hai |
| `frontend/src/lib/flush-offline-queue.ts` | Jab internet wapis aaye, queue ko backend ko bhejta hai |
| `frontend/src/components/providers/OfflineSyncManager.tsx` | Internet wapis aane ka signal sunta hai aur sync shuru karta hai |
| `frontend/src/lib/is-offline.ts` | Turant check karta hai ke internet bilkul hai hi nahi (airplane mode) |

### Step-by-step kya hota hai

1. Aap "Save transaction" dabate hain.
2. App pehle check karta hai: **kya phone mein bilkul network hi nahi hai**
   (`navigator.onLine === false`, jaisay airplane mode)? Agar haan, to
   **turant** (bina wait kiye) transaction ko local queue mein daal deta hai.
3. Agar network signal hai lekin request fail ho jaye (weak signal, ya
   genuinely offline): app pehle asal request try karta hai, aur agar wo
   fail ho (koi response hi na aaye), to **usay bhi** queue mein daal deta
   hai.
4. Queue mein daalte hi:
   - Ek toast dikhta hai: **"Saved offline — will sync automatically once
     you're back online."**
   - Transaction turant list mein dikh jati hai, ek chhota **"Syncing…"**
     badge ke saath — taa ke pata chale ye abhi tak database mein nahi
     pohnchi.
5. Jab internet wapis aaye (`online` event, browser khud batata hai):
   - `OfflineSyncManager` khud-ba-khud queue ko check karta hai.
   - Har pending transaction ko backend ko bhejta hai (sahi tarteeb mein,
     ek-ek karke).
   - Kamyab hone pe: queue se hata deta hai, "Syncing…" badge hat jata hai,
     aur ek toast dikhta hai: **"N offline entries synced."**

### Ye kabhi expire nahi hota

Wallets/transactions ka **dekhne wala cache** 30 din mein expire hota hai
(neeche section 5), lekin ye **pending queue** (jo abhi database tak nahi
pohncha) **kabhi apne aap expire nahi hoti** — chahe 5 minute lagein ya 5
mahine, jab tak internet wapis na aaye aur sync na ho jaye, transaction queue
mein mehfooz rehti hai.

---

## 5. Wallets/Transactions Dekhne Ka Cache (30 Din)

**File:** `frontend/src/lib/offline-read-cache.ts`

Jab app offline ho aur aap ek naya session shuru karo (jaise phone reboot ke
baad app dobara kholo), purana data (React ka in-memory cache) khatam ho chuka
hota hai. Is liye har baar jab wallets ya transactions ki list kaamyabi se
load hoti hai, uski ek copy **phone ke localStorage** mein save ho jati hai.

Agar agli baar internet na ho:
- Sabse pehle abhi-abhi wale in-memory data ko try karta hai.
- Agar wo bhi na mile, to is saved copy ko use karta hai — taa ke "No wallets
  yet" jaisa ghalat message na aaye jab aap ke paas asal mein wallets hain.

Ye cache **30 din** ke baad khud expire ho jata hai (purana/bohot stale data
hamesha ke liye trust nahi karna). Isi tarah aap ka login bhi cache hota hai
(neeche section 6), taa ke offline reload pe bhi aap logged-in rahein.

---

## 6. Login Offline Mein Bhi Kaam Kare

**Files:** `frontend/src/hooks/useAuth.ts`, `frontend/src/lib/local-session.ts`,
`frontend/src/libs/axios.ts`

### Masla kya tha

Pehle jab bhi app khulta, ek chhota check hota tha (`/auth/me`) ke aap ka
login abhi valid hai ya nahi. Agar internet na ho to ye check fail ho jata,
aur app **galat tareeqe se** samajh leta ke aap ka login expire ho gaya —
aur aap ko **logout** karke login screen pe bhej deta! Isi wajah se offline
mein app kabhi khulta hi nahi tha.

### Fix

Ab jab ye check fail ho (sirf internet na honay ki wajah se, real invalid
token ki wajah se nahi), app **aap ko logout nahi karta** — balke aap ka
pichla (cached) user data use kar leta hai, taa ke aap logged-in rahein.

### Login kitne din tak yaad rehta hai

- **Access token** (chhota-sa temporary pass): sirf **15 minute** chalta hai.
- **Refresh token** (asal login yaad rakhne wala): pehle 14 din tha, ab
  **30 din** kar diya gaya hai — taa ke agar aap mahine bhar offline rahein
  aur phir wapis aayein, aap ka login phir bhi kaam kare.

Har 15 minute baad app khud-ba-khud naya access token lene ki koshish karta
hai (background mein, aap ko pata bhi nahi chalta). Pehle is process mein do
masle thay: (1) is request ka koi time-limit nahi tha, is liye weak signal pe
ye hamesha ke liye "loading" reh sakta tha, aur (2) agar ye fail ho jata
(internet na honay ki wajah se), to aap ko galti se logout kar deta. Dono
theek kar diye gaye hain.

---

## 7. "Kabhi Bhi Hamesha Ke Liye Loading Na Ho" — Safety Nets

Kabhi kabhi koi cheez expected se zyada time le sakti hai (phone ki apni
IndexedDB storage stuck ho jaye, ya network bohot slow ho). Is liye har jaga
**time-limit (timeout)** laga di gayi hai, taa ke koi bhi button hamesha ke
liye "loading" na dikhaye:

| Kahan | Kitna time | Agar time khatam ho jaye |
|---|---|---|
| Phone ki local storage (IndexedDB) kholna | 5 second | Error dikhata hai, hang nahi hota |
| "Save transaction" button (poora operation) | 20 second | Red error toast, button dobara clickable ho jata hai |

Agar kabhi ye timeout error dikhe, to uska **exact wording** (jo bhi likha ho)
bohot zaroori hai — usi se pata chalta hai ke asal masla kahan hai.

---

## 8. Testing Karne Ka Sahi Tareeqa (Phone Pe)

Har baar jab koi naya update deploy ho, phone ka purana service worker/cache
khud-ba-khud fauran nahi badalta. Sahi tareeqe se test karne ke liye:

1. **App info → Storage & cache → Clear storage** (Android) ya **Settings →
   Safari → Advanced → Website Data → [site] → Delete** (iPhone).
2. App ko dobara kholo, **internet ON rakh kar**.
3. Kam az kam **10 second wait karo** (naya service worker install hone dena).
4. Ab internet OFF karo (airplane mode) aur test karo.

Agar in steps ke baad bhi koi masla aaye, to woh ek genuine naya bug hai —
purana cache wali wajah nahi.

---

## 9. Sab Files Ek Table Mein (Quick Reference)

| File | Kaam |
|---|---|
| `frontend/src/app/manifest.ts` | App ka manifest (naam, icon, rang) |
| `frontend/public/sw.js` | Service worker — caching aur offline page logic |
| `frontend/public/offline.html` | Jab bilkul kuch bhi cache na ho, ye dikhta hai |
| `frontend/src/components/providers/ServiceWorkerRegister.tsx` | Service worker register karta hai + update-toast dikhata hai |
| `frontend/src/components/providers/PWAInstallBanner.tsx` | "Install FinanceFlow" banner |
| `frontend/src/components/providers/OfflineSyncManager.tsx` | Internet wapis aane pe queue sync karta hai |
| `frontend/src/lib/offline-queue.ts` | Pending (offline) transactions ki local database |
| `frontend/src/lib/flush-offline-queue.ts` | Queue ko backend ko bhejne ka logic |
| `frontend/src/lib/offline-read-cache.ts` | Wallets/transactions dekhne ka 30-din cache |
| `frontend/src/lib/is-offline.ts` | "Bilkul internet hi nahi hai" ka fast check |
| `frontend/src/lib/local-session.ts` | Guest mode + cached logged-in user |
| `frontend/src/lib/promise-timeout.ts` | Kisi bhi operation ko time-limit dena |
| `frontend/src/hooks/useAuth.ts` | Login/session ka poora logic (offline-safe) |
| `frontend/src/libs/axios.ts` | Backend se baat karne ka setup, token-refresh |
| `frontend/scripts/generate-pwa-icons.mjs` | App icon (PNG) banane ki script |
