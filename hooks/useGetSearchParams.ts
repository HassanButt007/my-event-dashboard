export async function getSearchParams(
  props: { searchParams?: Promise<Record<string, string | undefined>> }
) {
  return await props.searchParams;
}