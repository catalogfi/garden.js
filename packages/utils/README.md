# @gardenfi/utils

The `@gardenfi/utils` package provides utility functions for authentication (SIWE, API keys, passkeys), HTTP fetching with built-in retries and fallback URLs, data processing and conversion, error handling with result types, storage management, event handling, and digest key utilities.

## Installation

```
yarn add @gardenfi/utils
```

## Usage

### HTTP Client with Fallback

```typescript
import { Fetcher } from '@gardenfi/utils';

// Simple requests with retry logic
const data = await Fetcher.get('https://api.example.com/data');
const result = await Fetcher.post('https://api.example.com/submit', {
  body: data,
});

// Requests with automatic fallback to multiple URLs
const reliable = await Fetcher.getWithFallback([
  'https://api1.example.com',
  'https://api2.example.com',
]);
```

### Authentication

```typescript
import { Siwe } from '@gardenfi/utils';

const siwe = new Siwe(url, walletClient);
const token = await siwe.getToken();
const headers = await siwe.getAuthHeaders();
```

### Data parsing

```typescript
import { with0x } from '@gardenfi/utils';

// Address formatting
const address = with0x('abc123');
```

### Error Handling

```typescript
import { Ok, Err, Result } from '@gardenfi/utils';

const result: Result<string, string> = await someOperation();
if (result.ok) {
  // Use result.val
} else {
  // Handle result.error
}
```

### Storage

```typescript
import { MemoryStorage, IStore } from '@gardenfi/utils';

const store: IStore = new MemoryStorage();
store.setItem('key', 'value');
const value = store.getItem('key');
```
