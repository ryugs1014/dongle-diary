module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: ['react-native-reanimated/plugin'], // 반드시 배열의 마지막에 추가해야 합니다!
    };
};