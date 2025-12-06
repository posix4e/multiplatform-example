# Multiplatform Example

A fully functional template for building cross-platform applications with shared code.

## Architecture

```
├── packages/shared/        # Shared TypeScript library
├── apps/
│   ├── web/               # React SPA (Vite)
│   ├── backend/           # Node.js Express API
│   └── mobile/            # Tauri 2 mobile app
│       ├── ios/           # + Safari Extension
│       └── android/       # + Autofill Service
├── docker/                # Dockerfiles
└── .github/workflows/     # CI/CD
```

## Features

- **Web Frontend**: React + Vite, proxies API requests to backend
- **Backend**: Node.js Express API with shared types
- **Mobile**: Tauri 2 for iOS and Android
- **iOS Safari Extension**: Tracks page navigation, sends to main app
- **Android Autofill Service**: Credential autofill integration
- **Shared Code**: TypeScript package used by all platforms
- **Docker**: Production-ready containers for web and backend
- **CI/CD**: GitHub Actions with staging/production environments

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Or start individually
pnpm --filter @multiplatform/backend dev  # Backend on :4000
pnpm --filter @multiplatform/web dev      # Frontend on :3000
```

## Development URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API via proxy**: http://localhost:3000/api/hello

## Build

```bash
# Build all packages
pnpm build

# Build Docker images
docker build -f docker/backend.Dockerfile -t multiplatform-backend .
docker build -f docker/web.Dockerfile -t multiplatform-web .
```

## Mobile Development

```bash
cd apps/mobile

# iOS
pnpm tauri ios init
pnpm tauri ios dev

# Android
pnpm tauri android init
pnpm tauri android dev
```

## CI/CD

| Trigger | Web/Backend | iOS | Android |
|---------|-------------|-----|---------|
| PR | Lint + Build | Debug .ipa artifact | Debug .apk artifact |
| Push to `main` | Docker → Staging | TestFlight | Play Store Internal |
| Release tag | Docker → Production | App Store | Play Store Production |

### Required Secrets

**Docker/GitHub Packages**: Automatic via `GITHUB_TOKEN`

**iOS**:
- `APPLE_BUILD_CERTIFICATE_BASE64`
- `APPLE_P12_PASSWORD`
- `APPLE_PROVISIONING_PROFILE_BASE64`
- `APPLE_API_KEY_ID`, `APPLE_API_ISSUER_ID`, `APPLE_API_KEY`

**Android**:
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

## Project Structure

| Package | Description |
|---------|-------------|
| `@multiplatform/shared` | Shared TypeScript types and utilities |
| `@multiplatform/web` | React frontend |
| `@multiplatform/backend` | Express API server |
| `@multiplatform/mobile` | Tauri mobile app |

## License

MIT
