/** Site-wide singletons. Same keys everywhere, so each is fetched once per page load. */
export function useSettings() {
  const { client } = usePrismic()
  return useAsyncData('single:settings', () => client.getSingle('settings'))
}

export function useNavigation() {
  const { client } = usePrismic()
  return useAsyncData('single:navigation', () => client.getSingle('navigation'))
}
