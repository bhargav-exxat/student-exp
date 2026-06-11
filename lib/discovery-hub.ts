export type DiscoveryHubSearchItem = {
  id: string
  label: string
  keywords?: string
  icon?: string
  href?: string
  askLeoPrompt?: string
}

export type DiscoveryHubSearchGroup = {
  id: string
  heading: string
  items: DiscoveryHubSearchItem[]
  searchOnly?: boolean
}
