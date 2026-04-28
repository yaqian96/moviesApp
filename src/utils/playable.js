import { fetchUserItems } from '@/api/emby-items'

export async function resolvePlayableId(item) {
  const t = item?.Type
  if (t === 'Movie' || t === 'Episode') {
    return item.Id
  }
  if (t === 'Series') {
    const { data } = await fetchUserItems({
      ParentId: item.Id,
      IncludeItemTypes: 'Episode',
      Recursive: true,
      SortBy: 'ParentIndexNumber,IndexNumber,SortName',
      SortOrder: 'Ascending',
      Limit: 1,
    })
    return data?.Items?.[0]?.Id || ''
  }
  if (t === 'Season') {
    const { data } = await fetchUserItems({
      ParentId: item.Id,
      IncludeItemTypes: 'Episode',
      SortBy: 'IndexNumber',
      SortOrder: 'Ascending',
      Limit: 1,
    })
    return data?.Items?.[0]?.Id || ''
  }
  return item.Id || ''
}
