export function process_wildcards(template: string, wildcards: any): string {
  let result = template
  for (const [key, value] of Object.entries(wildcards)) {
    const pattern = new RegExp(`__${key}__`, 'g')
    result = result.replace(pattern, (value as any).selection)
  }
  return result
}
