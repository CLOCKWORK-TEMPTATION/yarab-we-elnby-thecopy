<!-- Preset: mobile-app — extends core plan-template with iOS/Android considerations -->

## Mobile Architecture

### Architecture Pattern

| Aspect | Decision |
|--------|----------|
| Pattern | MVVM / MVI / Clean Architecture |
| Navigation | [FRAMEWORK] |
| DI | [FRAMEWORK] |
| Network | [LIBRARY] |
| Storage | [LOCAL_DB] |

### Platform-Specific Considerations

| Concern | iOS | Android |
|---------|-----|---------|
| Min SDK/OS | [X] | API [X] |
| Language | Swift / ObjC | Kotlin / Java |
| UI Framework | SwiftUI / UIKit | Compose / XML |
| Distribution | App Store | Google Play |
| CI/CD | Xcode Cloud / Fastlane | Gradle / Fastlane |

## Changelog

- 2026-03-17: Initial preset template for mobile-app projects
