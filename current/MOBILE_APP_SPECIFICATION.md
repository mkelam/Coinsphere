# Mobile App Specification

**Document Version:** 1.0
**Last Updated:** 2025-10-07
**Owner:** Mobile Team
**Status:** Draft (Post-MVP, Month 6+)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Strategic Rationale](#strategic-rationale)
3. [Technical Approach](#technical-approach)
4. [Feature Parity Matrix](#feature-parity-matrix)
5. [Mobile-Specific Features](#mobile-specific-features)
6. [UI/UX Adaptations](#uiux-adaptations)
7. [Performance Requirements](#performance-requirements)
8. [Development Roadmap](#development-roadmap)
9. [App Store Optimization](#app-store-optimization)

---

## 1. Executive Summary

**Status:** Post-MVP feature (target launch Month 6)

**Why Mobile?**
- 65% of crypto traders use mobile for portfolio tracking
- Push notifications are critical for price alerts
- On-the-go access increases engagement

**Approach:** React Native (single codebase for iOS + Android)

**Timeline:**
- Month 6-7: Development (8 weeks)
- Month 8: Beta testing (4 weeks)
- Month 9: App Store launch

**Budget:**
- Development: $40K (2 developers × 2 months)
- App Store fees: $99/year (Apple) + $25 one-time (Google)
- Testing devices: $2K

---

## 2. Strategic Rationale

### 2.1 Why Build a Mobile App?

**Data supporting mobile:**
- **65%** of crypto users check portfolios on mobile (CoinMarketCap survey)
- **Mobile users check 3x more frequently** than desktop (avg 5x/day vs 1.5x/day)
- **Push notifications drive 40%+ engagement** vs email alerts (12% open rate)

**User quotes from feedback:**
> "I need to check my portfolio on the bus, not just at my desk"
> "I want a widget showing my portfolio value on my home screen"
> "Push notifications are way better than emails for price alerts"

### 2.2 Why Wait Until Month 6?

**MVP priorities:**
1. **Months 1-3:** Core web app (portfolio tracking, alerts, predictions)
2. **Months 4-5:** Iterate based on user feedback, add Pro features
3. **Month 6+:** Mobile app (once web product-market fit is proven)

**Risks of building mobile too early:**
- Splits development resources (web suffers)
- Harder to iterate quickly (app store approval takes 1-2 weeks)
- Web app can be mobile-responsive as interim solution

**Benefits of waiting:**
- Web product-market fit proven
- Know which features users actually use (data-driven mobile priorities)
- API already stable and tested

### 2.3 Why React Native (vs Native iOS/Android)?

**React Native Pros:**
- ✅ Single codebase (TypeScript) → 60% faster development
- ✅ Shared logic with web app (hooks, utilities, types)
- ✅ Team already knows React/TypeScript
- ✅ Expo tooling (simplifies builds, OTA updates)
- ✅ Good performance for data-driven apps

**React Native Cons:**
- ❌ Slightly slower than native (but not noticeable for our use case)
- ❌ Occasional native module issues (rare)

**Native iOS/Android Pros:**
- ✅ Best performance and platform integration
- ✅ Access to latest OS features immediately

**Native iOS/Android Cons:**
- ❌ Two codebases (Swift + Kotlin) → 2x development time
- ❌ Team needs to learn two new languages
- ❌ Code duplication with web app

**Decision:** React Native with Expo (best ROI for our team size)

---

## 3. Technical Approach

### 3.1 Technology Stack

**Framework:**
- **React Native 0.74+** (latest stable)
- **Expo SDK 51+** (managed workflow)
- **TypeScript** (shared types with web app)

**State Management:**
- **React Query** (same as web app)
- **Zustand** (lightweight, simple)

**Navigation:**
- **React Navigation 6** (tab + stack navigators)

**UI Components:**
- **React Native Paper** (Material Design)
- **react-native-chart-kit** (charts, same data as web Recharts)

**Push Notifications:**
- **Expo Notifications** (unified API for iOS/Android)
- **Firebase Cloud Messaging** (backend)

**Authentication:**
- **expo-secure-store** (encrypted storage for JWT)
- **expo-local-authentication** (biometric login)

**Deployment:**
- **EAS Build** (Expo cloud builds)
- **EAS Submit** (automated app store submission)
- **EAS Update** (over-the-air JS/asset updates)

### 3.2 Project Structure

```
mobile-app/
├── src/
│   ├── screens/
│   │   ├── DashboardScreen.tsx
│   │   ├── PortfolioScreen.tsx
│   │   ├── AlertsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   ├── HoldingCard.tsx
│   │   ├── PriceChart.tsx
│   │   └── RiskScoreBadge.tsx
│   ├── hooks/
│   │   ├── usePortfolio.ts      # Shared with web
│   │   ├── usePrices.ts          # Shared with web
│   │   └── usePushNotifications.ts
│   ├── services/
│   │   ├── api.ts                # Same API client as web
│   │   └── notifications.ts
│   ├── types/
│   │   └── index.ts              # Shared with web (symlink)
│   └── utils/
│       └── formatters.ts         # Shared with web
├── app.json                      # Expo config
├── eas.json                      # Build config
└── package.json
```

**Shared code with web app:**
- `types/` (TypeScript interfaces)
- `hooks/` (React Query hooks)
- `utils/` (formatters, validators)
- `services/api.ts` (API client)

**Mobile-specific code:**
- `screens/` (mobile layouts)
- `components/` (mobile UI components)
- `services/notifications.ts` (push notification handling)

### 3.3 Code Sharing Strategy

**Monorepo structure:**
```
coinsphere/
├── packages/
│   ├── web/                  # Web app (Vite + React)
│   ├── mobile/               # Mobile app (Expo + React Native)
│   └── shared/               # Shared code
│       ├── types/
│       ├── hooks/
│       ├── utils/
│       └── api/
├── package.json              # Workspace root
└── turbo.json                # Turborepo config
```

**Benefits:**
- Single `npm install` for entire project
- Shared dependencies (React, TypeScript)
- Type safety across web + mobile
- Easier to keep in sync

---

## 4. Feature Parity Matrix

### 4.1 Core Features (Must Have in v1)

| Feature | Web | Mobile v1 | Notes |
|---------|-----|-----------|-------|
| **Portfolio Overview** | ✅ | ✅ | Total value, 24h change |
| **Holdings List** | ✅ | ✅ | Sortable table → scrollable list |
| **Add/Edit Holdings** | ✅ | ✅ | Bottom sheet modal |
| **Price Charts** | ✅ | ✅ | 7d/30d/90d/1y views |
| **Risk Score** | ✅ | ✅ | Per-asset + portfolio-wide |
| **AI Predictions** | ✅ | ✅ | 7-day predictions |
| **Price Alerts** | ✅ | ✅ | Push notifications |
| **Risk Alerts** | ✅ | ✅ | Push notifications |
| **User Settings** | ✅ | ✅ | Profile, tier, preferences |
| **Authentication** | ✅ | ✅ | Email/password + biometric |

### 4.2 Deferred Features (Mobile v2+)

| Feature | Web | Mobile v1 | Mobile v2 |
|---------|-----|-----------|-----------|
| Exchange API Import | ✅ | ❌ | ✅ |
| Whale Activity Alerts | ✅ | ❌ | ✅ |
| News Feed | ✅ | ❌ | ✅ |
| Portfolio Export (CSV) | ✅ | ❌ | ✅ |
| Advanced Charts (indicators) | ✅ | ❌ | ✅ |

**Rationale for deferring:**
- Exchange API import requires complex native UI (not critical for v1)
- Whale/news features are Pro tier only (smaller user base)
- Portfolio export rarely used on mobile
- Keep v1 lean to ship faster

### 4.3 Mobile-Only Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Home Screen Widget** | Show portfolio value on home screen | High |
| **Biometric Login** | Face ID / Touch ID | High |
| **Push Notifications** | Real-time price/risk alerts | High |
| **Offline Mode** | Show last cached data when offline | Medium |
| **Haptic Feedback** | Vibrate on alert triggers | Low |
| **Siri Shortcuts** | "Hey Siri, what's my portfolio value?" | Low |

---

## 5. Mobile-Specific Features

### 5.1 Home Screen Widget (iOS + Android)

**Widget shows:**
- Total portfolio value
- 24h change ($ and %)
- Top 3 holdings by value
- Last updated timestamp

**Widget sizes:**
- **Small:** Total value + 24h change only
- **Medium:** + Top 3 holdings
- **Large:** + Mini price chart

**Update frequency:**
- iOS: Every 15 minutes (WidgetKit limit)
- Android: Every 30 minutes (battery optimization)

**Implementation:**
```typescript
// iOS: WidgetKit (Swift)
struct PortfolioWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "PortfolioWidget", provider: Provider()) { entry in
      PortfolioWidgetEntryView(entry: entry)
    }
  }
}

// Android: Jetpack Glance (Kotlin)
class PortfolioWidget : GlanceAppWidget() {
  override suspend fun provideGlance(context: Context, id: GlanceId) {
    // Fetch data from API, render widget
  }
}
```

**Challenges:**
- Widgets can't make API calls on every render (too expensive)
- Background fetch must be efficient (battery)
- React Native doesn't support widgets natively (need native code)

**Solution:**
- Background job fetches data every 15 min, stores in shared storage
- Widget reads from storage (fast, no network)
- User can tap widget to open app for live data

---

### 5.2 Biometric Authentication

**Flow:**
```
1. User logs in with email/password (first time)
   ├─ Store JWT in expo-secure-store (encrypted)
   └─ Ask: "Enable Face ID for faster login?" [Yes] [No]

2. Next app launch:
   ├─ If biometric enabled → Show Face ID prompt
   ├─ On success → Retrieve JWT from secure store → Auto login
   └─ On failure → Fall back to email/password
```

**Security:**
- JWT stored in device's Secure Enclave (iOS) or Keystore (Android)
- Biometric auth required to decrypt JWT
- JWT refreshed every 7 days (user must re-authenticate)

**Implementation:**
```typescript
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

async function loginWithBiometrics() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) {
    // Fall back to password login
    return showPasswordLogin();
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Log in to Coinsphere',
    fallbackLabel: 'Use password',
  });

  if (result.success) {
    const token = await SecureStore.getItemAsync('auth_token');
    await loginWithToken(token);
  }
}
```

---

### 5.3 Push Notifications

**Notification types:**

**1. Price Alert:**
```
🚀 BTC Price Alert
Bitcoin crossed $50,000!
Current: $50,245.67 (+2.3%)

[Tap to view]
```

**2. Risk Alert:**
```
⚠️ Portfolio Risk Warning
Your portfolio risk increased to 72
(was 54 yesterday)

[View Details]
```

**3. Prediction Update:**
```
🔮 New AI Prediction
ETH prediction: BULLISH 🚀
+$340 expected (82% confidence)

[See Full Prediction]
```

**Notification handling:**
```typescript
import * as Notifications from 'expo-notifications';

// Register for push notifications
async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = await Notifications.getExpoPushTokenAsync();
  // Send token to backend
  await api.post('/users/devices', { pushToken: token });
}

// Handle notification tap
Notifications.addNotificationResponseReceivedListener(response => {
  const { alertId, assetSymbol } = response.notification.request.content.data;

  if (alertId) {
    navigation.navigate('AlertDetails', { alertId });
  } else if (assetSymbol) {
    navigation.navigate('AssetDetails', { symbol: assetSymbol });
  }
});
```

**Deep linking:**
- Notification taps should open specific screens (not just app home)
- Example: Price alert for BTC → open BTC detail screen

---

### 5.4 Offline Mode

**Behavior:**
- Show last cached data with banner: "⚠️ Offline - showing data from 5 min ago"
- Disable actions that require network (add holding, create alert)
- Queue actions for when network returns

**Implementation:**
```typescript
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache portfolio data
async function fetchPortfolio(userId: string) {
  const cacheKey = `portfolio_${userId}`;

  try {
    const data = await api.get(`/portfolios/${userId}`);
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (error) {
    // Network failed, return cached data
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    throw error;
  }
}

// Show offline banner
const [isOffline, setIsOffline] = useState(false);

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    setIsOffline(!state.isConnected);
  });
  return () => unsubscribe();
}, []);

{isOffline && (
  <Banner visible icon="wifi-off">
    Offline - showing cached data
  </Banner>
)}
```

---

## 6. UI/UX Adaptations

### 6.1 Navigation Structure

**Tab Navigator (bottom tabs):**
```
┌───────────────────────────────────┐
│                                   │
│         [Screen Content]          │
│                                   │
├───────────────────────────────────┤
│  [📊]   [🔔]   [⚙️]   [👤]       │
│  Home  Alerts Settings Profile    │
└───────────────────────────────────┘
```

**Tabs:**
1. **Home** - Portfolio overview + holdings list
2. **Alerts** - Manage price/risk alerts
3. **Settings** - Preferences, tier, logout
4. **Profile** - User info, subscription

**Stack Navigator (within each tab):**
- Home → Asset Detail → Price History
- Alerts → Create Alert → Alert Settings

### 6.2 Screen Adaptations

**Desktop to Mobile mapping:**

**Dashboard (Desktop):**
```
┌─────────────┬─────────────┬─────────────┐
│ Portfolio   │ Risk Score  │ Predictions │
│ Value Card  │ Card        │ Card        │
├─────────────┴─────────────┴─────────────┤
│          Holdings Table                 │
│  (5 columns: Asset, Value, 24h, Risk,   │
│   Prediction)                            │
└─────────────────────────────────────────┘
```

**Home Screen (Mobile):**
```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐   │
│  │ Total Value: $25,340.67     │   │
│  │ +$2,450 (+10.7%) 24h        │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Risk Score: 28 / 100        │   │
│  └─────────────────────────────┘   │
│                                     │
│  Holdings (3)                  [+]  │
│  ┌─────────────────────────────┐   │
│  │ 🟡 BTC        $15,200       │   │
│  │    0.5 BTC    +5.2%    ↗️   │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🔵 ETH        $8,500        │   │
│  │    3.5 ETH    -2.1%    ↘️   │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Scroll for more...]              │
└─────────────────────────────────────┘
```

**Key changes:**
- Vertical scroll (not horizontal layout)
- Cards stack vertically
- Holdings are cards (not table rows)
- Reduced info per holding (tap for details)

---

### 6.3 Gestures

**Swipe gestures:**
- **Swipe left on holding** → Quick actions (Edit, Delete)
- **Pull down to refresh** → Reload portfolio data
- **Swipe between tabs** → Switch tabs (optional)

**Tap gestures:**
- **Tap holding card** → Open asset detail screen
- **Long press** → Context menu (Edit, Delete, View on Exchange)

**Haptic feedback:**
- Alert triggered → Vibrate pattern
- Swipe action confirmed → Light haptic
- Error occurred → Error haptic pattern

---

## 7. Performance Requirements

### 7.1 Load Times

| Screen | Target | Acceptable | Current |
|--------|--------|------------|---------|
| App launch (cold start) | <2s | <3s | TBD |
| Portfolio screen | <1s | <2s | TBD |
| Asset detail screen | <0.5s | <1s | TBD |
| Chart render | <0.3s | <0.5s | TBD |

**Optimization techniques:**
- Lazy load charts (only render when visible)
- Memoize expensive computations (React.memo, useMemo)
- Paginate holdings list (virtualized list for 100+ holdings)

### 7.2 Bundle Size

**Target:** <15 MB download size (iOS + Android combined)

**Strategies:**
- Code splitting (load screens on-demand)
- Remove unused dependencies (bundle analysis)
- Compress images (WebP format)
- Use Hermes JS engine (faster startup)

### 7.3 Memory Usage

**Target:** <150 MB RAM usage (for devices with 2GB+ RAM)

**Monitoring:**
- React DevTools Profiler (identify re-render issues)
- Xcode Instruments (iOS memory profiling)
- Android Studio Profiler (Android memory profiling)

### 7.4 Battery Impact

**Target:** <5% battery drain per hour of active use

**Best practices:**
- Throttle API polling (every 30s, not every 5s)
- Cancel network requests when screen unmounts
- Use background fetch efficiently (iOS: 15 min intervals)

---

## 8. Development Roadmap

### 8.1 Sprint Plan (8 weeks)

**Sprint 1-2 (Weeks 1-4): Core Functionality**
- ✅ Project setup (Expo, TypeScript, React Native Paper)
- ✅ Authentication (login, biometric, JWT storage)
- ✅ Portfolio overview screen
- ✅ Holdings list (add, edit, delete)
- ✅ API integration (shared with web)

**Sprint 3-4 (Weeks 5-8): Features & Polish**
- ✅ Price charts (react-native-chart-kit)
- ✅ AI predictions display
- ✅ Alerts (create, manage, push notifications)
- ✅ Settings screen
- ✅ Home screen widget (iOS + Android)

**Sprint 5 (Week 9): Testing & Bug Fixes**
- Internal testing (team devices)
- TestFlight beta (iOS, 50 users)
- Google Play internal testing (Android, 50 users)
- Fix critical bugs

**Sprint 6 (Week 10): App Store Submission**
- App Store Connect setup (screenshots, description)
- Google Play Console setup
- Submit for review
- Address review feedback

**Sprint 7 (Week 11): Launch**
- App approved and live
- Announce to existing web users
- Monitor crash reports (Sentry)

**Sprint 8 (Week 12): Post-Launch**
- Fix bugs reported by users
- Iterate based on feedback
- Plan v2 features

### 8.2 Beta Testing Plan

**Internal testing (Week 9):**
- Team members (5-10 devices)
- Test on iOS 16/17, Android 12/13/14
- Focus on critical paths (login, portfolio, alerts)

**External beta (Week 10):**
- Invite 50 web users (selected from waitlist)
- TestFlight (iOS) + Google Play Internal Testing (Android)
- Collect feedback via in-app survey
- Track crashes with Sentry

**Success criteria for launch:**
- <1% crash rate
- >4.0 star rating from beta testers
- All critical bugs fixed

---

## 9. App Store Optimization

### 9.1 App Store Listing (iOS)

**App Name:**
- "Coinsphere - Crypto Portfolio"

**Subtitle:**
- "AI Predictions & Risk Scores"

**Keywords:**
- crypto, portfolio, bitcoin, tracker, alerts, predictions, risk

**Description:**
```
Track your crypto portfolio with AI-powered predictions and risk analysis.

KEY FEATURES:
• Real-time portfolio tracking across 2,000+ assets
• AI predictions with 70%+ accuracy
• Degen Risk Scores (0-100) for every asset
• Price & risk alerts via push notifications
• Beautiful charts and insights

PRICING:
• Free: Track unlimited holdings, 5 alerts
• Plus ($9/mo): 20 alerts, AI predictions, whale alerts
• Pro ($29/mo): 50 alerts, news feed, SMS alerts

SECURITY:
• Bank-level encryption for API keys
• Biometric login (Face ID, Touch ID)
• Read-only exchange access

Join thousands of crypto investors using Coinsphere!
```

**Screenshots (6.5" iPhone):**
1. Portfolio overview (hero shot)
2. Holdings list with risk scores
3. AI prediction detail
4. Price chart with 7-day prediction
5. Alerts screen
6. Widget on home screen

### 9.2 Google Play Listing (Android)

**App Name:**
- "Coinsphere: Crypto Portfolio Tracker"

**Short Description:**
- "Track crypto with AI predictions & risk scores. 2,000+ assets supported."

**Full Description:**
- (Same as iOS)

**Screenshots:**
- Same as iOS (adjusted for Android aspect ratios)

**Feature Graphic:**
- 1024 × 500px banner showing app UI

### 9.3 Launch Strategy

**Pre-launch (Week before):**
- Email existing web users: "Mobile app coming next week!"
- Social media teasers (screenshots, demo video)
- Product Hunt draft ready

**Launch day:**
- App Store + Google Play go live
- Email announcement: "The Coinsphere mobile app is here!"
- Product Hunt launch
- Reddit post (r/CryptoCurrency, r/CryptoPortfolios)
- Twitter announcement

**Post-launch (Week after):**
- Monitor reviews, respond to all feedback
- Fix critical bugs ASAP (OTA updates via EAS Update)
- Request reviews in-app (after 3 days of use)

---

## Appendix A: Technical Debt & Future Work

**Known limitations (accept for v1):**

1. **No offline-first sync**
   - Current: Show cached data when offline
   - Future: Full offline mode with sync when online

2. **No exchange API import**
   - Current: Manual entry only
   - Future: Add in v2 (complex native UI required)

3. **Limited chart interactivity**
   - Current: Static charts
   - Future: Pinch-to-zoom, tap for details

4. **No tablet optimization**
   - Current: Phone layouts only
   - Future: iPad/tablet-specific layouts

5. **No Android widgets (initially)**
   - Current: iOS widgets only (easier to implement)
   - Future: Add Android widgets in v1.1

---

## Appendix B: Cost Breakdown

**Development (8 weeks):**
- 2 developers × $5K/week = $40K

**Tools & Services:**
- Expo EAS: $99/month (during development) = $200
- Apple Developer: $99/year
- Google Play: $25 one-time
- Testing devices: $2K (2 iPhones, 2 Android phones)

**Total:** ~$42.5K

**Ongoing costs:**
- Expo EAS: $99/month (for OTA updates)
- Apple/Google fees: ~$100/year

---

**Document End**

*Mobile app development will begin in Month 6 after web product-market fit is achieved.*
