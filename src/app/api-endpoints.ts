export type ApiMode = 'gateway' | 'local';

const gatewayRoot = 'https://2wk43coz5b.execute-api.us-east-1.amazonaws.com/Dev/api/v1';
const storageKey = 'packit-api-mode';

function selectedMode(): ApiMode {
  if (typeof window === 'undefined') return 'gateway';
  const requested = new URLSearchParams(window.location.search).get('api');
  if (requested === 'local' || requested === 'gateway') {
    window.sessionStorage.setItem(storageKey, requested);
  }
  return window.sessionStorage.getItem(storageKey) === 'local' ? 'local' : 'gateway';
}

export const apiMode = selectedMode();

export const apiRoots = apiMode === 'local'
  ? {
      packages: 'http://localhost:8080/api/v1',
      history: 'http://localhost:8082/api/v1',
      documents: 'http://localhost:8083/api/v1'
    }
  : { packages: gatewayRoot, history: gatewayRoot, documents: gatewayRoot };
