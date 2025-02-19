export function process_wildcards(template: string, wildcards: any): string {
  let result = template
  for (const [key, value] of Object.entries(wildcards)) {
    const pattern = new RegExp(`\\{${key}\\}`, 'g')
    result = result.replace(pattern, (value as any).selection)
  }
  return result
}

export async function save_yaml(json: any, filename: string) {
  const response = await fetch('/api/yaml', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      json,
      file: filename
    })
  })
  return await response.json()
}
