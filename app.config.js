import { config } from '@expo/config';

export default ({ config: _config }) => {
  const appConfig = {
    ..._config,
    extra: {
      ..._config.extra,
      EXPO_ROUTER_APP_ROOT: './app',
    },
  };

  return appConfig;
};