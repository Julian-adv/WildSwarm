export async function save_json(json: any, filename: string): Promise<{ success: boolean }> {
  const response = await fetch('/api/json/write', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      json,
      path: filename
    })
  })
  return await response.json()
}

export async function load_json(filename: string): Promise<any> {
  const response = await fetch('/api/json/read', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      path: filename
    })
  })
  return await response.json()
}

export async function save_yaml(json: any, filename: string): Promise<{ success: boolean }> {
  const response = await fetch('/api/yaml/write', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      json,
      path: filename
    })
  })
  return await response.json()
}

export async function load_yaml(filename: string): Promise<any> {
  const response = await fetch('/api/yaml/read', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      path: filename
    })
  })
  return await response.json()
}

export function model_name_to_file(model_name: string) {
  if (model_name.includes('/')) {
    const parts = model_name.split('/')
    model_name = parts[parts.length - 1]
  }
  return 'model_settings/' + model_name + '.json'
}
